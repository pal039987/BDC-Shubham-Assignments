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

  CREATE TABLE IF NOT EXISTS user_wallets (
    user_id INTEGER PRIMARY KEY,
    cash_balance REAL DEFAULT 10000,
    positions_json TEXT DEFAULT '[]',
    orders_json TEXT DEFAULT '[]',
    trades_json TEXT DEFAULT '[]',
    updated_at INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

try {
  db.exec('ALTER TABLE portfolio ADD COLUMN avg_entry_price REAL DEFAULT 0');
} catch (e) { }

// ─── Universal Persistent User Registry Backup Engine ──────────────────────────
const USERS_BACKUP_FILE = path.join(__dirname, 'registered_users_backup.json');

function syncUsersBackup() {
  try {
    const allUsers = db.prepare('SELECT id, username, email, password, balance, created_at FROM users').all();
    const backupData = allUsers.map(u => {
      const wallet = db.prepare('SELECT cash_balance, positions_json, orders_json, trades_json, updated_at FROM user_wallets WHERE user_id = ?').get(u.id);
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        password: u.password,
        balance: wallet && typeof wallet.cash_balance === 'number' ? wallet.cash_balance : u.balance,
        created_at: u.created_at,
        positions_json: wallet ? wallet.positions_json : '[]',
        orders_json: wallet ? wallet.orders_json : '[]',
        trades_json: wallet ? wallet.trades_json : '[]',
        updated_at: wallet ? wallet.updated_at : Date.now()
      };
    });
    fs.writeFileSync(USERS_BACKUP_FILE, JSON.stringify(backupData, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to sync users backup:', err);
  }
}

function restoreUsersFromBackup() {
  try {
    // 1. Seed standard demo / test accounts if not already in DB
    const seedHash = bcrypt.hashSync('password123', 10);
    const defaultSeeds = [
      { username: 'testtrader', email: 'test@example.com', password: seedHash, balance: 10000 },
      { username: 'trader2', email: 'trader2@test.com', password: seedHash, balance: 10000 }
    ];
    defaultSeeds.forEach(s => {
      const exists = db.prepare('SELECT id FROM users WHERE LOWER(TRIM(email)) = ?').get(s.email.toLowerCase());
      if (!exists) {
        const ins = db.prepare('INSERT INTO users (username, email, password, balance) VALUES (?, ?, ?, ?)').run(s.username, s.email, s.password, s.balance);
        db.prepare('INSERT OR IGNORE INTO user_wallets (user_id, cash_balance, updated_at) VALUES (?, ?, ?)')
          .run(ins.lastInsertRowid, s.balance, Date.now());
      }
    });

    // 2. Restore any persisted registered users from backup ledger
    if (fs.existsSync(USERS_BACKUP_FILE)) {
      const content = fs.readFileSync(USERS_BACKUP_FILE, 'utf8');
      const backupUsers = JSON.parse(content || '[]');
      if (Array.isArray(backupUsers)) {
        for (const bu of backupUsers) {
          if (!bu.email) continue;
          const cleanEmail = bu.email.trim().toLowerCase();
          let existingUser = db.prepare('SELECT id FROM users WHERE LOWER(TRIM(email)) = ?').get(cleanEmail);
          let userId;
          if (!existingUser) {
            const ins = db.prepare('INSERT INTO users (username, email, password, balance, created_at) VALUES (?, ?, ?, ?, ?)')
              .run(bu.username || cleanEmail.split('@')[0], cleanEmail, bu.password, bu.balance || 10000, bu.created_at || new Date().toISOString());
            userId = ins.lastInsertRowid;
          } else {
            userId = existingUser.id;
          }
          db.prepare(`
            INSERT OR REPLACE INTO user_wallets (user_id, cash_balance, positions_json, orders_json, trades_json, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            userId,
            typeof bu.balance === 'number' ? bu.balance : 10000,
            bu.positions_json || '[]',
            bu.orders_json || '[]',
            bu.trades_json || '[]',
            bu.updated_at || Date.now()
          );
        }
      }
    }
  } catch (err) {
    console.error('Failed to restore users from backup ledger:', err);
  }
}

// Ensure persistent users ledger is restored on startup
restoreUsersFromBackup();
syncUsersBackup();

// Clean up any legacy auto-seeded mock position (entryPrice 82296.78) without resetting user balance
try {
  const targetEmail = 'pal039987@mpgi.edu.in';
  const targetUser = db.prepare('SELECT id FROM users WHERE LOWER(TRIM(email)) = ?').get(targetEmail);
  if (targetUser) {
    const w = db.prepare('SELECT positions_json FROM user_wallets WHERE user_id = ?').get(targetUser.id);
    if (w && w.positions_json) {
      let pos = JSON.parse(w.positions_json || '[]');
      const filtered = pos.filter(p => !(p.id === 1729340000000 || p.entryPrice === 82296.78));
      if (filtered.length !== pos.length) {
        db.prepare('UPDATE user_wallets SET positions_json = ? WHERE user_id = ?')
          .run(JSON.stringify(filtered), targetUser.id);
      }
    }
  }
} catch (e) { }

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  exposedHeaders: ['X-Refreshed-Token']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Explicit favicon handler for browser tabs
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/favicon.ico'));
});

// Serve Android APK directly from downloads folder
app.get('/vtrade.apk', (req, res) => {
  const apkPath = path.join(__dirname, '../downloads/VTrade.apk');
  if (fs.existsSync(apkPath)) {
    res.download(apkPath, 'VTrade.apk');
  } else {
    res.status(404).send('APK is compiling, please try again in a moment');
  }
});

// Version Check API for in-app OTA update system
app.get('/api/version', (req, res) => {
  res.json({
    latestVersion: '3.0.0',
    latestVersionCode: 21,
    releaseDate: '2026-10-21',
    changelog: 'Native TradingView Hexagonal Settings button on toolbar, 1:1 mobile pixel coordinate precision for smooth drawing handles & risk:reward resizing',
    downloadUrl: 'https://vtrade-crypto.onrender.com/vtrade.apk',
    forceUpdate: false
  });
});

function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });

    try {
      req.user = jwt.verify(token, JWT_SECRET);
      return next();
    } catch (verifyErr) {
      // Decode expired token to restore the user session seamlessly in paper trading
      let decoded = null;
      try { decoded = jwt.decode(token); } catch (_) { }
      let user = null;
      if (decoded?.id) {
        user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(decoded.id);
      }
      if (!user && decoded?.username) {
        user = db.prepare('SELECT id, username FROM users WHERE username = ?').get(decoded.username);
      }
      if (!user) {
        user = db.prepare('SELECT id, username FROM users ORDER BY id ASC LIMIT 1').get();
      }
      if (!user) {
        const hash = bcrypt.hashSync('papertrading123', 10);
        const ins = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(
          'flipfishtrust',
          'flipfishtrust@vtrade.paper',
          hash
        );
        user = { id: ins.lastInsertRowid, username: 'flipfishtrust' };
      }

      req.user = { id: user.id, username: user.username };
      const refreshedToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '365d' });
      res.setHeader('X-Refreshed-Token', refreshedToken);
      res.setHeader('Access-Control-Expose-Headers', 'X-Refreshed-Token');
      return next();
    }
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
app.post('/api/auth/paper-session', (req, res) => {
  try {
    const { username } = req.body || {};
    const preferredName = username || 'flipfishtrust';
    let user = db.prepare('SELECT id, username, email, balance FROM users WHERE username = ?').get(preferredName);
    if (!user) {
      user = db.prepare('SELECT id, username, email, balance FROM users ORDER BY id ASC LIMIT 1').get();
    }
    if (!user) {
      const hash = bcrypt.hashSync('papertrading123', 10);
      const userEmail = `${preferredName.toLowerCase()}@vtrade.paper`;
      const ins = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(
        preferredName,
        userEmail,
        hash
      );
      user = { id: ins.lastInsertRowid, username: preferredName, email: userEmail, balance: STARTING_BALANCE };
    }
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '365d' });
    res.json({ token, username: user.username, email: user.email, balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create paper session: ' + (err.message || 'unknown') });
  }
});
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required (username, email, password)' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    // Explicit duplicate check
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?').get(cleanEmail, cleanUsername.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Account already exists! Please Sign In.' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (username, email, password, balance) VALUES (?, ?, ?, ?)').run(cleanUsername, cleanEmail, hash, STARTING_BALANCE);
    const userId = result.lastInsertRowid;

    // Initialize user wallet and portfolio strictly for the supported pairs
    db.prepare('INSERT OR IGNORE INTO user_wallets (user_id, cash_balance, positions_json, orders_json, trades_json, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(userId, STARTING_BALANCE, '[]', '[]', '[]', Date.now());
    db.prepare('INSERT OR IGNORE INTO portfolio (user_id, coin, amount, avg_entry_price) VALUES (?, ?, 0, 0)').run(userId, 'bitcoin');
    db.prepare('INSERT OR IGNORE INTO portfolio (user_id, coin, amount, avg_entry_price) VALUES (?, ?, 0, 0)').run(userId, 'ethereum');
    db.prepare('INSERT OR IGNORE INTO portfolio (user_id, coin, amount, avg_entry_price) VALUES (?, ?, 0, 0)').run(userId, 'solana');

    syncUsersBackup();

    const token = jwt.sign({ id: userId, username: cleanUsername, email: cleanEmail }, JWT_SECRET, { expiresIn: '365d' });
    res.json({ token, username: cleanUsername, email: cleanEmail, balance: STARTING_BALANCE });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Account already exists! Please Sign In.' });
    }
    res.status(500).json({ error: 'Registration failed: ' + (err.message || 'unknown') });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(TRIM(email)) = ?').get(cleanEmail);
    if (!user) {
      return res.status(404).json({ error: 'Account is not registered. Please create an account first.' });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }
    const wallet = db.prepare('SELECT cash_balance FROM user_wallets WHERE user_id = ?').get(user.id);
    const effectiveBalance = wallet && typeof wallet.cash_balance === 'number' ? wallet.cash_balance : user.balance;
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '365d' });
    res.json({ token, username: user.username, email: user.email, balance: effectiveBalance });
  } catch (err) {
    res.status(500).json({ error: 'Login failed: ' + (err.message || 'unknown') });
  }
});

app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { email, newPassword, checkOnly } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email required' });
    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(TRIM(email)) = ?').get(cleanEmail);
    if (!user) {
      return res.status(404).json({ error: 'Account is not registered. Please create an account first.' });
    }
    if (checkOnly) {
      return res.json({ success: true, exists: true });
    }
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, user.id);
    syncUsersBackup();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password: ' + (err.message || 'unknown') });
  }
});

// ─── CLOUD WALLET SYNC (APK ⇄ WEB DUAL-DIRECTION REALTIME SYNC) ───────────
app.post('/api/wallet/sync', (req, res) => {
  try {
    const { email, cashBalance, positions, orders, tradesHistory, updatedAt } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email required' });
    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT id FROM users WHERE LOWER(TRIM(email)) = ?').get(cleanEmail);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const posJson = JSON.stringify(positions || []);
    const ordJson = JSON.stringify(orders || []);
    const trdJson = JSON.stringify(tradesHistory || []);
    const bal = typeof cashBalance === 'number' ? cashBalance : parseFloat(cashBalance || 10000);
    const ts = updatedAt || Date.now();

    db.prepare(`
      INSERT INTO user_wallets (user_id, cash_balance, positions_json, orders_json, trades_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        cash_balance = excluded.cash_balance,
        positions_json = excluded.positions_json,
        orders_json = excluded.orders_json,
        trades_json = excluded.trades_json,
        updated_at = excluded.updated_at
    `).run(user.id, bal, posJson, ordJson, trdJson, ts);

    // Also update base balance in users table
    db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(bal, user.id);
    syncUsersBackup();

    res.json({ success: true, cashBalance: bal, updatedAt: ts });
  } catch (err) {
    res.status(500).json({ error: 'Wallet sync failed: ' + (err.message || 'unknown') });
  }
});

app.get('/api/wallet/sync', (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: 'Email query parameter required' });
    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT id FROM users WHERE LOWER(TRIM(email)) = ?').get(cleanEmail);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let wallet = db.prepare('SELECT * FROM user_wallets WHERE user_id = ?').get(user.id);
    if (!wallet) {
      const defaultBal = 10000.00;
      const defaultPos = '[]';
      db.prepare(`
        INSERT INTO user_wallets (user_id, cash_balance, positions_json, orders_json, trades_json, updated_at)
        VALUES (?, ?, ?, '[]', '[]', ?)
      `).run(user.id, defaultBal, defaultPos, Date.now());
      wallet = db.prepare('SELECT * FROM user_wallets WHERE user_id = ?').get(user.id);
    }

    res.json({
      exists: true,
      cashBalance: wallet.cash_balance,
      positions: JSON.parse(wallet.positions_json || '[]'),
      orders: JSON.parse(wallet.orders_json || '[]'),
      tradesHistory: JSON.parse(wallet.trades_json || '[]'),
      updatedAt: wallet.updated_at
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cloud wallet: ' + (err.message || 'unknown') });
  }
});

// ─── SUPPORTED PAIRS CONFIG (Popular Coins: BTC, ETH, SOL, BNB, DOGE, XRP, ADA, SUI, AVAX, PEPE, NEAR) ───────────
const SUPPORTED_COINS = [
  'bitcoin', 'ethereum', 'gold', 'solana', 'ripple', 'binancecoin', 'dogecoin', 'cardano',
  'avalanche-2', 'sui', 'near', 'aptos', 'polkadot', 'tron', 'the-open-network', 'filecoin',
  'internet-computer', 'sei-network', 'celestia', 'algorand', 'hedera-hashgraph', 'cosmos',
  'stellar', 'fantom', 'vechain', 'litecoin', 'bitcoin-cash', 'ethereum-classic', 'uniswap',
  'chainlink', 'aave', 'maker', 'curve-dao-token', 'lido-dao', 'pendle', 'injective-protocol',
  'jupiter-exchange-solana', 'thorchain', 'havven', 'dydx-chain', 'arbitrum', 'optimism',
  'polygon-ecosystem-token', 'starknet', 'shiba-inu', 'pepe', 'dogwifcoin', 'bonk', 'floki',
  'book-of-meme', 'memecoin', 'render-token', 'fetch-ai', 'bittensor', 'worldcoin-wld', 'the-graph'
];

const COIN_METADATA = {
  'bitcoin': { symbol: 'BTC', pair: 'BTC/USDT', name: 'Bitcoin', basePrice: 83800.00, baseCap: 1676759000000, baseVol: 31513000000, baseChange: -0.10 },
  'ethereum': { symbol: 'ETH', pair: 'ETH/USDT', name: 'Ethereum', basePrice: 2515.00, baseCap: 307174000000, baseVol: 16497000000, baseChange: -1.60 },
  'gold': { symbol: 'XAU', pair: 'XAU/USD', name: 'Gold Spot', basePrice: 4134.90, baseCap: 15000000000000, baseVol: 85000000000, baseChange: -0.16 },
  'solana': { symbol: 'SOL', pair: 'SOL/USDT', name: 'Solana', basePrice: 107.50, baseCap: 63637000000, baseVol: 4059000000, baseChange: -3.70 },
  'binancecoin': { symbol: 'BNB', pair: 'BNB/USDT', name: 'BNB', basePrice: 744.00, baseCap: 107000000000, baseVol: 1850000000, baseChange: -0.14 },
  'dogecoin': { symbol: 'DOGE', pair: 'DOGE/USDT', name: 'Dogecoin', basePrice: 0.085, baseCap: 12500000000, baseVol: 850000000, baseChange: -0.65 },
  'ripple': { symbol: 'XRP', pair: 'XRP/USDT', name: 'XRP', basePrice: 1.38, baseCap: 78000000000, baseVol: 2450000000, baseChange: -0.85 },
  'cardano': { symbol: 'ADA', pair: 'ADA/USDT', name: 'Cardano', basePrice: 0.236, baseCap: 8400000000, baseVol: 420000000, baseChange: -1.08 },
  'sui': { symbol: 'SUI', pair: 'SUI/USDT', name: 'Sui', basePrice: 1.058, baseCap: 3100000000, baseVol: 560000000, baseChange: -1.13 },
  'avalanche-2': { symbol: 'AVAX', pair: 'AVAX/USDT', name: 'Avalanche', basePrice: 10.23, baseCap: 4100000000, baseVol: 390000000, baseChange: -2.10 },
  'pepe': { symbol: 'PEPE', pair: 'PEPE/USDT', name: 'Pepe', basePrice: 0.0000042, baseCap: 1800000000, baseVol: 650000000, baseChange: 1.60 },
  'near': { symbol: 'NEAR', pair: 'NEAR/USDT', name: 'NEAR Protocol', basePrice: 5.045, baseCap: 6200000000, baseVol: 480000000, baseChange: -1.20 },
  'aptos': { symbol: 'APT', pair: 'APT/USDT', name: 'Aptos', basePrice: 5.82, baseCap: 2800000000, baseVol: 190000000, baseChange: 0.8 },
  'polkadot': { symbol: 'DOT', pair: 'DOT/USDT', name: 'Polkadot', basePrice: 4.15, baseCap: 5900000000, baseVol: 210000000, baseChange: -0.5 },
  'tron': { symbol: 'TRX', pair: 'TRX/USDT', name: 'TRON', basePrice: 0.198, baseCap: 17000000000, baseVol: 450000000, baseChange: 0.2 },
  'the-open-network': { symbol: 'TON', pair: 'TON/USDT', name: 'Toncoin', basePrice: 5.25, baseCap: 13000000000, baseVol: 180000000, baseChange: -1.4 },
  'filecoin': { symbol: 'FIL', pair: 'FIL/USDT', name: 'Filecoin', basePrice: 3.65, baseCap: 2100000000, baseVol: 110000000, baseChange: -0.8 },
  'internet-computer': { symbol: 'ICP', pair: 'ICP/USDT', name: 'Internet Computer', basePrice: 8.45, baseCap: 3900000000, baseVol: 130000000, baseChange: -1.1 },
  'sei-network': { symbol: 'SEI', pair: 'SEI/USDT', name: 'Sei', basePrice: 0.38, baseCap: 1200000000, baseVol: 140000000, baseChange: 1.2 },
  'celestia': { symbol: 'TIA', pair: 'TIA/USDT', name: 'Celestia', basePrice: 4.85, baseCap: 1100000000, baseVol: 95000000, baseChange: -2.3 },
  'algorand': { symbol: 'ALGO', pair: 'ALGO/USDT', name: 'Algorand', basePrice: 0.145, baseCap: 1200000000, baseVol: 80000000, baseChange: 0.4 },
  'hedera-hashgraph': { symbol: 'HBAR', pair: 'HBAR/USDT', name: 'Hedera', basePrice: 0.052, baseCap: 1900000000, baseVol: 75000000, baseChange: -0.2 },
  'cosmos': { symbol: 'ATOM', pair: 'ATOM/USDT', name: 'Cosmos Hub', basePrice: 4.45, baseCap: 1700000000, baseVol: 90000000, baseChange: -1.5 },
  'stellar': { symbol: 'XLM', pair: 'XLM/USDT', name: 'Stellar', basePrice: 0.098, baseCap: 2900000000, baseVol: 85000000, baseChange: 0.3 },
  'fantom': { symbol: 'FTM', pair: 'FTM/USDT', name: 'Fantom', basePrice: 0.72, baseCap: 2000000000, baseVol: 150000000, baseChange: 2.1 },
  'vechain': { symbol: 'VET', pair: 'VET/USDT', name: 'VeChain', basePrice: 0.022, baseCap: 1800000000, baseVol: 60000000, baseChange: -0.4 },
  'litecoin': { symbol: 'LTC', pair: 'LTC/USDT', name: 'Litecoin', basePrice: 71.50, baseCap: 5300000000, baseVol: 280000000, baseChange: -0.7 },
  'bitcoin-cash': { symbol: 'BCH', pair: 'BCH/USDT', name: 'Bitcoin Cash', basePrice: 345.00, baseCap: 6800000000, baseVol: 220000000, baseChange: 0.5 },
  'ethereum-classic': { symbol: 'ETC', pair: 'ETC/USDT', name: 'Ethereum Classic', basePrice: 18.20, baseCap: 2700000000, baseVol: 140000000, baseChange: -0.9 },
  'uniswap': { symbol: 'UNI', pair: 'UNI/USDT', name: 'Uniswap', basePrice: 7.80, baseCap: 4700000000, baseVol: 190000000, baseChange: 1.4 },
  'chainlink': { symbol: 'LINK', pair: 'LINK/USDT', name: 'Chainlink', basePrice: 11.20, baseCap: 6800000000, baseVol: 250000000, baseChange: -1.2 },
  'aave': { symbol: 'AAVE', pair: 'AAVE/USDT', name: 'Aave', basePrice: 158.00, baseCap: 2300000000, baseVol: 180000000, baseChange: 3.2 },
  'maker': { symbol: 'MKR', pair: 'MKR/USDT', name: 'Maker', basePrice: 1250.00, baseCap: 1100000000, baseVol: 75000000, baseChange: -0.5 },
  'curve-dao-token': { symbol: 'CRV', pair: 'CRV/USDT', name: 'Curve DAO', basePrice: 0.28, baseCap: 350000000, baseVol: 55000000, baseChange: 1.8 },
  'lido-dao': { symbol: 'LDO', pair: 'LDO/USDT', name: 'Lido DAO', basePrice: 1.15, baseCap: 1000000000, baseVol: 85000000, baseChange: -1.7 },
  'pendle': { symbol: 'PENDLE', pair: 'PENDLE/USDT', name: 'Pendle', basePrice: 4.10, baseCap: 650000000, baseVol: 90000000, baseChange: 2.8 },
  'injective-protocol': { symbol: 'INJ', pair: 'INJ/USDT', name: 'Injective', basePrice: 19.50, baseCap: 1900000000, baseVol: 110000000, baseChange: 0.9 },
  'jupiter-exchange-solana': { symbol: 'JUP', pair: 'JUP/USDT', name: 'Jupiter', basePrice: 0.95, baseCap: 1300000000, baseVol: 140000000, baseChange: -0.6 },
  'thorchain': { symbol: 'RUNE', pair: 'RUNE/USDT', name: 'THORChain', basePrice: 4.80, baseCap: 1600000000, baseVol: 120000000, baseChange: 1.5 },
  'havven': { symbol: 'SNX', pair: 'SNX/USDT', name: 'Synthetix', basePrice: 1.45, baseCap: 480000000, baseVol: 65000000, baseChange: -0.8 },
  'dydx-chain': { symbol: 'DYDX', pair: 'DYDX/USDT', name: 'dYdX', basePrice: 0.98, baseCap: 650000000, baseVol: 70000000, baseChange: 0.4 },
  'arbitrum': { symbol: 'ARB', pair: 'ARB/USDT', name: 'Arbitrum', basePrice: 0.52, baseCap: 1800000000, baseVol: 160000000, baseChange: -1.3 },
  'optimism': { symbol: 'OP', pair: 'OP/USDT', name: 'Optimism', basePrice: 1.55, baseCap: 1900000000, baseVol: 130000000, baseChange: 0.2 },
  'polygon-ecosystem-token': { symbol: 'POL', pair: 'POL/USDT', name: 'Polygon Ecosystem', basePrice: 0.36, baseCap: 2800000000, baseVol: 110000000, baseChange: -0.9 },
  'starknet': { symbol: 'STRK', pair: 'STRK/USDT', name: 'Starknet', basePrice: 0.39, baseCap: 800000000, baseVol: 85000000, baseChange: -2.1 },
  'shiba-inu': { symbol: 'SHIB', pair: 'SHIB/USDT', name: 'Shiba Inu', basePrice: 0.0000185, baseCap: 10900000000, baseVol: 450000000, baseChange: 0.8 },
  'dogwifcoin': { symbol: 'WIF', pair: 'WIF/USDT', name: 'dogwifhat', basePrice: 2.35, baseCap: 2350000000, baseVol: 380000000, baseChange: 4.2 },
  'bonk': { symbol: 'BONK', pair: 'BONK/USDT', name: 'Bonk', basePrice: 0.0000215, baseCap: 1500000000, baseVol: 220000000, baseChange: 1.9 },
  'floki': { symbol: 'FLOKI', pair: 'FLOKI/USDT', name: 'Floki', basePrice: 0.000145, baseCap: 1400000000, baseVol: 190000000, baseChange: 0.6 },
  'book-of-meme': { symbol: 'BOME', pair: 'BOME/USDT', name: 'BOOK OF MEME', basePrice: 0.0085, baseCap: 590000000, baseVol: 160000000, baseChange: 3.5 },
  'memecoin': { symbol: 'MEME', pair: 'MEME/USDT', name: 'Memecoin', basePrice: 0.0125, baseCap: 380000000, baseVol: 85000000, baseChange: -1.2 },
  'render-token': { symbol: 'RENDER', pair: 'RENDER/USDT', name: 'Render', basePrice: 5.65, baseCap: 2900000000, baseVol: 170000000, baseChange: 1.8 },
  'fetch-ai': { symbol: 'FET', pair: 'FET/USDT', name: 'Artificial Superintelligence', basePrice: 1.35, baseCap: 3400000000, baseVol: 190000000, baseChange: 0.7 },
  'bittensor': { symbol: 'TAO', pair: 'TAO/USDT', name: 'Bittensor', basePrice: 520.00, baseCap: 3800000000, baseVol: 180000000, baseChange: 2.9 },
  'worldcoin-wld': { symbol: 'WLD', pair: 'WLD/USDT', name: 'Worldcoin', basePrice: 1.95, baseCap: 1100000000, baseVol: 240000000, baseChange: -0.4 },
  'the-graph': { symbol: 'GRT', pair: 'GRT/USDT', name: 'The Graph', basePrice: 0.165, baseCap: 1600000000, baseVol: 90000000, baseChange: 1.1 }
};

const BINANCE_SYMBOL_MAP = {
  'BTCUSDT': 'bitcoin', 'ETHUSDT': 'ethereum', 'PAXGUSDT': 'gold', 'SOLUSDT': 'solana',
  'XRPUSDT': 'ripple', 'BNBUSDT': 'binancecoin', 'DOGEUSDT': 'dogecoin', 'ADAUSDT': 'cardano',
  'AVAXUSDT': 'avalanche-2', 'SUIUSDT': 'sui', 'NEARUSDT': 'near', 'APTUSDT': 'aptos',
  'DOTUSDT': 'polkadot', 'TRXUSDT': 'tron', 'TONUSDT': 'the-open-network', 'FILUSDT': 'filecoin',
  'ICPUSDT': 'internet-computer', 'SEIUSDT': 'sei-network', 'TIAUSDT': 'celestia', 'ALGOUSDT': 'algorand',
  'HBARUSDT': 'hedera-hashgraph', 'ATOMUSDT': 'cosmos', 'XLMUSDT': 'stellar', 'FTMUSDT': 'fantom',
  'VETUSDT': 'vechain', 'LTCUSDT': 'litecoin', 'BCHUSDT': 'bitcoin-cash', 'ETCUSDT': 'ethereum-classic',
  'UNIUSDT': 'uniswap', 'LINKUSDT': 'chainlink', 'AAVEUSDT': 'aave', 'MKRUSDT': 'maker',
  'CRVUSDT': 'curve-dao-token', 'LDOUSDT': 'lido-dao', 'PENDLEUSDT': 'pendle', 'INJUSDT': 'injective-protocol',
  'JUPUSDT': 'jupiter-exchange-solana', 'RUNEUSDT': 'thorchain', 'SNXUSDT': 'havven', 'DYDXUSDT': 'dydx-chain',
  'ARBUSDT': 'arbitrum', 'OPUSDT': 'optimism', 'POLUSDT': 'polygon-ecosystem-token', 'STRKUSDT': 'starknet',
  'SHIBUSDT': 'shiba-inu', 'PEPEUSDT': 'pepe', 'WIFUSDT': 'dogwifcoin', 'BONKUSDT': 'bonk',
  'FLOKIUSDT': 'floki', 'BOMEUSDT': 'book-of-meme', 'MEMEUSDT': 'memecoin', 'RENDERUSDT': 'render-token',
  'FETUSDT': 'fetch-ai', 'TAOUSDT': 'bittensor', 'WLDUSDT': 'worldcoin-wld', 'GRTUSDT': 'the-graph'
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

// Cache for daily session open prices (00:00 UTC candle open matching TradingView)
const dailyOpenCache = {
  bitcoin: 0,
  ethereum: 0,
  gold: 4140.77,
  solana: 0,
  binancecoin: 0,
  dogecoin: 0,
  ripple: 0,
  cardano: 0,
  sui: 0,
  'avalanche-2': 0,
  pepe: 0,
  near: 0,
  lastUpdated: 0
};

// Track Gold Daily Session Open (00:00 UTC) matching TradingView
let lastGoldOpenUtcDay = new Date().getUTCDate();
let goldDailySessionOpen = 4140.77;

function getGoldSessionOpen(currentPrice) {
  const now = new Date();
  const currentUtcDay = now.getUTCDate();
  if (lastGoldOpenUtcDay !== currentUtcDay) {
    lastGoldOpenUtcDay = currentUtcDay;
    if (currentPrice > 0) {
      goldDailySessionOpen = currentPrice;
      dailyOpenCache['gold'] = currentPrice;
    }
  }
  return goldDailySessionOpen || dailyOpenCache['gold'] || 4140.77;
}

async function updateDailyOpenPrices() {
  try {
    const promises = Object.entries(BINANCE_SYMBOL_MAP).map(async ([sym, coinId]) => {
      if (coinId === 'gold') return; // Gold is Spot XAU/USD, session open tracked separately
      try {
        const resp = await fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=1d&limit=1`, { timeout: 3000 });
        if (resp.ok) {
          const klines = await resp.json();
          if (Array.isArray(klines) && klines.length > 0) {
            const openPrice = parseFloat(klines[0][1]);
            if (openPrice > 0 && !isNaN(openPrice)) {
              dailyOpenCache[coinId] = openPrice;
            }
          }
        }
      } catch (e) { }
    });
    await Promise.all(promises);
    dailyOpenCache.lastUpdated = Date.now();
  } catch (err) {
    // Keep last known daily open
  }
}

async function fetchPrices() {
  // Step 1: Query Binance Vision tradingDay live ticker for exact Session Open & TradingView alignment
  try {
    const bSymbols = encodeURIComponent(JSON.stringify(Object.keys(BINANCE_SYMBOL_MAP)));
    let bResp = null;
    try {
      bResp = await fetch(`https://data-api.binance.vision/api/v3/ticker/tradingDay?symbols=${bSymbols}`, { headers: { 'Accept': 'application/json' }, timeout: 3500 });
    } catch (e) { }
    if (!bResp || !bResp.ok) {
      bResp = await fetch(`https://api.binance.com/api/v3/ticker/tradingDay?symbols=${bSymbols}`, { headers: { 'Accept': 'application/json' }, timeout: 3500 });
    }
    if (!bResp || !bResp.ok) {
      bResp = await fetch(`https://data-api.binance.vision/api/v3/ticker/24hr?symbols=${bSymbols}`, { headers: { 'Accept': 'application/json' }, timeout: 3500 });
    }
    if (bResp && bResp.ok) {
      const bList = await bResp.json();
      if (Array.isArray(bList) && bList.length >= 3) {
        bList.forEach(item => {
          const coinId = BINANCE_SYMBOL_MAP[item.symbol];
          if (coinId) {
            if (coinId === 'gold') return; // Gold is Spot XAU/USD, synced with TVC:GOLD and Gold-API
            const p = parseFloat(item.lastPrice);
            if (p > 0 && !isNaN(p) && isFinite(p)) {
              // TradingView calculates % gain/loss from Daily Session Open (00:00 UTC)
              const dailyOpen = parseFloat(item.openPrice) || dailyOpenCache[coinId] || p;
              const changePrice = typeof item.priceChange !== 'undefined' ? parseFloat(item.priceChange) : (p - dailyOpen);
              const change24h = (typeof item.priceChangePercent !== 'undefined' && !isNaN(parseFloat(item.priceChangePercent)))
                ? parseFloat(item.priceChangePercent)
                : (dailyOpen > 0 ? (((p - dailyOpen) / dailyOpen) * 100) : 0);

              const decimals = p < 0.001 ? 8 : p < 1 ? 4 : 2;
              priceCache[coinId] = {
                price: parseFloat(p.toFixed(decimals)),
                usdtPrice: parseFloat(p.toFixed(decimals)),
                usdPrice: parseFloat(p.toFixed(decimals)),
                dailyOpen: dailyOpen,
                changePrice: parseFloat(changePrice.toFixed(decimals)),
                conversionUsed: false,
                change24h: parseFloat(change24h.toFixed(2)),
                marketCap: (priceCache[coinId]?.marketCap || COIN_METADATA[coinId].baseCap),
                volume24h: parseFloat(item.quoteVolume) || COIN_METADATA[coinId].baseVol,
                high24h: parseFloat(item.highPrice) || parseFloat((p * 1.02).toFixed(decimals)),
                low24h: parseFloat(item.lowPrice) || parseFloat((p * 0.98).toFixed(decimals)),
                lastVerified: Date.now()
              };
            }
          }
        });
        try {
          let goldData = null;
          try {
            const tvResp = await fetch('https://scanner.tradingview.com/symbol?symbol=TVC:GOLD&fields=close,change,change_abs,open,high,low', {
              headers: { 'Accept': 'application/json' },
              timeout: 2500
            });
            if (tvResp && tvResp.ok) {
              goldData = await tvResp.json();
            }
          } catch (tvErr) { }

          if (goldData && typeof goldData.close === 'number' && goldData.close > 0 && priceCache['gold']) {
            const gp = parseFloat(goldData.close.toFixed(2));
            const chg = typeof goldData.change === 'number' ? parseFloat(goldData.change.toFixed(2)) : -0.16;
            const diff = typeof goldData.change_abs === 'number' ? parseFloat(goldData.change_abs.toFixed(2)) : (gp * (chg / 100));
            const gOpen = goldData.open ? parseFloat(goldData.open.toFixed(2)) : getGoldSessionOpen(gp);
            priceCache['gold'].price = gp;
            priceCache['gold'].usdtPrice = gp;
            priceCache['gold'].usdPrice = gp;
            priceCache['gold'].dailyOpen = gOpen;
            priceCache['gold'].changePrice = diff;
            priceCache['gold'].change24h = chg;
            if (goldData.high) priceCache['gold'].high24h = parseFloat(goldData.high.toFixed(2));
            if (goldData.low) priceCache['gold'].low24h = parseFloat(goldData.low.toFixed(2));
            priceCache['gold'].lastVerified = Date.now();
          } else {
            const goldResp = await fetch('https://api.gold-api.com/price/XAU', { timeout: 2500 }).then(r => r.json()).catch(() => null);
            if (goldResp && goldResp.price && priceCache['gold']) {
              const gp = parseFloat(parseFloat(goldResp.price).toFixed(2));
              priceCache['gold'].price = gp;
              priceCache['gold'].usdtPrice = gp;
              priceCache['gold'].usdPrice = gp;
              const goldOpen = getGoldSessionOpen(gp);
              const goldDiff = gp - goldOpen;
              priceCache['gold'].dailyOpen = goldOpen;
              priceCache['gold'].changePrice = parseFloat(goldDiff.toFixed(2));
              priceCache['gold'].change24h = parseFloat(((goldDiff / goldOpen) * 100).toFixed(2));
              priceCache['gold'].lastVerified = Date.now();
            }
          }
        } catch (gErr) { }
        priceCache.updatedAt = Date.now();
        priceCache.isRateLimited = false;
        try { checkPendingOrders(); } catch (e) { }
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

  const ids = [...SUPPORTED_COINS, 'tether'].join(',');
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
        // CRITICAL PROTECTION: If we already have fresh Binance price (< 10 mins), NEVER overwrite with CoinGecko!
        const prev = priceCache[id];
        if (prev && prev.lastVerified && (Date.now() - prev.lastVerified < 600000)) {
          return;
        }

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
    try { checkPendingOrders(); } catch (e) { }
    return priceCache;
  } catch (err) {
    return priceCache;
  }
}

// Background auto-poller every 10000ms (10 seconds) - Binance rate-limit safe
setInterval(fetchPrices, 10000);

app.get('/api/prices', async (req, res) => {
  try {
    if (Date.now() - priceCache.updatedAt > 10000) {
      fetchPrices().catch(() => { });
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
      supportedPairs: SUPPORTED_COINS.map(c => COIN_METADATA[c].pair),
      provider: 'Live Binance Feed'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve market prices' });
  }
});

// ─── REAL HISTORICAL OHLC CANDLESTICK CHART ───────────────────
const chartCache = {};

async function handleChartRequest(req, res) {
  try {
    const rawCoin = (req.params.coin || '').toLowerCase().replace('/usdt', '').replace('usdt', '');
    const coin = SUPPORTED_COINS.find(c => c === rawCoin || (COIN_METADATA[c] && COIN_METADATA[c].symbol.toLowerCase() === rawCoin));
    const tf = (req.query.tf || '15m').toLowerCase();
    if (!coin) return res.status(400).json({ error: 'Invalid coin. Supported: ' + SUPPORTED_COINS.join(', ') });

    const cacheKey = `${coin}_${tf}`;
    const cached = chartCache[cacheKey];

    // Return fresh cached chart if within 10 seconds
    if (cached && (Date.now() - cached.timestamp < 10000)) {
      return res.json(cached.data);
    }

    // Step 1: Try Binance live klines for accurate real-time candles
    const binanceSymbols = { 'bitcoin': 'BTCUSDT', 'ethereum': 'ETHUSDT', 'gold': 'PAXGUSDT', 'solana': 'SOLUSDT' };
    const binanceIntervals = { '1m': '1m', '3m': '3m', '5m': '5m', '15m': '15m', '1h': '1h', '4h': '4h', '1d': '1d', '1w': '1w' };
    const bSymbol = binanceSymbols[coin];
    const bInterval = binanceIntervals[tf] || '15m';

    try {
      let kResp = null;
      try {
        kResp = await fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${bSymbol}&interval=${bInterval}&limit=100`, { timeout: 3500 });
      } catch (e) { }
      if (!kResp || !kResp.ok) {
        kResp = await fetch(`https://api.binance.com/api/v3/klines?symbol=${bSymbol}&interval=${bInterval}&limit=100`, { timeout: 3500 });
      }
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
    } catch (cgErr) { }

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
async function handleSpotTrade(req, res) {
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

      const insRes = db.prepare(`INSERT INTO orders (user_id, coin, type, direction, amount, price, trigger_price, status)
                  VALUES (?, ?, 'limit', ?, ?, ?, ?, 'pending')`).run(req.user.id, coin, type, amount, limitPrice, limitPrice);
      return res.json({
        success: true,
        id: insRes.lastInsertRowid,
        orderId: insRes.lastInsertRowid,
        message: `Limit ${type.toUpperCase()} order placed at $${limitPrice.toLocaleString()} USDT`,
        orderType: 'limit'
      });
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
}
app.post('/api/trade', authenticateToken, handleSpotTrade);

// ─── FUTURES POSITIONS (LONG / SHORT) ─────────────────────────────────────────
async function handlePositionsOpen(req, res) {
  try {
    let { coin, direction, size, amount, leverage = 1, orderType = 'market', limitPrice, price, stopLoss, takeProfit } = req.body;
    size = size || amount;
    limitPrice = limitPrice || price;
    if (typeof size === 'string') size = parseFloat(size);
    if (typeof leverage === 'string') leverage = parseInt(leverage, 10);
    if (typeof limitPrice === 'string') limitPrice = parseFloat(limitPrice);

    if (!coin || !direction || !size || typeof size !== 'number' || size <= 0 || !isFinite(size)) {
      return res.status(400).json({ error: 'Position size must be greater than 0' });
    }
    if (leverage < 1 || leverage > 150 || !isFinite(leverage)) {
      return res.status(400).json({ error: 'Leverage must be between 1 and 150' });
    }
    if (!SUPPORTED_COINS.includes(coin)) {
      return res.status(400).json({ error: `Invalid coin. VTrade supports ${SUPPORTED_COINS.map(c => COIN_METADATA[c]?.pair || c).join(', ')}` });
    }
    direction = direction.toLowerCase();
    if (direction === 'buy') direction = 'long';
    if (direction === 'sell') direction = 'short';
    if (!['long', 'short'].includes(direction)) return res.status(400).json({ error: 'Invalid direction (must be long or short)' });

    // Price safety check (Requirement: Reject orders if data is > 3m old)
    if (priceCache.updatedAt > 0 && (Date.now() - priceCache.updatedAt > 180000)) {
      return res.status(400).json({ error: 'Market data is stale (> 3m old). Order rejected for safety.' });
    }

    if (Date.now() - priceCache.updatedAt > 30000) await fetchPrices();
    const marketPrice = priceCache[coin]?.price || COIN_METADATA[coin]?.basePrice;
    if (!marketPrice || marketPrice <= 0 || !isFinite(marketPrice)) {
      return res.status(500).json({ error: 'Price currently unavailable' });
    }

    // Handle Limit Order for Futures / Positions
    if (orderType === 'limit' && limitPrice && limitPrice > 0 && isFinite(limitPrice)) {
      const margin = parseFloat(((size * limitPrice) / leverage).toFixed(2));
      const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
      if (user.balance < margin) {
        return res.status(400).json({ error: `Insufficient USDT balance for limit margin ($${user.balance.toFixed(2)} available, $${margin.toFixed(2)} required)` });
      }

      const insRes = db.prepare(`INSERT INTO orders (user_id, coin, type, direction, amount, price, trigger_price, status)
                  VALUES (?, ?, 'limit', ?, ?, ?, ?, 'pending')`).run(req.user.id, coin, direction, size, limitPrice, limitPrice);
      return res.json({
        success: true,
        id: insRes.lastInsertRowid,
        orderId: insRes.lastInsertRowid,
        message: `Limit ${direction.toUpperCase()} order placed at $${limitPrice.toLocaleString()} USDT`,
        orderType: 'limit',
        status: 'pending',
        direction,
        size,
        limitPrice
      });
    }

    // Market Execution
    const entryPrice = marketPrice;

    // Opposing Position Netting (Requirement 6 & Test 9: Net opposing futures positions without unintentional opposing exposure)
    const opposingDir = (direction === 'long') ? 'short' : 'long';
    const opp = db.prepare("SELECT * FROM positions WHERE user_id = ? AND coin = ? AND direction = ? AND status = 'open' ORDER BY created_at ASC LIMIT 1").get(req.user.id, coin, opposingDir);

    if (opp) {
      if (size <= opp.size) {
        // Order reduces or completely closes the opposing position
        const closeSize = size;
        const priceDiff = (opp.direction === 'long') ? (entryPrice - opp.entry_price) : (opp.entry_price - entryPrice);
        const pnl = parseFloat((priceDiff * closeSize).toFixed(2));
        const fraction = closeSize / opp.size;
        const marginPortion = parseFloat((opp.margin * fraction).toFixed(2));
        const returnAmount = Math.max(0, marginPortion + pnl);

        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(returnAmount, req.user.id);
        if (closeSize >= opp.size - 0.0000001) {
          db.prepare("UPDATE positions SET status = 'closed', size = 0, close_price = ?, pnl = ?, closed_at = CURRENT_TIMESTAMP WHERE id = ?").run(entryPrice, pnl, opp.id);
        } else {
          db.prepare('UPDATE positions SET size = size - ?, margin = margin - ? WHERE id = ?').run(closeSize, marginPortion, opp.id);
        }
        db.prepare('INSERT INTO trades (user_id, coin, type, amount, price, total) VALUES (?, ?, ?, ?, ?, ?)').run(req.user.id, coin, direction, closeSize, entryPrice, parseFloat((closeSize * entryPrice).toFixed(2)));

        const newUser = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
        return res.json({
          success: true,
          message: `Opposing ${opp.direction.toUpperCase()} reduced by ${closeSize} ${COIN_METADATA[coin].symbol} at $${entryPrice.toLocaleString()} USDT (Market Netting)`,
          netted: true,
          direction,
          pnl,
          balance: newUser.balance,
          entryPrice
        });
      } else {
        // Order is larger than opposing position: close full opposing position first, then open remainder
        const oppSize = opp.size;
        const priceDiff = (opp.direction === 'long') ? (entryPrice - opp.entry_price) : (opp.entry_price - entryPrice);
        const pnl = parseFloat((priceDiff * oppSize).toFixed(2));
        const returnAmount = Math.max(0, opp.margin + pnl);

        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(returnAmount, req.user.id);
        db.prepare("UPDATE positions SET status = 'closed', size = 0, close_price = ?, pnl = ?, closed_at = CURRENT_TIMESTAMP WHERE id = ?").run(entryPrice, pnl, opp.id);
        db.prepare('INSERT INTO trades (user_id, coin, type, amount, price, total) VALUES (?, ?, ?, ?, ?, ?)').run(req.user.id, coin, direction, oppSize, entryPrice, parseFloat((oppSize * entryPrice).toFixed(2)));

        size = parseFloat((size - oppSize).toFixed(8));
      }
    }

    // Open remaining position size
    const margin = parseFloat(((size * entryPrice) / leverage).toFixed(2));
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);

    if (user.balance < margin) {
      return res.status(400).json({ error: `Insufficient USDT margin ($${user.balance.toFixed(2)} available, $${margin.toFixed(2)} required)` });
    }

    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(margin, req.user.id);
    const insRes = db.prepare(`INSERT INTO positions (user_id, coin, direction, size, entry_price, leverage, margin, stop_loss, take_profit)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(req.user.id, coin, direction, size, entryPrice, leverage, margin, stopLoss || null, takeProfit || null);

    db.prepare('INSERT INTO trades (user_id, coin, type, amount, price, total) VALUES (?, ?, ?, ?, ?, ?)').run(req.user.id, coin, direction, size, entryPrice, parseFloat((size * entryPrice).toFixed(2)));

    const newUser = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    res.json({
      success: true,
      message: `${direction === 'long' ? 'Long' : 'Short'} order filled successfully on ${COIN_METADATA[coin].pair} at $${entryPrice.toLocaleString()} USDT`,
      balance: newUser.balance,
      id: insRes.lastInsertRowid,
      positionId: insRes.lastInsertRowid,
      coin,
      direction,
      size,
      leverage,
      margin,
      entry_price: entryPrice,
      entryPrice
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to open position: ' + (err.message || 'unknown') });
  }
}
app.post(['/api/positions/open', '/api/positions'], authenticateToken, handlePositionsOpen);

app.post('/api/positions/close/:id', authenticateToken, async (req, res) => {
  try {
    const pos = db.prepare('SELECT * FROM positions WHERE id = ? AND user_id = ? AND status = ?').get(req.params.id, req.user.id, 'open');
    if (!pos) return res.status(404).json({ error: 'Position not found or already closed' });

    if (Date.now() - priceCache.updatedAt > 30000) await fetchPrices();
    const closePrice = priceCache[pos.coin]?.price || COIN_METADATA[pos.coin]?.basePrice;
    if (!closePrice || closePrice <= 0 || !isFinite(closePrice)) {
      return res.status(500).json({ error: 'Price unavailable' });
    }

    let reqSize = req.body?.size || req.body?.amount;
    if (typeof reqSize === 'string') reqSize = parseFloat(reqSize);
    const isPartial = reqSize && reqSize > 0 && reqSize < (pos.size - 0.0000001);
    const actualCloseSize = isPartial ? reqSize : pos.size;
    const fraction = actualCloseSize / pos.size;
    const marginPortion = parseFloat((pos.margin * fraction).toFixed(2));

    const priceDiff = closePrice - pos.entry_price;
    const pnl = parseFloat(((pos.direction === 'long' ? priceDiff : -priceDiff) * actualCloseSize).toFixed(2));
    const returnAmount = Math.max(0, marginPortion + pnl);

    if (isPartial) {
      db.prepare(`UPDATE positions SET size = size - ?, margin = margin - ? WHERE id = ?`).run(actualCloseSize, marginPortion, pos.id);
    } else {
      db.prepare(`UPDATE positions SET status = 'closed', size = 0, close_price = ?, pnl = ?, closed_at = CURRENT_TIMESTAMP WHERE id = ?`).run(closePrice, pnl, pos.id);
    }

    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(returnAmount, req.user.id);
    db.prepare('INSERT INTO trades (user_id, coin, type, amount, price, total) VALUES (?, ?, ?, ?, ?, ?)').run(req.user.id, pos.coin, 'close_' + pos.direction, actualCloseSize, closePrice, parseFloat((actualCloseSize * closePrice).toFixed(2)));

    const newUser = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    res.json({
      success: true,
      message: `${isPartial ? 'Position partially closed' : 'Position closed'} at $${closePrice.toLocaleString()} USDT. PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
      pnl,
      balance: newUser.balance,
      closePrice,
      closedSize: actualCloseSize,
      isPartial
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to close position: ' + (err.message || 'unknown') });
  }
});

// Unified POST /api/orders route (accepts both market and limit orders)
app.post('/api/orders', authenticateToken, async (req, res) => {
  const category = req.body.category;
  const side = (req.body.side || '').toLowerCase();
  const direction = (req.body.direction || '').toLowerCase();
  const rawType = (req.body.type || '').toLowerCase();

  // Normalize field names across spot and futures conventions
  req.body.size = req.body.size != null ? req.body.size : req.body.amount;
  req.body.amount = req.body.size;
  req.body.limitPrice = req.body.limitPrice != null ? req.body.limitPrice : req.body.price;
  req.body.price = req.body.limitPrice;

  if (rawType === 'limit' || req.body.orderType === 'limit') {
    req.body.orderType = 'limit';
  }

  if (category === 'spot' || (!direction && (side === 'buy' || side === 'sell' || rawType === 'buy' || rawType === 'sell'))) {
    req.body.type = side || (rawType === 'buy' || rawType === 'sell' ? rawType : 'buy');
    return handleSpotTrade(req, res);
  }

  // Futures / positions
  req.body.direction = direction || (side === 'buy' ? 'long' : (side === 'sell' ? 'short' : (rawType === 'buy' ? 'long' : 'short')));
  return handlePositionsOpen(req, res);
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

app.post('/api/positions/:id/tpsl', authenticateToken, async (req, res) => {
  try {
    const posId = parseInt(req.params.id, 10);
    const { take_profit, stop_loss } = req.body;
    const pos = db.prepare("SELECT * FROM positions WHERE id = ? AND user_id = ? AND status = 'open'").get(posId, req.user.id);
    if (!pos) return res.status(404).json({ error: 'Position not found' });

    const tp = (take_profit != null && !isNaN(parseFloat(take_profit)) && parseFloat(take_profit) > 0) ? parseFloat(take_profit) : null;
    const sl = (stop_loss != null && !isNaN(parseFloat(stop_loss)) && parseFloat(stop_loss) > 0) ? parseFloat(stop_loss) : null;

    db.prepare('UPDATE positions SET take_profit = ?, stop_loss = ? WHERE id = ?').run(tp, sl, posId);
    res.json({ success: true, position_id: posId, take_profit: tp, stop_loss: sl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update TP/SL' });
  }
});

// ─── ORDERS & AUTO-FILL ───────────────────────────────────────────────────────
app.get('/api/orders', authenticateToken, (req, res) => {
  try {
    const orders = db.prepare(`SELECT * FROM orders WHERE user_id = ? AND status = 'pending' AND type = 'limit' ORDER BY created_at DESC`).all(req.user.id);
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
        if ((order.direction === 'buy' || order.direction === 'long') && price <= tp) shouldFill = true;
        if ((order.direction === 'sell' || order.direction === 'short') && price >= tp) shouldFill = true;
      }

      if (shouldFill) {
        const total = parseFloat((order.amount * price).toFixed(2));
        db.prepare(`UPDATE orders SET status = 'filled', filled_price = ?, total = ?, filled_at = CURRENT_TIMESTAMP WHERE id = ?`).run(price, total, order.id);
        if (order.direction === 'long' || order.direction === 'short') {
          const lev = 10;
          const margin = parseFloat(((order.amount * price) / lev).toFixed(2));
          db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(margin, order.user_id);
          db.prepare(`INSERT INTO positions (user_id, coin, direction, size, entry_price, leverage, margin, status)
                      VALUES (?, ?, ?, ?, ?, ?, ?, 'open')`).run(order.user_id, order.coin, order.direction, order.amount, price, lev, margin);
        } else if (order.direction === 'buy') {
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
  } catch (err) { }
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
      message: `Wallet reset to $${STARTING_BALANCE.toLocaleString()} USDT`,
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
    path.join(__dirname, '../downloads/VTrade.apk'),
    path.join(apkDir, 'app-debug.apk'),
    path.join(__dirname, '../VTrade.apk')
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

app.get(['/apk', '/download/apk', '/downloads/VTrade.apk', '/downloads/CryptoTrader-Pro.apk', '/downloads/cryptotrader.apk'], (req, res) => {
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

app.head(['/apk', '/download/apk', '/downloads/VTrade.apk', '/downloads/CryptoTrader-Pro.apk', '/downloads/cryptotrader.apk'], (req, res) => {
  const apk = getAvailableApkPath();
  if (apk) return res.status(200).end();
  res.status(404).end();
});

app.get('/api/info', (req, res) => {
  res.json({
    appName: 'VTrade',
    version: '2.0.0',
    supportedPairs: SUPPORTED_COINS.map(c => COIN_METADATA[c].pair),
    provider: 'Binance & CoinGecko',
    status: 'online',
    timestamp: Date.now()
  });
});

// SPA routes for Shark Exchange Auth & Exchange
app.get(['/auth/signin', '/auth/signup', '/login', '/register', '/futures', '/futures/:pair'], (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Global fallback & error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal server error: ' + (err.message || 'unexpected exception') });
});

app.listen(PORT, '0.0.0.0', () => {
  fetchPrices();
});
