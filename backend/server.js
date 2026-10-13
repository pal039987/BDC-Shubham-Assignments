const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'crypto_trading_secret_key_2024';
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

// ─── AUTH ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, hash);
    db.prepare('INSERT OR IGNORE INTO portfolio (user_id, coin, amount, avg_entry_price) VALUES (?, ?, 0, 0)').run(result.lastInsertRowid, 'bitcoin');
    db.prepare('INSERT OR IGNORE INTO portfolio (user_id, coin, amount, avg_entry_price) VALUES (?, ?, 0, 0)').run(result.lastInsertRowid, 'ethereum');
    const token = jwt.sign({ id: result.lastInsertRowid, username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username, balance: STARTING_BALANCE });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed: ' + (err.message || 'unknown') });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'All fields required' });
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username, balance: user.balance });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed: ' + (err.message || 'unknown') });
  }
});

// ─── SUPPORTED COINS CONFIG (CoinGecko only, no hardcoded multipliers) ─────────
const SUPPORTED_COINS = [
  'bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple', 'cardano',
  'dogecoin', 'avalanche-2', 'polkadot', 'chainlink', 'litecoin', 'tron',
  'shiba-inu', 'the-open-network', 'matic-network', 'cosmos', 'near',
  'uniswap', 'aptos', 'arbitrum'
];

const COIN_METADATA = {
  'bitcoin':          { basePrice: 83427,      baseCap: 1676759000000, baseVol: 31513000000, baseChange: -0.45 },
  'ethereum':         { basePrice: 2515.06,    baseCap: 307174000000,  baseVol: 16497000000, baseChange: -1.62 },
  'solana':           { basePrice: 108.01,     baseCap: 63637000000,   baseVol: 4059000000,  baseChange: -3.78 },
  'binancecoin':      { basePrice: 744.92,     baseCap: 99188000000,   baseVol: 856000000,   baseChange: -1.02 },
  'ripple':           { basePrice: 1.37,       baseCap: 86352000000,   baseVol: 2102000000,  baseChange: -3.15 },
  'cardano':          { basePrice: 0.2378,     baseCap: 8931000000,    baseVol: 503500000,   baseChange: -5.86 },
  'dogecoin':         { basePrice: 0.0846,     baseCap: 13224000000,   baseVol: 849200000,   baseChange: -3.16 },
  'avalanche-2':      { basePrice: 10.53,      baseCap: 4666000000,    baseVol: 434500000,   baseChange: -4.14 },
  'polkadot':         { basePrice: 1.18,       baseCap: 2018000000,    baseVol: 225000000,   baseChange: -6.25 },
  'chainlink':        { basePrice: 12.94,      baseCap: 9926000000,    baseVol: 378900000,   baseChange: -3.64 },
  'litecoin':         { basePrice: 61.94,      baseCap: 4813000000,    baseVol: 324300000,   baseChange: -5.03 },
  'tron':             { basePrice: 0.3298,     baseCap: 31331000000,   baseVol: 324600000,   baseChange: -0.65 },
  'shiba-inu':        { basePrice: 0.00000526, baseCap: 3097000000,    baseVol: 98600000,    baseChange: -4.47 },
  'the-open-network': { basePrice: 1.38,       baseCap: 3913000000,    baseVol: 52890000,    baseChange: -4.17 },
  'matic-network':    { basePrice: 0.1262,     baseCap: 1261000000,    baseVol: 180000000,   baseChange: -3.85 },
  'cosmos':           { basePrice: 1.82,       baseCap: 976000000,     baseVol: 80600000,    baseChange: -4.85 },
  'near':             { basePrice: 5.34,       baseCap: 6986000000,    baseVol: 1323000000,  baseChange: -9.40 },
  'uniswap':          { basePrice: 7.33,       baseCap: 4580000000,    baseVol: 470500000,   baseChange: -5.78 },
  'aptos':            { basePrice: 0.8284,     baseCap: 731000000,     baseVol: 118000000,   baseChange: -9.25 },
  'arbitrum':         { basePrice: 0.1870,     baseCap: 1269000000,    baseVol: 184500000,   baseChange: -4.45 }
};

// ─── PRICE CACHE & FETCHING ──────────────────────────────────────────────────
let priceCache = { updatedAt: 0 };
let serverCgRateLimitUntil = 0;

SUPPORTED_COINS.forEach(c => {
  const meta = COIN_METADATA[c] || { basePrice: 100, baseCap: 1000000000, baseVol: 100000000, baseChange: 0 };
  priceCache[c] = {
    price: meta.basePrice,
    change24h: meta.baseChange,
    marketCap: meta.baseCap,
    volume24h: meta.baseVol,
    high24h: meta.basePrice * 1.025,
    low24h: meta.basePrice * 0.975
  };
});

async function fetchPrices() {
  if (Date.now() < serverCgRateLimitUntil) {
    return priceCache;
  }
  const ids = SUPPORTED_COINS.join(',');
  try {
    const resp = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
      { timeout: 5000 }
    );
    if (resp.status === 429) {
      serverCgRateLimitUntil = Date.now() + 60000;
      throw new Error('CoinGecko 429 rate limit exceeded');
    }
    if (!resp.ok) throw new Error('CoinGecko status ' + resp.status);
    const data = await resp.json();
    SUPPORTED_COINS.forEach(id => {
      if (data[id] && typeof data[id].usd === 'number') {
        const p = data[id].usd;
        if (p > 0 && !isNaN(p) && isFinite(p)) {
          priceCache[id] = {
            price: p,
            change24h: (typeof data[id].usd_24h_change === 'number' && isFinite(data[id].usd_24h_change))
              ? data[id].usd_24h_change
              : (priceCache[id]?.change24h || 0),
            marketCap: data[id].usd_market_cap || COIN_METADATA[id]?.baseCap || (priceCache[id]?.marketCap || 0),
            volume24h: data[id].usd_24h_vol || COIN_METADATA[id]?.baseVol || (priceCache[id]?.volume24h || 0),
            high24h: p * 1.025,
            low24h: p * 0.975
          };
        }
      }
    });
    priceCache.updatedAt = Date.now();
    try { checkPendingOrders(); } catch (e) { console.error('checkPendingOrders error:', e); }
    return priceCache;
  } catch (err) {
    // If CoinGecko fails, simulate subtle realistic movement safely
    SUPPORTED_COINS.forEach(id => {
      const prev = priceCache[id]?.price || COIN_METADATA[id]?.basePrice || 100;
      const delta = prev * (Math.random() - 0.49) * 0.002;
      const newP = Math.max(0.000001, prev + delta);
      if (newP > 0 && isFinite(newP)) {
        priceCache[id] = {
          ...priceCache[id],
          price: parseFloat(newP > 10 ? newP.toFixed(2) : newP.toPrecision(5)),
          change24h: parseFloat(((priceCache[id]?.change24h || 0) + (Math.random() - 0.5) * 0.04).toFixed(2))
        };
      }
    });
    priceCache.updatedAt = Date.now();
    return priceCache;
  }
}

app.get('/api/prices', async (req, res) => {
  try {
    if (Date.now() - priceCache.updatedAt > 20000) await fetchPrices();
    res.json(priceCache);
  } catch (err) {
    console.error('Prices route error:', err);
    res.status(500).json({ error: 'Failed to retrieve prices: ' + (err.message || 'unknown') });
  }
});

// ─── CHART & CANDLESTICKS (COINGECKO ONLY, NO BINANCE) ─────────────────────────
function generateFallbackChart(coin, tf) {
  const currentPrice = priceCache[coin]?.price || COIN_METADATA[coin]?.basePrice || 100;
  const tfMinutes = { '1m': 1, '3m': 3, '5m': 5, '15m': 15, '1h': 60, '2h': 120, '4h': 240, '1d': 1440, '1w': 10080 }[tf] || 15;
  const count = 60;
  const now = Date.now();
  const stepMs = tfMinutes * 60 * 1000;
  let p = currentPrice * 0.985;
  const candles = [];
  const prices = [];
  for (let i = count; i >= 0; i--) {
    const timeMs = now - (i * stepMs);
    const open = p;
    const delta = (Math.random() - 0.49) * 0.006 * p;
    const close = i === 0 ? currentPrice : Math.max(0.000001, p + delta);
    const high = Math.max(open, close) + Math.random() * 0.003 * p;
    const low = Math.min(open, close) - Math.random() * 0.003 * p;
    const vol = Math.random() * 60 + 10;
    p = close;
    candles.push({
      time: Math.floor(timeMs / 1000),
      open: parseFloat(open.toFixed(open > 10 ? 2 : 5)),
      high: parseFloat(high.toFixed(high > 10 ? 2 : 5)),
      low: parseFloat(low.toFixed(low > 10 ? 2 : 5)),
      close: parseFloat(close.toFixed(close > 10 ? 2 : 5)),
      volume: parseFloat(vol.toFixed(2))
    });
    prices.push([timeMs, parseFloat(close.toFixed(close > 10 ? 2 : 5))]);
  }
  return { candles, prices, simulated: true };
}

app.get('/api/chart/:coin', async (req, res) => {
  try {
    const rawCoin = (req.params.coin || '').toLowerCase();
    const coin = SUPPORTED_COINS.find(c => c === rawCoin) || (rawCoin === 'btc' ? 'bitcoin' : rawCoin === 'eth' ? 'ethereum' : null);
    const tf = (req.query.tf || '15m').toLowerCase();
    if (!coin) return res.status(400).json({ error: 'Invalid coin' });

    if (Date.now() < serverCgRateLimitUntil) {
      return res.json(generateFallbackChart(coin, tf));
    }

    try {
      const days = ['1d', '1w'].includes(tf) ? 30 : ['4h'].includes(tf) ? 7 : 1;
      const url = `https://api.coingecko.com/api/v3/coins/${coin}/ohlc?vs_currency=usd&days=${days}`;
      const resp = await fetch(url, { timeout: 4500 });
      if (resp.status === 429) {
        serverCgRateLimitUntil = Date.now() + 60000;
        return res.json(generateFallbackChart(coin, tf));
      }
      if (!resp.ok) throw new Error('CoinGecko OHLC status ' + resp.status);
      const klines = await resp.json();
      if (!Array.isArray(klines) || !klines.length) throw new Error('Empty OHLC');

      const candles = klines.map(k => ({
        time: Math.floor(k[0] / 1000),
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat((Math.random() * 50 + 10).toFixed(2))
      }));
      const prices = candles.map(c => [c.time * 1000, c.close]);
      return res.json({ symbol: coin, candles, prices, simulated: false });
    } catch (cgErr) {
      return res.json(generateFallbackChart(coin, tf));
    }
  } catch (outerErr) {
    console.error('Chart endpoint error:', outerErr);
    res.status(500).json({ error: outerErr.message || 'Error generating chart' });
  }
});

// ─── SPOT TRADING ─────────────────────────────────────────────────────────────
app.post('/api/trade', authenticateToken, async (req, res) => {
  try {
    const { coin, type, amount, orderType = 'market', limitPrice } = req.body;
    if (!coin || !type || !amount || typeof amount !== 'number' || amount <= 0 || !isFinite(amount)) {
      return res.status(400).json({ error: 'Order size must be greater than 0' });
    }
    if (!SUPPORTED_COINS.includes(coin)) return res.status(400).json({ error: 'Invalid coin' });
    if (!['buy', 'sell'].includes(type)) return res.status(400).json({ error: 'Invalid type' });

    if (Date.now() - priceCache.updatedAt > 60000) await fetchPrices();
    const marketPrice = priceCache[coin]?.price || COIN_METADATA[coin]?.basePrice;
    if (!marketPrice || marketPrice <= 0 || !isFinite(marketPrice)) {
      return res.status(500).json({ error: 'Price unavailable' });
    }

    // Limit order → save as pending
    if (orderType === 'limit' && limitPrice && limitPrice > 0 && isFinite(limitPrice)) {
      const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
      const total = parseFloat((amount * limitPrice).toFixed(2));
      if (type === 'buy' && user.balance < total) {
        return res.status(400).json({ error: 'Insufficient balance for limit order' });
      }

      db.prepare(`INSERT INTO orders (user_id, coin, type, direction, amount, price, status)
                  VALUES (?, ?, 'limit', ?, ?, ?, 'pending')`).run(req.user.id, coin, type, amount, limitPrice);
      return res.json({ success: true, message: `Limit ${type} order placed at $${limitPrice.toLocaleString()}`, orderType: 'limit' });
    }

    // Market order → execute immediately
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const portfolio = db.prepare('SELECT * FROM portfolio WHERE user_id = ? AND coin = ?').get(req.user.id, coin);
    const total = parseFloat((amount * marketPrice).toFixed(2));
    const coinAmount = parseFloat(amount);

    if (type === 'buy') {
      if (user.balance < total) return res.status(400).json({ error: 'Insufficient balance' });
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
      if (!portfolio || portfolio.amount < coinAmount) return res.status(400).json({ error: 'Insufficient coin balance' });
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(total, req.user.id);
      db.prepare('UPDATE portfolio SET amount = amount - ? WHERE user_id = ? AND coin = ?').run(coinAmount, req.user.id, coin);
    }

    db.prepare('INSERT INTO trades (user_id, coin, type, amount, price, total) VALUES (?, ?, ?, ?, ?, ?)').run(req.user.id, coin, type, coinAmount, marketPrice, total);

    const newUser = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    const newPortfolio = db.prepare('SELECT * FROM portfolio WHERE user_id = ? AND coin = ?').get(req.user.id, coin);

    res.json({
      success: true,
      message: `${type === 'buy' ? 'Bought' : 'Sold'} ${coinAmount} ${coin} at $${marketPrice.toLocaleString()}`,
      balance: newUser.balance,
      coinBalance: newPortfolio?.amount || 0,
      price: marketPrice,
      total,
    });
  } catch (err) {
    console.error('Trade error:', err);
    res.status(500).json({ error: 'Trade execution failed: ' + (err.message || 'unknown') });
  }
});

// ─── POSITIONS (LONG / SHORT) ─────────────────────────────────────────────────
app.post('/api/positions/open', authenticateToken, async (req, res) => {
  try {
    const { coin, direction, size, leverage = 1, stopLoss, takeProfit } = req.body;
    if (!coin || !direction || !size || typeof size !== 'number' || size <= 0 || !isFinite(size)) {
      return res.status(400).json({ error: 'Position size must be greater than 0' });
    }
    if (leverage < 1 || leverage > 100 || !isFinite(leverage)) {
      return res.status(400).json({ error: 'Leverage must be between 1 and 100' });
    }
    if (!SUPPORTED_COINS.includes(coin)) return res.status(400).json({ error: 'Invalid coin' });
    if (!['long', 'short'].includes(direction)) return res.status(400).json({ error: 'Invalid direction' });

    if (Date.now() - priceCache.updatedAt > 60000) await fetchPrices();
    const entryPrice = priceCache[coin]?.price || COIN_METADATA[coin]?.basePrice;
    if (!entryPrice || entryPrice <= 0 || !isFinite(entryPrice)) {
      return res.status(500).json({ error: 'Price unavailable' });
    }

    const margin = parseFloat(((size * entryPrice) / leverage).toFixed(2));
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);

    if (user.balance < margin) return res.status(400).json({ error: 'Insufficient margin' });

    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(margin, req.user.id);
    db.prepare(`INSERT INTO positions (user_id, coin, direction, size, entry_price, leverage, margin, stop_loss, take_profit)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(req.user.id, coin, direction, size, entryPrice, leverage, margin, stopLoss || null, takeProfit || null);

    const newUser = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    res.json({ success: true, message: `${direction.toUpperCase()} position opened on ${coin.toUpperCase()} at $${entryPrice.toLocaleString()}`, balance: newUser.balance });
  } catch (err) {
    console.error('Position open error:', err);
    res.status(500).json({ error: 'Failed to open position: ' + (err.message || 'unknown') });
  }
});

app.post('/api/positions/close/:id', authenticateToken, async (req, res) => {
  try {
    const pos = db.prepare('SELECT * FROM positions WHERE id = ? AND user_id = ? AND status = ?').get(req.params.id, req.user.id, 'open');
    if (!pos) return res.status(404).json({ error: 'Position not found' });

    if (Date.now() - priceCache.updatedAt > 60000) await fetchPrices();
    const closePrice = priceCache[pos.coin]?.price;
    if (!closePrice || closePrice <= 0 || !isFinite(closePrice)) {
      return res.status(500).json({ error: 'Price unavailable' });
    }

    const priceDiff = closePrice - pos.entry_price;
    const pnl = parseFloat((pos.direction === 'long' ? priceDiff * pos.size : -priceDiff * pos.size).toFixed(2));
    const returnAmount = pos.margin + pnl;

    db.prepare(`UPDATE positions SET status = 'closed', close_price = ?, pnl = ?, closed_at = CURRENT_TIMESTAMP WHERE id = ?`).run(closePrice, pnl, pos.id);
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(Math.max(returnAmount, 0), req.user.id);

    const newUser = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    res.json({
      success: true,
      message: `Position closed at $${closePrice.toLocaleString()}. PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
      pnl,
      balance: newUser.balance,
      closePrice,
    });
  } catch (err) {
    console.error('Position close error:', err);
    res.status(500).json({ error: 'Failed to close position: ' + (err.message || 'unknown') });
  }
});

app.get('/api/positions', authenticateToken, async (req, res) => {
  try {
    const positions = db.prepare(`SELECT * FROM positions WHERE user_id = ? ORDER BY created_at DESC`).all(req.user.id);
    if (Date.now() - priceCache.updatedAt > 60000) await fetchPrices();

    const enriched = positions.map(p => {
      let unrealizedPnl = 0;
      if (p.status === 'open') {
        const currentPrice = priceCache[p.coin]?.price || p.entry_price;
        const priceDiff = currentPrice - p.entry_price;
        unrealizedPnl = parseFloat((p.direction === 'long' ? priceDiff * p.size : -priceDiff * p.size).toFixed(2));
      }
      return { ...p, currentPrice: priceCache[p.coin]?.price || null, unrealizedPnl };
    });

    res.json(enriched);
  } catch (err) {
    console.error('Get positions error:', err);
    res.status(500).json({ error: 'Failed to fetch positions: ' + (err.message || 'unknown') });
  }
});

// ─── ORDERS ───────────────────────────────────────────────────────────────────
app.get('/api/orders', authenticateToken, (req, res) => {
  try {
    const orders = db.prepare(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`).all(req.user.id);
    res.json(orders);
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders: ' + (err.message || 'unknown') });
  }
});

app.post('/api/orders/place', authenticateToken, async (req, res) => {
  try {
    const { coin, direction, amount, orderType, triggerPrice } = req.body;
    if (!coin || !direction || !amount || typeof amount !== 'number' || amount <= 0 || !isFinite(amount) || !orderType) {
      return res.status(400).json({ error: 'Order amount must be greater than 0' });
    }

    if (Date.now() - priceCache.updatedAt > 60000) await fetchPrices();
    const currentPrice = priceCache[coin]?.price;
    if (!currentPrice || currentPrice <= 0 || !isFinite(currentPrice)) {
      return res.status(500).json({ error: 'Price unavailable' });
    }

    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    const estimatedTotal = amount * (triggerPrice || currentPrice);
    if ((direction === 'buy' || direction === 'long') && user.balance < estimatedTotal) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    db.prepare(`INSERT INTO orders (user_id, coin, type, direction, amount, price, trigger_price, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`).run(req.user.id, coin, orderType, direction, amount, triggerPrice || null, triggerPrice || null);

    res.json({ success: true, message: `${orderType} order placed successfully` });
  } catch (err) {
    console.error('Place order error:', err);
    res.status(500).json({ error: 'Failed to place order: ' + (err.message || 'unknown') });
  }
});

app.delete('/api/orders/:id', authenticateToken, (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = ?').get(req.params.id, req.user.id, 'pending');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    db.prepare(`UPDATE orders SET status = 'cancelled' WHERE id = ?`).run(req.params.id);
    res.json({ success: true, message: 'Order cancelled' });
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({ error: 'Failed to cancel order: ' + (err.message || 'unknown') });
  }
});

// Auto-fill pending orders when price moves
function checkPendingOrders() {
  try {
    const pending = db.prepare(`SELECT * FROM orders WHERE status = 'pending'`).all();
    for (const order of pending) {
      const price = priceCache[order.coin]?.price;
      if (!price || price <= 0 || !isFinite(price)) continue;
      const tp = order.trigger_price;
      if (!tp) continue;

      let shouldFill = false;
      if (order.type === 'limit') {
        if (order.direction === 'buy'  && price <= tp) shouldFill = true;
        if (order.direction === 'sell' && price >= tp) shouldFill = true;
      } else if (order.type === 'stop_loss') {
        if (order.direction === 'sell' && price <= tp) shouldFill = true;
      } else if (order.type === 'take_profit') {
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
  } catch (err) {
    console.error('Error in checkPendingOrders:', err);
  }
}

// ─── PORTFOLIO & HISTORY ──────────────────────────────────────────────────────
app.get('/api/portfolio', authenticateToken, async (req, res) => {
  try {
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    const holdings = db.prepare('SELECT * FROM portfolio WHERE user_id = ?').all(req.user.id);
    if (Date.now() - priceCache.updatedAt > 60000) await fetchPrices();

    const portfolioData = holdings.map(h => ({
      coin: h.coin,
      amount: h.amount,
      avgEntryPrice: h.avg_entry_price,
      price: priceCache[h.coin]?.price || 0,
      value: parseFloat((h.amount * (priceCache[h.coin]?.price || 0)).toFixed(2)),
      pnl: parseFloat((h.amount * ((priceCache[h.coin]?.price || 0) - h.avg_entry_price)).toFixed(2)),
    }));

    const openPositionsMargin = db.prepare(`SELECT SUM(margin) as total FROM positions WHERE user_id = ? AND status = 'open'`).get(req.user.id)?.total || 0;
    const totalValue = portfolioData.reduce((acc, h) => acc + h.value, 0) + user.balance + openPositionsMargin;
    res.json({ balance: user.balance, holdings: portfolioData, totalValue: parseFloat(totalValue.toFixed(2)) });
  } catch (err) {
    console.error('Portfolio error:', err);
    res.status(500).json({ error: 'Failed to fetch portfolio: ' + (err.message || 'unknown') });
  }
});

app.get('/api/trades', authenticateToken, (req, res) => {
  try {
    const trades = db.prepare('SELECT * FROM trades WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
    res.json(trades);
  } catch (err) {
    console.error('Trades error:', err);
    res.status(500).json({ error: 'Failed to fetch trades: ' + (err.message || 'unknown') });
  }
});

app.post('/api/user/reset-balance', authenticateToken, (req, res) => {
  try {
    db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(STARTING_BALANCE, req.user.id);
    res.json({ success: true, message: `Balance reset to $${STARTING_BALANCE.toLocaleString()}`, balance: STARTING_BALANCE });
  } catch (err) {
    console.error('Reset balance error:', err);
    res.status(500).json({ error: 'Failed to reset balance: ' + (err.message || 'unknown') });
  }
});

// ─── APK DOWNLOAD ROUTE ────────────────────────────────────────────────────────
const apkDir = path.join(__dirname, '../android/app/build/outputs/apk/debug');
app.use('/download', express.static(apkDir));
app.use('/downloads', express.static(path.join(__dirname, '../frontend')));

app.get(['/downloads/cryptotrader.apk', '/downloads/CryptoTrader-Pro.apk'], (req, res) => {
  try {
    const candidatePaths = [
      path.join(__dirname, '../frontend/cryptotrader.apk'),
      path.join(apkDir, 'app-debug.apk'),
      path.join(__dirname, '../android/app/src/main/assets/public/cryptotrader.apk')
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return res.download(p, 'cryptotrader.apk');
      }
    }
    res.status(404).send('APK not available yet');
  } catch (err) {
    console.error('APK download error:', err);
    res.status(500).send('Error serving APK: ' + (err.message || 'unknown'));
  }
});

app.head(['/downloads/cryptotrader.apk', '/downloads/CryptoTrader-Pro.apk'], (req, res) => {
  try {
    const candidatePaths = [
      path.join(__dirname, '../frontend/cryptotrader.apk'),
      path.join(apkDir, 'app-debug.apk'),
      path.join(__dirname, '../android/app/src/main/assets/public/cryptotrader.apk')
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return res.status(200).end();
      }
    }
    res.status(404).end();
  } catch (err) {
    console.error('APK HEAD check error:', err);
    res.status(500).end();
  }
});

app.get('/apk', (req, res) => {
  try {
    const apkPath = path.join(apkDir, 'app-debug.apk');
    if (fs.existsSync(apkPath)) {
      res.download(apkPath, 'CryptoTrader-Pro.apk');
    } else {
      res.status(404).send('APK is still generating. Please try again in 1 minute.');
    }
  } catch (err) {
    console.error('/apk route error:', err);
    res.status(500).send('Error serving APK: ' + (err.message || 'unknown'));
  }
});

// ─── API INFO ROUTE ────────────────────────────────────────────────────────────
app.get('/api/info', (req, res) => {
  try {
    res.json({
      name: 'CryptoTrader Pro Backend',
      version: '2.0.0',
      status: 'online',
      time: new Date().toISOString()
    });
  } catch (err) {
    console.error('API info error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── 404 FOR ALL UNMATCHED /api ROUTES (MUST BE JSON, NOT HTML) ────────────────
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// ─── SERVE FRONTEND ────────────────────────────────────────────────────────────
app.get('/{*splat}', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  } catch (err) {
    console.error('Frontend serve error:', err);
    res.status(500).send('Error loading frontend');
  }
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error: ' + (err.message || 'unknown') });
});

// ─── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  fetchPrices();
});

// Poll prices every 3s to auto-fill limit orders and trigger SL/TP
setInterval(fetchPrices, 3000);
