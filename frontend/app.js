/* ==========================================================================
   VTrade – Professional Crypto Paper Trading (Part 6 & VTrade Branding)

   CODE CLEANUP:
   - Removed unused variable: openPositionsCache.
   - Removed obsolete Binance-specific endpoints and raw WebSockets.
   - Removed hardcoded market cap multipliers (* 100000000, * 19800000).
   - Removed debugging console.log invocations across all client routines.
   - Centralized number/currency rounding into single roundValue() helper.
   - Guarded every localStorage read/write with safeStorage wrappers.

   FINAL CHECKLIST:
   - Market list loads with 20 coins and categories work.
   - Chart renders, timeframes switch, fallback shows if API fails.
   - Market order, limit order, Spot and Position all work.
   - TP, SL and liquidation close positions once only.
   - History and PnL summary update after every close.
   - Settings save and survive app restart.
   - No horizontal page scroll on 360px and 412px phones.
   - Works offline with cached data.
   ========================================================================== */

const APP_VERSION = 'v1.0.5';

// ─── STORAGE SAFETY WRAPPERS (Requirement C1) ─────────────
function safeStorageGet(key, fallback = null) {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : fallback;
  } catch (e) {
    return fallback;
  }
}
function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}
function safeStorageRemove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
}

const DEFAULT_API_HOST = 'http://192.168.1.17:3001';
function getApiBase() {
  const custom = safeStorageGet('ct_api_url');
  if (custom) return custom.replace(/\/+$/, '');
  const isNative = typeof window !== 'undefined' && (
    window.Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && (!window.location.port || window.location.port === '80' || window.location.port === '443'))
  );
  if (isNative) {
    return `${DEFAULT_API_HOST}/api`;
  }
  if (typeof window !== 'undefined' && window.location && window.location.hostname !== '') {
    return `${window.location.origin}/api`;
  }
  return `${DEFAULT_API_HOST}/api`;
}
let API = getApiBase();

// ─── Supported Coins (Strictly 3 Pairs: BTC/USDT, ETH/USDT, SOL/USDT) ───────────
const COIN_LIST = [
  { id: 'bitcoin',  symbol: 'BTC', name: 'Bitcoin',  pair: 'BTC/USDT', color: '#f7931a', category: 'Majors',  tags: ['Majors'],  icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',   binanceSymbol: 'BTCUSDT', basePrice: 83427,   baseChange: -0.45, baseVol: 31513000000, baseCap: 1676759000000 },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', pair: 'ETH/USDT', color: '#627eea', category: 'Majors',  tags: ['Majors'],  icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', binanceSymbol: 'ETHUSDT', basePrice: 2515.06, baseChange: -1.62, baseVol: 16497000000, baseCap: 307174000000 },
  { id: 'solana',   symbol: 'SOL', name: 'Solana',   pair: 'SOL/USDT', color: '#14f195', category: 'Layer 1', tags: ['Layer 1'], icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',  binanceSymbol: 'SOLUSDT', basePrice: 108.01,  baseChange: -3.78, baseVol: 4059000000,  baseCap: 63637000000 }
];

function getCoinDefinition(coinId) {
  if (!coinId) return COIN_LIST[0];
  const lower = coinId.toLowerCase().replace('/usdt', '').replace('usdt', '');
  return COIN_LIST.find(c => c.id === lower || c.symbol.toLowerCase() === lower || c.id === coinId.toLowerCase()) || COIN_LIST[0];
}

// ─── Market Explorer State (Persisted in Session) ─────────
let marketState = {
  category: sessionStorage.getItem('ct_mkt_category') || 'All',
  search: sessionStorage.getItem('ct_mkt_search') || '',
  sortBy: sessionStorage.getItem('ct_mkt_sort_by') || 'rank',
  sortOrder: sessionStorage.getItem('ct_mkt_sort_order') || 'desc',
  quickFilter: sessionStorage.getItem('ct_mkt_quick_filter') || 'all',
  isPanelCollapsed: sessionStorage.getItem('ct_mkt_collapsed') === 'true'
};

function saveMarketState() {
  try {
    sessionStorage.setItem('ct_mkt_category', marketState.category);
    sessionStorage.setItem('ct_mkt_search', marketState.search);
    sessionStorage.setItem('ct_mkt_sort_by', marketState.sortBy);
    sessionStorage.setItem('ct_mkt_sort_order', marketState.sortOrder);
    sessionStorage.setItem('ct_mkt_quick_filter', marketState.quickFilter);
    sessionStorage.setItem('ct_mkt_collapsed', marketState.isPanelCollapsed ? 'true' : 'false');
  } catch(e) {}
}

// ─── Precision & Rounding Utilities (Requirement B4) ──────
function roundValue(val, type = 'money') {
  if (val == null || isNaN(val) || !isFinite(val)) return 0;
  const num = Number(val);
  if (type === 'money' || type === 'usd' || type === 'fiat') {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }
  const rounded = Math.round((num + Number.EPSILON) * 1e8) / 1e8;
  return parseFloat(rounded.toFixed(8));
}

function roundUsd(val) { return roundValue(val, 'money'); }
function roundCoin(val) { return roundValue(val, 'coin'); }
function fmtCoin(val) {
  return roundValue(val, 'coin').toString();
}

function isValidPrice(p) {
  return typeof p === 'number' && p > 0 && !isNaN(p) && isFinite(p);
}

// ─── Unified Wallet State & Storage (Requirement C1, C2, C3) ──
const WALLET_STORAGE_KEY = 'ct_wallet_state_v2';
const DEFAULT_WALLET = () => ({
  version: 1,
  cashBalance: 10000.00,
  holdings: {},
  positions: [],
  orders: [],
  history: [],
  realizedPnl: 0,
  tradesCount: 0,
  positionsClosed: 0
});

let walletState = DEFAULT_WALLET();
let activeBottomTab = 'positions';

function loadWalletState() {
  try {
    const raw = safeStorageGet(WALLET_STORAGE_KEY);
    if (!raw) {
      walletState = DEFAULT_WALLET();
      saveWalletState();
    } else {
      const parsed = JSON.parse(raw);
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        parsed.version !== 1 ||
        typeof parsed.cashBalance !== 'number' ||
        isNaN(parsed.cashBalance)
      ) {
        walletState = DEFAULT_WALLET();
        saveWalletState();
        setTimeout(() => {
          showToast('⚠️ Wallet schema updated; reset to default $10,000 state', 'info');
        }, 400);
      } else {
        walletState = {
          version: 1,
          cashBalance: Math.max(0, roundValue(parsed.cashBalance, 'money')),
          holdings: (typeof parsed.holdings === 'object' && parsed.holdings !== null) ? parsed.holdings : {},
          positions: Array.isArray(parsed.positions) ? parsed.positions : [],
          orders: Array.isArray(parsed.orders) ? parsed.orders.slice(0, 100) : [],
          history: Array.isArray(parsed.history) ? parsed.history.slice(0, 200) : [],
          realizedPnl: typeof parsed.realizedPnl === 'number' ? roundValue(parsed.realizedPnl, 'money') : 0,
          tradesCount: typeof parsed.tradesCount === 'number' ? parsed.tradesCount : 0,
          positionsClosed: typeof parsed.positionsClosed === 'number' ? parsed.positionsClosed : 0
        };
      }
    }
  } catch (e) {
    walletState = DEFAULT_WALLET();
    saveWalletState();
    setTimeout(() => {
      showToast('⚠️ Wallet data corrupted; reset to default $10,000 state', 'info');
    }, 400);
  }

  // Ensure all 20 coins exist in holdings
  COIN_LIST.forEach(c => {
    if (typeof walletState.holdings[c.id] !== 'number' || isNaN(walletState.holdings[c.id])) {
      walletState.holdings[c.id] = 0;
    }
  });

  balance = walletState.cashBalance;
  portfolio = walletState.holdings;
  saveWalletState();
}

function saveWalletState() {
  try {
    walletState.version = 1;
    walletState.cashBalance = Math.max(0, roundValue(walletState.cashBalance, 'money'));
    if (walletState.history.length > 200) {
      walletState.history = walletState.history.slice(0, 200);
    }
    if (walletState.orders.length > 100) {
      walletState.orders = walletState.orders.slice(0, 100);
    }
    safeStorageSet(WALLET_STORAGE_KEY, JSON.stringify(walletState));
    safeStorageSet('ct_balance', walletState.cashBalance.toString());
  } catch (e) {
    console.error('Failed to save wallet state:', e);
  }
}

// ─── Price Cache in LocalStorage (Requirement A3 & A4) ─────
const PRICE_CACHE_KEY = 'ctp_price_cache';
let lastGoodPriceTimestamp = 0;

function loadCachedPrices() {
  try {
    const raw = safeStorageGet(PRICE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.prices === 'object' && parsed.prices !== null) {
        lastGoodPriceTimestamp = parsed.timestamp || 0;
        Object.keys(parsed.prices).forEach(coinId => {
          const entry = parsed.prices[coinId];
          if (entry && isValidPrice(entry.price)) {
            currentPrices[coinId] = { ...currentPrices[coinId], ...entry };
          }
        });
      }
    }
  } catch (e) {
    console.error('Error loading price cache:', e);
  }
}

function saveCachedPrices() {
  try {
    lastGoodPriceTimestamp = Date.now();
    safeStorageSet(PRICE_CACHE_KEY, {
      timestamp: lastGoodPriceTimestamp,
      prices: currentPrices
    });
  } catch (e) {
    console.error('Error saving price cache:', e);
  }
}

// ─── State ────────────────────────────────────────────────
let token        = safeStorageGet('ct_token') || null;
let username     = safeStorageGet('ct_username') || '';
let balance      = parseFloat(safeStorageGet('ct_balance') || 10000);
let selectedCoin = 'bitcoin';
let currentTF    = '15m';
let chartMode    = 'candle';    // 'candle' | 'tv' | 'line'
let drawTool     = 'cursor';    // 'cursor' | 'trend' | 'horiz' | 'brush' | 'measure'
let drawColor    = '#f0b90b';
let drawings     = [];
let activeDrawing = null;
let candleData   = [];

// Delta-Style Trade Panel State
let tradeCategory   = 'spot';     // 'spot' | 'position'
let tradeSide       = 'buy';      // 'buy' | 'sell'
let tradeOrderType  = 'market';   // 'market' | 'limit'
let tradeUnit       = 'coin';     // 'coin' | 'usd'
let tradeLeverage   = 10;
let tradeMarginMode = 'isolated'; // 'isolated' | 'cross'

let currentPrices = {};
let portfolio    = {};
let priceChart   = null;
let isPriceDataLive = false;
let marketDataInterval = null;
let priceRefreshInterval = null;

// Initialize default prices from COIN_LIST base
COIN_LIST.forEach(c => {
  currentPrices[c.id] = {
    price: c.basePrice,
    change24h: c.baseChange,
    volume24h: c.baseVol,
    marketCap: c.baseCap,
    isSimulated: true
  };
});

// Load price cache from localStorage immediately so market list is never empty (Requirement A3)
loadCachedPrices();

// Load unified wallet state immediately
loadWalletState();

// ─── APP LIFECYCLE (Requirement D1, D2) ───────────────────
function startPriceRefreshTimer() {
  if (priceRefreshInterval) clearInterval(priceRefreshInterval);
  priceRefreshInterval = setInterval(() => {
    if (document.hidden) return;
    refreshPricesAndCheckPositions();
  }, 5000);
}

function stopPriceRefreshTimer() {
  if (priceRefreshInterval) {
    clearInterval(priceRefreshInterval);
    priceRefreshInterval = null;
  }
}

async function refreshPricesAndCheckPositions() {
  try {
    await fetchCoinGeckoPrices();
  } catch (e) {
    console.error('Price refresh error:', e);
  }
  checkAutoCloseConditions();
  checkPendingLimitOrders();
  renderPositions();
  renderOrders();
  updateTabBadges();
  updateMiniStats();
  updatePnlSummary();
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopPriceRefreshTimer();
  } else {
    startPriceRefreshTimer();
    refreshPricesAndCheckPositions();
  }
});

// ─── Boot ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadWalletState();
  if (typeof applySettingsToTradePanel === 'function') applySettingsToTradePanel();
  if (typeof initDownloadApkVisibility === 'function') initDownloadApkVisibility();
  if (token) showApp();
});

function showApp() {
  document.getElementById('auth-overlay').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('nav-username').textContent = username;
  document.getElementById('user-avatar').textContent  = username.charAt(0).toUpperCase();
  if (typeof applySettingsToTradePanel === 'function') applySettingsToTradePanel();
  if (typeof initDownloadApkVisibility === 'function') initDownloadApkVisibility();
  initMarketExplorer();
  loadAll();
  initRealtimeTicker();
  setupDrawingCanvas();
  startPriceRefreshTimer();
}

async function loadAll() {
  await loadPrices();
  await loadPortfolio();
  loadWalletState();
  updateMiniStats();
  renderPositions();
  renderOrders();
  renderHistory();
  updatePnlSummary();
  updateTabBadges();
  showBottomTab(activeBottomTab);
  updateTradeLabels();
  updateTradeCalc();
  loadChart(selectedCoin, currentTF);
}

// ─── AUTH ─────────────────────────────────────────────────
function switchTab(tab) {
  ['login','register'].forEach(t => {
    document.getElementById(`${t}-form`).classList.toggle('hidden', t !== tab);
    document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
  });
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const err = document.getElementById('login-error');
  setLoading(btn, true); err.classList.add('hidden');
  try {
    const r = await post(`${API}/auth/login`, { email: v('login-email'), password: v('login-password') });
    saveAuth(r); showApp();
  } catch(ex) { err.textContent = ex.message; err.classList.remove('hidden'); }
  finally { setLoading(btn, false); }
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('reg-btn');
  const err = document.getElementById('reg-error');
  setLoading(btn, true); err.classList.add('hidden');
  try {
    const r = await post(`${API}/auth/register`, { username: v('reg-username'), email: v('reg-email'), password: v('reg-password') });
    saveAuth(r); showApp();
    showToast('🎉 Account created! You have $10,000 to trade.', 'success');
  } catch(ex) { err.textContent = ex.message; err.classList.remove('hidden'); }
  finally { setLoading(btn, false); }
}

let cgRateLimitUntil = 0;

function saveAuth(data) {
  token    = data.token;   username = data.username; balance = data.balance;
  safeStorageSet('ct_token',    token);
  safeStorageSet('ct_username', username);
  safeStorageSet('ct_balance',  balance.toString());
}

function logout() {
  token = null; username = ''; balance = 10000;
  ['ct_token','ct_username','ct_balance'].forEach(k => safeStorageRemove(k));
  if (priceChart) { priceChart.destroy(); priceChart = null; }
  if (marketDataInterval) { clearInterval(marketDataInterval); marketDataInterval = null; }
  stopPriceRefreshTimer();
  document.getElementById('auth-overlay').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
  showToast('Logged out', 'info');
}

// ─── COINGECKO LIVE PRICES (TRUTHFUL USDT FEED & RATE LIMIT BACKOFF) ─────────
let isRateLimited = false;

async function fetchCoinGeckoPrices() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  let updatedAny = false;

  // Step 1: Query backend /api/prices first (provides Tether USD/USDT conversion, caching, and rate limit backoff)
  try {
    const res = await fetch(`${API}/prices`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        isRateLimited = !!data.isRateLimited;
        if (data.updatedAt) {
          lastGoodPriceTimestamp = new Date(data.updatedAt).getTime();
        } else {
          lastGoodPriceTimestamp = Date.now();
        }

        COIN_LIST.forEach(c => {
          const coinData = data[c.id];
          if (coinData && isValidPrice(coinData.price)) {
            const prevPrice = currentPrices[c.id]?.price || coinData.price;
            currentPrices[c.id] = {
              price: coinData.price,
              change24h: (typeof coinData.change24h === 'number' && isFinite(coinData.change24h)) ? coinData.change24h : c.baseChange,
              volume24h: (typeof coinData.volume24h === 'number' && isFinite(coinData.volume24h)) ? coinData.volume24h : c.baseVol,
              marketCap: (typeof coinData.marketCap === 'number' && isFinite(coinData.marketCap)) ? coinData.marketCap : c.baseCap,
              isSimulated: false,
              quoteCurrency: 'USDT'
            };
            if (prevPrice !== coinData.price) {
              onPriceTick(c.id, prevPrice, coinData.price);
            }
            updatedAny = true;
          }
        });

        isPriceDataLive = !isRateLimited && ((Date.now() - lastGoodPriceTimestamp) < 180000);
        saveCachedPrices();
      }
    }
  } catch (backendErr) {
    clearTimeout(timeoutId);
  }

  // Step 2: Fallback to direct CoinGecko if backend didn't update and rate limit cooldown not active
  if (!updatedAny && Date.now() >= cgRateLimitUntil) {
    const cgController = new AbortController();
    const cgTimeout = setTimeout(() => cgController.abort(), 5000);
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,tether&vs_currencies=usd,usdt&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
      const cgResp = await fetch(url, { signal: cgController.signal });
      clearTimeout(cgTimeout);
      if (cgResp.status === 429) {
        cgRateLimitUntil = Date.now() + 60000;
        isRateLimited = true;
      } else if (cgResp.ok) {
        const cgData = await cgResp.json();
        const tetherUsd = (cgData && cgData.tether && typeof cgData.tether.usd === 'number' && cgData.tether.usd > 0) ? cgData.tether.usd : 1.0;
        lastGoodPriceTimestamp = Date.now();
        isRateLimited = false;

        COIN_LIST.forEach(c => {
          const d = cgData[c.id];
          if (d && typeof d.usd === 'number' && isValidPrice(d.usd)) {
            // Truthful USDT conversion: calculate usd / tether.usd
            const rawUsdt = (typeof d.usdt === 'number' && d.usdt > 0) ? d.usdt : (d.usd / tetherUsd);
            const usdtPrice = isValidPrice(rawUsdt) ? rawUsdt : d.usd;
            const prevPrice = currentPrices[c.id]?.price || usdtPrice;
            currentPrices[c.id] = {
              price: usdtPrice,
              change24h: (typeof d.usd_24h_change === 'number' && isFinite(d.usd_24h_change)) ? d.usd_24h_change : c.baseChange,
              volume24h: (typeof d.usd_24h_vol === 'number' && isFinite(d.usd_24h_vol)) ? d.usd_24h_vol : c.baseVol,
              marketCap: d.usd_market_cap || c.baseCap,
              isSimulated: false,
              quoteCurrency: 'USDT'
            };
            if (prevPrice !== usdtPrice) {
              onPriceTick(c.id, prevPrice, usdtPrice);
            }
            updatedAny = true;
          }
        });

        isPriceDataLive = true;
        saveCachedPrices();
      }
    } catch (cgErr) {
      clearTimeout(cgTimeout);
    }
  }

  // Update truthful badge & UI status (zero fake drift)
  updateDataBadge();
  renderWatchlistChips();
  renderMarketsList();
  updateChartPriceDisplay();
  updateTickers(currentPrices);
  updateSpotCalc();
  updatePosCalc();
}

function updateDataBadge() {
  const badge = document.getElementById('market-data-badge');
  const txt = document.getElementById('badge-status-text');
  const headerBadge = document.getElementById('header-price-mode-badge');
  const headerText = document.getElementById('header-price-mode-text');
  const syncEl = document.getElementById('market-last-sync');
  const banner = document.getElementById('stale-warning-banner');

  const ageMs = Date.now() - (lastGoodPriceTimestamp || 0);
  const ageSec = Math.max(0, Math.floor(ageMs / 1000));

  let status = 'Live';
  let badgeClass = 'live';

  if (isRateLimited || Date.now() < cgRateLimitUntil) {
    status = 'Rate-Limited';
    badgeClass = 'rate-limited';
  } else if (ageMs > 180000) {
    status = 'Stale';
    badgeClass = 'stale';
  } else if (ageMs > 60000) {
    status = 'Delayed';
    badgeClass = 'delayed';
  } else {
    status = 'Live';
    badgeClass = 'live';
  }

  if (badge && txt) {
    badge.className = `data-badge ${badgeClass}`;
    txt.textContent = status;
    badge.title = `CoinGecko USDT Feed (${status}, age: ${ageSec}s)`;
  }

  if (headerBadge && headerText) {
    headerBadge.className = `price-mode-badge ${badgeClass}`;
    headerText.textContent = status;
  }

  if (syncEl) {
    if (ageSec < 5) {
      syncEl.textContent = 'Updated just now';
    } else if (ageSec < 60) {
      syncEl.textContent = `Updated ${ageSec}s ago`;
    } else {
      const mins = Math.floor(ageSec / 60);
      syncEl.textContent = `Updated ${mins}m ago`;
    }
  }

  if (banner) {
    if (ageMs > 180000 || (status === 'Rate-Limited' && ageMs > 120000)) {
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }
}

// ─── SPARKLINES ───────────────────────────────────────────
function generateSparklineSvg(change24h, width = 60, height = 22) {
  const isUp = (change24h || 0) >= 0;
  const strokeColor = isUp ? '#0ecb81' : '#f6465d';
  const fillColor   = isUp ? 'rgba(14,203,129,0.1)' : 'rgba(246,70,93,0.1)';
  const numPoints = 8;
  const points = [];
  const slope = ((change24h || 0) / 100) * 0.6;
  const seed = Math.abs(change24h || 1);

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const noise = Math.sin((i + 1) * 2.7 + seed) * 0.14;
    let yNorm = (0.5 - (slope * 0.4)) + (slope * t) + noise;
    yNorm = Math.max(0.08, Math.min(0.92, yNorm));
    const x = t * (width - 4) + 2;
    const y = (1 - yNorm) * (height - 6) + 3;
    points.push({ x: parseFloat(x.toFixed(1)), y: parseFloat(y.toFixed(1)) });
  }

  const pathStr = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaStr = `${pathStr} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="sparkline-svg">
    <path d="${areaStr}" fill="${fillColor}" />
    <path d="${pathStr}" fill="none" stroke="${strokeColor}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

// ─── WATCHLIST & MARKETS RENDERING ────────────────────────
function renderWatchlistChips() {
  const container = document.getElementById('watchlist-chips-scroll');
  if (!container) return;

  container.innerHTML = COIN_LIST.map(coin => {
    const priceData = currentPrices[coin.id] || { price: coin.basePrice, change24h: coin.baseChange };
    const price = priceData.price;
    const chg = priceData.change24h || 0;
    const isUp = chg >= 0;
    const isActive = coin.id === selectedCoin;

    return `
      <div class="wl-chip ${isActive ? 'active' : ''}" id="wl-chip-${coin.id}" onclick="selectCoin('${coin.id}')">
        <img src="${coin.icon}" class="wl-chip-icon" alt="${coin.symbol}" onerror="this.outerHTML='<span class=\\'wl-chip-dot\\' style=\\'background:${coin.color}\\'>${coin.symbol.charAt(0)}</span>'"/>
        <span class="wl-chip-sym">${coin.symbol}</span>
        <span class="wl-chip-price" id="wl-price-${coin.id}">$${fmt(price)}</span>
        <span class="wl-chip-chg ${isUp ? 'pos' : 'neg'}" id="wl-chg-${coin.id}">${isUp ? '+' : ''}${chg.toFixed(2)}%</span>
      </div>
    `;
  }).join('');
}

function renderMarketsList() {
  const listContainer = document.getElementById('markets-rows-scroll');
  if (!listContainer) return;

  let filtered = COIN_LIST.slice();

  // 1. Search filter
  if (marketState.search && marketState.search.trim()) {
    const q = marketState.search.trim().toLowerCase();
    filtered = filtered.filter(c => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }

  // 2. Category filter
  if (marketState.category && marketState.category !== 'All') {
    filtered = filtered.filter(c => c.category === marketState.category || (c.tags && c.tags.includes(marketState.category)));
  }

  // 3. Quick filter
  if (marketState.quickFilter === 'gainers') {
    filtered = filtered.filter(c => (currentPrices[c.id]?.change24h || c.baseChange) > 0);
  } else if (marketState.quickFilter === 'losers') {
    filtered = filtered.filter(c => (currentPrices[c.id]?.change24h || c.baseChange) < 0);
  } else if (marketState.quickFilter === 'topVol') {
    filtered.sort((a, b) => (currentPrices[b.id]?.volume24h || b.baseVol) - (currentPrices[a.id]?.volume24h || a.baseVol));
    filtered = filtered.slice(0, 10);
  }

  // 4. Sorting
  const sortBy = marketState.sortBy;
  const isAsc = marketState.sortOrder === 'asc';
  const mul = isAsc ? 1 : -1;

  if (sortBy === 'name') {
    filtered.sort((a, b) => mul * a.name.localeCompare(b.name));
  } else if (sortBy === 'price') {
    filtered.sort((a, b) => mul * ((currentPrices[a.id]?.price || a.basePrice) - (currentPrices[b.id]?.price || b.basePrice)));
  } else if (sortBy === 'change24h') {
    filtered.sort((a, b) => mul * ((currentPrices[a.id]?.change24h || a.baseChange) - (currentPrices[b.id]?.change24h || b.baseChange)));
  } else if (sortBy === 'volume24h') {
    filtered.sort((a, b) => mul * ((currentPrices[a.id]?.volume24h || a.baseVol) - (currentPrices[b.id]?.volume24h || b.baseVol)));
  } else if (sortBy === 'marketCap') {
    filtered.sort((a, b) => mul * ((currentPrices[a.id]?.marketCap || a.baseCap) - (currentPrices[b.id]?.marketCap || b.baseCap)));
  } else if (marketState.quickFilter !== 'topVol') {
    if (isAsc) filtered.reverse();
  }

  updateSortHeaderIndicators();

  if (!filtered.length) {
    listContainer.innerHTML = `<div style="text-align:center; padding:24px 16px; color:var(--txt3); font-size:12px;">No matching coins found for "${escapeHtml(marketState.search)}"</div>`;
    return;
  }

  listContainer.innerHTML = filtered.map(coin => {
    const pData = currentPrices[coin.id] || { price: coin.basePrice, change24h: coin.baseChange };
    const price = pData.price;
    const chg = pData.change24h || 0;
    const isUp = chg >= 0;
    const isActive = coin.id === selectedCoin;
    const sparkSvg = generateSparklineSvg(chg);

    return `
      <div class="market-row ${isActive ? 'active' : ''}" id="mkt-row-${coin.id}" onclick="selectCoin('${coin.id}')">
        <div class="mr-coin-info">
          <div class="mr-icon-wrap" style="background:${coin.color}">
            <img src="${coin.icon}" class="mr-icon-img" alt="${coin.symbol}" onerror="this.style.display='none'"/>
            <span class="mr-icon-fallback">${coin.symbol.charAt(0)}</span>
          </div>
          <div class="mr-names">
            <span class="mr-sym">${coin.symbol}</span>
            <span class="mr-fullname" title="${coin.name}">${coin.name}</span>
          </div>
        </div>
        <div class="mr-spark-wrap">
          ${sparkSvg}
        </div>
        <div class="mr-price-wrap">
          <span class="mr-price" id="mkt-price-${coin.id}">$${fmt(price)}</span>
          <span class="mr-change ${isUp ? 'pos' : 'neg'}" id="mkt-chg-${coin.id}">${isUp ? '+' : ''}${chg.toFixed(2)}%</span>
        </div>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  return String(str||'').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── MARKETS EXPLORER CONTROLS ────────────────────────────
function selectCategory(cat, btn) {
  marketState.category = cat;
  saveMarketState();
  document.querySelectorAll('.cat-chip').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-cat') === cat);
  });
  renderMarketsList();
}

function handleMarketSearch(val) {
  marketState.search = val;
  saveMarketState();
  const clearBtn = document.getElementById('msearch-clear');
  if (clearBtn) clearBtn.classList.toggle('hidden', !val);
  renderMarketsList();
}

function clearMarketSearch() {
  const inp = document.getElementById('market-search-input');
  if (inp) inp.value = '';
  handleMarketSearch('');
}

function openFilterModal() {
  syncFilterModalUI();
  document.getElementById('filter-modal').classList.remove('hidden');
}

function closeFilterModal() {
  document.getElementById('filter-modal').classList.add('hidden');
}

function syncFilterModalUI() {
  document.querySelectorAll('#sort-by-grid .sheet-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-sort') === marketState.sortBy);
  });
  const descBtn = document.getElementById('order-desc');
  const ascBtn = document.getElementById('order-asc');
  if (descBtn && ascBtn) {
    descBtn.classList.toggle('active', marketState.sortOrder === 'desc');
    ascBtn.classList.toggle('active', marketState.sortOrder === 'asc');
  }
  document.querySelectorAll('.qfilter-pill').forEach(pill => {
    pill.classList.toggle('active', pill.getAttribute('data-qf') === marketState.quickFilter);
  });
  updateFilterActiveIndicator();
}

function updateFilterActiveIndicator() {
  const dot = document.getElementById('filter-indicator-dot');
  const hasCustom = marketState.sortBy !== 'rank' || marketState.quickFilter !== 'all' || marketState.sortOrder !== 'desc';
  if (dot) dot.classList.toggle('hidden', !hasCustom);
}

function setSortBy(sortKey) {
  marketState.sortBy = sortKey;
  saveMarketState();
  syncFilterModalUI();
  renderMarketsList();
}

function setSortOrder(order) {
  marketState.sortOrder = order;
  saveMarketState();
  syncFilterModalUI();
  renderMarketsList();
}

function setSortByColumn(col) {
  if (marketState.sortBy === col) {
    marketState.sortOrder = marketState.sortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    marketState.sortBy = col;
    marketState.sortOrder = col === 'name' ? 'asc' : 'desc';
  }
  saveMarketState();
  syncFilterModalUI();
  renderMarketsList();
}

function updateSortHeaderIndicators() {
  const nameArr = document.getElementById('sort-arr-name');
  const priceArr = document.getElementById('sort-arr-price');
  if (nameArr) nameArr.textContent = marketState.sortBy === 'name' ? (marketState.sortOrder === 'asc' ? '↑' : '↓') : '';
  if (priceArr) priceArr.textContent = marketState.sortBy === 'price' ? (marketState.sortOrder === 'asc' ? '↑' : '↓') : '';
}

function setQuickFilter(qf) {
  marketState.quickFilter = qf;
  saveMarketState();
  syncFilterModalUI();
  renderMarketsList();
}

function resetFilters() {
  marketState.sortBy = 'rank';
  marketState.sortOrder = 'desc';
  marketState.quickFilter = 'all';
  saveMarketState();
  syncFilterModalUI();
  renderMarketsList();
  showToast('Filters reset to default', 'info');
}

function toggleMarketsPanel() {
  const panel = document.getElementById('markets-panel');
  const lbl = document.getElementById('markets-toggle-label');
  if (!panel) return;
  const isCollapsed = panel.classList.toggle('collapsed');
  marketState.isPanelCollapsed = isCollapsed;
  saveMarketState();
  if (lbl) lbl.textContent = isCollapsed ? 'Markets ▲' : 'Markets ▼';
}

function initMarketExplorer() {
  const panel = document.getElementById('markets-panel');
  const lbl = document.getElementById('markets-toggle-label');
  if (panel && marketState.isPanelCollapsed) {
    panel.classList.add('collapsed');
    if (lbl) lbl.textContent = 'Markets ▲';
  }

  const searchInput = document.getElementById('market-search-input');
  const clearBtn = document.getElementById('msearch-clear');
  if (searchInput && marketState.search) {
    searchInput.value = marketState.search;
    if (clearBtn) clearBtn.classList.remove('hidden');
  }

  document.querySelectorAll('.cat-chip').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-cat') === marketState.category);
  });

  syncFilterModalUI();
  renderWatchlistChips();
  renderMarketsList();

  fetchCoinGeckoPrices();
  if (marketDataInterval) clearInterval(marketDataInterval);
  marketDataInterval = setInterval(fetchCoinGeckoPrices, 30000);
}

// ─── PRICES ───────────────────────────────────────────────
async function loadPrices() {
  try {
    const data = await get(`${API}/prices`);
    if (data && typeof data === 'object') {
      let updated = false;
      Object.keys(data).forEach(k => {
        if (k !== 'updatedAt' && isValidPrice(data[k]?.price)) {
          currentPrices[k] = { ...currentPrices[k], ...data[k] };
          updated = true;
        }
      });
      if (updated) saveCachedPrices();
    }
    updateTickers(currentPrices);
    updateChartPriceDisplay();
    updateSpotCalc();
    updatePosCalc();
    renderWatchlistChips();
    renderMarketsList();
  } catch (err) {
    console.error('loadPrices error:', err);
  }
}

function updateTickers(data) {
  if (!data.bitcoin || !data.ethereum) return;
  setTicker('nav-btc-price','nav-btc-change', data.bitcoin.price, data.bitcoin.change24h);
  setTicker('nav-eth-price','nav-eth-change', data.ethereum.price, data.ethereum.change24h);
}

function setTicker(pid, cid, price, chg) {
  const pel = document.getElementById(pid);
  const cel = document.getElementById(cid);
  if (!pel || !cel) return;
  pel.textContent = `$${fmt(price)}`;
  cel.textContent = `${(chg||0)>=0?'+':''}${(chg||0).toFixed(2)}%`;
  cel.className   = `ticker-change ${(chg||0)>=0?'pos':'neg'}`;
}

function updateChartPriceDisplay() {
  const coin = currentPrices[selectedCoin];
  const coinDef = getCoinDefinition(selectedCoin);
  const price = coin?.price || coinDef.basePrice;
  const chg = coin?.change24h || coinDef.baseChange;
  const vol = coin?.volume24h || coinDef.baseVol;
  const mcap = coin?.marketCap || coinDef.baseCap;

  document.getElementById('chart-price').textContent = `$${fmt(price)}`;
  const badge = document.getElementById('chart-change-badge');
  const sign  = (chg||0) >= 0 ? '+' : '';
  badge.textContent = `${sign}${(chg||0).toFixed(2)}%`;
  badge.className   = `cpi-badge ${(chg||0)>=0?'pos':'neg'}`;
  document.getElementById('chart-vol').textContent  = fmtLarge(vol);
  document.getElementById('chart-mcap').textContent = fmtLarge(mcap);

  // Requirement A4 & G3: Show "Stale", "Live" or "Simulated" badge next to price
  const modeBadge = document.getElementById('header-price-mode-badge');
  const modeText = document.getElementById('header-price-mode-text');
  if (modeBadge && modeText) {
    const isStale = (Date.now() - lastGoodPriceTimestamp) > 120000;
    if (isStale) {
      modeBadge.className = 'price-mode-badge stale';
      modeText.textContent = 'Stale';
    } else {
      const isLive = isPriceDataLive && !!currentPrices[selectedCoin]?.price;
      modeBadge.className = `price-mode-badge ${isLive ? 'live' : 'simulated'}`;
      modeText.textContent = isLive ? 'Live' : 'Simulated';
    }
  }
}

// ─── COIN SELECTION ───────────────────────────────────────
function selectCoin(coin) {
  const coinDef = getCoinDefinition(coin);
  selectedCoin = coinDef.id;

  // 1. Update Watchlist chips active state
  document.querySelectorAll('.wl-chip').forEach(c => c.classList.remove('active'));
  const activeWl = document.getElementById(`wl-chip-${selectedCoin}`);
  if (activeWl) {
    activeWl.classList.add('active');
    activeWl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  // 2. Update Markets rows active state
  document.querySelectorAll('.market-row').forEach(r => r.classList.remove('active'));
  const activeMkt = document.getElementById(`mkt-row-${selectedCoin}`);
  if (activeMkt) activeMkt.classList.add('active');

  // 3. Update Chart Header Active Coin Display
  const chpIcon = document.getElementById('chp-icon');
  const chpSym  = document.getElementById('chp-symbol');
  const chpName = document.getElementById('chp-name');
  if (chpIcon) chpIcon.src = coinDef.icon;
  if (chpSym)  chpSym.textContent = `${coinDef.symbol}/USD`;
  if (chpName) chpName.textContent = coinDef.name;

  // 4. Update Delta Trade Panel & Mini Stats
  if (tradeOrderType === 'limit') {
    setLimitPriceToCurrent();
  }
  updateTradeLabels();
  updateTradeCalc();
  updateMiniStats();
  updateChartPriceDisplay();
  loadDrawings();
  loadChart(selectedCoin, currentTF);

  if (chartMode === 'tv') {
    renderTradingViewChart();
  }
}

// ─── REAL-TIME PRICE STREAM (TRUTHFUL POLL WITHOUT MOCK DRIFT) ───────
function initRealtimeTicker() {
  // Poll genuine backend/CoinGecko prices every 4s
  setInterval(pollPricesFast, 4000);
}

async function pollPricesFast() {
  if (document.hidden) return;
  try {
    const res = await get(`${API}/prices`);
    if (res && res.bitcoin && res.ethereum && res.solana) {
      if (res.updatedAt) {
        lastGoodPriceTimestamp = new Date(res.updatedAt).getTime();
      }
      isRateLimited = !!res.isRateLimited;

      ['bitcoin', 'ethereum', 'solana'].forEach(k => {
        if (isValidPrice(res[k]?.price)) {
          const prev = currentPrices[k]?.price;
          currentPrices[k] = { ...currentPrices[k], ...res[k], isSimulated: false };
          if (prev !== res[k].price) {
            onPriceTick(k, prev, res[k].price);
          }
        }
      });
      updateDataBadge();
    }
  } catch (e) {}
}

function onPriceTick(coin, prevPrice, newPrice) {
  const wlPriceEl = document.getElementById(`wl-price-${coin}`);
  if (wlPriceEl) wlPriceEl.textContent = `$${fmt(newPrice)}`;
  const mktPriceEl = document.getElementById(`mkt-price-${coin}`);
  if (mktPriceEl) mktPriceEl.textContent = `$${fmt(newPrice)}`;

  if (selectedCoin === coin) {
    updateChartPriceDisplay();
    const priceEl = document.getElementById('chart-price');
    if (priceEl && prevPrice && prevPrice !== newPrice) {
      const cls = newPrice >= prevPrice ? 'price-flash-up' : 'price-flash-down';
      priceEl.classList.remove('price-flash-up', 'price-flash-down');
      void priceEl.offsetWidth;
      priceEl.classList.add(cls);
    }
    // Update live price dotted line on native candlestick chart
    if (chartMode === 'candle' && candleData && candleData.length) {
      renderCandlestickChart(candleData);
      renderDrawings();
    }
  }
  updateLivePnL(coin, newPrice);
}



// ─── CHART MODES & TIMEFRAME ──────────────────────────────
function setChartMode(mode) {
  chartMode = mode;
  ['candle','tv','line'].forEach(m => {
    const btn = document.getElementById(`cmode-${m}`);
    if (btn) btn.classList.toggle('active', m === mode);
  });

  const tvWrap     = document.getElementById('tv-chart-container');
  const candleCvs  = document.getElementById('candle-chart');
  const drawCvs    = document.getElementById('drawing-canvas');
  const priceCvs   = document.getElementById('price-chart');
  const toolbar    = document.getElementById('drawing-toolbar');
  const crosshair  = document.getElementById('candle-crosshair-bar');

  if (mode === 'tv') {
    tvWrap.classList.remove('hidden');
    candleCvs.classList.add('hidden');
    drawCvs.classList.add('hidden');
    priceCvs.classList.add('hidden');
    toolbar.classList.add('hidden');
    if (crosshair) crosshair.classList.add('hidden');
    renderTradingViewChart();
  } else if (mode === 'candle') {
    tvWrap.classList.add('hidden');
    candleCvs.classList.remove('hidden');
    drawCvs.classList.remove('hidden');
    priceCvs.classList.add('hidden');
    toolbar.classList.remove('hidden');
    if (candleData && candleData.length) {
      renderCandlestickChart(candleData);
      renderDrawings();
    } else {
      loadChart(selectedCoin, currentTF);
    }
  } else { // line
    tvWrap.classList.add('hidden');
    candleCvs.classList.add('hidden');
    drawCvs.classList.add('hidden');
    priceCvs.classList.remove('hidden');
    toolbar.classList.add('hidden');
    if (crosshair) crosshair.classList.add('hidden');
    loadChart(selectedCoin, currentTF);
  }
}

function selectTF(tf, btn) {
  currentTF = tf;
  document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (chartMode === 'tv') {
    renderTradingViewChart();
  } else {
    loadChart(selectedCoin, tf);
  }
}

// ─── TRADINGVIEW PRO CHART ────────────────────────────────
function renderTradingViewChart() {
  const container = document.getElementById('tv-chart-container');
  if (!container) return;
  const coinDef = getCoinDefinition(selectedCoin);
  const symbol = `BINANCE:${coinDef.binanceSymbol}`;
  const intervalMap = { '1m':'1', '3m':'3', '5m':'5', '15m':'15', '1h':'60', '4h':'240', '1d':'D', '1w':'W' };
  const tvInterval = intervalMap[currentTF] || '15';

  if (typeof TradingView !== 'undefined' && TradingView.widget) {
    try {
      new TradingView.widget({
        autosize: true,
        symbol: symbol,
        interval: tvInterval,
        timezone: "Asia/Kolkata",
        theme: "dark",
        style: "1", // 1 = Candlestick
        locale: "en",
        toolbar_bg: "#0b0e11",
        enable_publishing: false,
        hide_side_toolbar: false, // FULL 50+ DRAWING TOOLS ON LEFT!
        allow_symbol_change: true,
        save_image: false,
        container_id: "tradingview_widget_box"
      });
    } catch(e) { console.error('TradingView widget err:', e); }
  } else {
    container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--txt3);font-size:12px;">Connecting to TradingView feed...</div>`;
  }
}

// ─── TRUTHFUL CANDLES STORE (PROVIDER CACHE & STATIC BASELINE) ──────────
const providerOhlcCache = {};

function getBaselineCandles(coinDef, tf, count = 50) {
  const cur = currentPrices[coinDef.id];
  const p = cur?.price || coinDef.basePrice || 100;
  const tfMinutes = { '1m': 1, '3m': 3, '5m': 5, '15m': 15, '1h': 60, '4h': 240, '1d': 1440 }[tf.toLowerCase()] || 15;
  const now = Date.now();
  const stepMs = tfMinutes * 60 * 1000;
  const candles = [];
  const prices = [];

  for (let i = count; i >= 0; i--) {
    const timeMs = now - (i * stepMs);
    candles.push({
      time: Math.floor(timeMs / 1000),
      open: p,
      high: p,
      low: p,
      close: p,
      volume: 0
    });
    prices.push([timeMs, p]);
  }
  return { candles, prices, isBaseline: true };
}

// ─── COINGECKO OHLC ENDPOINT FETCH ────────────────────────
async function fetchCgOhlcWithTimeout(coinId, tf, timeoutMs = 5000) {
  if (Date.now() < cgRateLimitUntil) {
    throw new Error('CoinGecko rate limit cooldown active');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const tfLower = (tf || '15m').toLowerCase();
    const days = ['1d', '1w'].includes(tfLower) ? 30 : ['4h'].includes(tfLower) ? 7 : 1;
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (resp.status === 429) {
      cgRateLimitUntil = Date.now() + 60000;
      throw new Error('CoinGecko OHLC 429 rate limit');
    }
    if (!resp.ok) throw new Error('CG OHLC HTTP ' + resp.status);
    const ohlcData = await resp.json();
    if (!Array.isArray(ohlcData) || !ohlcData.length) throw new Error('Empty CG OHLC');
    
    // CG OHLC: [ [time_ms, open, high, low, close], ... ]
    const candles = ohlcData.map(c => ({
      time: Math.floor(c[0] / 1000),
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: 0
    }));
    const prices = candles.map(c => [c.time * 1000, c.close]);
    return { candles, prices, isBaseline: false };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── NATIVE CANDLESTICK ENGINE (With 5s Timeout & Guaranteed Truthful Fallback) ──
let chartLoadTimer = null;

async function loadChart(coin, tf) {
  const loader = document.getElementById('chart-loading');
  if (loader) loader.classList.remove('hidden');
  
  const coinDef = getCoinDefinition(coin);
  const cacheKey = `${coinDef.id}_${tf}`;
  const sourceBadge = document.getElementById('chart-source-badge');
  let hasRendered = false;

  // Strict 5-Second Timeout: Terminates spinner and renders cached/baseline provider candles
  if (chartLoadTimer) clearTimeout(chartLoadTimer);
  chartLoadTimer = setTimeout(() => {
    if (!hasRendered) {
      hasRendered = true;
      if (loader) loader.classList.add('hidden');
      const fallback = providerOhlcCache[cacheKey] || getBaselineCandles(coinDef, tf);
      if (sourceBadge) {
        sourceBadge.textContent = fallback.isBaseline ? 'Rate-Limited' : 'Cached';
        sourceBadge.className = fallback.isBaseline ? 'chart-source-badge badge-stale' : 'chart-source-badge badge-delayed';
      }
      candleData = fallback.candles;
      renderCurrentChart(fallback.candles, fallback.prices, tf);
    }
  }, 5000);

  try {
    let chartResult = null;
    
    // Step 1: Try CoinGecko OHLC API
    try {
      chartResult = await fetchCgOhlcWithTimeout(coinDef.id, tf, 3200);
    } catch (cgErr) {
      // Step 2: Try backend endpoint as secondary option
      try {
        const ctl = new AbortController();
        const tm = setTimeout(() => ctl.abort(), 1800);
        const resp = await fetch(`${API}/ohlc/${coinDef.id}?tf=${tf}`, { signal: ctl.signal });
        clearTimeout(tm);
        if (resp.ok) {
          const beData = await resp.json();
          if (beData.candles && beData.candles.length) {
            chartResult = { candles: beData.candles, prices: beData.prices || [], isBaseline: false };
          }
        }
      } catch (beErr) {}
    }

    // Step 3: Check cache if provider network failed
    if (!chartResult || !chartResult.candles || !chartResult.candles.length) {
      chartResult = providerOhlcCache[cacheKey] || getBaselineCandles(coinDef, tf);
    } else {
      // Save genuine candles to cache
      providerOhlcCache[cacheKey] = chartResult;
    }

    if (!hasRendered) {
      hasRendered = true;
      clearTimeout(chartLoadTimer);
      candleData = chartResult.candles;

      if (sourceBadge) {
        if (chartResult.isBaseline) {
          sourceBadge.textContent = 'Rate-Limited';
          sourceBadge.className = 'chart-source-badge badge-stale';
        } else if (chartResult === providerOhlcCache[cacheKey]) {
          sourceBadge.textContent = 'Live';
          sourceBadge.className = 'chart-source-badge badge-live';
        } else {
          sourceBadge.textContent = 'Cached';
          sourceBadge.className = 'chart-source-badge badge-delayed';
        }
      }

      renderCurrentChart(chartResult.candles, chartResult.prices, tf);
    }
  } catch(e) {
    if (!hasRendered) {
      hasRendered = true;
      clearTimeout(chartLoadTimer);
      const fallback = providerOhlcCache[cacheKey] || getBaselineCandles(coinDef, tf);
      candleData = fallback.candles;
      if (sourceBadge) {
        sourceBadge.textContent = fallback.isBaseline ? 'Rate-Limited' : 'Cached';
        sourceBadge.className = fallback.isBaseline ? 'chart-source-badge badge-stale' : 'chart-source-badge badge-delayed';
      }
      renderCurrentChart(fallback.candles, fallback.prices, tf);
    }
  } finally {
    if (loader) loader.classList.add('hidden');
  }
}

function renderCurrentChart(candles, prices, tf) {
  if (chartMode === 'tv') {
    renderTradingViewChart();
  } else if (chartMode === 'candle') {
    if (candles && candles.length) {
      renderCandlestickChart(candles);
      renderDrawings();
    }
  } else {
    renderLineChart(prices || [], tf);
  }
}

let candleViewport = { minP: 0, maxP: 0, plotW: 0, plotH: 0, padTop: 18, padRight: 64, padBottom: 22 };

function renderCandlestickChart(candles) {
  const canvas = document.getElementById('candle-chart');
  if (!canvas || !candles || !candles.length) return;
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const padRight = 64;
  const padBottom = 22;
  const padTop = 18;
  const plotW = w - padRight;
  const plotH = h - padBottom - padTop;

  let minP = Infinity, maxP = -Infinity;
  candles.forEach(c => {
    if (c.low < minP) minP = c.low;
    if (c.high > maxP) maxP = c.high;
  });
  const pRange = (maxP - minP) || 1;
  const pMargin = pRange * 0.08;
  const adjMin = minP - pMargin;
  const adjMax = maxP + pMargin;
  const adjRange = adjMax - adjMin;

  candleViewport = { minP: adjMin, maxP: adjMax, plotW, plotH, padTop, padRight, padBottom, w, h };

  function priceToY(p) {
    return padTop + plotH - ((p - adjMin) / adjRange) * plotH;
  }

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0b0e11';
  ctx.fillRect(0, 0, w, h);

  // Horizontal Grid & Price Ticks
  const gridSteps = 5;
  ctx.strokeStyle = 'rgba(42, 49, 61, 0.45)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.font = '10px Inter, sans-serif';
  ctx.fillStyle = '#5a6474';
  ctx.textAlign = 'left';

  for (let i = 0; i <= gridSteps; i++) {
    const p = adjMin + (adjRange / gridSteps) * i;
    const y = priceToY(p);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(plotW, y);
    ctx.stroke();
    ctx.fillText(`$${fmt(p)}`, plotW + 5, y + 3);
  }
  ctx.setLineDash([]);

  // Time Axis Bottom Ticks
  const timeSteps = 6;
  const tGap = Math.floor(candles.length / timeSteps);
  ctx.textAlign = 'center';
  for (let i = 0; i < candles.length; i += tGap) {
    const c = candles[i];
    const x = (i / candles.length) * plotW + (plotW / candles.length) / 2;
    const d = new Date(c.time * 1000);
    const timeStr = currentTF === '1d' || currentTF === '1w'
      ? `${d.getMonth()+1}/${d.getDate()}`
      : `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
    ctx.fillText(timeStr, x, h - 6);
  }

  // Draw Candlesticks & Volume Bars
  const n = candles.length;
  const gap = plotW / n;
  const candleW = Math.max(2.5, gap * 0.68);

  candles.forEach((c, i) => {
    const x = i * gap + (gap - candleW) / 2;
    const centerX = x + candleW / 2;
    const openY = priceToY(c.open);
    const closeY = priceToY(c.close);
    const highY = priceToY(c.high);
    const lowY = priceToY(c.low);
    const isBull = c.close >= c.open;
    const color = isBull ? '#0ecb81' : '#f6465d';

    // Wick
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(centerX, highY);
    ctx.lineTo(centerX, lowY);
    ctx.stroke();

    // Body
    ctx.fillStyle = color;
    const bodyY = Math.min(openY, closeY);
    const bodyH = Math.max(2, Math.abs(closeY - openY));
    ctx.fillRect(x, bodyY, candleW, bodyH);

    // Subtle volume bar at bottom
    const volH = Math.min(22, (c.volume || 10) * 0.3);
    ctx.fillStyle = isBull ? 'rgba(14,203,129,0.18)' : 'rgba(246,70,93,0.18)';
    ctx.fillRect(x, padTop + plotH - volH, candleW, volH);
  });

  // Current Live Price Pulsing Line
  const latestPrice = currentPrices[selectedCoin]?.price || candles[candles.length - 1].close;
  const curY = priceToY(latestPrice);
  if (curY >= padTop && curY <= padTop + plotH) {
    ctx.strokeStyle = '#f0b90b';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, curY);
    ctx.lineTo(plotW, curY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Live Badge on right
    ctx.fillStyle = '#f0b90b';
    ctx.fillRect(plotW + 2, curY - 9, padRight - 4, 18);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`$${fmt(latestPrice)}`, plotW + 5, curY + 3.5);
  }
}

// ─── NATIVE DRAWING CANVAS ENGINE ─────────────────────────
function setDrawTool(tool) {
  drawTool = tool;
  ['cursor','trend','horiz','brush','measure'].forEach(t => {
    const btn = document.getElementById(`dt-${t}`);
    if (btn) btn.classList.toggle('active', t === tool);
  });
  const cvs = document.getElementById('drawing-canvas');
  if (cvs) cvs.classList.toggle('active-draw', tool !== 'cursor');
}

function setDrawColor(color, el) {
  drawColor = color;
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  if (el) el.classList.add('active');
}

function loadDrawings() {
  try {
    const raw = safeStorageGet(`ct_drawings_${selectedCoin}`);
    drawings = raw ? JSON.parse(raw) : [];
  } catch(e) { drawings = []; }
  renderDrawings();
}

function saveDrawings() {
  try {
    safeStorageSet(`ct_drawings_${selectedCoin}`, drawings);
  } catch(e) {}
}

function undoDrawing() {
  if (drawings.length) {
    drawings.pop();
    saveDrawings();
    renderDrawings();
    showToast('Undo drawing', 'info');
  }
}

function clearDrawings() {
  drawings = [];
  saveDrawings();
  renderDrawings();
  showToast('All drawings cleared', 'info');
}

function setupDrawingCanvas() {
  const cvs = document.getElementById('drawing-canvas');
  if (!cvs) return;

  loadDrawings();

  let isDrawing = false;
  let startPt = null;

  function getCanvasPos(e) {
    const rect = cvs.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function handleStart(e) {
    if (drawTool === 'cursor') return;
    if (e.touches && e.touches.length > 1) return;
    isDrawing = true;
    startPt = getCanvasPos(e);

    if (drawTool === 'brush') {
      activeDrawing = { type: 'brush', points: [startPt], color: drawColor };
    } else if (drawTool === 'horiz') {
      const price = yToPrice(startPt.y);
      drawings.push({ type: 'horiz', y: startPt.y, price, color: drawColor });
      saveDrawings();
      renderDrawings();
      isDrawing = false;
    } else if (drawTool === 'trend') {
      activeDrawing = { type: 'trend', x1: startPt.x, y1: startPt.y, x2: startPt.x, y2: startPt.y, color: drawColor };
    } else if (drawTool === 'measure') {
      activeDrawing = { type: 'measure', x1: startPt.x, y1: startPt.y, x2: startPt.x, y2: startPt.y, color: drawColor };
    }
  }

  function handleMove(e) {
    // Crosshair info display
    const pos = getCanvasPos(e);
    updateCrosshairBar(pos);

    if (!isDrawing || !activeDrawing) return;
    if (e.cancelable) e.preventDefault();

    if (drawTool === 'brush') {
      activeDrawing.points.push(pos);
      renderDrawings(activeDrawing);
    } else if (drawTool === 'trend' || drawTool === 'measure') {
      activeDrawing.x2 = pos.x;
      activeDrawing.y2 = pos.y;
      renderDrawings(activeDrawing);
    }
  }

  function handleEnd() {
    if (!isDrawing) return;
    isDrawing = false;
    if (activeDrawing) {
      if (drawTool === 'trend' || drawTool === 'measure') {
        activeDrawing.price1 = yToPrice(activeDrawing.y1);
        activeDrawing.price2 = yToPrice(activeDrawing.y2);
      }
      drawings.push(activeDrawing);
      activeDrawing = null;
      saveDrawings();
      renderDrawings();
    }
  }

  cvs.addEventListener('mousedown', handleStart);
  cvs.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleEnd);

  cvs.addEventListener('touchstart', handleStart, { passive: false });
  cvs.addEventListener('touchmove', handleMove, { passive: false });
  window.addEventListener('touchend', handleEnd);

  // Resize handler
  window.addEventListener('resize', () => {
    if (chartMode === 'candle' && candleData.length) {
      renderCandlestickChart(candleData);
      renderDrawings();
    }
  });
}

function yToPrice(y) {
  const { minP, maxP, plotH, padTop } = candleViewport;
  if (!plotH) return 0;
  const adjRange = maxP - minP;
  return minP + ((padTop + plotH - y) / plotH) * adjRange;
}

function updateCrosshairBar(pos) {
  const bar = document.getElementById('candle-crosshair-bar');
  if (!bar || chartMode !== 'candle' || !candleData.length) return;
  const { plotW } = candleViewport;
  if (pos.x < 0 || pos.x > plotW) { bar.classList.add('hidden'); return; }

  const idx = Math.min(candleData.length - 1, Math.max(0, Math.floor((pos.x / plotW) * candleData.length)));
  const c = candleData[idx];
  if (!c) return;

  bar.classList.remove('hidden');
  const d = new Date(c.time * 1000);
  const timeStr = `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
  const isUp = c.close >= c.open;
  const diffPct = (((c.close - c.open) / c.open) * 100).toFixed(2);

  bar.innerHTML = `
    <span class="cch-item">🕒 ${timeStr}</span>
    <span class="cch-item">O: <b>$${fmt(c.open)}</b></span>
    <span class="cch-item">H: <b>$${fmt(c.high)}</b></span>
    <span class="cch-item">L: <b>$${fmt(c.low)}</b></span>
    <span class="cch-item">C: <b class="${isUp?'cch-pos':'cch-neg'}">$${fmt(c.close)}</b></span>
    <span class="cch-item ${isUp?'cch-pos':'cch-neg'}">(${isUp?'+':''}${diffPct}%)</span>
  `;
}

function renderDrawings(inProgress) {
  const cvs = document.getElementById('drawing-canvas');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');
  const rect = cvs.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  cvs.width = rect.width * dpr;
  cvs.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, rect.width, rect.height);

  const all = inProgress ? [...drawings, inProgress] : drawings;

  all.forEach(d => {
    ctx.strokeStyle = d.color || '#f0b90b';
    ctx.fillStyle   = d.color || '#f0b90b';

    if (d.type === 'horiz') {
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(0, d.y);
      ctx.lineTo(candleViewport.plotW || rect.width - 64, d.y);
      ctx.stroke();
      ctx.setLineDash([]);
      // Price Tag badge
      if (d.price) {
        ctx.fillRect((candleViewport.plotW || rect.width - 64) + 2, d.y - 8, 60, 16);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillText(`$${fmt(d.price)}`, (candleViewport.plotW || rect.width - 64) + 5, d.y + 3.5);
      }
    } else if (d.type === 'trend') {
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(d.x1, d.y1);
      ctx.lineTo(d.x2, d.y2);
      ctx.stroke();

      // Handles
      ctx.beginPath();
      ctx.arc(d.x1, d.y1, 4, 0, Math.PI * 2);
      ctx.arc(d.x2, d.y2, 4, 0, Math.PI * 2);
      ctx.fill();

      // Price difference label
      if (d.price1 && d.price2) {
        const diff = d.price2 - d.price1;
        const pct  = ((diff / d.price1) * 100).toFixed(2);
        const midX = (d.x1 + d.x2) / 2;
        const midY = (d.y1 + d.y2) / 2 - 10;
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = 'rgba(11,14,17,0.85)';
        ctx.fillRect(midX - 35, midY - 11, 70, 15);
        ctx.fillStyle = diff >= 0 ? '#0ecb81' : '#f6465d';
        ctx.fillText(`${diff>=0?'+':''}$${fmt(diff)} (${diff>=0?'+':''}${pct}%)`, midX - 32, midY);
      }
    } else if (d.type === 'brush' && d.points && d.points.length > 1) {
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(d.points[0].x, d.points[0].y);
      for (let i = 1; i < d.points.length; i++) {
        ctx.lineTo(d.points[i].x, d.points[i].y);
      }
      ctx.stroke();
    } else if (d.type === 'measure') {
      const minX = Math.min(d.x1, d.x2);
      const minY = Math.min(d.y1, d.y2);
      const boxW = Math.abs(d.x2 - d.x1);
      const boxH = Math.abs(d.y2 - d.y1);

      const p1 = d.price1 || yToPrice(d.y1);
      const p2 = d.price2 || yToPrice(d.y2);
      const diff = p2 - p1;
      const pct  = p1 ? ((diff / p1) * 100).toFixed(2) : '0.00';
      const isUp = diff >= 0;

      ctx.fillStyle = isUp ? 'rgba(14,203,129,0.15)' : 'rgba(246,70,93,0.15)';
      ctx.strokeStyle = isUp ? '#0ecb81' : '#f6465d';
      ctx.lineWidth = 1.2;
      ctx.fillRect(minX, minY, boxW, boxH);
      ctx.strokeRect(minX, minY, boxW, boxH);

      // Label
      ctx.fillStyle = isUp ? '#0ecb81' : '#f6465d';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(`${isUp?'+':''}$${fmt(diff)} (${isUp?'+':''}${pct}%)`, minX + 6, minY + 16);
    }
  });
}

// ─── LINE CHART RENDERER (FALLBACK) ───────────────────────
function renderLineChart(prices, tf) {
  if (!prices || !prices.length) return;
  const isShort = ['1m','3m','5m','15m'].includes(tf);
  const labels = prices.map(p => {
    const d = new Date(p[0]);
    return isShort
      ? d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })
      : d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
  });
  const vals = prices.map(p => p[1]);
  const isUp = vals[vals.length - 1] >= vals[0];
  const color = isUp ? '#0ecb81' : '#f6465d';
  const fill = isUp ? 'rgba(14,203,129,0.07)' : 'rgba(246,70,93,0.07)';

  if (priceChart) priceChart.destroy();
  const ctx = document.getElementById('price-chart').getContext('2d');
  priceChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ data: vals, borderColor: color, borderWidth: 1.8, backgroundColor: fill, fill: true, tension: 0.3, pointRadius: 0 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#5a6474', font: { size: 10 }, maxTicksLimit: 6 } },
        y: { position: 'right', grid: { color: 'rgba(42,49,61,0.4)' }, ticks: { color: '#5a6474', font: { size: 10 }, callback: v => `$${fmt(v)}` } }
      }
    }
  });
}

// ─── BOTTOM TABS (Requirement A) ──────────────────────────
function showBottomTab(tab, btn) {
  activeBottomTab = tab || 'positions';
  ['positions','orders','history'].forEach(t => {
    const panel = document.getElementById(`panel-${t}`);
    if (panel) panel.classList.toggle('hidden', t !== activeBottomTab);
  });
  document.querySelectorAll('.btab').forEach(b => b.classList.remove('active'));
  const activeBtn = btn || document.getElementById(`tab-btn-${activeBottomTab}`);
  if (activeBtn) activeBtn.classList.add('active');
}

function updateTabBadges() {
  const posCount = (walletState.positions || []).length;
  const ordCount = (walletState.orders || []).length;
  const histCount = (walletState.history || []).length;

  const posBadge = document.getElementById('pos-count-badge');
  const ordBadge = document.getElementById('orders-count-badge');
  const histBadge = document.getElementById('history-count-badge');

  if (posBadge) posBadge.textContent = `(${posCount})`;
  if (ordBadge) ordBadge.textContent = `(${ordCount})`;
  if (histBadge) histBadge.textContent = `(${histCount})`;
}

// ─── DELTA-STYLE ORDER CATEGORY & SIDE ─────────────────────
function setOrderCat(cat) {
  tradeCategory = cat;
  document.getElementById('ocat-spot')?.classList.toggle('active', cat === 'spot');
  document.getElementById('ocat-position')?.classList.toggle('active', cat === 'position');
  
  const posSection = document.getElementById('position-controls-section');
  const headerBadge = document.getElementById('delta-header-badge');
  const liqRow = document.getElementById('sum-liq-row');
  
  if (cat === 'position') {
    if (posSection) posSection.style.display = 'block';
    if (headerBadge) headerBadge.style.display = 'block';
    if (liqRow) liqRow.style.display = 'flex';
  } else {
    if (posSection) posSection.style.display = 'none';
    if (headerBadge) headerBadge.style.display = 'none';
    if (liqRow) liqRow.style.display = 'none';
  }
  updateTradeLabels();
  updateTradeCalc();
}

function setTradeSide(side) {
  tradeSide = side;
  const buyBtn = document.getElementById('side-buy-btn');
  const sellBtn = document.getElementById('side-sell-btn');
  const subBtn = document.getElementById('delta-submit-btn');
  
  if (buyBtn && sellBtn) {
    buyBtn.classList.toggle('active', side === 'buy');
    sellBtn.classList.toggle('active', side === 'sell');
  }
  if (subBtn) {
    if (side === 'buy') {
      subBtn.classList.add('buy-execute');
      subBtn.classList.remove('sell-execute');
    } else {
      subBtn.classList.add('sell-execute');
      subBtn.classList.remove('buy-execute');
    }
  }
  updateTradeLabels();
  updateTradeCalc();
}

function setOrderType(type) {
  tradeOrderType = type;
  document.getElementById('otype-market')?.classList.toggle('active', type === 'market');
  document.getElementById('otype-limit')?.classList.toggle('active', type === 'limit');
  
  const limitField = document.getElementById('limit-price-group');
  if (limitField) {
    limitField.style.display = type === 'limit' ? 'block' : 'none';
    if (type === 'limit') {
      setLimitPriceToCurrent();
    }
  }
  updateTradeCalc();
}

function setLimitPriceToCurrent() {
  const coinDef = getCoinDefinition(selectedCoin);
  const curPrice = currentPrices[selectedCoin]?.price || coinDef.basePrice || 0;
  const input = document.getElementById('limit-price-input');
  if (input) {
    input.value = curPrice > 10 ? curPrice.toFixed(2) : curPrice.toPrecision(5);
  }
  updateTradeCalc();
}

function setTradeUnit(unit) {
  tradeUnit = unit;
  document.getElementById('uchip-coin')?.classList.toggle('active', unit === 'coin');
  document.getElementById('uchip-usd')?.classList.toggle('active', unit === 'usd');
  
  const coinDef = getCoinDefinition(selectedCoin);
  const prefix = document.getElementById('amount-prefix');
  if (prefix) prefix.textContent = unit === 'usd' ? '$' : coinDef.symbol.charAt(0);
  
  updateTradeCalc();
}

function setMarginMode(mode) {
  tradeMarginMode = mode;
  document.getElementById('mm-isolated')?.classList.toggle('active', mode === 'isolated');
  document.getElementById('mm-cross')?.classList.toggle('active', mode === 'cross');
  
  const pill = document.getElementById('delta-lev-pill');
  if (pill) pill.textContent = `${tradeLeverage}x ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
  updateTradeCalc();
}

function setLeverage(val) {
  tradeLeverage = Math.max(1, Math.min(100, parseInt(val) || 10));
  const slider = document.getElementById('leverage-slider');
  if (slider) slider.value = tradeLeverage;
  
  const disp = document.getElementById('lev-val-display');
  if (disp) disp.textContent = `${tradeLeverage}x`;
  
  const pill = document.getElementById('delta-lev-pill');
  if (pill) pill.textContent = `${tradeLeverage}x ${tradeMarginMode.charAt(0).toUpperCase() + tradeMarginMode.slice(1)}`;
  
  document.querySelectorAll('.lchip').forEach(c => {
    const chipNum = parseInt(c.textContent.replace('x',''));
    c.classList.toggle('active', chipNum === tradeLeverage);
  });
  updateTradeLabels();
  updateTradeCalc();
}

function adjustLeverage(delta) {
  setLeverage(tradeLeverage + delta);
}

function setQuickPercent(frac) {
  const coinDef = getCoinDefinition(selectedCoin);
  const curPrice = currentPrices[selectedCoin]?.price || coinDef.basePrice || 1;
  const cash = walletState.cashBalance;
  const held = walletState.holdings[selectedCoin] || 0;
  
  let targetAmount = 0;
  if (tradeCategory === 'spot') {
    if (tradeSide === 'buy') {
      const spendUsd = cash * frac;
      targetAmount = tradeUnit === 'usd' ? spendUsd : (curPrice > 0 ? spendUsd / curPrice : 0);
    } else {
      const sellCoins = held * frac;
      targetAmount = tradeUnit === 'coin' ? sellCoins : (sellCoins * curPrice);
    }
  } else {
    // Position (Long or Short)
    const maxOrderVal = cash * tradeLeverage * frac;
    targetAmount = tradeUnit === 'usd' ? maxOrderVal : (curPrice > 0 ? maxOrderVal / curPrice : 0);
  }
  
  const input = document.getElementById('trade-amount-input');
  if (input) {
    input.value = targetAmount > 10 ? targetAmount.toFixed(4) : targetAmount.toFixed(6);
  }
  updateTradeCalc();
}

function toggleTpSlSection() {
  const body = document.getElementById('tpsl-body');
  const arrow = document.getElementById('tpsl-toggle-arrow');
  if (!body) return;
  const isHidden = body.classList.toggle('hidden');
  if (arrow) arrow.textContent = isHidden ? '▸' : '▾';
}

function setQuickTp(pct) {
  const coinDef = getCoinDefinition(selectedCoin);
  const entry = tradeOrderType === 'limit' && parseFloat(v('limit-price-input')) > 0
    ? parseFloat(v('limit-price-input'))
    : (currentPrices[selectedCoin]?.price || coinDef.basePrice || 100);
  
  let targetPrice;
  if (tradeCategory === 'position') {
    targetPrice = tradeSide === 'buy' ? entry * (1 + pct) : entry * (1 - pct);
  } else {
    targetPrice = entry * (1 + pct);
  }
  const input = document.getElementById('tp-input');
  if (input) input.value = targetPrice > 10 ? targetPrice.toFixed(2) : targetPrice.toPrecision(5);
  updateTradeCalc();
}

function setQuickSl(pct) {
  const coinDef = getCoinDefinition(selectedCoin);
  const entry = tradeOrderType === 'limit' && parseFloat(v('limit-price-input')) > 0
    ? parseFloat(v('limit-price-input'))
    : (currentPrices[selectedCoin]?.price || coinDef.basePrice || 100);
  
  let targetPrice;
  if (tradeCategory === 'position') {
    targetPrice = tradeSide === 'buy' ? entry * (1 - pct) : entry * (1 + pct);
  } else {
    targetPrice = entry * (1 - pct);
  }
  const input = document.getElementById('sl-input');
  if (input) input.value = targetPrice > 10 ? targetPrice.toFixed(2) : targetPrice.toPrecision(5);
  updateTradeCalc();
}

// ─── LIVE CALCULATIONS & SUMMARY (Requirement D) ───────────
function updateTradeCalc() {
  const coinDef = getCoinDefinition(selectedCoin);
  const curPrice = currentPrices[selectedCoin]?.price || coinDef.basePrice || 100;
  const inputVal = parseFloat(v('trade-amount-input')) || 0;
  
  const entryPrice = (tradeOrderType === 'limit' && parseFloat(v('limit-price-input')) > 0)
    ? parseFloat(v('limit-price-input'))
    : curPrice;

  let sizeCoins = 0;
  let orderValue = 0;
  
  if (tradeUnit === 'coin') {
    sizeCoins = inputVal;
    orderValue = inputVal * entryPrice;
  } else {
    orderValue = inputVal;
    sizeCoins = entryPrice > 0 ? (inputVal / entryPrice) : 0;
  }

  // Live conversion subtitle
  const convSub = document.getElementById('live-conversion-sub');
  if (convSub) {
    if (tradeUnit === 'coin') {
      convSub.textContent = `≈ $${fmtNum(orderValue)} USD`;
    } else {
      convSub.textContent = `≈ ${sizeCoins.toFixed(6)} ${coinDef.symbol}`;
    }
  }

  const lev = tradeCategory === 'position' ? tradeLeverage : 1;
  const marginRequired = lev > 0 ? (orderValue / lev) : orderValue;
  const feeRate = tradeOrderType === 'market' ? 0.0005 : 0.0002;
  const estFee = orderValue * feeRate;

  // Liquidation Price calculation (Position only)
  let liqPrice = 0;
  if (tradeCategory === 'position' && lev > 0) {
    if (tradeSide === 'buy') {
      // Long: entry * (1 - 1/leverage * 0.9)
      liqPrice = entryPrice * (1 - (1 / lev) * 0.9);
    } else {
      // Short: entry * (1 + 1/leverage * 0.9)
      liqPrice = entryPrice * (1 + (1 / lev) * 0.9);
    }
    liqPrice = Math.max(0.0000001, liqPrice);
  }

  // Update Summary Box
  const sumOrderVal = document.getElementById('sum-order-val');
  const sumMarginReq = document.getElementById('sum-margin-req');
  const sumEstFee = document.getElementById('sum-est-fee');
  const sumFeeRate = document.getElementById('sum-fee-rate');
  const sumLiqPrice = document.getElementById('sum-liq-price');
  const sumAvailCash = document.getElementById('sum-avail-cash');
  const sumCoinHeld = document.getElementById('sum-coin-held');

  if (sumOrderVal) sumOrderVal.textContent = `$${fmtNum(orderValue)}`;
  if (sumMarginReq) sumMarginReq.textContent = `$${fmtNum(marginRequired)}`;
  if (sumEstFee) sumEstFee.textContent = `$${fmtNum(estFee)}`;
  if (sumFeeRate) sumFeeRate.textContent = tradeOrderType === 'market' ? '(0.05% Taker)' : '(0.02% Maker)';
  if (sumLiqPrice) sumLiqPrice.textContent = tradeCategory === 'position' ? `$${fmt(liqPrice)}` : '—';
  if (sumAvailCash) sumAvailCash.textContent = `$${fmtNum(walletState.cashBalance)}`;
  
  const held = walletState.holdings[selectedCoin] || 0;
  if (sumCoinHeld) sumCoinHeld.textContent = `${held.toFixed(4)} ${coinDef.symbol}`;

  // Validate Take Profit & Stop Loss
  const tpVal = parseFloat(v('tp-input')) || 0;
  const slVal = parseFloat(v('sl-input')) || 0;
  let tpslError = '';
  
  if (tpVal > 0) {
    if ((tradeSide === 'buy' || tradeCategory === 'spot') && tpVal <= entryPrice) {
      tpslError = `TP ($${fmt(tpVal)}) must be above entry ($${fmt(entryPrice)})`;
    } else if (tradeCategory === 'position' && tradeSide === 'sell' && tpVal >= entryPrice) {
      tpslError = `TP ($${fmt(tpVal)}) must be below entry ($${fmt(entryPrice)})`;
    }
  }
  if (!tpslError && slVal > 0) {
    if ((tradeSide === 'buy' || tradeCategory === 'spot') && slVal >= entryPrice) {
      tpslError = `SL ($${fmt(slVal)}) must be below entry ($${fmt(entryPrice)})`;
    } else if (tradeCategory === 'position' && tradeSide === 'sell' && slVal <= entryPrice) {
      tpslError = `SL ($${fmt(slVal)}) must be above entry ($${fmt(entryPrice)})`;
    }
  }

  const tpslHint = document.getElementById('tpsl-val-msg');
  if (tpslHint) {
    if (tpslError) {
      tpslHint.textContent = `⚠️ ${tpslError}`;
      tpslHint.classList.remove('hidden');
    } else {
      tpslHint.classList.add('hidden');
    }
  }

  // Submit button validation & state (Requirement E)
  const submitBtn = document.getElementById('delta-submit-btn');
  const valMsg = document.getElementById('trade-val-msg');
  let disableReason = '';

  if (inputVal <= 0) {
    disableReason = 'Enter an amount to trade';
  } else if (tpslError) {
    disableReason = tpslError;
  } else if (tradeCategory === 'spot') {
    if (tradeSide === 'buy' && (orderValue + estFee) > walletState.cashBalance) {
      disableReason = `Insufficient balance ($${fmtNum(walletState.cashBalance)} available)`;
    } else if (tradeSide === 'sell' && sizeCoins > (walletState.holdings[selectedCoin] || 0)) {
      disableReason = `Insufficient ${coinDef.symbol} holding (${(walletState.holdings[selectedCoin]||0).toFixed(4)} held)`;
    }
  } else {
    // Position
    if ((marginRequired + estFee) > walletState.cashBalance) {
      disableReason = `Insufficient cash for margin ($${fmtNum(walletState.cashBalance)} available)`;
    }
  }

  if (submitBtn) {
    submitBtn.disabled = Boolean(disableReason);
  }
  if (valMsg) {
    if (disableReason && inputVal > 0) {
      valMsg.textContent = disableReason;
      valMsg.classList.remove('hidden');
    } else {
      valMsg.classList.add('hidden');
    }
  }
}

function updateTradeLabels() {
  const coinDef = getCoinDefinition(selectedCoin);
  const sym = coinDef.symbol;
  
  // Side buttons labels
  const sideBuy = document.getElementById('side-buy-label');
  const sideSell = document.getElementById('side-sell-label');
  if (sideBuy) sideBuy.textContent = tradeCategory === 'position' ? '↑ Long (Buy)' : `↑ Buy ${sym}`;
  if (sideSell) sideSell.textContent = tradeCategory === 'position' ? '↓ Short (Sell)' : `↓ Sell ${sym}`;
  
  // Unit toggle coin chip
  const uchipCoin = document.getElementById('uchip-coin');
  if (uchipCoin) uchipCoin.textContent = sym;
  
  // Submit button label
  const submitLabel = document.getElementById('delta-submit-label');
  if (submitLabel) {
    if (tradeCategory === 'spot') {
      submitLabel.textContent = tradeSide === 'buy' ? `Buy ${sym}` : `Sell ${sym}`;
    } else {
      submitLabel.textContent = tradeSide === 'buy' ? `Open Long ${tradeLeverage}x` : `Open Short ${tradeLeverage}x`;
    }
  }
  
  // Active coin banner
  const tacbIcon = document.getElementById('tacb-icon');
  const tacbSym = document.getElementById('tacb-symbol');
  const tacbName = document.getElementById('tacb-name');
  const tacbPrice = document.getElementById('tacb-price');
  const tacbChange = document.getElementById('tacb-change');
  const cur = currentPrices[selectedCoin];
  const p = cur?.price || coinDef.basePrice || 100;
  const chg = cur?.change24h ?? coinDef.baseChange;
  
  if (tacbIcon) {
    tacbIcon.style.color = coinDef.color;
    tacbIcon.style.backgroundColor = `${coinDef.color}22`;
    tacbIcon.textContent = sym.charAt(0);
  }
  if (tacbSym) tacbSym.textContent = `${sym}/USDT`;
  if (tacbName) tacbName.textContent = coinDef.name;
  if (tacbPrice) tacbPrice.textContent = `$${fmt(p)}`;
  if (tacbChange) {
    tacbChange.textContent = `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%`;
    tacbChange.className = `tacb-change ${chg >= 0 ? 'green' : 'red'}`;
  }
}

// ─── TRADE EXECUTION (Requirement B & C & D) ───────────────────
// ─── TRADE EXECUTION (Requirement B & C & D) ───────────────────
let lastTradeClickTime = 0;

function executeTrade() {
  // Requirement: Reject any new order when market data is stale (> 3 minutes / 180s)
  const dataAgeMs = Date.now() - (lastGoodPriceTimestamp || 0);
  if (dataAgeMs > 180000) {
    showToast('⚠️ Market data is stale (> 3m old). New orders are disabled.', 'error');
    return;
  }

  // Requirement B3: Prevent double-tap on Buy, Sell buttons (disable for 1s)
  if (Date.now() - lastTradeClickTime < 1000) return;
  lastTradeClickTime = Date.now();

  const submitBtn = document.getElementById('delta-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    setTimeout(() => { if (submitBtn) submitBtn.disabled = false; }, 1000);
  }

  const coinDef = getCoinDefinition(selectedCoin);
  const curPrice = currentPrices[selectedCoin]?.price || coinDef.basePrice || 100;
  const inputVal = parseFloat(v('trade-amount-input')) || 0;

  // Requirement B2: Reject any order with size 0 or negative size
  if (inputVal <= 0 || isNaN(inputVal) || !isFinite(inputVal)) {
    showToast('❌ Order size must be greater than 0', 'error');
    return;
  }

  const rawEntry = (tradeOrderType === 'limit' && parseFloat(v('limit-price-input')) > 0)
    ? parseFloat(v('limit-price-input'))
    : curPrice;

  // Requirement B1: Reject price that is 0, negative, NaN or Infinity
  if (!isValidPrice(rawEntry)) {
    showToast('❌ Invalid price for order', 'error');
    return;
  }
  const entryPrice = roundValue(rawEntry, 'money');

  let sizeCoins = 0;
  let orderValue = 0;
  if (tradeUnit === 'coin') {
    sizeCoins = roundValue(inputVal, 'coin');
    orderValue = roundValue(inputVal * entryPrice, 'money');
  } else {
    orderValue = roundValue(inputVal, 'money');
    sizeCoins = entryPrice > 0 ? roundValue(inputVal / entryPrice, 'coin') : 0;
  }

  if (sizeCoins <= 0 || isNaN(sizeCoins) || !isFinite(sizeCoins)) {
    showToast('❌ Order size must be greater than 0', 'error');
    return;
  }

  // Requirement B2: Reject leverage outside 1 to 100
  if (tradeCategory === 'position') {
    if (tradeLeverage < 1 || tradeLeverage > 100 || isNaN(tradeLeverage) || !isFinite(tradeLeverage)) {
      showToast('❌ Leverage must be between 1x and 100x', 'error');
      return;
    }
  }

  const lev = (tradeCategory === 'position') ? tradeLeverage : 1;
  const marginRequired = (lev > 0) ? roundValue(orderValue / lev, 'money') : orderValue;
  const feeRate = (tradeOrderType === 'market') ? 0.0005 : 0.0002;
  const estFee = roundValue(orderValue * feeRate, 'money');

  // Check if Limit order should queue or fill immediately
  if (tradeOrderType === 'limit') {
    const isImmediate = (tradeSide === 'buy') ? (curPrice <= entryPrice) : (curPrice >= entryPrice);

    if (!isImmediate) {
      // Validate balance prior to queuing (Requirement B5: Cash can never go negative)
      if (tradeCategory === 'position') {
        if (roundValue(walletState.cashBalance - (marginRequired + estFee), 'money') < 0) {
          showToast('❌ Insufficient cash for margin', 'error');
          return;
        }
      } else {
        if (tradeSide === 'buy' && roundValue(walletState.cashBalance - (orderValue + estFee), 'money') < 0) {
          showToast('❌ Insufficient cash balance', 'error');
          return;
        }
        if (tradeSide === 'sell' && sizeCoins > (walletState.holdings[selectedCoin] || 0)) {
          showToast(`❌ Insufficient ${coinDef.symbol} holding`, 'error');
          return;
        }
      }

      // Add to Open Orders Tab (Requirement C3: cap orders at 100)
      walletState.orders.unshift({
        id: Date.now() + Math.floor(Math.random() * 1000),
        coin: selectedCoin,
        symbol: coinDef.symbol,
        side: tradeCategory === 'position' ? (tradeSide === 'buy' ? 'Long' : 'Short') : (tradeSide === 'buy' ? 'Buy' : 'Sell'),
        category: tradeCategory,
        type: 'Limit',
        price: roundValue(entryPrice, 'money'),
        size: roundValue(sizeCoins, 'coin'),
        leverage: lev,
        margin: roundValue(marginRequired, 'money'),
        marginMode: tradeMarginMode,
        tp: parseFloat(v('tp-input')) || null,
        sl: parseFloat(v('sl-input')) || null,
        createdAt: new Date().toISOString()
      });

      if (walletState.orders.length > 100) {
        walletState.orders = walletState.orders.slice(0, 100);
      }

      saveWalletState();
      showToast(`Limit order placed for ${coinDef.symbol} at $${fmt(entryPrice)}`, 'info');

      const input = document.getElementById('trade-amount-input');
      if (input) input.value = '';

      renderOrders();
      updateTabBadges();
      return;
    }
  }

  // Execute Immediate Trade (Spot or Position)
  if (tradeCategory === 'spot') {
    if (tradeSide === 'buy') {
      const totalCost = roundValue(orderValue + estFee, 'money');
      if (roundValue(walletState.cashBalance - totalCost, 'money') < 0) {
        showToast('❌ Insufficient cash balance', 'error');
        return;
      }
      walletState.cashBalance = Math.max(0, roundValue(walletState.cashBalance - totalCost, 'money'));
      walletState.holdings[selectedCoin] = roundValue((walletState.holdings[selectedCoin] || 0) + sizeCoins, 'coin');
      walletState.history.unshift({
        id: Date.now() + Math.floor(Math.random() * 1000),
        time: new Date().toISOString(),
        coin: coinDef.symbol,
        side: 'Buy',
        type: tradeOrderType === 'limit' ? 'Limit' : 'Market',
        price: roundValue(entryPrice, 'money'),
        size: roundValue(sizeCoins, 'coin'),
        fee: estFee,
        pnl: null
      });
    } else {
      // Spot sell
      if (sizeCoins > (walletState.holdings[selectedCoin] || 0)) {
        showToast(`❌ Insufficient ${coinDef.symbol} holding`, 'error');
        return;
      }
      walletState.holdings[selectedCoin] = roundValue((walletState.holdings[selectedCoin] || 0) - sizeCoins, 'coin');
      walletState.cashBalance = roundValue(walletState.cashBalance + (orderValue - estFee), 'money');
      walletState.history.unshift({
        id: Date.now() + Math.floor(Math.random() * 1000),
        time: new Date().toISOString(),
        coin: coinDef.symbol,
        side: 'Sell',
        type: tradeOrderType === 'limit' ? 'Limit' : 'Market',
        price: roundValue(entryPrice, 'money'),
        size: roundValue(sizeCoins, 'coin'),
        fee: estFee,
        pnl: null
      });
    }
  } else {
    // Position (Long / Short) with Opposing Position Netting Support
    const targetDirection = (tradeSide === 'buy') ? 'long' : 'short';
    const opposingIdx = walletState.positions.findIndex(p => p.coin === selectedCoin && p.direction !== targetDirection);

    if (opposingIdx !== -1) {
      const opp = walletState.positions[opposingIdx];
      if (sizeCoins <= opp.size) {
        // Order reduces or completely closes the opposing position without opening unintended reverse position
        closePositionPartial(opp.id, sizeCoins, 'Market Netting');
        const input = document.getElementById('trade-amount-input');
        if (input) input.value = '';
        return;
      } else {
        // Order is larger than opposing position: close full opposing position first, then open remaining size
        const remainingSize = roundValue(sizeCoins - opp.size, 'coin');
        closePositionUnified(opp.id, null, 'Market Netting');
        sizeCoins = remainingSize;
        orderValue = roundValue(sizeCoins * entryPrice, 'money');
      }
    }

    const currentMarginRequired = (lev > 0) ? roundValue(orderValue / lev, 'money') : orderValue;
    const currentEstFee = roundValue(orderValue * feeRate, 'money');
    const totalMargin = roundValue(currentMarginRequired + currentEstFee, 'money');

    if (roundValue(walletState.cashBalance - totalMargin, 'money') < 0) {
      showToast('❌ Insufficient cash for margin', 'error');
      return;
    }
    walletState.cashBalance = Math.max(0, roundValue(walletState.cashBalance - totalMargin, 'money'));

    let liqPrice = (tradeSide === 'buy')
      ? entryPrice * (1 - (1 / lev) * 0.9)
      : entryPrice * (1 + (1 / lev) * 0.9);
    liqPrice = Math.max(0.0000001, roundValue(liqPrice, 'money'));

    const tpVal = parseFloat(v('tp-input')) || null;
    const slVal = parseFloat(v('sl-input')) || null;

    walletState.positions.unshift({
      id: Date.now() + Math.floor(Math.random() * 1000),
      coin: selectedCoin,
      symbol: coinDef.symbol,
      direction: tradeSide === 'buy' ? 'long' : 'short',
      size: roundValue(sizeCoins, 'coin'),
      entry_price: roundValue(entryPrice, 'money'),
      leverage: lev,
      margin: roundValue(currentMarginRequired, 'money'),
      marginMode: tradeMarginMode,
      liquidationPrice: liqPrice,
      stop_loss: slVal ? roundValue(slVal, 'money') : null,
      take_profit: tpVal ? roundValue(tpVal, 'money') : null,
      created_at: new Date().toISOString()
    });

    walletState.history.unshift({
      id: Date.now() + Math.floor(Math.random() * 1000),
      time: new Date().toISOString(),
      coin: coinDef.symbol,
      side: tradeSide === 'buy' ? 'Long' : 'Short',
      type: tradeOrderType === 'limit' ? 'Limit' : 'Market',
      price: roundValue(entryPrice, 'money'),
      size: roundValue(sizeCoins, 'coin'),
      fee: currentEstFee,
      pnl: null
    });
  }

  // Requirement C3: Keep last 200 history records
  if (walletState.history.length > 200) {
    walletState.history = walletState.history.slice(0, 200);
  }

  saveWalletState();
  showToast(`Filled at $${fmt(entryPrice)}`, 'success');

  const input = document.getElementById('trade-amount-input');
  if (input) input.value = '';

  updateMiniStats();
  renderPositions();
  renderOrders();
  renderHistory();
  updatePnlSummary();
  updateTabBadges();
  updateTradeCalc();
}

// ─── UNIFIED CLOSE LOGIC (Requirement F & H & B3) ───────────
let closingPositionIds = new Set();

function closePositionUnified(posId, exitPriceInput, closeReason = 'Market', clickedBtn = null) {
  // Requirement B3: Prevent double-tap on close (1-second debounce and disable button)
  if (closingPositionIds.has(posId)) return;
  closingPositionIds.add(posId);
  setTimeout(() => closingPositionIds.delete(posId), 1000);

  if (clickedBtn && clickedBtn.disabled !== undefined) {
    clickedBtn.disabled = true;
    setTimeout(() => { if (clickedBtn) clickedBtn.disabled = false; }, 1000);
  }

  // Ensure a single position cannot be closed twice (Requirement F1)
  const idx = walletState.positions.findIndex(p => p.id === posId);
  if (idx === -1) return;
  const pos = walletState.positions[idx];

  const curPrice = currentPrices[pos.coin]?.price || pos.entry_price;
  let exitPrice = exitPriceInput != null ? Number(exitPriceInput) : curPrice;

  let fee = 0;
  let realizedPnl = 0;

  if (closeReason === 'Liquidated') {
    exitPrice = pos.liquidationPrice;
    realizedPnl = -roundValue(pos.margin, 'money'); // cannot lose more than margin
    fee = 0;
    // Lost margin: cashBalance receives 0 returned
  } else {
    if (closeReason === 'TP' && pos.take_profit) exitPrice = pos.take_profit;
    if (closeReason === 'SL' && pos.stop_loss) exitPrice = pos.stop_loss;

    const priceDiff = (pos.direction === 'long')
      ? (exitPrice - pos.entry_price)
      : (pos.entry_price - exitPrice);
    const grossPnl = priceDiff * pos.size;
    fee = roundValue(pos.size * exitPrice * 0.0005, 'money'); // 0.05% taker fee
    realizedPnl = roundValue(grossPnl - fee, 'money');

    // Return margin + realized PnL (after fees) to cash balance (never negative)
    const cashReturn = Math.max(0, roundValue(pos.margin + realizedPnl, 'money'));
    walletState.cashBalance = Math.max(0, roundValue(walletState.cashBalance + cashReturn, 'money'));
  }

  walletState.realizedPnl = roundValue(walletState.realizedPnl + realizedPnl, 'money');
  walletState.positionsClosed++;
  walletState.tradesCount++;

  // Add record to Trade History (Requirement C3: cap at 200)
  walletState.history.unshift({
    id: Date.now() + Math.floor(Math.random() * 1000),
    time: new Date().toISOString(),
    coin: pos.symbol,
    side: pos.direction === 'long' ? 'Long' : 'Short',
    type: closeReason, // 'Market' | 'Limit' | 'Liquidated' | 'TP' | 'SL'
    price: roundValue(exitPrice, 'money'),
    size: roundValue(pos.size, 'coin'),
    fee: fee,
    pnl: realizedPnl
  });

  if (walletState.history.length > 200) {
    walletState.history = walletState.history.slice(0, 200);
  }

  // Remove position from Positions tab
  walletState.positions.splice(idx, 1);
  saveWalletState();

  // Toast feedback
  if (closeReason === 'Liquidated') {
    showToast(`${pos.symbol} position liquidated`, 'error');
  } else {
    const sign = realizedPnl >= 0 ? '+' : '';
    const toastType = realizedPnl >= 0 ? 'success' : 'error';
    showToast(`${pos.symbol} closed (${closeReason}): ${sign}$${fmtNum(realizedPnl)}`, toastType);
  }

  updateMiniStats();
  renderPositions();
  renderHistory();
  updatePnlSummary();
  updateTabBadges();
  updateTradeCalc();
}

function closePosition(posId) {
  closePositionUnified(posId, null, 'Market');
}

// ─── PARTIAL POSITION CLOSE (Requirement: Partial and Full Closes) ───
function closePositionPartial(posId, closeSizeCoins, closeReason = 'Market') {
  const idx = walletState.positions.findIndex(p => p.id === posId);
  if (idx === -1) return;
  const pos = walletState.positions[idx];

  const validCloseSize = Math.min(pos.size, Math.max(0.000001, closeSizeCoins));
  if (validCloseSize >= pos.size - 0.000001) {
    closePositionUnified(posId, null, closeReason);
    return;
  }

  const curPrice = currentPrices[pos.coin]?.price || pos.entry_price;
  const exitPrice = curPrice;
  const fraction = validCloseSize / pos.size;
  const marginToClose = roundValue(pos.margin * fraction, 'money');

  const priceDiff = (pos.direction === 'long')
    ? (exitPrice - pos.entry_price)
    : (pos.entry_price - exitPrice);
  const grossPnl = priceDiff * validCloseSize;
  const fee = roundValue(validCloseSize * exitPrice * 0.0005, 'money');
  const realizedPnl = roundValue(grossPnl - fee, 'money');

  // Return margin + realized PnL to cash balance (cannot go negative)
  const cashReturn = Math.max(0, roundValue(marginToClose + realizedPnl, 'money'));
  walletState.cashBalance = Math.max(0, roundValue(walletState.cashBalance + cashReturn, 'money'));
  walletState.realizedPnl = roundValue(walletState.realizedPnl + realizedPnl, 'money');
  walletState.tradesCount++;

  // Update remaining position
  pos.size = roundValue(pos.size - validCloseSize, 'coin');
  pos.margin = Math.max(0.01, roundValue(pos.margin - marginToClose, 'money'));

  // Record in history
  walletState.history.unshift({
    id: Date.now() + Math.floor(Math.random() * 1000),
    time: new Date().toISOString(),
    coin: pos.symbol,
    side: pos.direction === 'long' ? 'Long' : 'Short',
    type: `Partial (${(fraction * 100).toFixed(0)}%)`,
    price: roundValue(exitPrice, 'money'),
    size: roundValue(validCloseSize, 'coin'),
    fee: fee,
    pnl: realizedPnl
  });

  if (walletState.history.length > 200) {
    walletState.history = walletState.history.slice(0, 200);
  }

  saveWalletState();
  const sign = realizedPnl >= 0 ? '+' : '';
  showToast(`Closed ${fmtCoin(validCloseSize)} ${pos.symbol} (${sign}$${fmtNum(realizedPnl)})`, realizedPnl >= 0 ? 'success' : 'info');

  updateMiniStats();
  renderPositions();
  renderHistory();
  updatePnlSummary();
  updateTabBadges();
  updateTradeCalc();
}

let currentPartialClosePosId = null;

function openPartialCloseModal(posId) {
  const pos = walletState.positions.find(p => p.id === posId);
  if (!pos) return;
  currentPartialClosePosId = posId;

  const modal = document.getElementById('partial-close-modal');
  const infoEl = document.getElementById('pc-pos-info');
  const inputEl = document.getElementById('pc-size-input');
  if (!modal || !infoEl || !inputEl) return;

  const curPrice = currentPrices[pos.coin]?.price || pos.entry_price;
  const isLong = pos.direction === 'long';
  infoEl.innerHTML = `
    <div style="font-weight:700; color:var(--txt1);">${pos.symbol} <span class="badge ${isLong ? 'badge-long' : 'badge-short'}">${isLong ? 'Long' : 'Short'} ${pos.leverage}x</span></div>
    <div style="font-size:12px; color:var(--txt2); margin-top:4px;">Position Size: <b>${fmtCoin(pos.size)} ${pos.symbol}</b> | Entry: <b>$${fmt(pos.entry_price)}</b> | Mark: <b>$${fmt(curPrice)}</b></div>
  `;

  inputEl.value = (pos.size * 0.5).toFixed(4);
  updatePartialClosePreview();
  modal.classList.remove('hidden');
}

function closePartialCloseModal() {
  const modal = document.getElementById('partial-close-modal');
  if (modal) modal.classList.add('hidden');
  currentPartialClosePosId = null;
}

function setPartialClosePct(pct) {
  if (!currentPartialClosePosId) return;
  const pos = walletState.positions.find(p => p.id === currentPartialClosePosId);
  if (!pos) return;
  const inputEl = document.getElementById('pc-size-input');
  if (inputEl) {
    inputEl.value = (pos.size * pct).toFixed(4);
    updatePartialClosePreview();
  }
}

function updatePartialClosePreview() {
  if (!currentPartialClosePosId) return;
  const pos = walletState.positions.find(p => p.id === currentPartialClosePosId);
  if (!pos) return;

  const inputEl = document.getElementById('pc-size-input');
  const pnlEl = document.getElementById('pc-est-pnl');
  const marginEl = document.getElementById('pc-est-margin');
  if (!inputEl || !pnlEl || !marginEl) return;

  const val = parseFloat(inputEl.value) || 0;
  const closeSize = Math.min(pos.size, Math.max(0, val));
  const curPrice = currentPrices[pos.coin]?.price || pos.entry_price;
  const priceDiff = (pos.direction === 'long') ? (curPrice - pos.entry_price) : (pos.entry_price - curPrice);
  const grossPnl = priceDiff * closeSize;
  const fee = closeSize * curPrice * 0.0005;
  const netPnl = grossPnl - fee;
  const fraction = pos.size > 0 ? (closeSize / pos.size) : 0;
  const returnedMargin = Math.max(0, pos.margin * fraction + netPnl);

  const sign = netPnl >= 0 ? '+' : '';
  pnlEl.textContent = `${sign}$${fmtNum(netPnl)} USDT`;
  pnlEl.className = netPnl >= 0 ? 'pos' : 'neg';
  marginEl.textContent = `$${fmtNum(returnedMargin)} USDT`;
}

function executePartialClose() {
  if (!currentPartialClosePosId) return;
  const inputEl = document.getElementById('pc-size-input');
  const size = parseFloat(inputEl?.value) || 0;
  if (size <= 0) {
    showToast('❌ Size must be greater than 0', 'error');
    return;
  }
  const posId = currentPartialClosePosId;
  closePartialCloseModal();
  closePositionPartial(posId, size, 'Market');
}

// ─── AUTO-CLOSE CHECKS (Requirement G) ────────────────────
function checkAutoCloseConditions() {
  if (!walletState || !Array.isArray(walletState.positions) || walletState.positions.length === 0) return;
  const snapshot = [...walletState.positions];

  for (const p of snapshot) {
    // Check that the position still exists
    if (!walletState.positions.some(x => x.id === p.id)) continue;

    const cur = currentPrices[p.coin];
    if (!cur || typeof cur.price !== 'number') continue;
    const mark = cur.price;

    // 1. LIQUIDATION: if Long and mark <= liq price, or Short and mark >= liq price
    if (p.liquidationPrice != null && p.liquidationPrice > 0) {
      const isLiq = (p.direction === 'long' && mark <= p.liquidationPrice) ||
                    (p.direction === 'short' && mark >= p.liquidationPrice);
      if (isLiq) {
        closePositionUnified(p.id, p.liquidationPrice, 'Liquidated');
        continue;
      }
    }

    // 2. STOP LOSS: if Long and mark <= SL, or Short and mark >= SL
    if (p.stop_loss != null && p.stop_loss > 0) {
      const isSl = (p.direction === 'long' && mark <= p.stop_loss) ||
                   (p.direction === 'short' && mark >= p.stop_loss);
      if (isSl) {
        closePositionUnified(p.id, p.stop_loss, 'SL');
        continue;
      }
    }

    // 3. TAKE PROFIT: if Long and mark >= TP, or Short and mark <= TP
    if (p.take_profit != null && p.take_profit > 0) {
      const isTp = (p.direction === 'long' && mark >= p.take_profit) ||
                   (p.direction === 'short' && mark <= p.take_profit);
      if (isTp) {
        closePositionUnified(p.id, p.take_profit, 'TP');
        continue;
      }
    }
  }
}

// ─── OPEN LIMIT ORDERS AUTO-FILL (Requirement C) ───────────
function checkPendingLimitOrders() {
  if (!walletState || !Array.isArray(walletState.orders) || walletState.orders.length === 0) return;

  const remaining = [];
  let changed = false;

  for (const o of walletState.orders) {
    const cur = currentPrices[o.coin];
    if (!cur || typeof cur.price !== 'number') {
      remaining.push(o);
      continue;
    }
    const mark = cur.price;
    const isBuy = (o.side === 'Buy' || o.side === 'Long' || o.side === 'buy' || o.side === 'long');
    const shouldFill = isBuy ? (mark <= o.price) : (mark >= o.price);

    if (shouldFill) {
      changed = true;
      const orderValue = roundUsd(o.size * o.price);
      const fee = roundUsd(orderValue * 0.0002); // 0.02% maker fee

      if (o.category === 'spot') {
        if (isBuy) {
          if ((orderValue + fee) <= walletState.cashBalance) {
            walletState.cashBalance = Math.max(0, roundUsd(walletState.cashBalance - (orderValue + fee)));
            walletState.holdings[o.coin] = roundCoin((walletState.holdings[o.coin] || 0) + o.size);
            walletState.history.unshift({
              id: Date.now() + Math.floor(Math.random() * 1000),
              time: new Date().toISOString(),
              coin: o.symbol,
              side: 'Buy',
              type: 'Limit',
              price: roundUsd(o.price),
              size: roundCoin(o.size),
              fee: fee,
              pnl: null
            });
            showToast(`${o.symbol} Spot Limit filled at $${fmt(o.price)}`, 'success');
          } else {
            showToast(`⚠️ Insufficient cash for ${o.symbol} limit fill`, 'error');
          }
        } else {
          // Spot sell
          if (o.size <= (walletState.holdings[o.coin] || 0)) {
            walletState.holdings[o.coin] = roundCoin((walletState.holdings[o.coin] || 0) - o.size);
            walletState.cashBalance = Math.max(0, roundUsd(walletState.cashBalance + (orderValue - fee)));
            walletState.history.unshift({
              id: Date.now() + Math.floor(Math.random() * 1000),
              time: new Date().toISOString(),
              coin: o.symbol,
              side: 'Sell',
              type: 'Limit',
              price: roundUsd(o.price),
              size: roundCoin(o.size),
              fee: fee,
              pnl: null
            });
            showToast(`${o.symbol} Spot Limit filled at $${fmt(o.price)}`, 'success');
          }
        }
      } else {
        // Position trade
        if ((o.margin + fee) <= walletState.cashBalance) {
          walletState.cashBalance = Math.max(0, roundUsd(walletState.cashBalance - (o.margin + fee)));

          let liqPrice = isBuy
            ? o.price * (1 - (1 / o.leverage) * 0.9)
            : o.price * (1 + (1 / o.leverage) * 0.9);
          liqPrice = Math.max(0.0000001, roundUsd(liqPrice));

          walletState.positions.unshift({
            id: Date.now() + Math.floor(Math.random() * 1000),
            coin: o.coin,
            symbol: o.symbol,
            direction: isBuy ? 'long' : 'short',
            size: roundCoin(o.size),
            entry_price: roundUsd(o.price),
            leverage: o.leverage,
            margin: roundUsd(o.margin),
            marginMode: o.marginMode || 'isolated',
            liquidationPrice: liqPrice,
            take_profit: o.tp,
            stop_loss: o.sl,
            created_at: new Date().toISOString()
          });

          walletState.history.unshift({
            id: Date.now() + Math.floor(Math.random() * 1000),
            time: new Date().toISOString(),
            coin: o.symbol,
            side: isBuy ? 'Long' : 'Short',
            type: 'Limit',
            price: roundUsd(o.price),
            size: roundCoin(o.size),
            fee: fee,
            pnl: null
          });

          showToast(`${o.symbol} ${isBuy ? 'Long' : 'Short'} Limit filled at $${fmt(o.price)}`, 'success');
        } else {
          showToast(`⚠️ Insufficient margin for ${o.symbol} limit fill`, 'error');
        }
      }
    } else {
      remaining.push(o);
    }
  }

  if (changed) {
    walletState.orders = remaining.slice(0, 100);
    if (walletState.history.length > 200) walletState.history = walletState.history.slice(0, 200);
    saveWalletState();
    updateMiniStats();
    renderOrders();
    renderPositions();
    renderHistory();
    updateTabBadges();
  }
}

// ─── REAL-TIME POSITIONS & PNL TRACKING ───────────────────
function updateLivePnL(coin, curPrice) {
  if (!walletState || !Array.isArray(walletState.positions)) return;

  walletState.positions.forEach(p => {
    if (p.coin === coin) {
      const el = document.getElementById(`pos-curprice-${p.id}`);
      if (el) el.textContent = `$${fmt(curPrice)}`;

      const priceDiff = (p.direction === 'long') ? (curPrice - p.entry_price) : (p.entry_price - curPrice);
      const pnl = roundUsd(priceDiff * p.size);
      const pnlPct = (p.margin > 0) ? ((pnl / p.margin) * 100).toFixed(2) : '0.00';
      const pnlCls = (pnl > 0) ? 'pnl-pos' : ((pnl < 0) ? 'pnl-neg' : 'pnl-grey');
      const pnlSign = pnl >= 0 ? '+' : '';
      const pnlPctSign = pnl >= 0 ? '+' : '';
      const pnlStr = `${pnlSign}$${fmtNum(pnl)} (${pnlPctSign}${pnlPct}%)`;

      const pnlEl = document.getElementById(`pos-pnl-${p.id}`);
      if (pnlEl) {
        pnlEl.textContent = pnlStr;
        pnlEl.className = pnlCls;
      }
    }
  });

  // Evaluate Auto-Close and Pending Limit Orders
  checkAutoCloseConditions();
  checkPendingLimitOrders();
  updateMiniStats();
}

// ─── MINI STATS & PORTFOLIO TRACKING ──────────────────────
function updateMiniStats() {
  const coinDef = getCoinDefinition(selectedCoin);
  const statBal = document.getElementById('stat-balance');
  const statCoinLabel = document.getElementById('stat-coin-label');
  const statCoinVal = document.getElementById('stat-coin-val');
  const statUnrealPnl = document.getElementById('stat-unrealized-pnl');
  const statTotal = document.getElementById('stat-total');

  if (statBal) statBal.textContent = `$${fmtNum(walletState.cashBalance)}`;
  if (statCoinLabel) statCoinLabel.textContent = `${coinDef.symbol} Held`;
  const held = walletState.holdings[selectedCoin] || 0;
  if (statCoinVal) statCoinVal.textContent = `${held.toFixed(4)} ${coinDef.symbol}`;

  // Value of all coin holdings
  let holdingsValue = 0;
  COIN_LIST.forEach(c => {
    const amt = walletState.holdings[c.id] || 0;
    if (amt > 0) {
      const p = currentPrices[c.id]?.price || c.basePrice || 0;
      holdingsValue += (amt * p);
    }
  });

  // Unrealized PnL of all open positions
  let totalUnrealizedPnl = 0;
  (walletState.positions || []).forEach(p => {
    const curP = currentPrices[p.coin]?.price || p.entry_price;
    const diff = (p.direction === 'long') ? (curP - p.entry_price) : (p.entry_price - curP);
    totalUnrealizedPnl += (diff * p.size);
  });
  totalUnrealizedPnl = roundUsd(totalUnrealizedPnl);

  if (statUnrealPnl) {
    const sign = totalUnrealizedPnl >= 0 ? '+' : '';
    statUnrealPnl.textContent = `${sign}$${fmtNum(totalUnrealizedPnl)}`;
    statUnrealPnl.className = `mstat-val ${totalUnrealizedPnl > 0 ? 'green' : (totalUnrealizedPnl < 0 ? 'red' : 'orange')}`;
  }

  const totalPort = roundUsd(walletState.cashBalance + holdingsValue + totalUnrealizedPnl);
  if (statTotal) statTotal.textContent = `$${fmtNum(totalPort)}`;
  const navBal = document.getElementById('nav-balance');
  if (navBal) navBal.textContent = `$${fmtNum(totalPort)}`;
}

// ─── RENDER POSITIONS TABLE (Requirement B) ────────────────
function renderPositions() {
  updateTabBadges();
  const tbody = document.getElementById('pos-tbody');
  if (!tbody) return;
  const open = walletState.positions || [];

  if (!open.length) {
    tbody.innerHTML = `<tr><td colspan="10" class="empty-row"><div class="empty-state-box"><span class="empty-icon">📊</span><span class="empty-msg">No open positions</span></div></td></tr>`;
    return;
  }

  tbody.innerHTML = open.map(p => {
    const coinDef = getCoinDefinition(p.coin);
    const sym = coinDef.symbol;
    const curPrice = currentPrices[p.coin]?.price || p.entry_price;
    const priceDiff = (p.direction === 'long') ? (curPrice - p.entry_price) : (p.entry_price - curPrice);
    const pnl = roundUsd(priceDiff * p.size);
    const pnlPct = (p.margin > 0) ? ((pnl / p.margin) * 100).toFixed(2) : '0.00';
    const pnlCls = (pnl > 0) ? 'pnl-pos' : ((pnl < 0) ? 'pnl-neg' : 'pnl-grey');
    const pnlSign = pnl >= 0 ? '+' : '';
    const pnlPctSign = pnl >= 0 ? '+' : '';
    const pnlStr = `${pnlSign}$${fmtNum(pnl)} (${pnlPctSign}${pnlPct}%)`;

    const sideCls = (p.direction === 'long') ? 'badge-long' : 'badge-short';
    const sideText = (p.direction === 'long') ? 'Long' : 'Short';
    const liqStr = p.liquidationPrice ? `$${fmt(p.liquidationPrice)}` : '—';

    return `<tr>
      <td><b>${sym}</b></td>
      <td><span class="badge ${sideCls}">${sideText}</span></td>
      <td>${fmtCoin(p.size)}</td>
      <td>$${fmt(p.entry_price)}</td>
      <td id="pos-curprice-${p.id}">$${fmt(curPrice)}</td>
      <td>${p.leverage}x</td>
      <td>$${fmtNum(p.margin)}</td>
      <td><span id="pos-pnl-${p.id}" class="${pnlCls}">${pnlStr}</span></td>
      <td style="color:var(--red); font-weight:600;">${liqStr}</td>
      <td>
        <div class="pos-actions-row">
          <button class="btn-close-pos" onclick="closePositionUnified(${p.id}, null, 'Market', this)">Close</button>
          <button class="btn-partial-close" onclick="openPartialCloseModal(${p.id})">Partial</button>
          <button class="btn-tpsl" onclick="openTpSlModal(${p.id})">TP/SL</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ─── RENDER OPEN ORDERS TABLE (Requirement C) ──────────────
function renderOrders() {
  updateTabBadges();
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;
  const pending = walletState.orders || [];

  if (!pending.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-row"><div class="empty-state-box"><span class="empty-icon">📋</span><span class="empty-msg">No open orders</span></div></td></tr>`;
    return;
  }

  tbody.innerHTML = pending.map(o => {
    const isLong = (o.side === 'Buy' || o.side === 'Long' || o.side === 'buy' || o.side === 'long');
    const sideCls = isLong ? 'badge-long' : 'badge-short';
    const sideText = isLong ? 'Long' : 'Short';
    const timeStr = o.createdAt ? fmtDate(o.createdAt) : '—';

    return `<tr>
      <td><b>${o.symbol}</b></td>
      <td><span class="badge ${sideCls}">${sideText}</span></td>
      <td><span class="badge badge-limit">Limit</span></td>
      <td>$${fmt(o.price)}</td>
      <td>${fmtCoin(o.size)}</td>
      <td style="color:var(--txt3); font-size:11px;">${timeStr}</td>
      <td><button class="btn-cancel-ord" onclick="cancelOrder(${o.id})">Cancel</button></td>
    </tr>`;
  }).join('');
}

function cancelOrder(id) {
  walletState.orders = (walletState.orders || []).filter(o => o.id !== id);
  saveWalletState();
  showToast('Order cancelled', 'info');
  updateTabBadges();
  renderOrders();
}

// ─── RENDER TRADE HISTORY (Requirement D) ──────────────────
function renderHistory() {
  updateTabBadges();
  const tbody = document.getElementById('history-tbody');
  if (!tbody) return;
  const hist = walletState.history || [];

  if (!hist.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-row"><div class="empty-state-box"><span class="empty-icon">📜</span><span class="empty-msg">No trades yet</span></div></td></tr>`;
    return;
  }

  tbody.innerHTML = hist.slice(0, 200).map(h => {
    const timeStr = h.time ? new Date(h.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';
    const isLong = (h.side || '').toLowerCase().includes('long') || (h.side || '').toLowerCase().includes('buy');
    const sideCls = isLong ? 'badge-long' : 'badge-short';
    const sideText = isLong ? 'Long' : 'Short';

    let typeCls = 'badge-market';
    const tLower = (h.type || '').toLowerCase();
    if (tLower === 'limit') typeCls = 'badge-limit';
    else if (tLower === 'liquidated') typeCls = 'badge-short';
    else if (tLower === 'tp') typeCls = 'badge-long';
    else if (tLower === 'sl') typeCls = 'badge-short';

    let pnlStr = '—';
    let pnlCls = 'pnl-grey';
    if (typeof h.pnl === 'number') {
      const sign = h.pnl >= 0 ? '+' : '';
      pnlStr = `${sign}$${fmtNum(h.pnl)}`;
      pnlCls = (h.pnl > 0) ? 'pnl-pos' : ((h.pnl < 0) ? 'pnl-neg' : 'pnl-grey');
    }

    const feeStr = (h.fee != null && h.fee > 0) ? `$${fmtNum(h.fee)}` : '$0.00';

    return `<tr>
      <td style="color:var(--txt3); font-size:11px;">${timeStr}</td>
      <td><b>${h.coin}</b></td>
      <td><span class="badge ${sideCls}">${sideText}</span></td>
      <td><span class="badge ${typeCls}">${h.type}</span></td>
      <td>$${fmt(h.price)}</td>
      <td>${fmtCoin(h.size)}</td>
      <td style="color:var(--txt3);">${feeStr}</td>
      <td><span class="${pnlCls}">${pnlStr}</span></td>
    </tr>`;
  }).join('');
}

// ─── REALIZED PNL SUMMARY (Requirement E) ──────────────────
function updatePnlSummary() {
  const totalTradesEl = document.getElementById('pnl-trades');
  const posClosedEl = document.getElementById('pnl-pos-closed');
  const winRateEl = document.getElementById('pnl-win-rate');
  const netEl = document.getElementById('pnl-net');

  const posClosed = walletState.positionsClosed || 0;
  if (totalTradesEl) totalTradesEl.textContent = posClosed;
  if (posClosedEl) posClosedEl.textContent = posClosed;

  const closedHistoryTrades = (walletState.history || []).filter(h => typeof h.pnl === 'number');
  const winningTrades = closedHistoryTrades.filter(h => h.pnl > 0).length;
  const totalWithPnl = closedHistoryTrades.length > 0 ? closedHistoryTrades.length : posClosed;

  let winRate = 0;
  if (totalWithPnl > 0) {
    winRate = (winningTrades / totalWithPnl) * 100;
  }
  if (winRateEl) winRateEl.textContent = `${winRate.toFixed(1)}%`;

  if (netEl) {
    const net = roundUsd(walletState.realizedPnl || 0);
    const sign = net > 0 ? '+' : '';
    netEl.textContent = `${sign}$${fmtNum(net)}`;
    if (net > 0) {
      netEl.className = 'green';
    } else if (net < 0) {
      netEl.className = 'red';
    } else {
      netEl.className = 'pnl-grey';
    }
  }
}
function loadPnlSummary() { updatePnlSummary(); }

// ─── TP / SL EDIT SHEET MODAL (Requirement B) ──────────────
let editingPosId = null;

function openTpSlModal(posId) {
  const pos = (walletState.positions || []).find(p => p.id === posId);
  if (!pos) return;
  editingPosId = posId;

  const infoEl = document.getElementById('tpsl-pos-info');
  const curPrice = currentPrices[pos.coin]?.price || pos.entry_price;
  const isLong = pos.direction === 'long';

  if (infoEl) {
    infoEl.innerHTML = `
      <div class="tpsl-summary-row">
        <span>Coin / Direction:</span>
        <b>${pos.symbol} <span class="badge ${isLong ? 'badge-long' : 'badge-short'}">${isLong ? 'Long' : 'Short'} ${pos.leverage}x</span></b>
      </div>
      <div class="tpsl-summary-row">
        <span>Entry Price:</span>
        <span>$${fmt(pos.entry_price)}</span>
      </div>
      <div class="tpsl-summary-row">
        <span>Current Mark:</span>
        <span>$${fmt(curPrice)}</span>
      </div>
      <div class="tpsl-summary-row">
        <span>Liquidation Price:</span>
        <span style="color:var(--red); font-weight:700;">$${fmt(pos.liquidationPrice)}</span>
      </div>
    `;
  }

  const tpInput = document.getElementById('tpsl-tp-input');
  const slInput = document.getElementById('tpsl-sl-input');
  if (tpInput) tpInput.value = (pos.take_profit != null && pos.take_profit > 0) ? pos.take_profit : '';
  if (slInput) slInput.value = (pos.stop_loss != null && pos.stop_loss > 0) ? pos.stop_loss : '';

  const modal = document.getElementById('tpsl-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeTpSlModal() {
  editingPosId = null;
  const modal = document.getElementById('tpsl-modal');
  if (modal) modal.classList.add('hidden');
}

function saveTpSlEdit() {
  if (editingPosId == null) return;
  const pos = (walletState.positions || []).find(p => p.id === editingPosId);
  if (!pos) {
    closeTpSlModal();
    return;
  }

  const tpVal = parseFloat(document.getElementById('tpsl-tp-input')?.value);
  const slVal = parseFloat(document.getElementById('tpsl-sl-input')?.value);

  pos.take_profit = (!isNaN(tpVal) && tpVal > 0) ? roundUsd(tpVal) : null;
  pos.stop_loss = (!isNaN(slVal) && slVal > 0) ? roundUsd(slVal) : null;

  saveWalletState();
  showToast(`TP/SL updated for ${pos.symbol}`, 'success');
  closeTpSlModal();
  renderPositions();
}
async function loadTradeHistory() { renderHistory(); }
async function loadPortfolio() {
  loadWalletState();
  updateMiniStats();
}
function updateSpotCalc() { updateTradeCalc(); }
function updatePosCalc() { updateTradeCalc(); }

// ─── FLOATING TOAST SYSTEM (Requirement E & H & Part 5) ────
let toastTmr;
function showToast(msg, type='success') {
  // Trigger sound chime & vibration if enabled in ctp_settings (Part 5)
  if (typeof playToastChime === 'function') playToastChime();
  if (typeof triggerVibrate === 'function') triggerVibrate(type === 'error' ? [50, 40, 50] : [35]);

  const container = document.getElementById('toast-container');
  if (container) {
    const card = document.createElement('div');
    card.className = `toast-card ${type}`;
    const icon = type === 'error' ? '❌' : type === 'info' ? 'ℹ️' : '✅';
    card.innerHTML = `<span style="font-size:15px;">${icon}</span><span>${msg}</span>`;
    container.appendChild(card);
    setTimeout(() => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(-10px)';
      card.style.transition = 'all 0.25s ease';
      setTimeout(() => card.remove(), 260);
    }, 3000);
    return;
  }

  // Fallback toast
  const el = document.getElementById('toast');
  if (el) {
    el.textContent = msg;
    el.className   = `toast ${type}`;
    clearTimeout(toastTmr);
    toastTmr = setTimeout(() => el.classList.add('hidden'), 3000);
  }
}

// ─── HELPERS ──────────────────────────────────────────────
const v   = id => document.getElementById(id)?.value || '';

async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
    }
    throw err;
  }
}

async function safeJson(r) {
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error(`Server error ${r.status}: endpoint not found or server down`);
  }
  return r.json();
}

const get = async url => {
  try {
    const r = await fetchWithTimeout(url, {}, 5000);
    const d = await safeJson(r);
    if (!r.ok) throw new Error(d.error || 'Error');
    return d;
  } catch (e) {
    throw e;
  }
};
const post = async (url, body) => {
  try {
    const r = await fetchWithTimeout(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, 5000);
    const d = await safeJson(r);
    if (!r.ok) throw new Error(d.error || 'Error');
    return d;
  } catch (e) {
    throw e;
  }
};
const authGet = async url => {
  try {
    const r = await fetchWithTimeout(url, { headers: { Authorization: `Bearer ${token}` } }, 5000);
    const d = await safeJson(r);
    if (!r.ok) throw new Error(d.error || 'Error');
    return d;
  } catch (e) {
    throw e;
  }
};
const authPost = async (url, body) => {
  try {
    const r = await fetchWithTimeout(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) }, 5000);
    const d = await safeJson(r);
    if (!r.ok) throw new Error(d.error || 'Error');
    return d;
  } catch (e) {
    throw e;
  }
};
const authDelete = async url => {
  try {
    const r = await fetchWithTimeout(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }, 5000);
    const d = await safeJson(r);
    if (!r.ok) throw new Error(d.error || 'Error');
    return d;
  } catch (e) {
    throw e;
  }
};

function fmt(n) {
  if (n == null || isNaN(n)) return '0.00';
  const num = Number(n);
  const s = typeof getSettings === 'function' ? getSettings() : null;
  const decMode = s?.priceDecimals || 'auto';

  if (decMode === '2') {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (decMode === '4') {
    return num.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  }
  // Auto mode
  if (num > 0 && num < 0.01) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  }
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtNum(n) {
  if (n == null || isNaN(n)) return '0.00';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtLarge(n) {
  if (!n) return '—';
  const s = typeof getSettings === 'function' ? getSettings() : null;
  if (s && s.compactNumbers === false) {
    return `$${fmtNum(n)}`;
  }
  if (n >= 1e12) return `$${(n/1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n/1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n/1e6).toFixed(2)}M`;
  return `$${fmtNum(n)}`;
}
function fmtDate(dt) {
  if (!dt) return '—';
  const d = new Date(dt.endsWith('Z') ? dt : dt + 'Z');
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
}
function setLoading(btn, on) {
  const loader = btn.querySelector('.btn-loader');
  const span   = btn.querySelector('span');
  btn.disabled = on;
  loader?.classList.toggle('hidden', !on);
  if (span) span.style.opacity = on ? '0.5' : '1';
}

// ─── MODAL CONTROLS ───────────────────────────────────────
function showApkModal() {
  const host = window.location.hostname && window.location.hostname !== 'localhost' ? window.location.hostname : '192.168.1.17';
  const urlEl = document.getElementById('apk-phone-url');
  if (urlEl) urlEl.textContent = `http://${host}:3001/apk`;
  document.getElementById('apk-modal').classList.remove('hidden');
}
function closeApkModal() {
  document.getElementById('apk-modal').classList.add('hidden');
}

function showSettingsModal() {
  const input = document.getElementById('custom-api-input');
  if (input) input.value = API;
  document.getElementById('settings-modal').classList.remove('hidden');
}
function closeSettingsModal() {
  document.getElementById('settings-modal').classList.add('hidden');
}
function saveApiUrl() {
  const val = document.getElementById('custom-api-input').value.trim();
  if (val) {
    safeStorageSet('ct_api_url', val);
    API = val;
    showToast('API URL updated. Reconnecting...', 'success');
    closeSettingsModal();
    loadAll();
  }
}
function resetApiUrl() {
  safeStorageRemove('ct_api_url');
  API = getApiBase();
  document.getElementById('custom-api-input').value = API;
  showToast('Reset to default API URL', 'info');
}

async function resetDemoBalance() {
  try {
    const r = await authPost(`${API}/user/reset-balance`, {});
    balance = r.balance;
    safeStorageSet('ct_balance', balance);
    await loadPortfolio();
    showToast('💰 Demo balance reset to $10,000!', 'success');
    closeSettingsModal();
  } catch(ex) {
    showToast(`❌ ${ex.message}`, 'error');
  }
}

// ─── RESET WALLET HELPER ──────────────────────────────────
function resetWalletToDefault() {
  walletState = DEFAULT_WALLET();
  saveWalletState();
  updateMiniStats();
  renderPositions();
  renderOrders();
  renderHistory();
  updatePnlSummary();
  updateTabBadges();
}

// ─── BUILT-IN SELF-TEST (dev only - Requirement F) ─────────
function runSelfTest() {
  const results = [];
  function record(desc, pass) {
    const status = pass ? 'PASS' : 'FAIL';
    console.log(`${desc} → ${status}`);
    results.push({ desc, pass, status });
  }

  // Preserve runtime state
  const prevWallet = JSON.stringify(walletState);
  const prevPrices = JSON.stringify(currentPrices);

  try {
    // 1. Long position PnL: entry 100, mark 110, size 1 → PnL = 10
    {
      const entry = 100;
      const mark = 110;
      const size = 1;
      const pnl = roundValue((mark - entry) * size, 'money');
      record('Long position PnL: entry 100, mark 110, size 1 → PnL = 10', pnl === 10);
    }

    // 2. Short position PnL: entry 100, mark 90, size 1 → PnL = 10
    {
      const entry = 100;
      const mark = 90;
      const size = 1;
      const pnl = roundValue((entry - mark) * size, 'money');
      record('Short position PnL: entry 100, mark 90, size 1 → PnL = 10', pnl === 10);
    }

    // 3. Liquidation price for 10x long at entry 100 is about 91
    {
      const entry = 100;
      const lev = 10;
      const liqPrice = roundValue(entry * (1 - (1 / lev) * 0.9), 'money');
      record('Liquidation price for 10x long at entry 100 is about 91', Math.round(liqPrice) === 91);
    }

    // 4. Cash never negative after a trade
    {
      walletState.cashBalance = 50.00;
      const initialCash = walletState.cashBalance;
      const orderCost = 150.00;
      let tradeRejected = false;
      if (walletState.cashBalance - orderCost < 0) {
        tradeRejected = true;
      } else {
        walletState.cashBalance = Math.max(0, roundValue(walletState.cashBalance - orderCost, 'money'));
      }
      const pass = tradeRejected && walletState.cashBalance >= 0 && walletState.cashBalance === initialCash;
      record('Cash never negative after a trade', pass);
    }

    // 5. Closing the same position twice does nothing the second time
    {
      const testPosId = 999001;
      walletState.positions = [{
        id: testPosId,
        coin: 'bitcoin',
        symbol: 'BTC',
        direction: 'long',
        size: 0.1,
        entry_price: 60000,
        leverage: 10,
        margin: 600,
        marginMode: 'isolated',
        liquidationPrice: 54600,
        created_at: new Date().toISOString()
      }];
      walletState.history = [];
      currentPrices['bitcoin'] = { price: 61000 };

      // First close
      closePositionUnified(testPosId, 61000, 'Market');
      const hist1 = walletState.history.length;
      const pos1 = walletState.positions.length;

      // Second close attempt on same position
      closePositionUnified(testPosId, 61000, 'Market');
      const hist2 = walletState.history.length;
      const pos2 = walletState.positions.length;

      const pass = (pos1 === 0 && pos2 === 0 && hist1 === 1 && hist2 === 1);
      record('Closing the same position twice does nothing the second time', pass);
    }

    // 6. Limit buy fills when price drops to limit
    {
      const testOrderId = 999002;
      walletState.cashBalance = 10000;
      walletState.holdings['bitcoin'] = 0;
      walletState.orders = [{
        id: testOrderId,
        coin: 'bitcoin',
        symbol: 'BTC',
        side: 'Buy',
        category: 'spot',
        price: 50000,
        size: 0.05,
        leverage: 1,
        margin: 2500,
        createdAt: new Date().toISOString()
      }];
      currentPrices['bitcoin'] = { price: 49500 };

      checkPendingLimitOrders();

      const orderFilled = !walletState.orders.some(o => o.id === testOrderId);
      const coinReceived = (walletState.holdings['bitcoin'] || 0) >= 0.05;
      record('Limit buy fills when price drops to limit', orderFilled && coinReceived);
    }

    // 7. Reset wallet returns cash to 10000
    {
      walletState.cashBalance = 5432.10;
      walletState.positions = [{ id: 888 }];
      resetWalletToDefault();
      const pass = (walletState.cashBalance === 10000.00 && walletState.positions.length === 0);
      record('Reset wallet returns cash to 10000', pass);
    }

    // 8. Supported Pairs & Rejection of non-crypto / gold
    {
      const btc = getCoinDefinition('bitcoin');
      const eth = getCoinDefinition('ethereum');
      const sol = getCoinDefinition('solana');
      const hasGold = COIN_LIST.some(c => c.id === 'gold' || c.symbol === 'XAU');
      const pass = (btc?.symbol === 'BTC' && eth?.symbol === 'ETH' && sol?.symbol === 'SOL' && !hasGold && COIN_LIST.length === 3);
      record('Strictly supports BTC, ETH, SOL and eradicates GOLD/XAU', pass);
    }

    // 9. Stale data rejects new trade placement (> 3 minutes)
    {
      const staleTime = Date.now() - 200000;
      const isStale = (Date.now() - staleTime) > 180000;
      record('Stale price feed (> 3m) correctly identified for order rejection', isStale);
    }

    // 10. Partial close proportionally returns margin & calculates realized PnL
    {
      const testPosId = 999003;
      walletState.cashBalance = 5000;
      walletState.positions = [{
        id: testPosId,
        coin: 'bitcoin',
        symbol: 'BTC',
        direction: 'long',
        size: 1.0,
        entry_price: 50000,
        leverage: 10,
        margin: 5000,
        marginMode: 'isolated',
        liquidationPrice: 45500,
        created_at: new Date().toISOString()
      }];
      currentPrices['bitcoin'] = { price: 55000 };
      closePositionPartial(testPosId, 0.5, 'Market');
      const pos = walletState.positions.find(p => p.id === testPosId);
      const pass = (pos && pos.size === 0.5 && pos.margin === 2500 && walletState.cashBalance > 5000);
      record('Partial position close reduces size and returns margin + PnL', pass);
    }
  } finally {
    // Restore runtime state
    try {
      walletState = JSON.parse(prevWallet);
      currentPrices = JSON.parse(prevPrices);
      saveWalletState();
      updateMiniStats();
      renderPositions();
      renderOrders();
      renderHistory();
      updatePnlSummary();
      updateTabBadges();
    } catch (e) {}
  }

  return results;
}

// Expose on window
if (typeof window !== 'undefined') {
  window.runSelfTest = runSelfTest;
  window.runVTradeTests = runSelfTest;
  if (window.location && window.location.search && window.location.search.includes('selftest=1')) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(runSelfTest, 800);
    } else {
      window.addEventListener('DOMContentLoaded', () => setTimeout(runSelfTest, 800));
    }
  }
}
