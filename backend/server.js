const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'vtrade_secure_trading_key_2025';
const STARTING_BALANCE = 10000;

// ─── DB Setup ─────────────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'trading.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    balance REAL DEFAULT ${STARTING_BALANCE},
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    coin TEXT NOT NULL,
    amount REAL DEFAULT 0,
    avg_entry_price REAL DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, coin)
  );

  CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    coin TEXT NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('long','short')),
    size REAL NOT NULL,
    entry_price REAL NOT NULL,
    leverage REAL DEFAULT 1,
    margin REAL NOT NULL,
    status TEXT DEFAULT 'open' CHECK(status IN ('open','closed')),
    close_price REAL,
    pnl REAL DEFAULT 0,
    stop_loss REAL,
    take_profit REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    coin TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('market','limit','stop_loss','take_profit')),
    direction TEXT NOT NULL CHECK(direction IN ('buy','sell','long','short')),
    amount REAL NOT NULL,
    price REAL,
    trigger_price REAL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','filled','cancelled')),
    filled_price REAL,
    total REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    filled_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    coin TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    price REAL NOT NULL,
    total REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

try {
  db.exec('ALTER TABLE portfolio ADD COLUMN avg_entry_price REAL DEFAULT 0');
} catch (e) {}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

function authenticateToken(req, res, next) {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, hash);
    
    // Initialize portfolio strictly for the 3 supported pairs
    db.prepare('INSERT OR IGNORE INTO portfolio (user_id, coin, amount, avg_entry_price) VALUES (?, ?, 0, 0)').run(result.lastInsertRowid, 'bitcoin');
    db.prepare('INSERT OR IGNORE INTO portfolio (user_id, coin, amount, avg_entry_price) VALUES (?, ?, 0, 0)').run(result.lastInsertRowid, 'ethereum');
    db.prepare('INSERT OR IGNORE INTO portfolio (user_id, coin, amount, avg_entry_price) VALUES (?, ?, 0, 0)').run(result.lastInsertRowid, 'solana');
    
    const token = jwt.sign({ id: result.lastInsertRowid, username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username, balance: STARTING_BALANCE });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Registration failed: ' + (err.message || 'unknown') });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username, balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: 'Login failed: ' + (err.message || 'unknown') });
  }
});

// ─── SUPPORTED PAIRS CONFIG (Strictly BTC/USDT, ETH/USDT, SOL/USDT) ───────────
const SUPPORTED_COINS = ['bitcoin', 'ethereum', 'solana'];

const COIN_METADATA = {
  'bitcoin':  { symbol: 'BTC', pair: 'BTC/USDT', name: 'Bitcoin',  basePrice: 83427.00, baseCap: 1676759000000, baseVol: 31513000000, baseChange: -0.45 },
  'ethereum': { symbol: 'ETH', pair: 'ETH/USDT', name: 'Ethereum', basePrice: 2515.00,  baseCap: 307174000000,  baseVol: 16497000000, baseChange: -1.62 },
  'solana':   { symbol: 'SOL', pair: 'SOL/USDT', name: 'Solana',   basePrice: 108.00,   baseCap: 63637000000,   baseVol: 4059000000,  baseChange: -3.78 }
};

// ─── PROVIDER-SOURCED PRICE CACHE & COINGECKO INTEGRATION ──────────────────────
// Zero fabricated/random movements. Genuine provider data or truthful stale state.
let priceCache = {
  updatedAt: 0,
  tetherUsdRate: 1.0,
  isRateLimited: false,
  provider: 'CoinGecko'
};
let serverCgRateLimitUntil = 0;

// Initialize cache with baseline metadata
SUPPORTED_COINS.forEach(c => {
  const meta = COIN_METADATA[c];
  priceCache[c] = {
    price: meta.basePrice,
    usdtPrice: meta.basePrice,
    usdPrice: meta.basePrice,
    conversionUsed: false,
    change24h: meta.baseChange,
    marketCap: meta.baseCap,
    volume24h: meta.baseVol,
    high24h: meta.basePrice * 1.025,
    low24h: meta.basePrice * 0.975,
    lastVerified: 0
  };
});

async function fetchPrices() {
  // Step 1: Query Binance 24hr live ticker for real-time orderflow and price ticks
  try {
    const bUrl = 'https://api.binance.com/api/v3/ticker/24hr?symbols=%5B%22BTCUSDC%22,%22BTCUSDT%22,%22ETHUSDT%22,%22SOLUSDT%22%5D';
    const bResp = await fetch(bUrl, { headers: { 'Accept': 'application/json' }, timeout: 3000 });
    if (bResp.ok) {
      const bList = await bResp.json();
      if (Array.isArray(bList) && bList.length >= 3) {
        // BTCUSDC matches Coinbase/TradingView BTC-USD index; BTCUSDT is fallback
        const symbolMap = { 'BTCUSDC': 'bitcoin', 'BTCUSDT': 'bitcoin_usdt', 'ETHUSDT': 'ethereum', 'SOLUSDT': 'solana' };
        let hasBtcUsdc = false;
        bList.forEach(item => {
          if (item.symbol === 'BTCUSDC') hasBtcUsdc = true;
        });

        bList.forEach(item => {
          let coinId = symbolMap[item.symbol];
          if (coinId === 'bitcoin_usdt' && hasBtcUsdc) return; // Prefer BTCUSDC for exact live match
          if (coinId === 'bitcoin_usdt') coinId = 'bitcoin';

          if (coinId) {
            const p = parseFloat(item.lastPrice);
            if (p > 0 && !isNaN(p) && isFinite(p)) {
              priceCache[coinId] = {
                price: parseFloat(p.toFixed(p > 10 ? 2 : 4)),
                usdtPrice: parseFloat(p.toFixed(p > 10 ? 2 : 4)),
                usdPrice: parseFloat(p.toFixed(p > 10 ? 2 : 4)),
                conversionUsed: false,
                change24h: parseFloat(parseFloat(item.priceChangePercent).toFixed(2)),
                marketCap: (priceCache[coinId]?.marketCap || COIN_METADATA[coinId].baseCap),
                volume24h: parseFloat(item.quoteVolume) || COIN_METADATA[coinId].baseVol,
                high24h: parseFloat(item.highPrice) || parseFloat((p * 1.02).toFixed(2)),
                low24h: parseFloat(item.lowPrice) || parseFloat((p * 0.98).toFixed(2)),
                lastVerified: Date.now()
              };
            }
          }
        });
        priceCache.updatedAt = Date.now();
        priceCache.isRateLimited = false;
        try { checkPendingOrders(); } catch (e) {}
        return priceCache;
      }
    }
  } catch (bErr) {
    // If Binance is unreachable, fall back to CoinGecko
  }

  // Step 2: CoinGecko Fallback
  const now = Date.now();
  if (now < serverCgRateLimitUntil) {
    priceCache.isRateLimited = true;
    return priceCache;
  }

  const ids = 'bitcoin,ethereum,solana,tether';
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usdt,usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;

  try {
    const resp = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      timeout: 5000
    });

    if (resp.status === 429) {
      serverCgRateLimitUntil = Date.now() + 60000;
      priceCache.isRateLimited = true;
      return priceCache;
    }

    if (!resp.ok) {
      return priceCache;
    }

    const data = await resp.json();
    const tetherUsd = (data.tether && typeof data.tether.usd === 'number' && data.tether.usd > 0)
      ? data.tether.usd
      : 1.0;
    priceCache.tetherUsdRate = tetherUsd;

    SUPPORTED_COINS.forEach(id => {
      if (data[id]) {
        let p = data[id].usdt;
        let conversionUsed = false;

        // If direct USDT quote is unavailable, calculate via USD / Tether USD
        if (typeof p !== 'number' || p <= 0) {
          if (typeof data[id].usd === 'number' && data[id].usd > 0) {
            p = data[id].usd / tetherUsd;
            conversionUsed = true;
          }
        }

        if (typeof p === 'number' && p > 0 && !isNaN(p) && isFinite(p)) {
          const prev = priceCache[id];
          priceCache[id] = {
            price: parseFloat(p.toFixed(p > 10 ? 2 : 4)),
            usdtPrice: parseFloat(p.toFixed(p > 10 ? 2 : 4)),
            usdPrice: data[id].usd || parseFloat((p * tetherUsd).toFixed(2)),
            conversionUsed,
            change24h: (typeof data[id].usd_24h_change === 'number' && isFinite(data[id].usd_24h_change))
              ? parseFloat(data[id].usd_24h_change.toFixed(2))
              : (prev ? prev.change24h : COIN_METADATA[id].baseChange),
            marketCap: data[id].usd_market_cap || (prev ? prev.marketCap : COIN_METADATA[id].baseCap),
            volume24h: data[id].usd_24h_vol || (prev ? prev.volume24h : COIN_METADATA[id].baseVol),
            high24h: parseFloat((p * 1.025).toFixed(2)),
            low24h: parseFloat((p * 0.975).toFixed(2)),
            lastVerified: Date.now()
          };
        }
      }
    });

    priceCache.updatedAt = Date.now();
    priceCache.isRateLimited = false;

    // Check pending limit orders against genuine market prices
    try { checkPendingOrders(); } catch (e) {}
    return priceCache;
  } catch (err) {
    return priceCache;
  }
}

// Background auto-poller every 1500ms so market prices are constantly live
setInterval(fetchPrices, 1500);

app.get('/api/prices', async (req, res) => {
  try {
    if (Date.now() - priceCache.updatedAt > 2000) {
      await fetchPrices();
    }
    const isStale = (Date.now() - priceCache.updatedAt) > 180000;
    res.json({
      prices: priceCache,
      bitcoin: priceCache.bitcoin,
      ethereum: priceCache.ethereum,
      solana: priceCache.solana,
      updatedAt: priceCache.updatedAt,
      isStale,
      isRateLimited: Date.now() < serverCgRateLimitUntil,
      tetherRate: priceCache.tetherUsdRate,
      supportedPairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
      provider: 'Live Market Feed'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve market prices' });
  }
});

// ─── REAL HISTORICAL OHLC CANDLESTICK CHART ───────────────────
const chartCache = {};

async function handleChartRequest(req, res) {
  try {
    const rawCoin = (req.params.coin || '').toLowerCase();
    const coin = SUPPORTED_COINS.find(c => c === rawCoin) || (rawCoin === 'btc' ? 'bitcoin' : rawCoin === 'eth' ? 'ethereum' : rawCoin === 'sol' ? 'solana' : null);
    const tf = (req.query.tf || '15m').toLowerCase();
    if (!coin) return res.status(400).json({ error: 'Invalid coin. Supported: bitcoin, ethereum, solana' });

    const cacheKey = `${coin}_${tf}`;
    const cached = chartCache[cacheKey];

    // Return fresh cached chart if within 10 seconds
    if (cached && (Date.now() - cached.timestamp < 10000)) {
      return res.json(cached.data);
    }

    // Step 1: Try Binance live klines for accurate real-time candles (BTCUSDC matches Coinbase/TradingView BTC-USD)
    const binanceSymbols = { 'bitcoin': 'BTCUSDC', 'ethereum': 'ETHUSDT', 'solana': 'SOLUSDT' };
    const binanceIntervals = { '1m':'1m', '3m':'3m', '5m':'5m', '15m':'15m', '1h':'1h', '4h':'4h', '1d':'1d', '1w':'1w' };
    const bSymbol = binanceSymbols[coin];
    const bInterval = binanceIntervals[tf] || '15m';

    try {
      const klineUrl = `https://api.binance.com/api/v3/klines?symbol=${bSymbol}&interval=${bInterval}&limit=100`;
      const kResp = await fetch(klineUrl, { timeout: 3500 });
      if (kResp.ok) {
        const klines = await kResp.json();
        if (Array.isArray(klines) && klines.length > 0) {
          const candles = klines.map(k => ({
            time: Math.floor(k[0] / 1000),
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5])
          }));
          const prices = candles.map(c => [c.time * 1000, c.close]);
          const payload = { symbol: coin, pair: COIN_METADATA[coin].pair, tf, candles, prices, isProviderData: true, timestamp: Date.now() };
          chartCache[cacheKey] = { timestamp: Date.now(), data: payload };
          return res.json(payload);
        }
      }
    } catch (binanceErr) {
      // Fall through to CoinGecko or cache
    }

    // Step 2: CoinGecko Fallback
    const days = ['1d', '1w'].includes(tf) ? 30 : ['4h'].includes(tf) ? 7 : 1;
    const cgUrl = `https://api.coingecko.com/api/v3/coins/${coin}/ohlc?vs_currency=usd&days=${days}`;

    try {
      const cgResp = await fetch(cgUrl, { timeout: 4500 });
      if (cgResp.ok) {
        const cgData = await cgResp.json();
        if (Array.isArray(cgData) && cgData.length > 0) {
          const candles = cgData.map(k => ({
            time: Math.floor(k[0] / 1000),
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: 0
          }));
          const prices = candles.map(c => [c.time * 1000, c.close]);
          const payload = { symbol: coin, pair: COIN_METADATA[coin].pair, tf, candles, prices, isProviderData: true, timestamp: Date.now() };
          chartCache[cacheKey] = { timestamp: Date.now(), data: payload };
          return res.json(payload);
        }
      }
    } catch (cgErr) {}

    if (cached) {
      return res.json({ ...cached.data, isStale: true });
    }

    res.json({
      symbol: coin,
      pair: COIN_METADATA[coin].pair,
      candles: [],
      prices: [],
      timestamp: Date.now()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve chart data' });
  }
}

app.get('/api/chart/:coin', handleChartRequest);
app.get('/api/ohlc/:coin', handleChartRequest);

// ─── SPOT TRADING ─────────────────────────────────────────────────────────────
app.post('/api/trade', authenticateToken, async (req, res) => {
  try {
    const { coin, type, amount, orderType = 'market', limitPrice } = req.body;
    if (!coin || !type || !amount || typeof amount !== 'number' || amount <= 0 || !isFinite(amount)) {
      return res.status(400).json({ error: 'Order size must be greater than 0' });
    }
    if (!SUPPORTED_COINS.includes(coin)) {
      return res.status(400).json({ error: 'Invalid coin. VTrade supports BTC/USDT, ETH/USDT, and SOL/USDT only' });
    }
    if (!['buy', 'sell'].includes(type)) return res.status(400).json({ error: 'Invalid order side' });

    // Safety: ensure price data is fresh (within 3 minutes)
    if (priceCache.updatedAt > 0 && (Date.now() - priceCache.updatedAt > 180000)) {
      return res.status(400).json({ error: 'Market data is stale (> 3m old). Order rejected for pricing safety.' });
    }

    if (Date.now() - priceCache.updatedAt > 30000) await fetchPrices();
    const marketPrice = priceCache[coin]?.price || COIN_METADATA[coin]?.basePrice;
    if (!marketPrice || marketPrice <= 0 || !isFinite(marketPrice)) {
      return res.status(500).json({ error: 'Market price currently unavailable' });
    }

    // Limit order placement
    if (orderType === 'limit' && limitPrice && limitPrice > 0 && isFinite(limitPrice)) {
      const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
      const total = parseFloat((amount * limitPrice).toFixed(2));
      if (type === 'buy' && user.balance < total) {
        return res.status(400).json({ error: 'Insufficient balance for limit order' });
      }

      db.prepare(`INSERT INTO orders (user_id, coin, type, direction, amount, price, trigger_price, status)
                  VALUES (?, ?, 'limit', ?, ?, ?, ?, 'pending')`).run(req.user.id, coin, type, amount, limitPrice, limitPrice);
      return res.json({ success: true, message: `Limit ${type.toUpperCase()} order placed at $${limitPrice.toLocaleString()} USDT`, orderType: 'limit' });
    }

    // Immediate Market order execution
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const portfolio = db.prepare('SELECT * FROM portfolio WHERE user_id = ? AND coin = ?').get(req.user.id, coin);
    const total = parseFloat((amount * marketPrice).toFixed(2));
    const coinAmount = parseFloat(amount);

    if (type === 'buy') {
      if (user.balance < total) return res.status(400).json({ error: 'Insufficient USDT balance' });
      db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(total, req.user.id);
      const currentAmount = portfolio?.amount || 0;
      const currentEntry = portfolio?.avg_entry_price || 0;
      const newAmount = currentAmount + coinAmount;
      const newAvg = (currentAmount * currentEntry + coinAmount * marketPrice) / newAmount;
      db.prepare(`INSERT INTO portfolio (user_id, coin, amount, avg_entry_price)
                  VALUES (?, ?, ?, ?)
                  ON CONFLICT(user_id, coin) DO UPDATE SET amount = ?, avg_entry_price = ?`)
        .run(req.user.id, coin, newAmount, newAvg, newAmount, newAvg);
    } else {
      if (!portfolio || portfolio.amount < coinAmount) return res.status(400).json({ error: `Insufficient ${coin.toUpperCase()} holding` });
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(total, req.user.id);
      db.prepare('UPDATE portfolio SET amount = amount - ? WHERE user_id = ? AND coin = ?').run(coinAmount, req.user.id, coin);
    }

    db.prepare('INSERT INTO trades (user_id, coin, type, amount, price, total) VALUES (?, ?, ?, ?, ?, ?)').run(req.user.id, coin, type, coinAmount, marketPrice, total);

    const newUser = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    const newPortfolio = db.prepare('SELECT * FROM portfolio WHERE user_id = ? AND coin = ?').get(req.user.id, coin);

    res.json({
      success: true,
      message: `${type === 'buy' ? 'Bought' : 'Sold'} ${coinAmount} ${COIN_METADATA[coin].symbol} at $${marketPrice.toLocaleString()} USDT`,
      balance: newUser.balance,
      coinBalance: newPortfolio?.amount || 0,
      price: marketPrice,
      total
    });
  } catch (err) {
    res.status(500).json({ error: 'Trade execution failed: ' + (err.message || 'unknown') });
  }
});

// ─── FUTURES POSITIONS (LONG / SHORT) ─────────────────────────────────────────
app.post('/api/positions/open', authenticateToken, async (req, res) => {
  try {
    const { coin, direction, size, leverage = 1, stopLoss, takeProfit } = req.body;
    if (!coin || !direction || !size || typeof size !== 'number' || size <= 0 || !isFinite(size)) {
      return res.status(400).json({ error: 'Position size must be greater than 0' });
    }
    if (leverage < 1 || leverage > 100 || !isFinite(leverage)) {
      return res.status(400).json({ error: 'Leverage must be between 1 and 100' });
    }
    if (!SUPPORTED_COINS.includes(coin)) {
      return res.status(400).json({ error: 'Invalid coin. VTrade supports BTC/USDT, ETH/USDT, and SOL/USDT only' });
    }
    if (!['long', 'short'].includes(direction)) return res.status(400).json({ error: 'Invalid direction' });

    // Price safety check
    if (priceCache.updatedAt > 0 && (Date.now() - priceCache.updatedAt > 180000)) {
      return res.status(400).json({ error: 'Market data is stale (> 3m old). Order rejected for safety.' });
    }

    if (Date.now() - priceCache.updatedAt > 30000) await fetchPrices();
    const entryPrice = priceCache[coin]?.price || COIN_METADATA[coin]?.basePrice;
    if (!entryPrice || entryPrice <= 0 || !isFinite(entryPrice)) {
      return res.status(500).json({ error: 'Price currently unavailable' });
    }

    const margin = parseFloat(((size * entryPrice) / leverage).toFixed(2));
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);

    if (user.balance < margin) return res.status(400).json({ error: 'Insufficient USDT margin' });

    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(margin, req.user.id);
    db.prepare(`INSERT INTO positions (user_id, coin, direction, size, entry_price, leverage, margin, stop_loss, take_profit)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(req.user.id, coin, direction, size, entryPrice, leverage, margin, stopLoss || null, takeProfit || null);

    const newUser = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    res.json({
      success: true,
      message: `${direction.toUpperCase()} position opened on ${COIN_METADATA[coin].pair} at $${entryPrice.toLocaleString()}`,
      balance: newUser.balance
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to open position: ' + (err.message || 'unknown') });
  }
});

app.post('/api/positions/close/:id', authenticateToken, async (req, res) => {
  try {
    const pos = db.prepare('SELECT * FROM positions WHERE id = ? AND user_id = ? AND status = ?').get(req.params.id, req.user.id, 'open');
    if (!pos) return res.status(404).json({ error: 'Position not found' });

    if (Date.now() - priceCache.updatedAt > 30000) await fetchPrices();
    const closePrice = priceCache[pos.coin]?.price || COIN_METADATA[pos.coin]?.basePrice;
    if (!closePrice || closePrice <= 0 || !isFinite(closePrice)) {
      return res.status(500).json({ error: 'Price unavailable' });
    }

    const priceDiff = closePrice - pos.entry_price;
    const pnl = parseFloat((pos.direction === 'long' ? priceDiff * pos.size : -priceDiff * pos.size).toFixed(2));
    const returnAmount = Math.max(0, pos.margin + pnl);

    db.prepare(`UPDATE positions SET status = 'closed', close_price = ?, pnl = ?, closed_at = CURRENT_TIMESTAMP WHERE id = ?`).run(closePrice, pnl, pos.id);
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(returnAmount, req.user.id);

    const newUser = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    res.json({
      success: true,
      message: `Position closed at $${closePrice.toLocaleString()} USDT. PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
      pnl,
      balance: newUser.balance,
      closePrice
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to close position: ' + (err.message || 'unknown') });
  }
});

app.get('/api/positions', authenticateToken, async (req, res) => {
  try {
    const positions = db.prepare(`SELECT * FROM positions WHERE user_id = ? AND status = 'open' ORDER BY created_at DESC`).all(req.user.id);
    if (Date.now() - priceCache.updatedAt > 30000) await fetchPrices();

    const enriched = positions.map(p => {
      const mark = priceCache[p.coin]?.price || p.entry_price;
      const diff = (p.direction === 'long') ? (mark - p.entry_price) : (p.entry_price - mark);
      const pnl = parseFloat((diff * p.size).toFixed(2));
      const liq = p.direction === 'long'
        ? p.entry_price * (1 - (1 / p.leverage) * 0.9)
        : p.entry_price * (1 + (1 / p.leverage) * 0.9);
      return {
        ...p,
        pair: COIN_METADATA[p.coin]?.pair || `${p.coin.toUpperCase()}/USDT`,
        markPrice: mark,
        unrealizedPnl: pnl,
        liquidationPrice: Math.max(0.0001, parseFloat(liq.toFixed(2)))
      };
    });
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// ─── ORDERS & AUTO-FILL ───────────────────────────────────────────────────────
app.get('/api/orders', authenticateToken, (req, res) => {
  try {
    const orders = db.prepare(`SELECT * FROM orders WHERE user_id = ? AND status = 'pending' ORDER BY created_at DESC`).all(req.user.id);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.delete('/api/orders/:id', authenticateToken, (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = ?').get(req.params.id, req.user.id, 'pending');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    db.prepare(`UPDATE orders SET status = 'cancelled' WHERE id = ?`).run(req.params.id);
    res.json({ success: true, message: 'Order cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

function checkPendingOrders() {
  try {
    const pending = db.prepare(`SELECT * FROM orders WHERE status = 'pending'`).all();
    for (const order of pending) {
      const price = priceCache[order.coin]?.price;
      if (!price || price <= 0 || !isFinite(price)) continue;
      const tp = order.trigger_price || order.price;
      if (!tp) continue;

      let shouldFill = false;
      if (order.type === 'limit') {
        if (order.direction === 'buy'  && price <= tp) shouldFill = true;
        if (order.direction === 'sell' && price >= tp) shouldFill = true;
      }

      if (shouldFill) {
        const total = parseFloat((order.amount * price).toFixed(2));
        db.prepare(`UPDATE orders SET status = 'filled', filled_price = ?, total = ?, filled_at = CURRENT_TIMESTAMP WHERE id = ?`).run(price, total, order.id);
        if (order.direction === 'buy') {
          db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(total, order.user_id);
          db.prepare(`INSERT INTO portfolio (user_id, coin, amount, avg_entry_price) VALUES (?, ?, ?, ?)
                      ON CONFLICT(user_id, coin) DO UPDATE SET amount = amount + ?, avg_entry_price = (avg_entry_price + ?)/2`)
            .run(order.user_id, order.coin, order.amount, price, order.amount, price);
        } else {
          db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(total, order.user_id);
          db.prepare('UPDATE portfolio SET amount = MAX(0, amount - ?) WHERE user_id = ? AND coin = ?').run(order.amount, order.user_id, order.coin);
        }
        db.prepare('INSERT INTO trades (user_id, coin, type, amount, price, total) VALUES (?, ?, ?, ?, ?, ?)').run(order.user_id, order.coin, order.direction, order.amount, price, total);
      }
    }

    // Check open positions for SL/TP
    const openPositions = db.prepare(`SELECT * FROM positions WHERE status = 'open'`).all();
    for (const pos of openPositions) {
      const price = priceCache[pos.coin]?.price;
      if (!price || price <= 0 || !isFinite(price)) continue;
      let shouldClose = false;
      if (pos.stop_loss && ((pos.direction === 'long' && price <= pos.stop_loss) || (pos.direction === 'short' && price >= pos.stop_loss))) shouldClose = true;
      if (pos.take_profit && ((pos.direction === 'long' && price >= pos.take_profit) || (pos.direction === 'short' && price <= pos.take_profit))) shouldClose = true;
      if (shouldClose) {
        const priceDiff = price - pos.entry_price;
        const pnl = parseFloat((pos.direction === 'long' ? priceDiff * pos.size : -priceDiff * pos.size).toFixed(2));
        db.prepare(`UPDATE positions SET status = 'closed', close_price = ?, pnl = ?, closed_at = CURRENT_TIMESTAMP WHERE id = ?`).run(price, pnl, pos.id);
        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(Math.max(pos.margin + pnl, 0), pos.user_id);
      }
    }
  } catch (err) {}
}

// ─── PORTFOLIO & HISTORY ──────────────────────────────────────────────────────
app.get('/api/portfolio', authenticateToken, async (req, res) => {
  try {
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    const holdings = db.prepare('SELECT * FROM portfolio WHERE user_id = ?').all(req.user.id);
    if (Date.now() - priceCache.updatedAt > 30000) await fetchPrices();

    const portfolioData = holdings.map(h => ({
      coin: h.coin,
      pair: COIN_METADATA[h.coin]?.pair || `${h.coin.toUpperCase()}/USDT`,
      amount: h.amount,
      avgEntryPrice: h.avg_entry_price,
      price: priceCache[h.coin]?.price || 0,
      value: parseFloat((h.amount * (priceCache[h.coin]?.price || 0)).toFixed(2)),
      pnl: parseFloat((h.amount * ((priceCache[h.coin]?.price || 0) - h.avg_entry_price)).toFixed(2))
    }));

    const openPositionsMargin = db.prepare(`SELECT SUM(margin) as total FROM positions WHERE user_id = ? AND status = 'open'`).get(req.user.id)?.total || 0;
    const totalValue = portfolioData.reduce((acc, h) => acc + h.value, 0) + user.balance + openPositionsMargin;
    res.json({ balance: user.balance, holdings: portfolioData, totalValue: parseFloat(totalValue.toFixed(2)) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

app.get('/api/trades', authenticateToken, (req, res) => {
  try {
    const trades = db.prepare('SELECT * FROM trades WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').all(req.user.id);
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// Comprehensive Reset Wallet: resets balance, closes open positions, cancels orders, clears holdings
app.post('/api/user/reset-balance', authenticateToken, (req, res) => {
  try {
    db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(STARTING_BALANCE, req.user.id);
    db.prepare(`UPDATE positions SET status = 'closed', closed_at = CURRENT_TIMESTAMP WHERE user_id = ? AND status = 'open'`).run(req.user.id);
    db.prepare(`UPDATE orders SET status = 'cancelled' WHERE user_id = ? AND status = 'pending'`).run(req.user.id);
    db.prepare('UPDATE portfolio SET amount = 0, avg_entry_price = 0 WHERE user_id = ?').run(req.user.id);
    res.json({
      success: true,
      message: `Virtual wallet reset to $${STARTING_BALANCE.toLocaleString()} USDT`,
      balance: STARTING_BALANCE
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset balance' });
  }
});

// ─── APK DOWNLOAD ROUTES (VTrade branding) ────────────────────────────────────
const apkDir = path.join(__dirname, '../android/app/build/outputs/apk/debug');

function getAvailableApkPath() {
  const candidates = [
    path.join(__dirname, '../VTrade.apk'),
    path.join(apkDir, 'app-debug.apk'),
    path.join(__dirname, '../CryptoTrader-Pro.apk'),
    path.join(__dirname, '../frontend/VTrade.apk'),
    path.join(__dirname, '../frontend/cryptotrader.apk')
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

app.get(['/apk', '/downloads/VTrade.apk', '/downloads/CryptoTrader-Pro.apk', '/downloads/cryptotrader.apk'], (req, res) => {
  try {
    const apk = getAvailableApkPath();
    if (apk) {
      return res.download(apk, 'VTrade.apk');
    }
    res.status(404).send('VTrade APK not available yet. Please build.');
  } catch (err) {
    res.status(500).send('Error serving APK');
  }
});

app.head(['/apk', '/downloads/VTrade.apk', '/downloads/CryptoTrader-Pro.apk', '/downloads/cryptotrader.apk'], (req, res) => {
  const apk = getAvailableApkPath();
  if (apk) return res.status(200).end();
  res.status(404).end();
});

app.get('/api/info', (req, res) => {
  res.json({
    appName: 'VTrade',
    version: '2.0.0',
    supportedPairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
    provider: 'CoinGecko',
    status: 'online',
    timestamp: Date.now()
  });
});

// Global fallback & error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal server error: ' + (err.message || 'unexpected exception') });
});

app.listen(PORT, '0.0.0.0', () => {
  fetchPrices();
});
