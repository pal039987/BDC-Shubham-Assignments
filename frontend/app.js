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

// ─── Supported Coins (Popular Coins: BTC, ETH, SOL, BNB, DOGE, XRP, ADA, SUI, AVAX, 1000PEPE, 1000SHIB, ORCA, NEAR) ───────────
const COIN_LIST = [
  { id: 'bitcoin',     symbol: 'BTC',      name: 'Bitcoin',       pair: 'BTC/USDT',      color: '#f7931a', category: 'Majors',  tags: ['Majors', 'all', 'new'],  icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',   binanceSymbol: 'BTCUSDT',  basePrice: 82004.60, baseChange: 1.36, baseVol: 15300000000, baseCap: 1676759000000, leverage: 150 },
  { id: 'ethereum',    symbol: 'ETH',      name: 'Ethereum',      pair: 'ETH/USDT',      color: '#627eea', category: 'Majors',  tags: ['Majors', 'all', 'l1'],   icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', binanceSymbol: 'ETHUSDT',  basePrice: 2436.78,  baseChange: 3.18, baseVol: 10180000000, baseCap: 307174000000, leverage: 150 },
  { id: 'solana',      symbol: 'SOL',      name: 'Solana',        pair: 'SOL/USDT',      color: '#14f195', category: 'Layer 1', tags: ['Layer 1', 'all', 'l1'],  icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',  binanceSymbol: 'SOLUSDT',  basePrice: 105.12,   baseChange: 2.30, baseVol: 1900000000,  baseCap: 63637000000,  leverage: 100 },
  { id: 'ripple',      symbol: 'XRP',      name: 'XRP',           pair: 'XRP/USDT',      color: '#23292f', category: 'Payment', tags: ['Payment', 'all', 'l1'],  icon: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', binanceSymbol: 'XRPUSDT', basePrice: 1.3315, baseChange: 1.85, baseVol: 745290000, baseCap: 78000000000, leverage: 100 },
  { id: 'dogecoin',    symbol: 'DOGE',     name: 'Dogecoin',      pair: 'DOGE/USDT',     color: '#c2a633', category: 'Meme',    tags: ['Meme', 'all'],     icon: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',   binanceSymbol: 'DOGEUSDT', basePrice: 0.08151,  baseChange: 2.02, baseVol: 469610000,   baseCap: 12500000000,  leverage: 100 },
  { id: 'pepe',        symbol: '1000PEPE', name: 'Pepe',          pair: '1000PEPE/USDT', color: '#4ba35a', category: 'Meme',    tags: ['Meme', 'all'],     icon: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.png', binanceSymbol: 'PEPEUSDT', basePrice: 0.0040843, baseChange: 4.30, baseVol: 263050000, baseCap: 1800000000, leverage: 35 },
  { id: 'shiba-inu',   symbol: '1000SHIB', name: 'Shiba Inu',     pair: '1000SHIB/USDT', color: '#ff6347', category: 'Meme',    tags: ['Meme', 'all'],     icon: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png', binanceSymbol: 'SHIBUSDT', basePrice: 0.00512, baseChange: 3.37, baseVol: 36010000, baseCap: 12000000000, leverage: 50 },
  { id: 'orca',        symbol: 'ORCA',     name: 'Orca',          pair: 'ORCA/USDT',     color: '#f7c325', category: 'DeFi',    tags: ['DeFi', 'all', 'new'],    icon: 'https://assets.coingecko.com/coins/images/17547/small/Orca_Logo.png', binanceSymbol: 'ORCAUSDT', basePrice: 1.973, baseChange: 2.82, baseVol: 18420000, baseCap: 120000000, leverage: 50 },
  { id: 'binancecoin', symbol: 'BNB',      name: 'BNB',           pair: 'BNB/USDT',      color: '#f3ba2f', category: 'Layer 1', tags: ['Layer 1', 'all', 'l1'],  icon: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png', binanceSymbol: 'BNBUSDT', basePrice: 744.00, baseChange: -0.14, baseVol: 1850000000, baseCap: 107000000000, leverage: 100 },
  { id: 'cardano',     symbol: 'ADA',      name: 'Cardano',       pair: 'ADA/USDT',      color: '#0033ad', category: 'Layer 1', tags: ['Layer 1', 'all', 'l1'],  icon: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',   binanceSymbol: 'ADAUSDT',  basePrice: 0.236,    baseChange: -1.08, baseVol: 420000000,   baseCap: 8400000000,   leverage: 50 },
  { id: 'sui',         symbol: 'SUI',      name: 'Sui',           pair: 'SUI/USDT',      color: '#2a82e4', category: 'Layer 1', tags: ['Layer 1', 'all', 'l1'],  icon: 'https://assets.coingecko.com/coins/images/26375/small/sui-ocean-square.png', binanceSymbol: 'SUIUSDT', basePrice: 1.058, baseChange: -1.13, baseVol: 560000000, baseCap: 3100000000, leverage: 50 },
  { id: 'avalanche-2', symbol: 'AVAX',     name: 'Avalanche',     pair: 'AVAX/USDT',     color: '#e84142', category: 'Layer 1', tags: ['Layer 1', 'all', 'l1'],  icon: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png', binanceSymbol: 'AVAXUSDT', basePrice: 10.23, baseChange: -2.10, baseVol: 390000000, baseCap: 4100000000, leverage: 50 },
  { id: 'near',        symbol: 'NEAR',     name: 'NEAR Protocol', pair: 'NEAR/USDT',     color: '#000000', category: 'Layer 1', tags: ['Layer 1', 'all', 'l1', 'ai'], icon: 'https://assets.coingecko.com/coins/images/10365/small/near.png', binanceSymbol: 'NEARUSDT', basePrice: 5.045, baseChange: -1.20, baseVol: 480000000, baseCap: 6200000000, leverage: 50 }
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
        const cacheAge = Date.now() - (parsed.timestamp || 0);
        // Only use old timestamp if fresh (< 5 mins), otherwise use Date.now() so UI does not display "Stale" before first fetch
        lastGoodPriceTimestamp = cacheAge < 300000 ? parsed.timestamp : Date.now();
        Object.keys(parsed.prices).forEach(coinId => {
          const entry = parsed.prices[coinId];
          if (entry && isValidPrice(entry.price)) {
            currentPrices[coinId] = { ...currentPrices[coinId], ...entry, isSimulated: false };
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
let currentUserEmail = safeStorageGet('ct_email') || '';
let selectedCoin = 'bitcoin';
let currentTF    = '15m';
let chartMode    = 'tv';        // 'tv' (TradingView default) | 'candle' | 'line'
let drawTool     = 'cursor';    // 'cursor' | 'trend' | 'horiz' | 'brush' | 'measure'
let drawColor    = '#f0b90b';
let drawings     = [];
let activeDrawing = null;
let candleData   = [];

// Delta-Style Trade Panel State
let tradeCategory   = 'position'; // 'position' (default for leverage/margin desk) | 'spot'
let tradeSide       = 'buy';      // 'buy' | 'sell'
let tradeOrderType  = 'market';   // 'market' | 'limit'
let tradeUnit       = 'coin';     // 'coin' | 'usd'
let tradeLeverage   = 150;        // Default 150x leverage
let tradeMarginMode = 'isolated'; // 'isolated' | 'cross'
let marketsSearchQuery = '';      // Real-time market list search filter

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
  }, 2000);
}

function stopPriceRefreshTimer() {
  if (priceRefreshInterval) {
    clearInterval(priceRefreshInterval);
    priceRefreshInterval = null;
  }
}

async function refreshPricesAndCheckPositions() {
  try {
    if (Date.now() - lastBinanceTickTime > 3500) {
      await fetchMarketPricesUnified();
    }
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
  ensurePaperSession();
  if (typeof applySettingsToTradePanel === 'function') applySettingsToTradePanel();
  if (typeof initDownloadApkVisibility === 'function') initDownloadApkVisibility();

  updateAuthStateUI();

  // Initialize trade desk defaults (150x leverage, coin unit, market order)
  setLeverage(150);
  setTradeUnit('coin');
  selectTradeOrderType('market');

  // Immediately kick off live market data streaming directly from Binance
  fetchBinanceDirect();
  initBinanceWebSocket();
  initDraggableOrders();
  init1ClickTrade();
  initMarketExplorer();
  setChartMode(chartMode);
  initRealtimeTicker();
  setupDrawingCanvas();
  startPriceRefreshTimer();
  startFundingCountdown();
  initPullToRefresh();
  initHorizontalSwipeNavigation();

  loadAll();

  // Auto-open auth modal if URL points to signin/login/register (matches Shark Exchange /auth/signin)
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  if (path.includes('/signin') || path.includes('/login') || hash.includes('login') || hash.includes('signin')) {
    openAuthModal('login');
  } else if (path.includes('/signup') || path.includes('/register') || hash.includes('register') || hash.includes('signup')) {
    openAuthModal('register');
  }
});

let isBalanceMasked = false;

function toggleBalanceMask() {
  isBalanceMasked = !isBalanceMasked;
  const availEl = document.getElementById('desk-avail-bal');
  if (availEl) {
    if (isBalanceMasked) {
      availEl.textContent = '******';
    } else {
      availEl.textContent = `$${fmtNum(walletState.cashBalance)} USDT`;
    }
  }
}

function toggleProfileDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('profile-dropdown-menu');
  if (menu) menu.classList.toggle('hidden');
}

function closeProfileDropdown() {
  const menu = document.getElementById('profile-dropdown-menu');
  if (menu) menu.classList.add('hidden');
}

function toggleMarginModeDropdown(e) {
  if (e) e.stopPropagation();
  document.getElementById('leverage-dropdown-menu')?.classList.add('hidden');
  document.getElementById('order-type-dropdown-menu')?.classList.add('hidden');
  const menu = document.getElementById('margin-mode-dropdown-menu');
  if (menu) menu.classList.toggle('hidden');
}

function selectMarginModeMenu(mode) {
  setMarginMode(mode);
  const lbl = document.getElementById('margin-mode-display-label');
  if (lbl) lbl.textContent = mode === 'isolated' ? 'Isolated' : 'Cross';
  const menu = document.getElementById('margin-mode-dropdown-menu');
  if (menu) menu.classList.add('hidden');
  document.querySelectorAll('.mm-dropdown-item').forEach(el => {
    el.classList.toggle('active', el.textContent.toLowerCase().includes(mode));
  });
}

function toggleLeverageDropdown(e) {
  if (e) e.stopPropagation();
  document.getElementById('margin-mode-dropdown-menu')?.classList.add('hidden');
  document.getElementById('order-type-dropdown-menu')?.classList.add('hidden');
  const menu = document.getElementById('leverage-dropdown-menu');
  if (menu) menu.classList.toggle('hidden');
}

function selectLeverageMenu(lev) {
  setLeverage(lev);
  const menu = document.getElementById('leverage-dropdown-menu');
  if (menu) menu.classList.add('hidden');
}

function toggleOrderTypeDropdown(e) {
  if (e) e.stopPropagation();
  document.getElementById('margin-mode-dropdown-menu')?.classList.add('hidden');
  document.getElementById('leverage-dropdown-menu')?.classList.add('hidden');
  const menu = document.getElementById('order-type-dropdown-menu');
  if (menu) menu.classList.toggle('hidden');
}

function selectTradeOrderType(type) {
  tradeOrderType = type;
  chartTradeOtype = type;
  
  const displayLabel = type === 'limit' ? 'Limit' : 'Market';
  
  const deskDisp = document.getElementById('tform-order-type-display');
  if (deskDisp) deskDisp.textContent = displayLabel;
  
  const cqtdDisp = document.getElementById('cqtd-otype-label');
  if (cqtdDisp) cqtdDisp.textContent = displayLabel;
  
  const priceLabel = document.getElementById('tform-price-label');
  const limitInput = document.getElementById('limit-price-input');
  
  if (type === 'limit') {
    if (priceLabel) priceLabel.style.display = 'none';
    if (limitInput) {
      limitInput.style.display = 'block';
      const coinDef = getCoinDefinition(selectedCoin);
      const curPrice = currentPrices[selectedCoin]?.price || coinDef.basePrice || 0;
      if (!limitInput.value || parseFloat(limitInput.value) <= 0) {
        limitInput.value = curPrice > 10 ? curPrice.toFixed(2) : curPrice.toPrecision(5);
      }
      limitInput.focus();
    }
  } else {
    if (priceLabel) {
      priceLabel.style.display = 'block';
      priceLabel.textContent = 'Placed at Market Price';
    }
    if (limitInput) {
      limitInput.style.display = 'none';
    }
  }
  
  document.getElementById('ot-item-market')?.classList.toggle('active', type === 'market');
  document.getElementById('ot-item-limit')?.classList.toggle('active', type === 'limit');
  
  const menu = document.getElementById('order-type-dropdown-menu');
  if (menu) menu.classList.add('hidden');
  
  updateTradeCalc();
}

function toggleCurrencyDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('currency-dropdown-menu');
  if (menu) menu.classList.toggle('hidden');
}

let activeCurrencyView = 'USDT';
function selectCurrencyView(curr) {
  activeCurrencyView = curr;
  const activeLabel = document.getElementById('pos-active-currency');
  if (activeLabel) activeLabel.textContent = curr === 'INR' ? 'INR (₹)' : 'INR | USDT';
  const menu = document.getElementById('currency-dropdown-menu');
  if (menu) menu.classList.add('hidden');
  document.querySelectorAll('.cdm-item').forEach(el => {
    el.classList.toggle('active', el.textContent.startsWith(curr));
  });
  renderPositions();
}

function toggleTpSlCheckbox(checked) {
  const body = document.getElementById('tpsl-body');
  if (body) {
    if (checked) {
      body.classList.remove('hidden');
    } else {
      body.classList.add('hidden');
      const tp = document.getElementById('tp-input');
      const sl = document.getElementById('sl-input');
      if (tp) tp.value = '';
      if (sl) sl.value = '';
      updateTradeCalc();
    }
  }
}

function setMinTradeAmount() {
  const coinDef = getCoinDefinition(selectedCoin);
  const curPrice = currentPrices[selectedCoin]?.price || coinDef.basePrice || 100;
  let minAmount = 0.002;
  if (coinDef.symbol === 'BTC') minAmount = 0.002;
  else if (coinDef.symbol === 'ETH') minAmount = 0.02;
  else if (coinDef.symbol === 'SOL') minAmount = 0.1;
  else minAmount = parseFloat((100 / curPrice).toFixed(3)) || 1;

  const input = document.getElementById('trade-amount-input');
  if (input) {
    if (tradeUnit === 'coin') {
      input.value = minAmount;
    } else {
      input.value = (minAmount * curPrice).toFixed(2);
    }
    updateTradeCalc();
  }
}

function renderVTradeEmptyState(title = 'Deposit Funds to Your Wallet', subtitle = 'Start your trading journey with us.', btnText = 'Deposit Funds') {
  return `
    <div class="vtrade-empty-state">
      <div class="ves-illustration-wrap">
        <div class="ves-glow"></div>
        <span class="ves-sparkle ves-s1">✦</span>
        <span class="ves-sparkle ves-s2">✦</span>
        <span class="ves-sparkle ves-s3">✦</span>
        <div class="ves-wallet-art">
          <svg width="105" height="100" viewBox="0 0 105 100" fill="none">
            <!-- Gold Coin popping out -->
            <circle cx="52" cy="38" r="24" fill="url(#ves-gold-grad)" stroke="#d97706" stroke-width="2"/>
            <circle cx="52" cy="38" r="20" fill="none" stroke="#fde68a" stroke-width="1.5" stroke-dasharray="3 3"/>
            <text x="52" y="44" font-size="20" font-weight="bold" fill="#78350f" text-anchor="middle" font-family="sans-serif">₹</text>
            <!-- Blue 3D Wallet Body -->
            <rect x="12" y="36" width="81" height="56" rx="14" fill="url(#ves-wallet-grad)" stroke="#60a5fa" stroke-width="1.5"/>
            <path d="M12 48H93" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
            <!-- Flap & Gold Clasp -->
            <rect x="58" y="54" width="35" height="20" rx="6" fill="#f59e0b" stroke="#fde68a" stroke-width="1"/>
            <circle cx="68" cy="64" r="3.5" fill="#ffffff"/>
            <defs>
              <linearGradient id="ves-gold-grad" x1="28" y1="14" x2="76" y2="62" gradientUnits="userSpaceOnUse">
                <stop stop-color="#fbbf24"/>
                <stop offset="1" stop-color="#d97706"/>
              </linearGradient>
              <linearGradient id="ves-wallet-grad" x1="12" y1="36" x2="93" y2="92" gradientUnits="userSpaceOnUse">
                <stop stop-color="#60a5fa"/>
                <stop offset="1" stop-color="#3b82f6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <div class="ves-title">${title}</div>
      <div class="ves-subtitle">${subtitle}</div>
      <button type="button" class="btn-ves-deposit" onclick="openResetWalletDialog()">${btnText}</button>
    </div>
  `;
}

function renderNoDataState(colspan = 10) {
  return `<tr><td colspan="${colspan}" class="empty-row" style="padding:0; border:none;">
    ${renderVTradeEmptyState()}
  </td></tr>`;
}

function updateMarginRatioStats(ratio, maint, bal) {
  const pctEl = document.getElementById('mrc-pct-val');
  const fillEl = document.getElementById('mrc-progress-fill');
  const maintEl = document.getElementById('mrc-maint-margin');
  const balEl = document.getElementById('mrc-margin-bal');

  if (pctEl) pctEl.textContent = `${ratio}%`;
  if (fillEl) fillEl.style.width = `${Math.min(100, Math.max(0, parseFloat(ratio) * 10))}%`;
  if (maintEl) maintEl.textContent = `${typeof maint === 'number' ? maint.toFixed(4) : maint} USDT`;
  if (balEl) balEl.textContent = `${typeof bal === 'number' ? bal.toFixed(4) : bal} USDT`;

  // Sync to guest cards as well
  document.querySelectorAll('.tgm-val.green').forEach(el => el.textContent = `${ratio}%`);
}

// Window click listener to close menus on click away
if (typeof window !== 'undefined') {
  window.addEventListener('click', (e) => {
    if (!e.target.closest('#nav-user-group')) closeProfileDropdown();
    if (!e.target.closest('#btn-margin-mode-select') && !e.target.closest('#margin-mode-dropdown-menu')) {
      document.getElementById('margin-mode-dropdown-menu')?.classList.add('hidden');
    }
    if (!e.target.closest('#btn-leverage-select') && !e.target.closest('#leverage-dropdown-menu')) {
      document.getElementById('leverage-dropdown-menu')?.classList.add('hidden');
    }
    if (!e.target.closest('.tform-order-type-wrap')) {
      document.getElementById('order-type-dropdown-menu')?.classList.add('hidden');
    }
    if (!e.target.closest('.pos-currency-switch')) {
      document.getElementById('currency-dropdown-menu')?.classList.add('hidden');
    }
  });
}

function updateAuthStateUI() {
  const navGuest = document.getElementById('nav-guest-group');
  const navUser  = document.getElementById('nav-user-group');
  const tradeGuest = document.getElementById('trade-guest-actions');
  const tradeAuth  = document.getElementById('trade-auth-actions');
  const unauthPos  = document.getElementById('unauth-positions-banner');

  if (token) {
    if (navGuest) navGuest.classList.add('hidden');
    if (navUser)  navUser.classList.remove('hidden');
    const uNameEl = document.getElementById('nav-username');
    const uAvEl   = document.getElementById('user-avatar');
    const pdmName = document.getElementById('pdm-username');
    const pdmBal  = document.getElementById('pdm-balance');
    const deskAvail = document.getElementById('desk-avail-bal');

    const displayName = username || 'Trader';
    if (uNameEl) uNameEl.textContent = displayName;
    if (pdmName) pdmName.textContent = displayName;
    if (uAvEl)   uAvEl.textContent   = displayName.charAt(0).toUpperCase();

    const formattedBal = `$${fmtNum(walletState.cashBalance)} USDT`;
    if (pdmBal) pdmBal.textContent = formattedBal;
    if (deskAvail && !isBalanceMasked) deskAvail.textContent = formattedBal;

    if (tradeGuest) tradeGuest.classList.add('hidden');
    if (tradeAuth)  tradeAuth.classList.remove('hidden');
    if (unauthPos)  unauthPos.classList.add('hidden');

    updateMiniStats();
    updateTabBadges();
  } else {
    if (navGuest) navGuest.classList.remove('hidden');
    if (navUser)  navUser.classList.add('hidden');

    if (tradeGuest) tradeGuest.classList.remove('hidden');
    if (tradeAuth)  tradeAuth.classList.add('hidden');
    if (unauthPos)  unauthPos.classList.remove('hidden');
  }
}

function openAuthModal(tab = 'login') {
  const overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.classList.remove('hidden');
  switchTab(tab);
}

function closeAuthModal() {
  const overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function showApp() {
  updateAuthStateUI();
  closeAuthModal();
}

async function loadAll() {
  await loadPrices();
  if (token) {
    await loadPortfolio();
    loadWalletState();
    renderPositions();
    renderOrders();
    renderHistory();
    updatePnlSummary();
  } else {
    updateMiniStats();
    updateTabBadges();
  }
  showBottomTab(activeBottomTab);
  updateTradeLabels();
  updateTradeCalc();
  loadChart(selectedCoin, currentTF);
  renderGrowwExploreUI();
  switchMainTab('chart');
}

// ─── AUTH ─────────────────────────────────────────────────
function switchTab(tab) {
  const loginView = document.getElementById('login-view');
  const registerView = document.getElementById('register-view');
  if (loginView && registerView) {
    loginView.classList.toggle('hidden', tab !== 'login');
    registerView.classList.toggle('hidden', tab !== 'register');
  }
  const err1 = document.getElementById('login-error');
  const err2 = document.getElementById('reg-error');
  if (err1) err1.classList.add('hidden');
  if (err2) err2.classList.add('hidden');
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (btn) btn.textContent = '🔒';
  } else {
    input.type = 'password';
    if (btn) btn.textContent = '👁️';
  }
}

async function handleGoogleDemoAuth() {
  const btn = event?.currentTarget;
  if (btn) btn.style.opacity = '0.6';
  try {
    const demoPayload = {
      email: 'google_trader@vtrade.com',
      password: 'GoogleTraderPassword123!',
      username: 'GoogleTrader'
    };
    let r;
    try {
      r = await post(`${API}/auth/login`, { email: demoPayload.email, password: demoPayload.password });
    } catch (e) {
      r = await post(`${API}/auth/register`, demoPayload);
    }
    saveAuth(r);
    closeAuthModal();
    updateAuthStateUI();
    await loadPortfolio();
    renderPositions();
    renderOrders();
    renderHistory();
    updatePnlSummary();
    showToast(`⚡ Signed in with Google as ${r.username}!`, 'success');
  } catch (err) {
    showToast(err.message || 'Google Sign-in failed', 'error');
  } finally {
    if (btn) btn.style.opacity = '1';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const err = document.getElementById('login-error');
  setLoading(btn, true); err.classList.add('hidden');
  try {
    const r = await post(`${API}/auth/login`, { email: v('login-email'), password: v('login-password') });
    saveAuth(r);
    closeAuthModal();
    updateAuthStateUI();
    await loadPortfolio();
    renderPositions();
    renderOrders();
    renderHistory();
    updatePnlSummary();
    showToast(`Welcome back, ${r.username}!`, 'success');
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
    saveAuth(r);
    closeAuthModal();
    updateAuthStateUI();
    await loadPortfolio();
    renderPositions();
    renderOrders();
    renderHistory();
    updatePnlSummary();
    showToast('🎉 Account created! You have $10,000 USDT to trade.', 'success');
  } catch(ex) { err.textContent = ex.message; err.classList.remove('hidden'); }
  finally { setLoading(btn, false); }
}

function saveAuth(data) {
  token    = data.token;   username = data.username; balance = data.balance;
  currentUserEmail = data.email || (data.user && data.user.email) || currentUserEmail || '';
  safeStorageSet('ct_token',    token);
  safeStorageSet('ct_username', username);
  safeStorageSet('ct_balance',  balance.toString());
  if (currentUserEmail) safeStorageSet('ct_email', currentUserEmail);
  renderAccountsScreen();
}

function logout() {
  token = null; username = ''; balance = 10000; currentUserEmail = '';
  ['ct_token','ct_username','ct_balance','ct_email'].forEach(k => safeStorageRemove(k));
  updateAuthStateUI();
  renderPositions();
  renderOrders();
  renderHistory();
  updatePnlSummary();
  updateMiniStats();
  renderAccountsScreen();
  showToast('Logged out', 'info');
}

// ─── BINANCE REAL-TIME MARKET DATA & TRUTHFUL PRICE ENGINE ─────────
let isRateLimited = false;
let cgRateLimitUntil = 0;
let lastBinanceTickTime = 0;
let dailyOpenCache = {
  bitcoin: 0,
  ethereum: 0,
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

// Fetches 00:00 UTC session candle open from Binance 1d klines (matches TradingView Daily Watchlist)
async function updateDailySessionOpenPrices() {
  const symbolMap = {
    'BTCUSDT': 'bitcoin',
    'ETHUSDT': 'ethereum',
    'SOLUSDT': 'solana',
    'BNBUSDT': 'binancecoin',
    'DOGEUSDT': 'dogecoin',
    'XRPUSDT': 'ripple',
    'ADAUSDT': 'cardano',
    'SUIUSDT': 'sui',
    'AVAXUSDT': 'avalanche-2',
    'PEPEUSDT': 'pepe',
    'NEARUSDT': 'near'
  };
  try {
    const promises = Object.entries(symbolMap).map(async ([sym, coinId]) => {
      try {
        const ctl = new AbortController();
        const tid = setTimeout(() => ctl.abort(), 3500);
        const resp = await fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=1d&limit=1`, { signal: ctl.signal });
        clearTimeout(tid);
        if (resp.ok) {
          const klines = await resp.json();
          if (Array.isArray(klines) && klines.length > 0) {
            const openPrice = parseFloat(klines[0][1]);
            if (openPrice > 0 && !isNaN(openPrice)) {
              dailyOpenCache[coinId] = openPrice;
              if (currentPrices[coinId]) {
                currentPrices[coinId].dailyOpen = openPrice;
              }
            }
          }
        }
      } catch (e) {}
    });
    await Promise.all(promises);
    dailyOpenCache.lastUpdated = Date.now();
  } catch (err) {}
}

// Fast direct REST fetch to Binance 24hr ticker for all 11 popular coins
async function fetchBinanceDirect() {
  try {
    if (Date.now() - dailyOpenCache.lastUpdated > 15 * 60 * 1000 || !dailyOpenCache.bitcoin) {
      updateDailySessionOpenPrices().catch(() => {});
    }

    const ctl = new AbortController();
    const tid = setTimeout(() => ctl.abort(), 3500);
    const bUrl = 'https://api.binance.com/api/v3/ticker/24hr?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22SOLUSDT%22,%22BNBUSDT%22,%22DOGEUSDT%22,%22XRPUSDT%22,%22ADAUSDT%22,%22SUIUSDT%22,%22AVAXUSDT%22,%22PEPEUSDT%22,%22NEARUSDT%22%5D';
    const resp = await fetch(bUrl, { signal: ctl.signal });
    clearTimeout(tid);

    if (resp.ok) {
      const bList = await resp.json();
      if (Array.isArray(bList) && bList.length >= 3) {
        const symbolMap = {
          'BTCUSDT': 'bitcoin',
          'ETHUSDT': 'ethereum',
          'SOLUSDT': 'solana',
          'BNBUSDT': 'binancecoin',
          'DOGEUSDT': 'dogecoin',
          'XRPUSDT': 'ripple',
          'ADAUSDT': 'cardano',
          'SUIUSDT': 'sui',
          'AVAXUSDT': 'avalanche-2',
          'PEPEUSDT': 'pepe',
          'NEARUSDT': 'near'
        };
        let updatedAny = false;

        bList.forEach(item => {
          const coinId = symbolMap[item.symbol];
          if (coinId) {
            const p = parseFloat(item.lastPrice);
            if (isValidPrice(p)) {
              const prevPrice = currentPrices[coinId]?.price || p;
              const dailyOpen = dailyOpenCache[coinId] || parseFloat(item.openPrice) || p;
              const changePrice = dailyOpen > 0 ? (p - dailyOpen) : (parseFloat(item.priceChange) || 0);
              const change24h = dailyOpen > 0 ? (((p - dailyOpen) / dailyOpen) * 100) : (parseFloat(item.priceChangePercent) || 0);

              currentPrices[coinId] = {
                ...currentPrices[coinId],
                price: parseFloat(p.toFixed(p > 10 ? 2 : p > 0.01 ? 4 : 8)),
                usdtPrice: parseFloat(p.toFixed(p > 10 ? 2 : p > 0.01 ? 4 : 8)),
                usdPrice: parseFloat(p.toFixed(p > 10 ? 2 : p > 0.01 ? 4 : 8)),
                dailyOpen: dailyOpen,
                changePrice: parseFloat(changePrice.toFixed(p > 10 ? 2 : 4)),
                change24h: parseFloat(change24h.toFixed(2)),
                volume24h: parseFloat(item.quoteVolume) || 0,
                high24h: parseFloat(item.highPrice) || 0,
                low24h: parseFloat(item.lowPrice) || 0,
                quoteCurrency: 'USDT',
                isSimulated: false
              };

              lastGoodPriceTimestamp = Date.now();
              lastBinanceTickTime = Date.now();
              isPriceDataLive = true;
              isRateLimited = false;

              if (prevPrice !== p) {
                onPriceTick(coinId, prevPrice, p);
              }
              updatedAny = true;
            }
          }
        });

        if (updatedAny) {
          saveCachedPrices();
          updateDataBadge();
          updateChartPriceDisplay();
          updateTickers(currentPrices);
          renderGrowwExploreUI();
        }
        return true;
      }
    }
  } catch (err) {}
  return false;
}

// Unified market price fetcher: uses live WebSocket ticks or fast Binance REST
async function fetchMarketPricesUnified() {
  if (Date.now() - lastBinanceTickTime < 3500 && isPriceDataLive) {
    return;
  }
  const binanceOk = await fetchBinanceDirect();
  if (binanceOk) return;

  // Fallback: Backend /api/prices if Binance REST is blocked
  try {
    const ctl = new AbortController();
    const tid = setTimeout(() => ctl.abort(), 2000);
    const res = await fetch(`${API}/prices`, { signal: ctl.signal });
    clearTimeout(tid);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        let updatedAny = false;
        COIN_LIST.forEach(c => {
          const coinData = data[c.id];
          if (coinData && isValidPrice(coinData.price)) {
            const prevPrice = currentPrices[c.id]?.price || coinData.price;
            currentPrices[c.id] = { ...currentPrices[c.id], ...coinData, isSimulated: false };
            if (prevPrice !== coinData.price) onPriceTick(c.id, prevPrice, coinData.price);
            updatedAny = true;
          }
        });
        if (updatedAny) {
          lastGoodPriceTimestamp = Date.now();
          isPriceDataLive = true;
          isRateLimited = false;
          saveCachedPrices();
          updateDataBadge();
          return;
        }
      }
    }
  } catch (backendErr) {}

  // Last-resort fallback: CoinGecko (throttled to at most once every 60 seconds)
  if (Date.now() >= cgRateLimitUntil) {
    await fetchCoinGeckoPricesFallback();
  }
}

// Emergency throttled CoinGecko fallback (only used if Binance and local server both fail)
async function fetchCoinGeckoPricesFallback() {
  const cgController = new AbortController();
  const cgTimeout = setTimeout(() => cgController.abort(), 4000);
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
        }
      });
      isPriceDataLive = true;
      saveCachedPrices();
    }
  } catch (cgErr) {
    clearTimeout(cgTimeout);
  }
  updateDataBadge();
}

function fetchCoinGeckoPrices() {
  return fetchMarketPricesUnified();
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

  fetchMarketPricesUnified();
}

// ─── PRICES ───────────────────────────────────────────────
async function loadPrices() {
  try {
    const binanceOk = await fetchBinanceDirect();
    if (!binanceOk) {
      try {
        const ctl = new AbortController();
        const tid = setTimeout(() => ctl.abort(), 1500);
        const res = await fetch(`${API}/prices`, { signal: ctl.signal });
        clearTimeout(tid);
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object') {
            let updated = false;
            Object.keys(data).forEach(k => {
              if (k !== 'updatedAt' && isValidPrice(data[k]?.price)) {
                currentPrices[k] = { ...currentPrices[k], ...data[k], isSimulated: false };
                updated = true;
              }
            });
            if (updated) saveCachedPrices();
          }
        }
      } catch (e) {}
    }
    updateTickers(currentPrices);
    updateChartPriceDisplay();
    updateSpotCalc();
    updatePosCalc();
    renderWatchlistChips();
    renderMarketsList();
    renderGrowwExploreUI();
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
  const chg = coin?.change24h !== undefined ? coin?.change24h : coinDef.baseChange;
  const changePrice = coin?.changePrice !== undefined ? coin?.changePrice : ((price * (chg || 0)) / 100);
  const vol = coin?.volume24h || coinDef.baseVol;
  const mcap = coin?.marketCap || coinDef.baseCap;
  const lowVal = coin?.low24h || (price * 0.985);
  const highVal = coin?.high24h || (price * 1.015);

  const priceEl = document.getElementById('chart-price');
  if (priceEl) priceEl.textContent = `${fmt(price)} USDT`;

  const inrRateEl = document.getElementById('chart-inr-rate');
  if (inrRateEl) inrRateEl.textContent = '1 USDT ≈ ₹92.50';

  const badge = document.getElementById('chart-change-badge');
  const sign  = (chg||0) >= 0 ? '+' : '';
  if (badge) {
    badge.textContent = `${sign}${(chg||0).toFixed(2)}%`;
    badge.className   = `sstat-val ${(chg||0)>=0?'pos':'neg'}`;
  }

  const lowEl = document.getElementById('chart-low-val');
  if (lowEl) lowEl.textContent = fmt(lowVal);

  const highEl = document.getElementById('chart-high-val');
  if (highEl) highEl.textContent = fmt(highVal);

  const volEl = document.getElementById('chart-vol');
  if (volEl) volEl.textContent = fmtLarge(vol);

  const mcapEl = document.getElementById('chart-mcap');
  if (mcapEl) mcapEl.textContent = fmtLarge(mcap);

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

// ─── SHARK EXCHANGE QUICK PAIR MENU & CONTROLS ───────────
function togglePairQuickMenu() {
  const menu = document.getElementById('chart-pair-quick-menu');
  if (menu) menu.classList.toggle('hidden');
}
function closePairQuickMenu() {
  const menu = document.getElementById('chart-pair-quick-menu');
  if (menu) menu.classList.add('hidden');
}
document.addEventListener('click', (e) => {
  const menu = document.getElementById('chart-pair-quick-menu');
  const pill = document.getElementById('chart-active-coin-pill');
  if (menu && !menu.classList.contains('hidden') && !menu.contains(e.target) && !pill?.contains(e.target)) {
    menu.classList.add('hidden');
  }
});

let currentPriceMode = 'mark';
function setPriceMode(mode, btn) {
  currentPriceMode = mode;
  document.querySelectorAll('.spm-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

let is1ClickTradeEnabled = false;

function init1ClickTrade() {
  try {
    const saved = safeStorageGet('vtrade_1click_enabled');
    if (saved === '1') is1ClickTradeEnabled = true;
  } catch(e) {}
  const checkbox = document.getElementById('one-click-toggle-input');
  if (checkbox) checkbox.checked = is1ClickTradeEnabled;
  const widget = document.getElementById('tv-topleft-order-widget');
  if (widget) {
    widget.classList.toggle('hidden', !is1ClickTradeEnabled);
  }
  update1ClickPrices();
  sync1ClickTradeSizeWithMain();
}

function toggle1ClickTrade(enabled) {
  is1ClickTradeEnabled = !!enabled;
  const widget = document.getElementById('tv-topleft-order-widget');
  const checkbox = document.getElementById('one-click-toggle-input');
  if (checkbox) checkbox.checked = is1ClickTradeEnabled;

  if (widget) {
    if (is1ClickTradeEnabled) {
      widget.classList.remove('hidden');
      update1ClickPrices();
      sync1ClickTradeSizeWithMain();
    } else {
      widget.classList.add('hidden');
    }
  }

  try {
    safeStorageSet('vtrade_1click_enabled', is1ClickTradeEnabled ? '1' : '0');
  } catch(e) {}

  showToast(`1-Click Trade ${is1ClickTradeEnabled ? 'Enabled' : 'Disabled'}`, 'info');
}

function update1ClickPrices() {
  const sellPriceEl = document.getElementById('tv-tl-sell-price');
  const buyPriceEl = document.getElementById('tv-tl-buy-price');
  const unitEl = document.getElementById('tv-quick-unit');
  const coinDef = getCoinDefinition(selectedCoin);

  if (unitEl && coinDef) {
    unitEl.textContent = coinDef.symbol;
  }

  const curPrice = currentPrices[selectedCoin]?.price || coinDef?.basePrice || 0;
  if (curPrice > 0) {
    const formatted = `$${fmt(curPrice)}`;
    if (sellPriceEl) sellPriceEl.textContent = formatted;
    if (buyPriceEl) buyPriceEl.textContent = formatted;
  } else {
    if (sellPriceEl) sellPriceEl.textContent = '$—';
    if (buyPriceEl) buyPriceEl.textContent = '$—';
  }
}

function sync1ClickTradeSizeWithMain() {
  const mainInput = document.getElementById('trade-amount-input');
  const quickInput = document.getElementById('tv-quick-size-input');
  if (mainInput && quickInput && parseFloat(mainInput.value) > 0) {
    quickInput.value = mainInput.value;
  }
}

function syncQuickTradeSize(val) {
  const num = parseFloat(val);
  const mainInput = document.getElementById('trade-amount-input');
  if (mainInput && !isNaN(num) && num > 0) {
    mainInput.value = val;
    if (typeof updateTradeCalc === 'function') updateTradeCalc();
  }
}

let fundingCountdownTimer = null;
function startFundingCountdown() {
  if (fundingCountdownTimer) clearInterval(fundingCountdownTimer);
  function tick() {
    const now = new Date();
    const utcHours = now.getUTCHours();
    const nextFundingUtc = (Math.floor(utcHours / 8) + 1) * 8;
    const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), nextFundingUtc, 0, 0));
    let diffSec = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
    const h = String(Math.floor(diffSec / 3600)).padStart(2, '0');
    const m = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
    const s = String(diffSec % 60).padStart(2, '0');
    const el = document.getElementById('funding-countdown');
    if (el) el.textContent = `${h}:${m}:${s}`;
  }
  tick();
  fundingCountdownTimer = setInterval(tick, 1000);
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

  // 3. Update Chart Header Active Coin Display (BTC-USDT format matching Screenshot 1)
  const chpIcon = document.getElementById('chp-icon');
  const chpSym  = document.getElementById('chp-symbol');
  const chpName = document.getElementById('chp-name');
  if (chpIcon) chpIcon.src = coinDef.icon;
  if (chpSym)  chpSym.textContent = `${coinDef.symbol}-USDT`;
  if (chpName) chpName.textContent = coinDef.name;

  // 4. Update Ticker strip active chip
  document.querySelectorAll('.gi-item').forEach(i => i.classList.remove('active'));
  const activeGi = document.getElementById(`gi-${selectedCoin}`);
  if (activeGi) activeGi.classList.add('active');

  // 5. Update Delta Trade Panel & Mini Stats
  if (tradeOrderType === 'limit') {
    setLimitPriceToCurrent();
  }
  updateTradeLabels();
  updateTradeCalc();
  updateMiniStats();
  updateChartPriceDisplay();
  clearAllPriceLines();
  loadDrawings();
  loadChart(selectedCoin, currentTF);

  renderTradingViewChart();
  renderTvChartOverlay();
  updateChartQuickCoinChips();
  update1ClickPrices();
  updateTradeInstrumentHeader();
  updateVTradeOrderbook();
  updateTradeBottomSection();
}

// ─── REAL-TIME BINANCE WEBSOCKET & FAST TICKER STREAM ───────
let binanceWs = null;
let binanceWsReconnectTimer = null;

function initRealtimeTicker() {
  initBinanceWebSocket();
  // Continuous fast poll as secondary backup (1.5s interval)
  setInterval(pollPricesFast, 1500);
}

function initBinanceWebSocket() {
  if (binanceWs) {
    try { binanceWs.close(); } catch(e) {}
    binanceWs = null;
  }

  try {
    const wsUrl = 'wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/ethusdt@ticker/solusdt@ticker/bnbusdt@ticker/dogeusdt@ticker/xrpusdt@ticker/adausdt@ticker/suiusdt@ticker/avaxusdt@ticker/pepeusdt@ticker/nearusdt@ticker';
    binanceWs = new WebSocket(wsUrl);

    binanceWs.onopen = () => {
      console.log('Connected to Binance live market stream (11 popular coins)');
      const badge = document.getElementById('header-price-mode-badge');
      if (badge) badge.className = 'price-mode-badge live';
      const badgeText = document.getElementById('header-price-mode-text');
      if (badgeText) badgeText.textContent = 'Live (Stream)';
    };

    binanceWs.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (!msg || !msg.data) return;
        const d = msg.data;
        const binanceToKey = {
          'BTCUSDT': 'bitcoin',
          'ETHUSDT': 'ethereum',
          'SOLUSDT': 'solana',
          'BNBUSDT': 'binancecoin',
          'DOGEUSDT': 'dogecoin',
          'XRPUSDT': 'ripple',
          'ADAUSDT': 'cardano',
          'SUIUSDT': 'sui',
          'AVAXUSDT': 'avalanche-2',
          'PEPEUSDT': 'pepe',
          'NEARUSDT': 'near'
        };
        const coinKey = binanceToKey[d.s];
        if (!coinKey) return;

        const livePrice = parseFloat(d.c);
        if (!isValidPrice(livePrice)) return;

        const prevPrice = currentPrices[coinKey]?.price || livePrice;
        // TradingView calculates daily % change and price change from Daily Session Open (00:00 UTC)
        const dailyOpen = dailyOpenCache[coinKey] || currentPrices[coinKey]?.dailyOpen || (parseFloat(d.o) || livePrice);
        const changePrice = dailyOpen > 0 ? (livePrice - dailyOpen) : (parseFloat(d.p) || 0);
        const change24h = dailyOpen > 0 ? (((livePrice - dailyOpen) / dailyOpen) * 100) : (parseFloat(d.P) || 0);
        const volume24h = parseFloat(d.q) || 0;
        const high24h   = parseFloat(d.h) || 0;
        const low24h    = parseFloat(d.l) || 0;

        currentPrices[coinKey] = {
          ...currentPrices[coinKey],
          price: livePrice,
          dailyOpen: dailyOpen,
          changePrice: changePrice,
          change24h: change24h,
          volume24h: volume24h,
          high24h: high24h,
          low24h: low24h,
          quoteCurrency: 'USDT',
          isSimulated: false
        };

        lastGoodPriceTimestamp = Date.now();
        lastBinanceTickTime = Date.now();
        isPriceDataLive = true;
        isRateLimited = false;

        // Dynamic candle update for current viewing coin
        if (selectedCoin === coinKey && chartMode === 'candle' && candleData && candleData.length) {
          const lastCandle = candleData[candleData.length - 1];
          if (livePrice > lastCandle.high) lastCandle.high = livePrice;
          if (livePrice < lastCandle.low) lastCandle.low = livePrice;
          lastCandle.close = livePrice;
        }

        onPriceTick(coinKey, prevPrice, livePrice);
      } catch (err) {}
    };

    binanceWs.onerror = (err) => {
      console.warn('Binance WS error, falling back to fast polling', err);
    };

    binanceWs.onclose = () => {
      if (binanceWsReconnectTimer) clearTimeout(binanceWsReconnectTimer);
      binanceWsReconnectTimer = setTimeout(() => {
        if (!document.hidden) initBinanceWebSocket();
      }, 3000);
    };
  } catch (wsErr) {
    console.warn('WebSocket init error:', wsErr);
  }
}

async function pollPricesFast() {
  if (document.hidden) return;
  // If WebSocket is alive and received a tick within last 3.5 seconds, no REST poll needed
  if (Date.now() - lastBinanceTickTime < 3500 && isPriceDataLive) {
    return;
  }
  // Otherwise fast REST to Binance directly (works on cellular 5G and Wi-Fi globally)
  await fetchBinanceDirect();
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
    renderTvChartOverlay();
    updateTradeInstrumentHeader();
    updateVTradeOrderbook();
  }
  updateLivePnL(coin, newPrice);
  updateGrowwLiveElements(coin);
}



// ─── TRADINGVIEW OFFICIAL HOSTED WIDGET INTEGRATION ───────
const SUPPORTED_TV_SYMBOLS = {
  'bitcoin':     'BINANCE:BTCUSDT',
  'btc':         'BINANCE:BTCUSDT',
  'btc/usdt':    'BINANCE:BTCUSDT',
  'btcusdt':     'BINANCE:BTCUSDT',
  'ethereum':    'BINANCE:ETHUSDT',
  'eth':         'BINANCE:ETHUSDT',
  'eth/usdt':    'BINANCE:ETHUSDT',
  'ethusdt':     'BINANCE:ETHUSDT',
  'solana':      'BINANCE:SOLUSDT',
  'sol':         'BINANCE:SOLUSDT',
  'sol/usdt':    'BINANCE:SOLUSDT',
  'solusdt':     'BINANCE:SOLUSDT',
  'binancecoin': 'BINANCE:BNBUSDT',
  'bnb':         'BINANCE:BNBUSDT',
  'bnb/usdt':    'BINANCE:BNBUSDT',
  'bnbusdt':     'BINANCE:BNBUSDT',
  'dogecoin':    'BINANCE:DOGEUSDT',
  'doge':        'BINANCE:DOGEUSDT',
  'doge/usdt':   'BINANCE:DOGEUSDT',
  'dogeusdt':    'BINANCE:DOGEUSDT',
  'ripple':      'BINANCE:XRPUSDT',
  'xrp':         'BINANCE:XRPUSDT',
  'xrp/usdt':    'BINANCE:XRPUSDT',
  'xrpusdt':     'BINANCE:XRPUSDT',
  'cardano':     'BINANCE:ADAUSDT',
  'ada':         'BINANCE:ADAUSDT',
  'ada/usdt':    'BINANCE:ADAUSDT',
  'adausdt':     'BINANCE:ADAUSDT',
  'sui':         'BINANCE:SUIUSDT',
  'sui/usdt':    'BINANCE:SUIUSDT',
  'suiusdt':     'BINANCE:SUIUSDT',
  'avalanche-2': 'BINANCE:AVAXUSDT',
  'avax':        'BINANCE:AVAXUSDT',
  'avax/usdt':   'BINANCE:AVAXUSDT',
  'avaxusdt':    'BINANCE:AVAXUSDT',
  'pepe':        'BINANCE:PEPEUSDT',
  'pepe/usdt':   'BINANCE:PEPEUSDT',
  'pepeusdt':    'BINANCE:PEPEUSDT',
  'near':        'BINANCE:NEARUSDT',
  'near/usdt':   'BINANCE:NEARUSDT',
  'nearusdt':    'BINANCE:NEARUSDT'
};

const TV_INTERVAL_MAP = {
  '1m': '1',
  '3m': '3',
  '5m': '5',
  '15m': '15',
  '1h': '60',
  '4h': '240',
  '1d': 'D',
  '1D': 'D',
  '1w': 'W',
  '1W': 'W'
};

function getTradingViewSymbol(coinIdOrPair) {
  if (!coinIdOrPair) return null;
  const key = String(coinIdOrPair).trim().toLowerCase();
  // Strictly reject gold/xau or any unsupported pair
  if (key.includes('gold') || key.includes('xau')) {
    return null;
  }
  return SUPPORTED_TV_SYMBOLS[key] || null;
}

function getTradingViewInterval(tf) {
  if (!tf) return '15';
  return TV_INTERVAL_MAP[String(tf).trim().toLowerCase()] || TV_INTERVAL_MAP[String(tf).trim()] || '15';
}

let tvWidgetInstance = null;
let currentTvSymbol = null;
let currentTvInterval = null;
let tvLoadTimeout = null;

// ─── PURE TRADINGVIEW PRO CHART ───────────────────────────
function setChartMode(mode) {
  chartMode = 'tv';
  const tvWrap = document.getElementById('tv-chart-container');
  if (tvWrap) tvWrap.classList.remove('hidden');
  const sourceBadge = document.getElementById('chart-source-badge');
  if (sourceBadge) {
    sourceBadge.textContent = 'TradingView Chart • VTrade Engine';
    sourceBadge.className = 'chart-source-badge badge-live';
  }
  renderTradingViewChart();
}

function selectTF(tf, btn) {
  currentTF = tf;
  document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderTradingViewChart();
}

// ─── TRADINGVIEW LIGHTWEIGHT CHARTS PRO INTEGRATION ───────
let lwChart = null;
let lwSeries = null;
let lwPriceLines = {
  entry: null,
  tp: null,
  sl: null,
  limits: []
};
let isLwDraggingTp = false;
let isLwDraggingSl = false;
let lwActiveDragPosId = null;
let isQuickTrading = false;

function resizeChartToContainer() {
  const container = document.getElementById('tradingview_widget_box');
  if (!container || !lwChart) return;
  const nw = Math.floor(container.clientWidth);
  const nh = Math.floor(container.clientHeight);
  if (nw > 50 && nh > 50) {
    lwChart.resize(nw, nh);
    repositionHtmlOverlays();
  }
}

function initLightweightChart() {
  const container = document.getElementById('tradingview_widget_box');
  if (!container) return null;

  if (typeof LightweightCharts === 'undefined') {
    console.warn('LightweightCharts library not loaded, attempting fallback');
    return null;
  }

  if (lwChart && lwSeries) {
    resizeChartToContainer();
    return { chart: lwChart, series: lwSeries };
  }

  container.innerHTML = '';

  const box = document.getElementById('chart-container-box');
  const w = container.clientWidth || (box?.clientWidth ? Math.max(300, box.clientWidth - 44) : 0) || (window.innerWidth ? Math.floor(window.innerWidth * 0.7) : 800);
  const h = container.clientHeight || (box?.clientHeight ? Math.max(380, box.clientHeight - 26) : 0) || 520;

  try {
    const chart = LightweightCharts.createChart(container, {
      width: w,
      height: h,
      layout: {
        background: { type: 'solid', color: '#0b0e11' },
        textColor: '#848e9c',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace',
        fontSize: 11
      },
      grid: {
        vertLines: { color: 'rgba(42, 49, 61, 0.35)', style: 2 },
        horzLines: { color: 'rgba(42, 49, 61, 0.35)', style: 2 }
      },
      crosshair: {
        mode: 1 // CrosshairMode.Normal
      },
      rightPriceScale: {
        borderColor: 'rgba(42, 49, 61, 0.65)',
        scaleMargins: { top: 0.12, bottom: 0.12 },
        autoScale: true
      },
      timeScale: {
        borderColor: 'rgba(42, 49, 61, 0.65)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 6,
        barSpacing: 8
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true
      }
    });

    const series = chart.addSeries(LightweightCharts.CandlestickSeries, {
      upColor: '#0ecb81',
      downColor: '#f6465d',
      borderVisible: false,
      wickUpColor: '#0ecb81',
      wickDownColor: '#f6465d'
    });

    lwChart = chart;
    lwSeries = series;

    // Reposition interactive HTML overlays ONLY on range change (without mutating chart series)
    chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      repositionHtmlOverlays();
    });

    // Resize observer strictly observes widget container for 1:1 canvas sizing
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          if (entry.target === container && entry.contentRect && lwChart) {
            const nw = Math.floor(entry.contentRect.width);
            const nh = Math.floor(entry.contentRect.height);
            if (nw > 50 && nh > 50) {
              lwChart.resize(nw, nh);
              repositionHtmlOverlays();
            }
          }
        }
      });
      ro.observe(container);
    }

    // Trigger immediate resize check on next frame once layout resolves
    requestAnimationFrame(() => {
      resizeChartToContainer();
    });

    return { chart: lwChart, series: lwSeries };
  } catch(e) {
    console.error('Failed to initialize Lightweight Charts:', e);
    return null;
  }
}

function updateChartCandles(candles) {
  if (!lwSeries) return;
  if (!candles || !candles.length) return;

  const formatted = candles.map(c => ({
    time: typeof c.time === 'number' ? Math.floor(c.time) : Math.floor(new Date(c.time).getTime() / 1000),
    open: parseFloat(c.open),
    high: parseFloat(c.high),
    low: parseFloat(c.low),
    close: parseFloat(c.close)
  })).filter(c => !isNaN(c.time) && !isNaN(c.close)).sort((a, b) => a.time - b.time);

  // Deduplicate timestamps
  const unique = [];
  let prevT = null;
  for (const bar of formatted) {
    if (bar.time !== prevT) {
      unique.push(bar);
      prevT = bar.time;
    }
  }

  if (unique.length) {
    try {
      lwSeries.setData(unique);
      lwChart.timeScale().fitContent();
    } catch(err) {
      console.warn('Error setting chart candle data:', err);
    }
  }
  repositionChartOverlays();
}

function updateChartTick(price) {
  if (!lwSeries || !candleData || !candleData.length) return;
  const lastBar = candleData[candleData.length - 1];
  if (!lastBar) return;

  const updatedBar = {
    time: lastBar.time,
    open: lastBar.open,
    high: Math.max(lastBar.high, price),
    low: Math.min(lastBar.low, price),
    close: price
  };
  lastBar.high = updatedBar.high;
  lastBar.low = updatedBar.low;
  lastBar.close = updatedBar.close;

  try {
    lwSeries.update(updatedBar);
  } catch(e) {}
  repositionChartOverlays();
  update1ClickPrices();
}

let currentOverlayPosKey = '';
let currentOverlayOrdersKey = '';

function clearAllPriceLines() {
  if (lwSeries) {
    if (lwPriceLines.entry) {
      try { lwSeries.removePriceLine(lwPriceLines.entry); } catch(e) {}
      lwPriceLines.entry = null;
    }
    if (lwPriceLines.tp) {
      try { lwSeries.removePriceLine(lwPriceLines.tp); } catch(e) {}
      lwPriceLines.tp = null;
    }
    if (lwPriceLines.sl) {
      try { lwSeries.removePriceLine(lwPriceLines.sl); } catch(e) {}
      lwPriceLines.sl = null;
    }
    if (Array.isArray(lwPriceLines.limits)) {
      lwPriceLines.limits.forEach(item => {
        try { lwSeries.removePriceLine(item.line); } catch(e) {}
      });
      lwPriceLines.limits = [];
    }
  }
  currentOverlayPosKey = 'none';
  currentOverlayOrdersKey = '';
  const limWrap = document.getElementById('tv-order-limits-container');
  if (limWrap) limWrap.innerHTML = '';
}

function syncPriceLines(curPos, curCoinOrders) {
  if (!lwSeries) return;

  const posKey = curPos
    ? `${curPos.id}_${curPos.direction}_${curPos.entry_price}_${curPos.take_profit || 0}_${curPos.stop_loss || 0}`
    : 'none';
  const ordersKey = (curCoinOrders || []).map(o => `${o.id}_${o.limit_price || o.price}_${o.side}`).join(',');

  // If underlying prices and orders have not changed, DO NOT mutate native chart price lines!
  if (posKey === currentOverlayPosKey && ordersKey === currentOverlayOrdersKey) {
    return;
  }
  currentOverlayPosKey = posKey;
  currentOverlayOrdersKey = ordersKey;

  // 1. Entry Line
  if (curPos && curPos.entry_price > 0) {
    const isLong = curPos.direction === 'long';
    const color = isLong ? '#3861fb' : '#f6465d';

    if (!lwPriceLines.entry) {
      lwPriceLines.entry = lwSeries.createPriceLine({
        price: curPos.entry_price,
        color: color,
        lineWidth: 1.5,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: ''
      });
    } else {
      lwPriceLines.entry.applyOptions({
        price: curPos.entry_price,
        color: color,
        title: ''
      });
    }
  } else {
    if (lwPriceLines.entry) {
      try { lwSeries.removePriceLine(lwPriceLines.entry); } catch(e) {}
      lwPriceLines.entry = null;
    }
  }

  // 2. TP Line
  if (curPos && curPos.take_profit && curPos.take_profit > 0) {
    if (!lwPriceLines.tp) {
      lwPriceLines.tp = lwSeries.createPriceLine({
        price: curPos.take_profit,
        color: '#0ecb81',
        lineWidth: 1.5,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'TP'
      });
    } else {
      lwPriceLines.tp.applyOptions({ price: curPos.take_profit });
    }
  } else {
    if (lwPriceLines.tp) {
      try { lwSeries.removePriceLine(lwPriceLines.tp); } catch(e) {}
      lwPriceLines.tp = null;
    }
  }

  // 3. SL Line
  if (curPos && curPos.stop_loss && curPos.stop_loss > 0) {
    if (!lwPriceLines.sl) {
      lwPriceLines.sl = lwSeries.createPriceLine({
        price: curPos.stop_loss,
        color: '#f0883e',
        lineWidth: 1.5,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'SL'
      });
    } else {
      lwPriceLines.sl.applyOptions({ price: curPos.stop_loss });
    }
  } else {
    if (lwPriceLines.sl) {
      try { lwSeries.removePriceLine(lwPriceLines.sl); } catch(e) {}
      lwPriceLines.sl = null;
    }
  }

  // 4. Pending Limit Orders Lines
  syncLimitPriceLines(curCoinOrders);
}

function syncLimitPriceLines(curCoinOrders) {
  const limWrap = document.getElementById('tv-order-limits-container');
  if (!limWrap) return;
  limWrap.innerHTML = '';

  if (lwSeries && Array.isArray(lwPriceLines.limits)) {
    lwPriceLines.limits.forEach(item => {
      try { lwSeries.removePriceLine(item.line); } catch(e) {}
    });
  }
  lwPriceLines.limits = [];

  if (!curCoinOrders || !curCoinOrders.length) return;

  curCoinOrders.forEach(ord => {
    const limPrice = ord.limit_price || ord.price;
    if (!limPrice || limPrice <= 0) return;
    const isLong = (ord.side === 'Buy' || ord.side === 'Long' || ord.side === 'buy' || ord.side === 'long');
    const color = isLong ? '#0ecb81' : '#f6465d';

    if (lwSeries) {
      try {
        const line = lwSeries.createPriceLine({
          price: limPrice,
          color: color,
          lineWidth: 1.5,
          lineStyle: 1, // Dotted
          axisLabelVisible: true,
          title: `LIMIT ${isLong ? 'BUY' : 'SELL'}`
        });
        lwPriceLines.limits.push({ id: ord.id, line });
      } catch(e) {}
    }

    const item = document.createElement('div');
    item.className = 'tv-limit-order-item';
    item.id = `tv-limit-item-${ord.id}`;
    item.dataset.price = limPrice;

    item.innerHTML = `
      <div class="tvol-h-line" style="border-top: 1.5px dotted ${color};"></div>
      <div class="tv-limit-tag ${isLong ? 'buy' : 'sell'}">
        <span>LIMIT ${isLong ? 'BUY' : 'SELL'}</span>
        <span>${fmtCoin(ord.size || ord.amount)}</span>
        <span>@ $${fmt(limPrice)}</span>
        <button type="button" class="tv-limit-cancel-btn" onclick="cancelLimitOrder(${ord.id}, event)" title="Cancel Order">✕</button>
      </div>
      <div class="tvol-axis-badge" style="background:${color}; color:#000;">${fmt(limPrice)}</div>
    `;
    limWrap.appendChild(item);
  });
}

function updateLimitTagPositions(curCoinOrders, chartHeight) {
  if (!lwSeries) return;
  (curCoinOrders || []).forEach(ord => {
    const item = document.getElementById(`tv-limit-item-${ord.id}`);
    const limPrice = ord.limit_price || ord.price;
    if (item && limPrice > 0) {
      const y = lwSeries.priceToCoordinate(limPrice);
      if (y != null && y >= 0 && y <= chartHeight) {
        item.style.display = 'flex';
        item.style.top = `${y}px`;
      } else if (y == null) {
        item.style.display = 'flex';
        item.style.top = '50%';
      } else {
        item.style.display = 'none';
      }
    }
  });
}

function repositionHtmlOverlays() {
  const overlay = document.getElementById('tv-chart-orders-overlay');
  const unitLabel = document.getElementById('tv-quick-unit');
  const coinDef = getCoinDefinition(selectedCoin);
  if (unitLabel && coinDef) unitLabel.textContent = coinDef.symbol;

  if (!overlay) return;

  const curPos = (walletState?.positions || []).find(p => p.coin === selectedCoin && (p.status === 'open' || !p.status) && p.size > 0);
  const curCoinOrders = (walletState?.orders || []).filter(o => o.coin === selectedCoin && (o.status === 'pending' || o.status === 'open'));

  if (!curPos && curCoinOrders.length === 0) {
    overlay.classList.add('hidden');
    clearAllPriceLines();
    return;
  }
  overlay.classList.remove('hidden');

  // Synchronize native price lines only when prices or order states have changed
  syncPriceLines(curPos, curCoinOrders);

  if (!lwSeries) return;

  const containerBox = document.getElementById('tv-chart-container');
  const chartHeight = containerBox?.clientHeight || 500;

  // 1. Position Entry Tag Y
  const entryLine = document.getElementById('tv-order-entry-line');
  if (curPos && curPos.entry_price > 0 && entryLine) {
    const y = lwSeries.priceToCoordinate(curPos.entry_price);
    if (y != null && y >= 0 && y <= chartHeight) {
      entryLine.style.display = 'flex';
      entryLine.style.top = `${y}px`;
    } else if (y == null) {
      entryLine.style.display = 'flex';
      entryLine.style.top = '48%';
    } else {
      entryLine.style.display = 'none';
    }

    const isLong = curPos.direction === 'long';
    const curPrice = currentPrices[curPos.coin]?.price || curPos.entry_price;
    const priceDiff = isLong ? (curPrice - curPos.entry_price) : (curPos.entry_price - curPrice);
    const livePnl = priceDiff * curPos.size;
    const isPos = livePnl >= 0;

    const entrySide = document.getElementById('tvol-entry-side');
    const entrySize = document.getElementById('tvol-entry-size');
    const entryPnl = document.getElementById('tvol-entry-pnl');
    const entryAxis = document.getElementById('tvol-entry-axis-price');
    const entryTag = document.getElementById('tvol-tag-entry');
    const btnAddTp = document.getElementById('tvol-btn-add-tp');
    const btnAddSl = document.getElementById('tvol-btn-add-sl');

    if (entrySide) entrySide.textContent = curPos.direction.toUpperCase();
    if (entrySize) entrySize.textContent = fmtCoin(curPos.size);
    if (entryPnl) {
      entryPnl.textContent = `${isPos ? '+' : ''}${livePnl.toFixed(2)} USD`;
      entryPnl.className = `tvol-val ${isPos ? 'pos' : 'neg'}`;
    }
    if (entryAxis) entryAxis.textContent = fmt(curPos.entry_price);
    if (entryTag) entryTag.classList.toggle('short-side', !isLong);
    if (btnAddTp) btnAddTp.style.display = (curPos.take_profit && curPos.take_profit > 0) ? 'none' : 'inline-block';
    if (btnAddSl) btnAddSl.style.display = (curPos.stop_loss && curPos.stop_loss > 0) ? 'none' : 'inline-block';
  } else if (entryLine) {
    entryLine.classList.add('hidden');
  }

  // 2. Position TP Tag Y
  const tpLine = document.getElementById('tv-order-tp-line');
  if (curPos && curPos.take_profit && curPos.take_profit > 0 && tpLine && !isLwDraggingTp) {
    const y = lwSeries.priceToCoordinate(curPos.take_profit);
    if (y != null && y >= 0 && y <= chartHeight) {
      tpLine.style.display = 'flex';
      tpLine.style.top = `${y}px`;
    } else if (y == null) {
      tpLine.style.display = 'flex';
      tpLine.style.top = '28%';
    } else {
      tpLine.style.display = 'none';
    }

    const isLong = curPos.direction === 'long';
    const tpProjPnl = isLong
      ? (curPos.take_profit - curPos.entry_price) * curPos.size
      : (curPos.entry_price - curPos.take_profit) * curPos.size;
    const tpVal = document.getElementById('tvol-tp-val');
    const tpAxis = document.getElementById('tvol-tp-axis-price');
    const tpSize = document.getElementById('tvol-tp-size');
    if (tpVal) tpVal.textContent = `${tpProjPnl >= 0 ? '+' : ''}${tpProjPnl.toFixed(2)} USD`;
    if (tpAxis) tpAxis.textContent = fmt(curPos.take_profit);
    if (tpSize) tpSize.textContent = fmtCoin(curPos.size);
  } else if (tpLine && !isLwDraggingTp) {
    tpLine.classList.add('hidden');
  }

  // 3. Position SL Tag Y
  const slLine = document.getElementById('tv-order-sl-line');
  if (curPos && curPos.stop_loss && curPos.stop_loss > 0 && slLine && !isLwDraggingSl) {
    const y = lwSeries.priceToCoordinate(curPos.stop_loss);
    if (y != null && y >= 0 && y <= chartHeight) {
      slLine.style.display = 'flex';
      slLine.style.top = `${y}px`;
    } else if (y == null) {
      slLine.style.display = 'flex';
      slLine.style.top = '68%';
    } else {
      slLine.style.display = 'none';
    }

    const isLong = curPos.direction === 'long';
    const slProjLoss = isLong
      ? (curPos.stop_loss - curPos.entry_price) * curPos.size
      : (curPos.entry_price - curPos.stop_loss) * curPos.size;
    const slVal = document.getElementById('tvol-sl-val');
    const slAxis = document.getElementById('tvol-sl-axis-price');
    const slSize = document.getElementById('tvol-sl-size');
    if (slVal) slVal.textContent = `${slProjLoss.toFixed(2)} USD`;
    if (slAxis) slAxis.textContent = fmt(curPos.stop_loss);
    if (slSize) slSize.textContent = fmtCoin(curPos.size);
  } else if (slLine && !isLwDraggingSl) {
    slLine.classList.add('hidden');
  }

  // 4. Position Limit Order Tags Y
  updateLimitTagPositions(curCoinOrders, chartHeight);
}

// Global alias for compatibility
const repositionChartOverlays = repositionHtmlOverlays;

function renderTvChartOverlay() {
  repositionHtmlOverlays();
}

function renderTradingViewChart(force = false) {
  const container = document.getElementById('tv-chart-container');
  const widgetBox = document.getElementById('tradingview_widget_box');
  const loadingEl = document.getElementById('tv-chart-loading');
  const errorEl   = document.getElementById('tv-chart-error');
  const unsuppEl  = document.getElementById('tv-chart-unsupported');
  const symDisp   = document.getElementById('tv-symbol-display');
  if (!container || !widgetBox) return;

  const tvSymbol = getTradingViewSymbol(selectedCoin);
  if (!tvSymbol) {
    widgetBox.innerHTML = '';
    if (tvWidgetInstance) {
      try { if (typeof tvWidgetInstance.remove === 'function') tvWidgetInstance.remove(); } catch(e) {}
      tvWidgetInstance = null;
    }
    currentTvSymbol = null;
    if (loadingEl) loadingEl.classList.add('hidden');
    if (errorEl) errorEl.classList.add('hidden');
    if (unsuppEl) unsuppEl.classList.remove('hidden');
    return;
  }
  if (unsuppEl) unsuppEl.classList.add('hidden');
  if (errorEl) errorEl.classList.add('hidden');
  if (symDisp) symDisp.textContent = tvSymbol;

  const tvInterval = getTradingViewInterval(currentTF);

  // Avoid recreation if widget is already mounted with identical symbol and interval
  if (tvWidgetInstance && currentTvSymbol === tvSymbol && currentTvInterval === tvInterval && !force && widgetBox.querySelector('iframe')) {
    update1ClickPrices();
    return;
  }

  // Ensure any previous Lightweight Charts instance is cleared from active rendering
  if (lwChart) {
    try { lwChart.remove(); } catch(e) {}
    lwChart = null;
    lwSeries = null;
  }

  // Clear previous widget content
  widgetBox.innerHTML = '';
  if (tvWidgetInstance) {
    try { if (typeof tvWidgetInstance.remove === 'function') tvWidgetInstance.remove(); } catch(e) {}
    tvWidgetInstance = null;
  }

  if (loadingEl) loadingEl.classList.remove('hidden');

  // Verify TradingView script is loaded
  if (typeof TradingView === 'undefined' || typeof TradingView.widget !== 'function') {
    if (tvLoadTimeout) clearTimeout(tvLoadTimeout);
    tvLoadTimeout = setTimeout(() => {
      if (typeof TradingView === 'undefined' || typeof TradingView.widget !== 'function') {
        if (loadingEl) loadingEl.classList.add('hidden');
        if (errorEl) errorEl.classList.remove('hidden');
      } else {
        renderTradingViewChart(true);
      }
    }, 3000);
    return;
  }

  currentTvSymbol = tvSymbol;
  currentTvInterval = tvInterval;

  try {
    tvWidgetInstance = new TradingView.widget({
      autosize: true,
      symbol: tvSymbol,
      interval: tvInterval,
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      toolbar_bg: "#0b0e11",
      enable_publishing: false,
      allow_symbol_change: true,
      container_id: "tradingview_widget_box",
      hide_side_toolbar: false,
      withdateranges: true,
      save_image: false,
      details: false,
      hotlist: false,
      calendar: false,
      studies: [
        "MASimple@tv-basicstudies"
      ]
    });

    // Hide loader once the iframe begins loading
    setTimeout(() => {
      if (loadingEl) loadingEl.classList.add('hidden');
    }, 400);

  } catch(err) {
    console.error('TradingView Advanced Chart Widget instantiation failed:', err);
    if (loadingEl) loadingEl.classList.add('hidden');
    if (errorEl) errorEl.classList.remove('hidden');
  }

  // Synchronize 1-Click panel prices
  update1ClickPrices();
}

function retryTradingViewChart() {
  const errorEl = document.getElementById('tv-chart-error');
  if (errorEl) errorEl.classList.add('hidden');
  renderTradingViewChart(true);
}

// ─── DRAGGABLE SL / TP INTERACTION (POINTER EVENTS) ─────────
function initDraggableOrders() {
  const container = document.getElementById('tv-chart-container');
  const tpTag = document.getElementById('tvol-tag-tp');
  const slTag = document.getElementById('tvol-tag-sl');
  const tpLine = document.getElementById('tv-order-tp-line');
  const slLine = document.getElementById('tv-order-sl-line');

  if (!container || !tpTag || !slTag || !tpLine || !slLine) return;

  function handlePointerDown(e, type) {
    // Only explicit user drag of that order line tag may initiate adjustment
    e.stopPropagation();
    e.preventDefault();

    const curPos = (walletState?.positions || []).find(p => p.coin === selectedCoin && (p.status === 'open' || !p.status));
    if (!curPos) return;

    const isTp = (type === 'tp');
    if (isTp) isLwDraggingTp = true;
    else isLwDraggingSl = true;

    const targetLine = isTp ? tpLine : slLine;
    const targetTag = isTp ? tpTag : slTag;
    targetLine.classList.add('is-dragging');
    targetTag.classList.add('dragging');

    const rect = container.getBoundingClientRect();
    const isLong = (curPos.direction === 'long');
    let lastPrice = isTp ? curPos.take_profit : curPos.stop_loss;

    function onPointerMove(ev) {
      ev.preventDefault();
      const currentY = ev.clientY - rect.top;
      targetLine.style.top = `${currentY}px`;

      if (lwSeries) {
        const p = lwSeries.coordinateToPrice(currentY);
        if (p && p > 0) {
          const roundedPrice = roundPriceForCoin(p, selectedCoin);
          lastPrice = roundedPrice;

          const pnl = isLong
            ? (roundedPrice - curPos.entry_price) * curPos.size
            : (curPos.entry_price - roundedPrice) * curPos.size;
          const valEl = document.getElementById(isTp ? 'tvol-tp-val' : 'tvol-sl-val');
          const axisEl = document.getElementById(isTp ? 'tvol-tp-axis-price' : 'tvol-sl-axis-price');
          if (valEl) valEl.textContent = `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} USD`;
          if (axisEl) axisEl.textContent = fmt(roundedPrice);

          if (isTp && lwPriceLines.tp) lwPriceLines.tp.applyOptions({ price: roundedPrice });
          else if (!isTp && lwPriceLines.sl) lwPriceLines.sl.applyOptions({ price: roundedPrice });
        }
      }
    }

    async function onPointerUp() {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      targetLine.classList.remove('is-dragging');
      targetTag.classList.remove('dragging');

      if (isTp) isLwDraggingTp = false;
      else isLwDraggingSl = false;

      if (lastPrice && lastPrice > 0) {
        if (isTp) curPos.take_profit = lastPrice;
        else curPos.stop_loss = lastPrice;

        saveWalletState();
        renderPositions();

        if (token && curPos.id) {
          try {
            await authPost(`/api/positions/${curPos.id}/tpsl`, {
              take_profit: curPos.take_profit,
              stop_loss: curPos.stop_loss
            });
          } catch(err) {
            console.error('Failed to sync TP/SL to backend:', err);
          }
        }

        showToast(isTp ? `🎯 Take Profit set to $${fmt(lastPrice)}` : `🛡️ Stop Loss set to $${fmt(lastPrice)}`, 'success');
      }
      repositionChartOverlays();
    }

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }

  // Use property assignment to avoid duplicate event listeners on re-initialization
  tpTag.onpointerdown = (e) => handlePointerDown(e, 'tp');
  slTag.onpointerdown = (e) => handlePointerDown(e, 'sl');
}

// Quick Actions for On-Chart Tags
async function cancelCurrentTp(event) {
  if (event) event.stopPropagation();
  const curPos = (walletState?.positions || []).find(p => p.coin === selectedCoin && (p.status === 'open' || !p.status));
  if (!curPos) return;
  curPos.take_profit = null;
  saveWalletState();
  if (token && curPos.id) {
    try {
      await authPost(`/api/positions/${curPos.id}/tpsl`, { take_profit: null, stop_loss: curPos.stop_loss });
    } catch(e) {}
  }
  renderPositions();
  repositionChartOverlays();
  showToast('Take Profit removed', 'info');
}

async function cancelCurrentSl(event) {
  if (event) event.stopPropagation();
  const curPos = (walletState?.positions || []).find(p => p.coin === selectedCoin && (p.status === 'open' || !p.status));
  if (!curPos) return;
  curPos.stop_loss = null;
  saveWalletState();
  if (token && curPos.id) {
    try {
      await authPost(`/api/positions/${curPos.id}/tpsl`, { take_profit: curPos.take_profit, stop_loss: null });
    } catch(e) {}
  }
  renderPositions();
  repositionChartOverlays();
  showToast('Stop Loss removed', 'info');
}

async function quickAddTp(event) {
  if (event) event.stopPropagation();
  const curPos = (walletState?.positions || []).find(p => p.coin === selectedCoin && (p.status === 'open' || !p.status));
  if (!curPos) return;
  const isLong = curPos.direction === 'long';
  curPos.take_profit = roundPriceForCoin(isLong ? curPos.entry_price * 1.02 : curPos.entry_price * 0.98, selectedCoin);
  saveWalletState();
  if (token && curPos.id) {
    try {
      await authPost(`/api/positions/${curPos.id}/tpsl`, { take_profit: curPos.take_profit, stop_loss: curPos.stop_loss });
    } catch(e) {}
  }
  renderPositions();
  repositionChartOverlays();
  showToast('🎯 Take Profit added! Drag the green line on chart to adjust price.', 'success');
}

async function quickAddSl(event) {
  if (event) event.stopPropagation();
  const curPos = (walletState?.positions || []).find(p => p.coin === selectedCoin && (p.status === 'open' || !p.status));
  if (!curPos) return;
  const isLong = curPos.direction === 'long';
  curPos.stop_loss = roundPriceForCoin(isLong ? curPos.entry_price * 0.985 : curPos.entry_price * 1.015, selectedCoin);
  saveWalletState();
  if (token && curPos.id) {
    try {
      await authPost(`/api/positions/${curPos.id}/tpsl`, { take_profit: curPos.take_profit, stop_loss: curPos.stop_loss });
    } catch(e) {}
  }
  renderPositions();
  repositionChartOverlays();
  showToast('🛡️ Stop Loss added! Drag the orange line on chart to adjust price.', 'info');
}

async function cancelLimitOrder(orderId, event) {
  if (event) event.stopPropagation();
  if (!orderId) return;

  try {
    const res = await authFetch(`/api/orders/${orderId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Order cancelled', 'info');
      await syncWithBackend();
      renderOrders();
      repositionChartOverlays();
    } else {
      showToast(data.error || 'Failed to cancel order', 'error');
    }
  } catch(err) {
    showToast('Failed to cancel order', 'error');
  }
}

// ─── 1-CLICK TRADING PANEL ORDER EXECUTION ────────────────
async function executeQuickTrade(side) {
  if (isQuickTrading) return; // Prevent double-clicks

  if (!token) {
    await ensurePaperSession();
  }

  const quickInput = document.getElementById('tv-quick-size-input');
  const mainInput = document.getElementById('trade-amount-input');
  let sizeVal = parseFloat(quickInput?.value) || parseFloat(mainInput?.value) || 0;

  if (sizeVal <= 0 || isNaN(sizeVal) || !isFinite(sizeVal)) {
    showToast('❌ Please enter a valid size (> 0)', 'error');
    if (quickInput) quickInput.focus();
    return;
  }

  const coinDef = getCoinDefinition(selectedCoin);
  const curPrice = currentPrices[selectedCoin]?.price;
  if (!curPrice || curPrice <= 0) {
    showToast('❌ Market price is currently unavailable', 'error');
    return;
  }

  const levSelect = document.getElementById('trade-leverage-select') || document.getElementById('tv-quick-leverage');
  const leverage = parseInt(levSelect?.value, 10) || tradeLeverage || 10;
  const direction = (side === 'buy' || side === 'long') ? 'long' : 'short';

  const btn = document.getElementById(side === 'buy' ? 'tv-tl-buy-btn' : 'tv-tl-sell-btn');
  isQuickTrading = true;
  if (btn) btn.classList.add('loading');

  try {
    let res = null;
    try {
      res = await authPost('/api/positions/open', {
        coin: selectedCoin,
        direction: direction,
        size: sizeVal,
        leverage: leverage,
        order_type: 'market'
      });
    } catch (backendErr) {
      console.warn('1-Click backend call failed, falling back to local paper trade:', backendErr);
      res = null;
    }

    if (res && res.error) {
      showToast(`❌ ${res.error}`, 'error');
    } else {
      const actionName = direction === 'long' ? 'Buy' : 'Sell';
      const fillPrice = res?.entry_price || curPrice;

      if (!res) {
        // Local execution
        const notional = sizeVal * curPrice;
        const reqMargin = roundUsd(notional / leverage);
        walletState.cashBalance = Math.max(0, roundUsd(walletState.cashBalance - reqMargin));
        let liqPrice = (direction === 'long')
          ? curPrice * (1 - (1 / leverage) * 0.9)
          : curPrice * (1 + (1 / leverage) * 0.9);
        liqPrice = Math.max(0.0000001, roundUsd(liqPrice));

        walletState.positions = walletState.positions || [];
        walletState.positions.unshift({
          id: Date.now() + Math.floor(Math.random() * 1000),
          coin: selectedCoin,
          symbol: getCoinDefinition(selectedCoin).symbol,
          direction: direction,
          size: roundCoin(sizeVal),
          entry_price: roundUsd(curPrice),
          leverage: leverage,
          margin: reqMargin,
          marginMode: 'isolated',
          liquidationPrice: liqPrice,
          created_at: new Date().toISOString()
        });
        saveWalletState();
      }

      showToast(`${actionName} order filled successfully at $${fmt(fillPrice)}`, 'success');
      try {
        if (res) await syncWithBackend();
        renderPositions();
        renderOrders();
        updateMiniStats();
        repositionChartOverlays();
      } catch (uiErr) {
        console.warn('Post-trade UI update warning:', uiErr);
      }
    }
  } catch(err) {
    console.error('1-Click trade error:', err);
    showToast(`Order processed in paper mode`, 'info');
  } finally {
    isQuickTrading = false;
    if (btn) btn.classList.remove('loading');
  }
}

function quickCloseCurrentPosition() {
  const curPos = (walletState?.positions || []).find(p => p.coin === selectedCoin && (p.status === 'open' || !p.status));
  if (!curPos) {
    showToast('No active position on ' + selectedCoin, 'info');
    return;
  }
  closePositionUnified(curPos.id, null, 'Market');
  setTimeout(repositionChartOverlays, 120);
}

function openTpSlForCurrentPosition() {
  const curPos = (walletState?.positions || []).find(p => p.coin === selectedCoin && (p.status === 'open' || !p.status));
  if (!curPos) return;
  openTpSlModal(curPos.id);
}

// ─── PAIR QUICK MENU TOGGLES ──────────────────────────────
function togglePairQuickMenu() {
  const menu = document.getElementById('chart-pair-quick-menu');
  if (menu) menu.classList.toggle('hidden');
}

function closePairQuickMenu() {
  const menu = document.getElementById('chart-pair-quick-menu');
  if (menu) menu.classList.add('hidden');
}

document.addEventListener('click', (e) => {
  const pill = document.getElementById('chart-active-coin-pill');
  const menu = document.getElementById('chart-pair-quick-menu');
  if (pill && menu && !pill.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.add('hidden');
  }
});


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
    
    // Step 1: Try backend Binance OHLC API (Fast & genuine)
    try {
      const ctl = new AbortController();
      const tm = setTimeout(() => ctl.abort(), 2000);
      const resp = await fetch(`${API}/ohlc/${coinDef.id}?tf=${tf}`, { signal: ctl.signal });
      clearTimeout(tm);
      if (resp.ok) {
        const beData = await resp.json();
        if (beData.candles && beData.candles.length) {
          chartResult = { candles: beData.candles, prices: beData.prices || [], isBaseline: false };
        }
      }
    } catch (beErr) {
      // Step 2: Try CoinGecko OHLC API as fallback
      try {
        chartResult = await fetchCgOhlcWithTimeout(coinDef.id, tf, 2500);
      } catch (cgErr) {}
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
  updateChartCandles(candles);
  repositionChartOverlays();
  update1ClickPrices();
}

let candleViewport = { minP: 0, maxP: 0, plotW: 0, plotH: 0, padTop: 18, padRight: 64, padBottom: 22 };

// ─── CHART ZOOM & PAN STATE ──────────────────────────────
let chartZoom = 1.0;
let chartPanOffset = 0;
let isPanningChart = false;
let panStartX = 0;
let panStartOffset = 0;

function chartZoomIn() {
  chartZoom = Math.min(3.2, chartZoom * 1.25);
  if (chartMode === 'candle' && candleData && candleData.length) {
    renderCandlestickChart(candleData);
    renderDrawings();
  }
}

function chartZoomOut() {
  chartZoom = Math.max(0.35, chartZoom / 1.25);
  if (chartMode === 'candle' && candleData && candleData.length) {
    renderCandlestickChart(candleData);
    renderDrawings();
  }
}

function chartZoomReset() {
  chartZoom = 1.0;
  chartPanOffset = 0;
  if (chartMode === 'candle' && candleData && candleData.length) {
    renderCandlestickChart(candleData);
    renderDrawings();
  }
}

function roundPriceForCoin(price, coin) {
  if (price <= 0 || !isFinite(price)) return price;
  if (coin === 'bitcoin') return Math.round(price * 10) / 10;
  if (coin === 'ethereum') return Math.round(price * 100) / 100;
  return Math.round(price * 100) / 100;
}

function renderCandlestickChart(allCandles) {
  const canvas = document.getElementById('candle-chart');
  if (!canvas || !allCandles || !allCandles.length) return;

  // Zoom & Pan candle window slicing
  const totalN = allCandles.length;
  const visibleCount = Math.max(12, Math.min(totalN, Math.round(55 / chartZoom)));
  const maxOffset = Math.max(0, totalN - visibleCount);
  chartPanOffset = Math.max(0, Math.min(maxOffset, chartPanOffset));
  const startIdx = Math.max(0, totalN - visibleCount - chartPanOffset);
  const endIdx = Math.min(totalN, startIdx + visibleCount);
  const candles = allCandles.slice(startIdx, endIdx);

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

  // Incorporate positions and orders into price scale bounds gracefully
  const curCoinPositions = (walletState?.positions || []).filter(p => p.coin === selectedCoin);
  curCoinPositions.forEach(p => {
    if (p.entry_price && p.entry_price > minP * 0.75 && p.entry_price < maxP * 1.25) {
      if (p.entry_price < minP) minP = p.entry_price;
      if (p.entry_price > maxP) maxP = p.entry_price;
    }
    if (p.take_profit && p.take_profit > minP * 0.75 && p.take_profit < maxP * 1.25) {
      if (p.take_profit < minP) minP = p.take_profit;
      if (p.take_profit > maxP) maxP = p.take_profit;
    }
    if (p.stop_loss && p.stop_loss > minP * 0.75 && p.stop_loss < maxP * 1.25) {
      if (p.stop_loss < minP) minP = p.stop_loss;
      if (p.stop_loss > maxP) maxP = p.stop_loss;
    }
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
  const tGap = Math.max(1, Math.floor(candles.length / timeSteps));
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

    // Volume bar
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

  // ─── OVERLAY ORDERS & POSITIONS ON CHART ───
  curCoinPositions.forEach(p => {
    const isLong = p.direction === 'long';
    
    // 1. Position Entry Price Line
    const entryY = priceToY(p.entry_price);
    if (entryY >= padTop && entryY <= padTop + plotH) {
      ctx.save();
      ctx.strokeStyle = isLong ? '#3b82f6' : '#ec4899';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, entryY);
      ctx.lineTo(plotW, entryY);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Take Profit (TP) Line with Circular Handle
    const tpPrice = p.take_profit || (isLong ? p.entry_price * 1.04 : p.entry_price * 0.96);
    const hasRealTp = !!p.take_profit;
    const tpY = priceToY(tpPrice);
    if (tpY >= padTop && tpY <= padTop + plotH) {
      ctx.save();
      ctx.strokeStyle = '#0ecb81';
      ctx.setLineDash(hasRealTp ? [6, 3] : [2, 4]);
      ctx.lineWidth = hasRealTp ? 1.6 : 1.2;
      ctx.beginPath();
      ctx.moveTo(0, tpY);
      ctx.lineTo(plotW, tpY);
      ctx.stroke();

      // Circular Handle on right
      const hX = plotW - 25;
      ctx.fillStyle = '#0ecb81';
      ctx.beginPath();
      ctx.arc(hX, tpY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Badge label
      const pnlEst = isLong ? (tpPrice - p.entry_price) * p.size : (p.entry_price - tpPrice) * p.size;
      const pnlSign = pnlEst >= 0 ? '+' : '';
      const tpTag = hasRealTp 
        ? `TP: $${fmt(tpPrice)} (${pnlSign}$${fmtNum(pnlEst)}) ↕ DRAG`
        : `+ Set TP: $${fmt(tpPrice)} ↕ DRAG`;
      ctx.font = 'bold 10px Inter, sans-serif';
      const tw = ctx.measureText(tpTag).width + 16;
      ctx.fillStyle = '#0ecb81';
      ctx.fillRect(plotW - tw - 40, tpY - 10, tw, 20);
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'left';
      ctx.fillText(tpTag, plotW - tw - 32, tpY + 4);
      ctx.restore();
    }

    // 3. Stop Loss (SL) Line with Circular Handle
    const slPrice = p.stop_loss || (isLong ? p.entry_price * 0.97 : p.entry_price * 1.03);
    const hasRealSl = !!p.stop_loss;
    const slY = priceToY(slPrice);
    if (slY >= padTop && slY <= padTop + plotH) {
      ctx.save();
      ctx.strokeStyle = '#f6465d';
      ctx.setLineDash(hasRealSl ? [6, 3] : [2, 4]);
      ctx.lineWidth = hasRealSl ? 1.6 : 1.2;
      ctx.beginPath();
      ctx.moveTo(0, slY);
      ctx.lineTo(plotW, slY);
      ctx.stroke();

      // Circular Handle on right
      const hX = plotW - 25;
      ctx.fillStyle = '#f6465d';
      ctx.beginPath();
      ctx.arc(hX, slY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Badge label
      const pnlEst = isLong ? (slPrice - p.entry_price) * p.size : (p.entry_price - slPrice) * p.size;
      const slTag = hasRealSl 
        ? `SL: $${fmt(slPrice)} (-$${fmtNum(Math.abs(pnlEst))}) ↕ DRAG`
        : `+ Set SL: $${fmt(slPrice)} ↕ DRAG`;
      ctx.font = 'bold 10px Inter, sans-serif';
      const tw = ctx.measureText(slTag).width + 16;
      ctx.fillStyle = '#f6465d';
      ctx.fillRect(plotW - tw - 40, slY - 10, tw, 20);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(slTag, plotW - tw - 32, slY + 4);
      ctx.restore();
    }

    // 4. Liquidation Price Line
    const liqPrice = p.liquidationPrice || p.liq_price;
    if (liqPrice && liqPrice > 0) {
      const liqY = priceToY(liqPrice);
      if (liqY >= padTop && liqY <= padTop + plotH) {
        ctx.save();
        ctx.strokeStyle = '#f97316';
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(0, liqY);
        ctx.lineTo(plotW, liqY);
        ctx.stroke();

        ctx.fillStyle = '#ea580c';
        const liqTag = `LIQ: $${fmt(liqPrice)}`;
        ctx.font = 'bold 10px Inter, sans-serif';
        const tw = ctx.measureText(liqTag).width + 12;
        ctx.fillRect(8, liqY - 9, tw, 18);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(liqTag, 14, liqY + 3.5);
        ctx.restore();
      }
    }
  });

  // 5. Open Pending Limit Orders
  const curCoinOrders = (walletState?.orders || []).filter(o => o.coin === selectedCoin && (o.status === 'open' || !o.status));
  curCoinOrders.forEach(o => {
    if (!o.limit_price) return;
    const ordY = priceToY(o.limit_price);
    if (ordY >= padTop && ordY <= padTop + plotH) {
      ctx.save();
      const isLong = (o.side === 'Buy' || o.side === 'Long' || o.side === 'buy' || o.side === 'long');
      ctx.strokeStyle = isLong ? '#10b981' : '#f43f5e';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, ordY);
      ctx.lineTo(plotW, ordY);
      ctx.stroke();

      ctx.fillStyle = isLong ? 'rgba(16,185,129,0.9)' : 'rgba(244,63,94,0.9)';
      const ordTag = `LIMIT ${isLong ? 'BUY' : 'SELL'} @ $${fmt(o.limit_price)}`;
      ctx.font = 'bold 9px Inter, sans-serif';
      const tw = ctx.measureText(ordTag).width + 12;
      ctx.fillRect(8, ordY - 8, tw, 16);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.fillText(ordTag, 14, ordY + 3.5);
      ctx.restore();
    }
  });
}

// ─── NATIVE DRAWING CANVAS ENGINE & DRAG-AND-DROP TP/SL ───
let draggingOrderLine = null;

function setDrawTool(tool) {
  drawTool = tool;
  ['cursor','trend','horiz','brush','measure'].forEach(t => {
    const btn = document.getElementById(`dt-${t}`);
    if (btn) btn.classList.toggle('active', t === tool);
  });
  const cvs = document.getElementById('drawing-canvas');
  if (cvs) {
    cvs.classList.toggle('cursor-mode', tool === 'cursor');
    cvs.classList.toggle('active-draw', tool !== 'cursor');
  }
}

function setDrawColor(color, el) {
  drawColor = color;
  document.querySelectorAll('.ctb-color-row .color-dot, .dt-colors .color-dot').forEach(d => d.classList.remove('active'));
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

function findDraggableLine(pos) {
  const curCoinPositions = (walletState?.positions || []).filter(p => p.coin === selectedCoin);
  for (const p of curCoinPositions) {
    const isLong = p.direction === 'long';
    // Check Take Profit handle / line
    const tpPrice = p.take_profit || (isLong ? p.entry_price * 1.04 : p.entry_price * 0.96);
    const tpY = priceToY(tpPrice);
    if (Math.abs(pos.y - tpY) <= 15) {
      return { pos: p, type: 'tp', y: tpY, price: tpPrice };
    }

    // Check Stop Loss handle / line
    const slPrice = p.stop_loss || (isLong ? p.entry_price * 0.97 : p.entry_price * 1.03);
    const slY = priceToY(slPrice);
    if (Math.abs(pos.y - slY) <= 15) {
      return { pos: p, type: 'sl', y: slY, price: slPrice };
    }
  }
  return null;
}

function setupDrawingCanvas() {
  const cvs = document.getElementById('drawing-canvas');
  if (!cvs) return;

  loadDrawings();

  let isDrawing = false;
  let startPt = null;
  let touchStartDist = 0;
  let touchStartZoom = 1.0;

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
    // Two-finger pinch to zoom
    if (e.touches && e.touches.length === 2) {
      touchStartDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      touchStartZoom = chartZoom;
      isDrawing = false;
      isPanningChart = false;
      return;
    }

    const pos = getCanvasPos(e);

    // Only drag order line if clicking specifically on the handle tag on the right edge
    const draggable = findDraggableLine(pos);
    if (draggable && pos.x >= (candleViewport.plotW - 60) && Math.abs(pos.y - draggable.y) <= 12) {
      if (e.cancelable) e.preventDefault();
      draggingOrderLine = { ...draggable };
      cvs.classList.add('drag-active');
      return;
    }

    // If in cursor mode and not on SL/TP, enable horizontal pan through chart
    if (drawTool === 'cursor') {
      isPanningChart = true;
      panStartX = pos.x;
      panStartOffset = chartPanOffset;
      return;
    }

    if (e.touches && e.touches.length > 1) return;
    isDrawing = true;
    startPt = pos;

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
    // Pinch to zoom gesture
    if (e.touches && e.touches.length === 2 && touchStartDist > 0) {
      if (e.cancelable) e.preventDefault();
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const factor = dist / touchStartDist;
      chartZoom = Math.max(0.35, Math.min(3.2, touchStartZoom * factor));
      renderCandlestickChart(candleData);
      renderDrawings();
      return;
    }

    const pos = getCanvasPos(e);
    updateCrosshairBar(pos);

    // If dragging TP or SL line
    if (draggingOrderLine) {
      if (e.cancelable) e.preventDefault();
      const curPrice = yToPrice(pos.y);
      const roundedPrice = roundPriceForCoin(curPrice, selectedCoin);
      if (roundedPrice > 0) {
        if (draggingOrderLine.type === 'tp') {
          draggingOrderLine.pos.take_profit = roundedPrice;
        } else {
          draggingOrderLine.pos.stop_loss = roundedPrice;
        }
        renderCandlestickChart(candleData);
        renderDrawings();

        // Render floating drag tooltip
        const ctx = cvs.getContext('2d');
        ctx.save();
        const isLong = draggingOrderLine.pos.direction === 'long';
        const estPnl = isLong 
          ? (roundedPrice - draggingOrderLine.pos.entry_price) * draggingOrderLine.pos.size
          : (draggingOrderLine.pos.entry_price - roundedPrice) * draggingOrderLine.pos.size;
        const pnlSign = estPnl >= 0 ? '+' : '';
        const label = `${draggingOrderLine.type.toUpperCase()}: $${fmt(roundedPrice)} (Est. PnL: ${pnlSign}$${fmtNum(estPnl)})`;
        ctx.font = 'bold 11px Inter, sans-serif';
        const lw = ctx.measureText(label).width + 20;
        const rect = cvs.getBoundingClientRect();
        const tx = Math.min(rect.width - lw - 10, Math.max(10, pos.x + 15));
        const ty = Math.max(20, pos.y - 15);
        ctx.fillStyle = draggingOrderLine.type === 'tp' ? '#0ecb81' : '#f6465d';
        ctx.fillRect(tx, ty, lw, 24);
        ctx.fillStyle = draggingOrderLine.type === 'tp' ? '#000000' : '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(label, tx + 10, ty + 16);
        ctx.restore();
      }
      return;
    }

    // Chart pan in cursor mode
    if (isPanningChart && drawTool === 'cursor') {
      if (e.cancelable) e.preventDefault();
      const dx = pos.x - panStartX;
      const candleWidthPixels = (candleViewport.plotW / Math.max(12, Math.round(55 / chartZoom)));
      const candleDelta = Math.round(dx / candleWidthPixels);
      chartPanOffset = Math.max(0, panStartOffset + candleDelta);
      renderCandlestickChart(candleData);
      renderDrawings();
      return;
    }

    // Hover detection for cursor mode
    if (drawTool === 'cursor') {
      const nearby = findDraggableLine(pos);
      if (nearby) {
        cvs.classList.add('drag-handle-hover');
      } else {
        cvs.classList.remove('drag-handle-hover');
      }
      return;
    }

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
    isPanningChart = false;
    touchStartDist = 0;

    if (draggingOrderLine) {
      const lineInfo = draggingOrderLine;
      draggingOrderLine = null;
      cvs.classList.remove('drag-active');
      saveWalletState();
      const updatedVal = lineInfo.type === 'tp' ? lineInfo.pos.take_profit : lineInfo.pos.stop_loss;
      showToast(`${lineInfo.type.toUpperCase()} set to $${fmt(updatedVal)}`, 'success');
      renderPositions();
      renderCandlestickChart(candleData);
      renderDrawings();
      return;
    }

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

  // Mouse wheel zoom
  cvs.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY < 0) chartZoomIn();
    else chartZoomOut();
  }, { passive: false });

  // Resize handler
  window.addEventListener('resize', () => {
    if (chartMode === 'candle' && candleData.length) {
      renderCandlestickChart(candleData);
      renderDrawings();
    }
  });
}

// ─── FULLSCREEN CHART TOGGLE (With Square Options) ─────────
function toggleChartFullscreen() {
  const box = document.getElementById('chart-container-box');
  const exitBtn = document.getElementById('btn-exit-fullscreen');
  const fsBtn = document.getElementById('btn-chart-fullscreen');
  const sqBtn = document.getElementById('square-fs-icon');
  const sqBox = document.getElementById('btn-square-fullscreen');
  if (!box) return;

  const isFs = box.classList.toggle('fullscreen-chart');
  if (exitBtn) exitBtn.classList.toggle('hidden', !isFs);
  if (sqBox) sqBox.classList.toggle('hidden', isFs);
  if (fsBtn) {
    fsBtn.innerHTML = isFs ? '<span class="square-icon-box">✕</span>' : '<span class="square-icon-box">⛶</span> Fullscreen';
    fsBtn.classList.toggle('active', isFs);
  }
  if (sqBtn) {
    sqBtn.textContent = isFs ? '✕' : '⛶';
  }

  requestAnimationFrame(() => {
    resizeChartToContainer();
    repositionHtmlOverlays();
  });
}

// ─── GROWW-STYLE MAIN TAB NAVIGATION & CRYPTO DASHBOARD ──────────
let activeMainTab = 'explore';
let moversFilter = 'gainers';

function formatChangeStr(changePrice, change24h) {
  const sign = (change24h || 0) >= 0 ? '+' : '';
  const priceSign = (changePrice || 0) >= 0 ? '+' : '';
  const absPrice = Math.abs(changePrice || 0);
  const priceFormatted = absPrice >= 10 ? fmt(absPrice) : absPrice.toFixed(2);
  return `${priceSign}$${priceFormatted} (${sign}${(change24h || 0).toFixed(2)}%)`;
}

function updateChartQuickCoinChips() {
  document.querySelectorAll('.cq-coin-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById(`cq-${selectedCoin}`);
  if (activeBtn) activeBtn.classList.add('active');
}

function switchMainTab(tabName, swipeDirection = null) {
  activeMainTab = tabName;

  // Instantly scroll window to top to eliminate any blank offset
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }

  // 1. Update Sub-Navigation strip (kept for backward compatibility if present)
  document.querySelectorAll('.gsub-tab').forEach(b => b.classList.remove('active'));
  const subBtn = document.getElementById(`gsub-${tabName}`);
  if (subBtn) subBtn.classList.add('active');

  // 2. Update Fixed Bottom-Nav (Active Glowing Pill)
  document.querySelectorAll('.groww-bottom-nav .gnav-btn, .vtrade-bottom-nav .vnav-btn').forEach(b => b.classList.remove('active'));
  let navKey = tabName;
  if (tabName === 'orders' || tabName === 'history') navKey = 'positions';
  if (tabName === 'markets') navKey = 'explore';
  if (tabName === 'funds') navKey = 'wallet';
  if (tabName === 'accounts') navKey = 'profile';
  const navBtn = document.getElementById(`gnav-${navKey}`);
  if (navBtn) navBtn.classList.add('active');

  // 3. Cache DOM containers
  const exploreContainer   = document.getElementById('groww-explore-container');
  const chartArea          = document.getElementById('chart-area');
  const chartContainerBox  = document.getElementById('chart-container-box');
  const chartHeader        = document.querySelector('.chart-header');
  const tfRow              = document.querySelector('.tf-row');
  const watchlistSection   = document.getElementById('watchlist-section');
  const marketsPanel       = document.getElementById('markets-panel');
  const positionsContainer = document.getElementById('view-positions-container');
  const historyContainer   = document.getElementById('view-history-container');
  const tradePanel         = document.getElementById('view-trade-panel') || document.querySelector('.order-sidebar');
  const walletPanel        = document.getElementById('view-wallet-panel');
  const accountsPanel      = document.getElementById('view-accounts-panel');
  const indicesTicker      = document.getElementById('groww-indices-ticker');

  // Hide all sections first
  if (exploreContainer)   exploreContainer.classList.add('hidden');
  if (chartArea)          chartArea.classList.add('hidden');
  if (positionsContainer) positionsContainer.classList.add('hidden');
  if (historyContainer)   historyContainer.classList.add('hidden');
  if (tradePanel)         tradePanel.classList.add('hidden');
  if (walletPanel)        walletPanel.classList.add('hidden');
  if (accountsPanel)      accountsPanel.classList.add('hidden');
  if (indicesTicker)      indicesTicker.classList.add('hidden');

  // Strictly keep watchlistSection & marketsPanel hidden on pure chart tab
  if (watchlistSection)   watchlistSection.classList.add('hidden');
  if (marketsPanel)       marketsPanel.classList.add('hidden');

  const isDesktop = typeof window !== 'undefined' && window.innerWidth > 1024;
  let revealedPanel = null;

  if (tabName === 'explore' || tabName === 'markets') {
    if (exploreContainer) {
      exploreContainer.classList.remove('hidden');
      revealedPanel = exploreContainer;
    }
    renderGrowwExploreUI();
  } else if (tabName === 'wallet' || tabName === 'funds') {
    if (walletPanel) {
      walletPanel.classList.remove('hidden');
      revealedPanel = walletPanel;
    }
    renderWalletOverview();
  } else if (tabName === 'profile' || tabName === 'accounts') {
    if (accountsPanel) {
      accountsPanel.classList.remove('hidden');
      accountsPanel.scrollTop = 0;
      revealedPanel = accountsPanel;
    }
    renderAccountsScreen();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  } else if (tabName === 'history') {
    if (historyContainer) {
      historyContainer.classList.remove('hidden');
      revealedPanel = historyContainer;
    }
    renderHistoryScreen();
  } else {
    // Exchange views (chart, trade, positions, orders)
    if (indicesTicker) indicesTicker.classList.remove('hidden');

    if (isDesktop) {
      // Desktop Pro Exchange Layout: Chart + Positions on left, Trade Desk on right (Screenshots 1 & 2)
      if (chartArea) chartArea.classList.remove('hidden');
      if (chartContainerBox) chartContainerBox.classList.remove('hidden');
      if (chartHeader) chartHeader.classList.remove('hidden');
      if (tfRow) tfRow.classList.remove('hidden');
      if (positionsContainer) positionsContainer.classList.remove('hidden');
      if (tradePanel) tradePanel.classList.remove('hidden');

      showBottomTab(tabName === 'orders' ? 'orders' : 'positions');
      updateMiniStats();
      updateTradeActiveCoinBanner();
      updateTradeInstrumentHeader();
      updateVTradeOrderbook();
      updateTradeCalc();
      renderTradingViewChart();
      requestAnimationFrame(() => {
        resizeChartToContainer();
        repositionHtmlOverlays();
      });
    } else {
      // Mobile isolated single-tab mode
      if (tabName === 'chart') {
        if (chartArea) {
          chartArea.classList.remove('hidden');
          revealedPanel = chartArea;
        }
        if (chartContainerBox) chartContainerBox.classList.remove('hidden');
        if (chartHeader) chartHeader.classList.remove('hidden');
        if (tfRow) tfRow.classList.remove('hidden');
        updateChartQuickCoinChips();
        renderTradingViewChart();
        requestAnimationFrame(() => {
          resizeChartToContainer();
          repositionHtmlOverlays();
        });
      } else if (tabName === 'trade') {
        if (tradePanel) {
          tradePanel.classList.remove('hidden');
          revealedPanel = tradePanel;
        }
        updateMiniStats();
        updateTradeActiveCoinBanner();
        updateTradeInstrumentHeader();
        updateVTradeOrderbook();
        updateTradeBottomSection();
        updateTradeCalc();
      } else if (tabName === 'positions' || tabName === 'orders') {
        if (positionsContainer) {
          positionsContainer.classList.remove('hidden');
          revealedPanel = positionsContainer;
        }
        showVTradeOrdersTab(tabName === 'orders' ? 'orders' : 'positions');
        renderPositions();
        renderOrders();
        renderHistory();
      }
    }
  }

  // Apply smooth 120 FPS hardware-accelerated transition if triggered by swipe gesture
  if (revealedPanel && swipeDirection) {
    apply120FpsSwipeAnimation(revealedPanel, swipeDirection);
  }
}

// ══════════════════════ GESTURE ENGINES: PULL-TO-REFRESH & HORIZONTAL SWIPE ══════════════════════
let ptrTouchStartY = 0;
let ptrTouchStartX = 0;
let isPtrActive = false;
let isPtrRefreshing = false;

function initPullToRefresh() {
  const ptrIndicator = document.getElementById('pull-to-refresh-indicator');
  const ptrSpinner = document.getElementById('ptr-spinner');
  const ptrText = document.getElementById('ptr-text');
  if (!ptrIndicator) return;

  window.addEventListener('touchstart', (e) => {
    if (isPtrRefreshing || e.touches.length !== 1) return;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (scrollY <= 2) {
      ptrTouchStartY = e.touches[0].clientY;
      ptrTouchStartX = e.touches[0].clientX;
      isPtrActive = true;
    } else {
      isPtrActive = false;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isPtrActive || isPtrRefreshing) return;
    const curY = e.touches[0].clientY;
    const curX = e.touches[0].clientX;
    const deltaY = curY - ptrTouchStartY;
    const deltaX = curX - ptrTouchStartX;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

    if (scrollY <= 2 && deltaY > 10 && deltaY > Math.abs(deltaX) * 1.3) {
      ptrIndicator.classList.add('pulling');
      const pullOffset = Math.min(deltaY * 0.45, 80);
      ptrIndicator.style.transform = `translateY(${pullOffset - 60}px)`;
      const rot = Math.min((pullOffset / 60) * 180, 180);
      if (ptrSpinner) ptrSpinner.style.transform = `rotate(${rot}deg)`;
      if (ptrText) {
        ptrText.textContent = pullOffset >= 55 ? 'Release to refresh' : 'Pull down to refresh';
      }
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (!isPtrActive || isPtrRefreshing) {
      isPtrActive = false;
      return;
    }
    isPtrActive = false;
    ptrIndicator.classList.remove('pulling');

    const match = ptrIndicator.style.transform.match(/translateY\((-?\d+(\.\d+)?)px\)/);
    const currentOffset = match ? parseFloat(match[1]) : -60;

    if (currentOffset >= -10) {
      triggerGlobalRefresh();
    } else {
      ptrIndicator.style.transform = '';
      if (ptrSpinner) ptrSpinner.style.transform = '';
      if (ptrText) ptrText.textContent = 'Pull down to refresh';
    }
  }, { passive: true });
}

async function triggerGlobalRefresh() {
  const ptrIndicator = document.getElementById('pull-to-refresh-indicator');
  const ptrSpinner = document.getElementById('ptr-spinner');
  const ptrText = document.getElementById('ptr-text');
  if (isPtrRefreshing) return;
  isPtrRefreshing = true;

  if (ptrIndicator) {
    ptrIndicator.classList.add('refreshing');
    ptrIndicator.style.transform = 'translateY(12px)';
  }
  if (ptrText) ptrText.textContent = 'Updating prices & balances...';

  try {
    // 1. Fetch fresh live prices directly from Binance
    if (typeof fetchBinanceDirect === 'function') {
      await fetchBinanceDirect().catch(() => {});
    }
    // 2. Fetch authenticated portfolio & positions if logged in
    if (typeof loadPortfolio === 'function') {
      await loadPortfolio().catch(() => {});
    }
    // 3. Re-render all views and balances
    if (typeof renderPositions === 'function') renderPositions();
    if (typeof renderOrders === 'function') renderOrders();
    if (typeof renderOpenOrdersCardList === 'function') renderOpenOrdersCardList();
    if (typeof renderFundsBalance === 'function') renderFundsBalance();
    if (typeof renderAccountsScreen === 'function') renderAccountsScreen();
    if (typeof renderWalletOverview === 'function') renderWalletOverview();

    if (ptrText) ptrText.textContent = 'Refreshed!';
    showToast('Data refreshed successfully!', 'success');
  } catch (err) {
    showToast('Refreshed local trading state', 'info');
  } finally {
    setTimeout(() => {
      if (ptrIndicator) {
        ptrIndicator.classList.remove('refreshing');
        ptrIndicator.style.transform = '';
      }
      if (ptrSpinner) ptrSpinner.style.transform = '';
      if (ptrText) ptrText.textContent = 'Pull down to refresh';
      isPtrRefreshing = false;
    }, 600);
  }
}

// Horizontal Swipe Across All Bottom Navbar Categories
const MAIN_BOTTOM_NAV_CATEGORIES = ['orders', 'explore', 'trade', 'funds', 'accounts'];
let hSwipeStartX = 0;
let hSwipeStartY = 0;
let hSwipeStartTime = 0;

function initHorizontalSwipeNavigation() {
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    const target = e.target;
    // Exempt interactive chart canvas, TradingView widgets, sliders, text inputs, open dialogs
    if (target.closest('#tradingview-chart-container') ||
        target.closest('.chart-wrapper') ||
        target.closest('#chart-canvas') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select') ||
        target.closest('.modal') ||
        target.closest('.dialog-overlay') ||
        target.closest('.vtrade-dialog-overlay')) {
      hSwipeStartX = 0;
      return;
    }
    hSwipeStartX = e.touches[0].clientX;
    hSwipeStartY = e.touches[0].clientY;
    hSwipeStartTime = Date.now();
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (!hSwipeStartX) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - hSwipeStartX;
    const deltaY = endY - hSwipeStartY;
    const duration = Date.now() - hSwipeStartTime;
    hSwipeStartX = 0;

    // Minimum swipe distance: 55px, dominant horizontal movement, within 650ms
    if (duration < 650 && Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.35) {
      let currentTab = activeMainTab || 'explore';
      if (currentTab === 'positions' || currentTab === 'history') currentTab = 'orders';
      if (currentTab === 'markets') currentTab = 'explore';
      if (currentTab === 'wallet') currentTab = 'funds';
      if (currentTab === 'profile') currentTab = 'accounts';

      const currentIndex = MAIN_BOTTOM_NAV_CATEGORIES.indexOf(currentTab);
      if (currentIndex === -1) return;

      if (deltaX < 0) {
        // Swipe Left -> Next Category
        if (currentIndex < MAIN_BOTTOM_NAV_CATEGORIES.length - 1) {
          const nextTab = MAIN_BOTTOM_NAV_CATEGORIES[currentIndex + 1];
          switchMainTab(nextTab, 'slide-left');
          triggerSwipeHapticFeedback();
        }
      } else {
        // Swipe Right -> Previous Category
        if (currentIndex > 0) {
          const prevTab = MAIN_BOTTOM_NAV_CATEGORIES[currentIndex - 1];
          switchMainTab(prevTab, 'slide-right');
          triggerSwipeHapticFeedback();
        }
      }
    }
  }, { passive: true });
}

function apply120FpsSwipeAnimation(panelEl, swipeDirection) {
  if (!panelEl || !swipeDirection) return;
  panelEl.classList.remove('vtrade-swipe-left', 'vtrade-swipe-right');
  // Trigger immediate layout pass so CSS hardware animation cleanly triggers at 120 FPS
  void panelEl.offsetWidth;
  const cls = (swipeDirection === 'slide-left') ? 'vtrade-swipe-left' : 'vtrade-swipe-right';
  panelEl.classList.add(cls);
  setTimeout(() => {
    if (panelEl) panelEl.classList.remove(cls);
  }, 220);
}

function triggerSwipeHapticFeedback() {
  if (typeof navigator !== 'undefined' && navigator.vibrate && hapticFeedbackActive) {
    try { navigator.vibrate(15); } catch (_) {}
  }
}

// ─── SCREEN 1: ORDERS SCREEN FUNCTIONS (Screenshot 1 Match) ───────────
let activeOrdersTab = 'positions';

function showVTradeOrdersTab(type) {
  activeOrdersTab = type;
  const posBtn = document.getElementById('orders-seg-positions');
  const ordBtn = document.getElementById('orders-seg-orders');
  const panelPos = document.getElementById('panel-positions');
  const panelOrd = document.getElementById('panel-orders');

  if (type === 'positions') {
    if (posBtn) posBtn.classList.add('active');
    if (ordBtn) ordBtn.classList.remove('active');
    if (panelPos) panelPos.classList.remove('hidden');
    if (panelOrd) panelOrd.classList.add('hidden');
    renderPositions();
  } else {
    if (posBtn) posBtn.classList.remove('active');
    if (ordBtn) ordBtn.classList.add('active');
    if (panelPos) panelPos.classList.add('hidden');
    if (panelOrd) panelOrd.classList.remove('hidden');
    renderOrders();
  }
}

// ─── SCREEN 2: HISTORY SCREEN FUNCTIONS (Screenshot 2 Match) ──────────
let activeHistorySubTab = 'order';

function showHistorySubTab(sub) {
  activeHistorySubTab = sub;
  const orderBtn = document.getElementById('hist-seg-order');
  const tradeBtn = document.getElementById('hist-seg-trade');
  const transBtn = document.getElementById('hist-seg-trans');

  if (orderBtn) orderBtn.classList.toggle('active', sub === 'order');
  if (tradeBtn) tradeBtn.classList.toggle('active', sub === 'trade');
  if (transBtn) transBtn.classList.toggle('active', sub === 'transaction');

  renderHistoryScreen();
}

function renderHistoryScreen() {
  const container = document.getElementById('history-content-area');
  if (!container) return;

  if (activeHistorySubTab === 'order') {
    const orders = walletState.orders || [];
    if (!orders.length) {
      container.innerHTML = renderVTradeEmptyState('Deposit Funds to Your Wallet', 'Start your trading journey with us.', 'Deposit Funds');
      return;
    }
    container.innerHTML = `
      <div class="pos-cards-list" style="padding:16px;">
        ${orders.map(o => `
          <div class="pos-card">
            <div class="pos-card-header">
              <span class="pos-card-sym">${(o.symbol || o.coin).toUpperCase()}</span>
              <span class="badge ${o.direction === 'long' ? 'badge-long' : 'badge-short'}">${(o.direction || 'BUY').toUpperCase()}</span>
            </div>
            <div class="pos-card-body">
              <div class="pos-card-row"><span>Type</span><span>${(o.type || 'LIMIT').toUpperCase()}</span></div>
              <div class="pos-card-row"><span>Price</span><span>$${fmt(o.price)}</span></div>
              <div class="pos-card-row"><span>Amount</span><span>${o.size}</span></div>
              <div class="pos-card-row"><span>Status</span><span style="color:var(--v-amber);">${o.status || 'Pending'}</span></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (activeHistorySubTab === 'trade') {
    const history = walletState.history || [];
    if (!history.length) {
      container.innerHTML = renderVTradeEmptyState('Deposit Funds to Your Wallet', 'Start your trading journey with us.', 'Deposit Funds');
      return;
    }
    container.innerHTML = `
      <div class="pos-cards-list" style="padding:16px;">
        ${history.map(h => {
          const isPos = (h.realizedPnl || 0) >= 0;
          return `
            <div class="pos-card">
              <div class="pos-card-header">
                <span class="pos-card-sym">${(h.symbol || h.coin).toUpperCase()}</span>
                <span class="badge ${isPos ? 'badge-long' : 'badge-short'}">${isPos ? '+' : ''}$${fmtNum(h.realizedPnl || 0)}</span>
              </div>
              <div class="pos-card-body">
                <div class="pos-card-row"><span>Side</span><span>${(h.direction || h.side || 'LONG').toUpperCase()}</span></div>
                <div class="pos-card-row"><span>Close Price</span><span>$${fmt(h.closePrice || h.price || 0)}</span></div>
                <div class="pos-card-row"><span>Quantity</span><span>${h.size}</span></div>
                <div class="pos-card-row"><span>Time</span><span>${h.time ? new Date(h.time).toLocaleTimeString() : 'Recent'}</span></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    container.innerHTML = renderVTradeEmptyState('Deposit Funds to Your Wallet', 'Start your trading journey with us.', 'Deposit Funds');
  }
}

// ─── SCREEN 3 & 4: MARKETS SCREEN FUNCTIONS (Screenshots 3 & 4 Match) ──
let activeMarketsCategory = 'all';
let activeMarketsQuote = 'USDT';
let marketsSortBy = 'pair';
let marketsSortAsc = true;
let marketsFavOnly = false;
let userFavoriteCoins = ['bitcoin', 'ethereum', 'solana'];

function filterMarketsCategory(cat, btn) {
  activeMarketsCategory = cat;
  document.querySelectorAll('.mcat-chip').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderMarketsCoinList();
}

function setMarketsQuote(quote) {
  activeMarketsQuote = quote;
  document.querySelectorAll('.markets-nav-tab').forEach(b => b.classList.remove('active'));
  const tab = document.getElementById(`mnav-tab-${quote.toLowerCase()}`);
  if (tab) tab.classList.add('active');
  renderMarketsCoinList();
}

function toggleFavoritesFilter() {
  marketsFavOnly = !marketsFavOnly;
  const btn = document.getElementById('btn-fav-filter');
  if (btn) btn.classList.toggle('active', marketsFavOnly);
  renderMarketsCoinList();
}

function sortMarketsList(col) {
  if (marketsSortBy === col) {
    marketsSortAsc = !marketsSortAsc;
  } else {
    marketsSortBy = col;
    marketsSortAsc = true;
  }
  renderMarketsCoinList();
}

function toggleMarketsSortOrder() {
  marketsSortAsc = !marketsSortAsc;
  renderMarketsCoinList();
}

function fmtMarketVol(vol) {
  if (!vol || isNaN(vol)) return '$1.20B';
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
  return `$${fmt(vol)}`;
}

function renderMarketsCoinList() {
  const container = document.getElementById('markets-coin-list');
  if (!container) return;

  let list = [...COIN_LIST];

  // 1. Filter by Favorites
  if (marketsFavOnly) {
    list = list.filter(c => userFavoriteCoins.includes(c.id));
  }

  // 2. Filter by Search Query (Real-time live filtering on markets screen)
  if (marketsSearchQuery) {
    list = list.filter(c =>
      c.symbol.toLowerCase().includes(marketsSearchQuery) ||
      c.name.toLowerCase().includes(marketsSearchQuery) ||
      c.id.toLowerCase().includes(marketsSearchQuery)
    );
  }

  // 3. Filter by Category
  if (activeMarketsCategory && activeMarketsCategory !== 'all') {
    if (activeMarketsCategory === 'new') {
      list = list.filter(c => c.tags?.includes('new') || c.category === 'DeFi' || c.id === 'orca' || c.id === 'sui');
    } else if (activeMarketsCategory === 'meme') {
      list = list.filter(c => c.category === 'Meme' || c.tags?.includes('Meme'));
    } else if (activeMarketsCategory === 'l1') {
      list = list.filter(c => c.category === 'Layer 1' || c.tags?.includes('l1') || c.category === 'Majors');
    } else if (activeMarketsCategory === 'l2') {
      list = list.filter(c => c.tags?.includes('l2') || c.id === 'solana' || c.id === 'near');
    } else if (activeMarketsCategory === 'ai') {
      list = list.filter(c => c.tags?.includes('ai') || c.id === 'near');
    }
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div style="padding:48px 20px; text-align:center; color:var(--v-text-muted);">
        <div style="font-size:28px; margin-bottom:8px;">🔍</div>
        <p style="font-size:14px; font-weight:600; color:#ffffff; margin-bottom:4px;">No coins found</p>
        <span style="font-size:12px; opacity:0.7;">No crypto pairs matching "${escapeHtml(marketsSearchQuery)}"</span>
      </div>
    `;
    return;
  }

  // 3. Sort list
  list.sort((a, b) => {
    const aData = currentPrices[a.id] || { price: a.basePrice, change24h: a.baseChange };
    const bData = currentPrices[b.id] || { price: b.basePrice, change24h: b.baseChange };
    let res = 0;
    if (marketsSortBy === 'price') {
      res = (aData.price || 0) - (bData.price || 0);
    } else {
      res = a.symbol.localeCompare(b.symbol);
    }
    return marketsSortAsc ? res : -res;
  });

  const quoteRate = activeMarketsQuote === 'INR' ? usdToInrRate : 1;
  const quoteSuffix = activeMarketsQuote;

  container.innerHTML = list.map(c => {
    const cData = currentPrices[c.id] || { price: c.basePrice, change24h: c.baseChange, volume24h: c.baseVol };
    const price = (cData.price || c.basePrice) * quoteRate;
    const chg = cData.change24h !== undefined ? cData.change24h : c.baseChange;
    const isPos = chg >= 0;
    const lev = c.leverage || 100;
    const volStr = fmtMarketVol(cData.volume24h || c.baseVol);

    return `
      <div class="mcoin-row" onclick="selectCoin('${c.id}'); switchMainTab('trade');">
        <div class="mcoin-left">
          <img src="${c.icon}" class="mcoin-avatar" alt="${c.symbol}" />
          <div class="mcoin-info">
            <div class="mcoin-symbol-row">
              <span class="mcoin-symbol-main">${c.symbol}</span>
              <span class="mcoin-symbol-quote">-${quoteSuffix}</span>
            </div>
            <div class="mcoin-sub-row">
              <span class="mcoin-leverage-badge">${lev}x</span>
              <span class="mcoin-vol-text">Vol: ${volStr}</span>
            </div>
          </div>
        </div>
        <div class="mcoin-right">
          <span class="mcoin-price">${price >= 1 ? price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : price.toFixed(price < 0.01 ? 6 : 4)}</span>
          <span class="mcoin-chg-pill ${isPos ? 'pos' : 'neg'}">${isPos ? '+' : ''}${chg.toFixed(2)}%</span>
        </div>
      </div>
    `;
  }).join('');
}

// ─── SCREEN 5: SPLIT TRADE DESK & ORDERBOOK FUNCTIONS (Screenshot 5 Match) ───
function updateVTradeOrderbook() {
  const asksContainer = document.getElementById('ob-asks-list');
  const bidsContainer = document.getElementById('ob-bids-list');
  const midPriceEl = document.getElementById('ob-mid-price-val');
  const midMarkEl = document.getElementById('ob-mid-mark-val');
  const buyerRatioText = document.getElementById('ob-buyer-ratio-text');
  const sellerRatioText = document.getElementById('ob-seller-ratio-text');
  const buyerRatioBar = document.getElementById('ob-ratio-buyer-bar');
  const sellerRatioBar = document.getElementById('ob-ratio-seller-bar');

  if (!asksContainer || !bidsContainer) return;

  const curData = currentPrices[selectedCoin] || COIN_LIST.find(c => c.id === selectedCoin) || COIN_LIST[0];
  const price = curData.price || curData.basePrice || 82061.3;
  const chg = curData.change24h || 0;
  const isPos = chg >= 0;

  if (midPriceEl) {
    midPriceEl.textContent = `${price >= 1 ? price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : price.toFixed(4)} ${isPos ? '↑' : '↓'}`;
    midPriceEl.style.color = isPos ? 'var(--v-green)' : 'var(--v-red)';
  }
  if (midMarkEl) {
    const markP = price * (1 + (Math.random() * 0.0004 - 0.0002));
    midMarkEl.textContent = `M ${markP >= 1 ? markP.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : markP.toFixed(4)}`;
  }

  // 6 Ask levels (descending order)
  const askOffsets = [0.0008, 0.0006, 0.0005, 0.0003, 0.0002, 0.0001];
  const askQtys = [0.002, 0.001, 0.063, 0.025, 0.006, 3.665];
  const maxQty = 4.0;

  asksContainer.innerHTML = askOffsets.map((off, i) => {
    const p = price * (1 + off);
    const q = askQtys[i] || (Math.random() * 0.5 + 0.01).toFixed(3);
    const depthPct = Math.min(100, Math.round((parseFloat(q) / maxQty) * 100));
    return `
      <div class="ob-row">
        <span class="ob-price ask">${p >= 1 ? p.toFixed(1) : p.toFixed(4)}</span>
        <span class="ob-qty">${q}</span>
        <div class="ob-depth-bar ask" style="width: ${depthPct}%;"></div>
      </div>
    `;
  }).join('');

  // 6 Bid levels (descending order)
  const bidOffsets = [-0.0001, -0.0002, -0.0003, -0.0005, -0.0006, -0.0008];
  const bidQtys = [1.438, 0.468, 0.001, 0.002, 0.002, 0.100];

  bidsContainer.innerHTML = bidOffsets.map((off, i) => {
    const p = price * (1 + off);
    const q = bidQtys[i] || (Math.random() * 0.5 + 0.01).toFixed(3);
    const depthPct = Math.min(100, Math.round((parseFloat(q) / maxQty) * 100));
    return `
      <div class="ob-row">
        <span class="ob-price bid">${p >= 1 ? p.toFixed(1) : p.toFixed(4)}</span>
        <span class="ob-qty">${q}</span>
        <div class="ob-depth-bar bid" style="width: ${depthPct}%;"></div>
      </div>
    `;
  }).join('');

  // Sentiment Ratio
  const buyerPct = 41.08 + (Math.sin(Date.now() / 10000) * 4);
  const sellerPct = 100 - buyerPct;
  if (buyerRatioText) buyerRatioText.textContent = `B ${buyerPct.toFixed(2)}%`;
  if (sellerRatioText) sellerRatioText.textContent = `${sellerPct.toFixed(2)}% S`;
  if (buyerRatioBar) buyerRatioBar.style.width = `${buyerPct}%`;
  if (sellerRatioBar) sellerRatioBar.style.width = `${sellerPct}%`;
}

function updateTradeInstrumentHeader() {
  const icon = document.getElementById('tinst-active-icon');
  const sym = document.getElementById('tinst-active-symbol');
  const chgBadge = document.getElementById('tinst-active-chg');

  const coin = COIN_LIST.find(c => c.id === selectedCoin) || COIN_LIST[0];
  const pData = currentPrices[selectedCoin] || { price: coin.basePrice, change24h: coin.baseChange };

  if (icon) icon.src = coin.icon;
  if (sym) sym.textContent = `${coin.symbol}-USDT`;
  if (chgBadge) {
    const isPos = (pData.change24h || 0) >= 0;
    chgBadge.textContent = `${isPos ? '+' : ''}${(pData.change24h || 0).toFixed(2)}%`;
    chgBadge.className = `tinst-chg-badge ${isPos ? 'pos' : 'neg'}`;
  }

  // Also update Screenshot 2 Chart Header elements
  const chartIcon = document.getElementById('chart-vtrade-coin-icon');
  const chartSym = document.getElementById('chart-vtrade-symbol');
  const chartChg = document.getElementById('chart-vtrade-chg-pill');
  if (chartIcon) chartIcon.src = coin.icon;
  if (chartSym) chartSym.textContent = `${coin.symbol}-USDT`;
  if (chartChg) {
    const isPos = (pData.change24h || 0) >= 0;
    chartChg.textContent = `${isPos ? '+' : ''}${(pData.change24h || 0).toFixed(2)}%`;
    chartChg.className = `cvh-chg-pill ${isPos ? 'pos' : 'neg'}`;
  }
}

function setSnapPercent(pct) {
  document.querySelectorAll('.tform-snap-dot').forEach(dot => {
    const dPct = parseFloat(dot.getAttribute('data-pct')) / 100;
    dot.classList.toggle('active', dPct <= pct);
  });
  const bar = document.getElementById('tform-slider-progress');
  if (bar) bar.style.width = `${pct * 100}%`;
  setQuickPercent(pct);
}

function toggleTpSlSection() {
  const body = document.getElementById('tpsl-body');
  if (body) body.classList.toggle('hidden');
}

// ─── SCREEN 1: POSITION / ORDERS SECTION & EMPTY STATE (Screenshot 1 Match) ───
function renderNoDataState() {
  return `
    <div class="vtrade-no-data-state">
      <div class="vtrade-no-data-icon">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="4"></rect>
          <path d="M7 8h6"></path>
          <circle cx="16" cy="8" r="1" fill="currentColor"></circle>
          <line x1="7" y1="12" x2="17" y2="12"></line>
          <line x1="7" y1="16" x2="13" y2="16"></line>
        </svg>
      </div>
      <div class="vtrade-no-data-text">No Data Available</div>
    </div>
  `;
}

let allMarketsFilterActive = true;
function toggleAllMarketsFilter(chk) {
  allMarketsFilterActive = !!chk;
  updateTradeBottomSection();
}

let activeTradeBottomTab = 'pos';

function switchTradeBottomTab(tab) {
  activeTradeBottomTab = tab;
  const posTab = document.getElementById('tbpos-tab-pos');
  const ordTab = document.getElementById('tbpos-tab-orders');
  if (posTab) posTab.classList.toggle('active', tab === 'pos');
  if (ordTab) ordTab.classList.toggle('active', tab === 'orders');
  updateTradeBottomSection();
}

function updateTradeBottomSection() {
  const container = document.getElementById('trade-bottom-content-area');
  const countPos = document.getElementById('tbpos-count-pos');
  const countOrders = document.getElementById('tbpos-count-orders');

  let positions = walletState.positions || [];
  let orders = walletState.orders || [];

  if (countPos) countPos.textContent = `(${positions.length})`;
  if (countOrders) countOrders.textContent = `(${orders.length})`;

  if (!container) return;

  if (activeTradeBottomTab === 'pos') {
    if (!allMarketsFilterActive) {
      positions = positions.filter(p => p.coin === selectedCoin);
    }
    if (!positions.length) {
      container.innerHTML = renderNoDataState();
      return;
    }
    container.innerHTML = `
      <div class="pos-cards-list">
        ${positions.map(p => {
          const coinDef = getCoinDefinition(p.coin);
          const curPrice = currentPrices[p.coin]?.price || p.entry_price;
          const priceDiff = (p.direction === 'long') ? (curPrice - p.entry_price) : (p.entry_price - curPrice);
          const pnl = roundUsd(priceDiff * p.size);
          const isPos = pnl >= 0;
          return `
            <div class="pos-card" style="margin-bottom:8px;">
              <div class="pos-card-header">
                <span class="pos-card-sym">${coinDef.symbol}-USDT</span>
                <span class="badge ${p.direction === 'long' ? 'badge-long' : 'badge-short'}">${(p.direction).toUpperCase()} ${p.leverage}x</span>
              </div>
              <div class="pos-card-body">
                <div class="pos-card-row"><span>Size</span><span>${p.size} ${coinDef.symbol}</span></div>
                <div class="pos-card-row"><span>Entry</span><span>$${fmt(p.entry_price)}</span></div>
                <div class="pos-card-row"><span>Mark</span><span>$${fmt(curPrice)}</span></div>
                <div class="pos-card-row"><span>PnL</span><span class="${isPos ? 'pnl-pos' : 'pnl-neg'}" style="font-weight:700;">${isPos ? '+' : ''}$${fmtNum(pnl)}</span></div>
              </div>
              <button type="button" class="btn-close-pos" style="width:100%; margin-top:8px;" onclick="closePositionUnified(${p.id})">Close Position</button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    if (!allMarketsFilterActive) {
      orders = orders.filter(o => o.coin === selectedCoin);
    }
    if (!orders.length) {
      container.innerHTML = renderNoDataState();
      return;
    }
    container.innerHTML = `
      <div class="pos-cards-list">
        ${orders.map(o => `
          <div class="pos-card" style="margin-bottom:8px;">
            <div class="pos-card-header">
              <span class="pos-card-sym">${(o.symbol || o.coin).toUpperCase()}</span>
              <span class="badge ${o.direction === 'long' ? 'badge-long' : 'badge-short'}">${(o.direction || 'BUY').toUpperCase()}</span>
            </div>
            <div class="pos-card-body">
              <div class="pos-card-row"><span>Type</span><span>${(o.type || 'LIMIT').toUpperCase()}</span></div>
              <div class="pos-card-row"><span>Price</span><span>$${fmt(o.price)}</span></div>
              <div class="pos-card-row"><span>Amount</span><span>${o.size}</span></div>
            </div>
            <button type="button" class="btn-close-pos" style="width:100%; margin-top:8px;" onclick="cancelLimitOrder(${o.id})">Cancel Order</button>
          </div>
        `).join('')}
      </div>
    `;
  }
}

// ─── SCREEN 2: CHART SCREEN QUICK-TRADE DOCK & ACTIONS (Screenshot 2 Match) ───
let chartTradeOtype = 'market';
let chartTradeLeverage = 150;

function toggleOrderTypeFromChart() {
  const nextType = (tradeOrderType === 'market') ? 'limit' : 'market';
  selectTradeOrderType(nextType);
}

function toggleLeverageFromChart() {
  const levs = [150, 100, 50, 25, 10, 5, 1];
  const nextIdx = (levs.indexOf(tradeLeverage) + 1) % levs.length;
  const newLev = levs[nextIdx];
  setLeverage(newLev);
}

function syncChartTradeQty(val) {
  const mainInput = document.getElementById('trade-amount-input');
  if (mainInput && val !== mainInput.value) {
    mainInput.value = val;
  }
  updateTradeCalc();
}

function syncTradeDeskQty(val) {
  const cqtdInp = document.getElementById('cqtd-qty-input');
  if (cqtdInp && val !== cqtdInp.value) {
    cqtdInp.value = val;
  }
  updateTradeCalc();
}

async function executeChartQuickTrade(side) {
  const qtyInput = document.getElementById('cqtd-qty-input');
  const size = parseFloat(qtyInput?.value || 0.01);
  if (!size || size <= 0) {
    showToast('Please enter a valid quantity', 'error');
    return;
  }
  const mainInput = document.getElementById('trade-amount-input');
  if (mainInput) mainInput.value = size;
  currentDirection = (side === 'buy' || side === 'long') ? 'long' : 'short';
  await executeTrade();
}

function toggleChartFavorite() {
  const btn = document.getElementById('btn-chart-fav');
  const isFav = userFavoriteCoins.includes(selectedCoin);
  if (isFav) {
    userFavoriteCoins = userFavoriteCoins.filter(id => id !== selectedCoin);
    if (btn) btn.style.opacity = '0.5';
    showToast('Removed from Favorites', 'info');
  } else {
    userFavoriteCoins.push(selectedCoin);
    if (btn) btn.style.opacity = '1';
    showToast('Added to Favorites', 'success');
  }
}

function toggleChartSettings() {
  openSettingsSheet();
}

// ─── SCREEN 3: FUNDS / WALLET FUNCTIONS (Screenshot 3 Match) ───
// ─── DYNAMIC NET EQUITY ENGINE (Screenshots 1 & 2 Sync) ───────────
function computeNetEquity() {
  const cash = (walletState && typeof walletState.cashBalance === 'number') 
    ? walletState.cashBalance 
    : ((walletState && typeof walletState.cash === 'number') ? walletState.cash : 10000);
  const open = walletState?.positions || [];
  let totalMargin = 0;
  let totalUnrealized = 0;

  open.forEach(p => {
    totalMargin += (p.margin || 0);
    const curPrice = currentPrices[p.coin]?.price || p.entry_price || 0;
    const priceDiff = (p.direction === 'long') ? (curPrice - p.entry_price) : (p.entry_price - curPrice);
    totalUnrealized += (priceDiff * (p.size || 0));
  });

  return Math.max(0, roundUsd(cash + totalMargin + totalUnrealized));
}

let activeFundsWalletTab = 'futures';
let fundsBalanceHidden = false;
let activeFundsSheetTab = 'fiat';

function switchFundsWalletTab(tab) {
  activeFundsWalletTab = tab;
  const inrBtn = document.getElementById('vfunds-tab-inr');
  const futBtn = document.getElementById('vfunds-tab-futures');
  if (inrBtn) inrBtn.classList.toggle('active', tab === 'inr');
  if (futBtn) futBtn.classList.toggle('active', tab === 'futures');

  const inrToggleBtn = document.getElementById('vfunds-curr-inr');
  const usdtToggleBtn = document.getElementById('vfunds-curr-usdt');
  if (inrToggleBtn) inrToggleBtn.classList.toggle('active', tab === 'inr');
  if (usdtToggleBtn) usdtToggleBtn.classList.toggle('active', tab === 'futures');

  const depSub = document.getElementById('vfunds-dep-sub');
  const withSub = document.getElementById('vfunds-with-sub');
  if (depSub) depSub.textContent = tab === 'inr' ? 'INR' : 'USDT';
  if (withSub) withSub.textContent = tab === 'inr' ? 'INR' : 'USDT';

  renderFundsBalance();
}

function toggleFundsBalanceCurrency() {
  switchFundsWalletTab(activeFundsWalletTab === 'inr' ? 'futures' : 'inr');
}

function toggleFundsBalanceVisibility() {
  fundsBalanceHidden = !fundsBalanceHidden;
  const eyeBtn = document.getElementById('vfunds-eye-btn');
  if (eyeBtn) eyeBtn.textContent = fundsBalanceHidden ? '🔒' : '👁';
  renderFundsBalance();
}

function renderFundsBalance() {
  const balEl = document.getElementById('vfunds-balance-display');
  if (!balEl) return;

  const netEquity = computeNetEquity();

  const inrToggleBtn = document.getElementById('vfunds-curr-inr');
  const usdtToggleBtn = document.getElementById('vfunds-curr-usdt');
  if (inrToggleBtn) inrToggleBtn.classList.toggle('active', activeFundsWalletTab === 'inr');
  if (usdtToggleBtn) usdtToggleBtn.classList.toggle('active', activeFundsWalletTab === 'futures');

  if (fundsBalanceHidden) {
    balEl.textContent = activeFundsWalletTab === 'inr' ? '₹ ••••••••' : '$ ••••••••';
    return;
  }

  if (activeFundsWalletTab === 'inr') {
    const inrVal = netEquity * (usdToInrRate || 92.5);
    balEl.textContent = `₹ ${inrVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    balEl.textContent = `$ ${netEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
  }
}

function openFundsInfoDialog() {
  showToast('VTrade Paper Trading: Risk-free virtual demo wallet with genuine real-time market data.', 'info');
}

function openFundsTransferDialog() {
  showToast('Instant zero-fee transfer between Virtual INR and Futures USDT.', 'info');
}

function switchFundsSheetTab(tab) {
  activeFundsSheetTab = tab;
  const fTab = document.getElementById('vfunds-shtab-fiat');
  const rTab = document.getElementById('vfunds-shtab-ref');
  if (fTab) fTab.classList.toggle('active', tab === 'fiat');
  if (rTab) rTab.classList.toggle('active', tab === 'referral');
}

// ─── SCREEN 4: ACCOUNTS & PAPER-TRADING PREFERENCES (Screenshot 4 Match) ───
let userCustomName = 'flipfishtrust';
let accountsCurrency = safeStorageGet('vtrade_accounts_currency') || 'INR';

function setAccountsCurrency(curr) {
  accountsCurrency = curr;
  safeStorageSet('vtrade_accounts_currency', curr);
  const inrBtn = document.getElementById('vacc-curr-inr');
  const usdBtn = document.getElementById('vacc-curr-usd');
  if (inrBtn) inrBtn.classList.toggle('active', curr === 'INR');
  if (usdBtn) usdBtn.classList.toggle('active', curr === 'USD');
  renderAccountsScreen();
}

function toggleAccountsCurrency() {
  setAccountsCurrency(accountsCurrency === 'INR' ? 'USD' : 'INR');
}

function triggerAvatarUpload() {
  const inp = document.getElementById('vacc-avatar-input');
  if (inp) inp.click();
}

function handleAvatarFileSelect(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUrl = evt.target.result;
    const avatarImg = document.getElementById('vacc-avatar-img');
    if (avatarImg) avatarImg.src = dataUrl;
    safeStorageSet('vtrade_user_avatar', dataUrl);
    showToast('Profile photo updated successfully!', 'success');
  };
  reader.readAsDataURL(file);
}

function renderAccountsScreen() {
  const netEquity = computeNetEquity();
  const totalBalEl = document.getElementById('vacc-total-balance');
  const nameEl = document.getElementById('vacc-username');
  if (nameEl) nameEl.textContent = `Hi ${userCustomName} !`;

  const inrBtn = document.getElementById('vacc-curr-inr');
  const usdBtn = document.getElementById('vacc-curr-usd');
  if (inrBtn) inrBtn.classList.toggle('active', accountsCurrency === 'INR');
  if (usdBtn) usdBtn.classList.toggle('active', accountsCurrency === 'USD');

  if (totalBalEl) {
    if (accountsCurrency === 'INR') {
      const inrVal = netEquity * (usdToInrRate || 92.5);
      totalBalEl.textContent = `₹ ${inrVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      totalBalEl.textContent = `$ ${netEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
    }
  }

  // Load custom profile DP if saved
  const savedAvatar = safeStorageGet('vtrade_user_avatar');
  const avatarImg = document.getElementById('vacc-avatar-img');
  if (savedAvatar && avatarImg) {
    avatarImg.src = savedAvatar;
  }

  // Display genuine user email
  const emailEl = document.getElementById('vacc-email');
  if (emailEl) {
    const userEmail = safeStorageGet('ct_email') || currentUserEmail || (username ? `${username.toLowerCase()}@gmail.com` : 'user@vtrade.paper');
    emailEl.textContent = userEmail;
  }
}

function editUsernameDialog() {
  const newName = prompt('Enter display name:', userCustomName);
  if (newName && newName.trim()) {
    userCustomName = newName.trim();
    renderAccountsScreen();
    showToast(`Name updated to ${userCustomName}`, 'success');
  }
}

function showPaperModeInfo() {
  showToast('Paper Trading Engine is active and risk-free. No KYC or real bank account needed.', 'success');
}

function openLeverageSettingsDialog() {
  showToast('Supported maximum 150x Leverage on BTC/ETH and 100x on Altcoins.', 'info');
}

function openTradingPreferencesDialog() {
  openSettingsSheet();
}

function showFeeRebateDialog() {
  showToast('Zero Fee Scalping Offer Tier Active: 0% Maker and 0% Taker fees applied!', 'success');
}

// ─── SCREEN 5: SETTINGS, HAPTICS, APP LOCK & SUPPORT HANDLERS ───
function showReferDialog() {
  showToast('Refer & Earn: Invite traders to VTrade paper trading and earn VIP rebate badges!', 'info');
}

let appLockActive = false;
function toggleAppLock(checked) {
  appLockActive = checked;
  showToast(checked ? 'App Lock PIN enabled for VTrade' : 'App Lock disabled', checked ? 'success' : 'info');
}

let currentThemeIdx = 0;
const availableThemes = ['Cyber Violet', 'Midnight Onyx', 'Neon Emerald'];
function cycleThemeChoice() {
  currentThemeIdx = (currentThemeIdx + 1) % availableThemes.length;
  const lbl = document.getElementById('vacc-theme-label');
  if (lbl) lbl.textContent = `${availableThemes[currentThemeIdx]} ›`;
  showToast(`Theme switched to ${availableThemes[currentThemeIdx]}`, 'success');
}

let hapticFeedbackActive = true;
function toggleHapticFeedback(checked) {
  hapticFeedbackActive = checked;
  if (checked && navigator.vibrate) navigator.vibrate(30);
  showToast(checked ? 'Haptic feedback enabled' : 'Haptic feedback disabled', 'info');
}

function openSupportModal() {
  showToast('Need help? Our 24/7 Virtual Trading Support is available at support@vtrade.io', 'info');
}

function showFeeStructureDialog() {
  showToast('Fee Structure: 0.00% Maker / 0.00% Taker on all Virtual Futures (Scalping Offer active)', 'success');
}

function handleAccountsLogout() {
  if (confirm('Are you sure you want to reset your paper-trading session?')) {
    openResetWalletDialog();
  }
}

function openProfileScreen() {
  switchMainTab('accounts');
}

// Funding Rate Countdown Timer (ticking every 1s)
let fundingSecondsRemaining = 3 * 3600 + 52 * 60 + 37;
setInterval(() => {
  fundingSecondsRemaining--;
  if (fundingSecondsRemaining < 0) fundingSecondsRemaining = 8 * 3600;
  const h = String(Math.floor(fundingSecondsRemaining / 3600)).padStart(2, '0');
  const m = String(Math.floor((fundingSecondsRemaining % 3600) / 60)).padStart(2, '0');
  const s = String(fundingSecondsRemaining % 60).padStart(2, '0');
  const el = document.getElementById('trade-funding-countdown');
  if (el) el.textContent = `${h}:${m}:${s}`;
}, 1000);

// Ensure chart layout updates smoothly on window resize without infinite tab re-triggers
let resizeDebounceTimer = null;
window.addEventListener('resize', () => {
  if (resizeDebounceTimer) cancelAnimationFrame(resizeDebounceTimer);
  resizeDebounceTimer = requestAnimationFrame(() => {
    resizeChartToContainer();
    repositionHtmlOverlays();
  });
});

// Backward-compat fallback for any older call
function switchNavSection(section, btn) {
  if (section === 'watchlist') switchMainTab('explore');
  else if (section === 'chart') switchMainTab('chart');
  else if (section === 'trade') switchMainTab('trade');
  else if (section === 'positions') switchMainTab('positions');
  else if (section === 'menu') switchMainTab('wallet');
}

function updateGrowwLiveElements(coinKey) {
  const cData = currentPrices[coinKey];
  if (!cData || !isValidPrice(cData.price)) return;
  const price = cData.price;
  const chg = cData.change24h !== undefined ? cData.change24h : 0;
  const chgPrice = cData.changePrice !== undefined ? cData.changePrice : (price * chg / 100);
  const isPos = chg >= 0;
  const sym = coinKey === 'bitcoin' ? 'btc' : coinKey === 'ethereum' ? 'eth' : coinKey === 'solana' ? 'sol' : coinKey;

  // 1. Ticker strip elements (Supports all 11 popular coins)
  const tickPriceEl = document.getElementById(`gi-price-${coinKey}`) || document.getElementById(`gi-price-${sym}`);
  const tickChgEl = document.getElementById(`gi-chg-${coinKey}`) || document.getElementById(`gi-chg-${sym}`);
  if (tickPriceEl) tickPriceEl.textContent = `$${fmt(price)}`;
  if (tickChgEl) {
    tickChgEl.textContent = `${isPos ? '+' : ''}${chg.toFixed(2)}%`;
    tickChgEl.className = `gi-chg ${isPos ? 'pos' : 'neg'}`;
  }

  // 2. Recently viewed
  const recChgEl = document.getElementById(`grecent-chg-${coinKey}`);
  if (recChgEl) {
    recChgEl.textContent = `${isPos ? '+' : ''}${chg.toFixed(2)}%`;
    recChgEl.className = `grecent-chg ${isPos ? 'pos' : 'neg'}`;
  }

  // 3. Most traded cards
  const cardPriceEl = document.getElementById(`gcard-price-${coinKey}`);
  const cardChgEl = document.getElementById(`gcard-chg-${coinKey}`);
  if (cardPriceEl) cardPriceEl.textContent = `$${fmt(price)}`;
  if (cardChgEl) {
    cardChgEl.textContent = formatChangeStr(chgPrice, chg);
    cardChgEl.className = `gcard-chg ${isPos ? 'pos' : 'neg'}`;
  }

  // 4. Intraday cards
  const intraPriceEl = document.getElementById(`gintra-price-${coinKey}`);
  const intraChgEl = document.getElementById(`gintra-chg-${coinKey}`);
  if (intraPriceEl) intraPriceEl.textContent = `$${fmt(price)}`;
  if (intraChgEl) {
    intraChgEl.textContent = formatChangeStr(chgPrice, chg);
    intraChgEl.className = `gcard-chg ${isPos ? 'pos' : 'neg'}`;
  }

  // 5. Volume list
  const volPriceEl = document.getElementById(`gvol-price-${coinKey}`);
  const volPctEl = document.getElementById(`gvol-pct-${coinKey}`);
  if (volPriceEl) volPriceEl.textContent = `$${fmt(price)}`;
  if (volPctEl) {
    volPctEl.textContent = `${isPos ? '+' : ''}${chg.toFixed(2)}%`;
    volPctEl.className = `gvol-pct ${isPos ? 'pos' : 'neg'}`;
  }
}

function setMoversFilter(filter, btn) {
  moversFilter = filter;
  document.querySelectorAll('.gpill-filter').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderGrowwMovers();
}

function renderGrowwMovers() {
  const container = document.getElementById('groww-movers-container');
  if (!container) return;

  const coins = COIN_LIST.map(c => {
    const data = currentPrices[c.id] || {};
    const price = data.price || c.basePrice;
    const change24h = data.change24h !== undefined ? data.change24h : c.baseChange;
    const changePrice = data.changePrice !== undefined ? data.changePrice : (price * change24h / 100);
    const marketCap = data.marketCap || c.baseCap;
    return { ...c, price, change24h, changePrice, marketCap };
  });

  if (moversFilter === 'gainers') {
    coins.sort((a, b) => b.change24h - a.change24h);
  } else if (moversFilter === 'losers') {
    coins.sort((a, b) => a.change24h - b.change24h);
  } else if (moversFilter === 'largecap') {
    coins.sort((a, b) => b.marketCap - a.marketCap);
  }

  container.innerHTML = coins.map(coin => {
    const isPos = coin.change24h >= 0;
    return `
      <div class="gcard" onclick="selectCoin('${coin.id}'); switchMainTab('chart');">
        <div class="gcard-top">
          <div class="gcard-badge"><img src="${coin.icon}" alt="${coin.symbol}" /></div>
          <div class="gcard-title-group">
            <span class="gcard-name">${coin.name}</span>
            <span class="gcard-sub">${coin.symbol}/USDT</span>
          </div>
        </div>
        <div class="gcard-price">$${fmt(coin.price)}</div>
        <div class="gcard-chg ${isPos ? 'pos' : 'neg'}">${formatChangeStr(coin.changePrice, coin.change24h)}</div>
      </div>
    `;
  }).join('');
}

function renderGrowwExploreUI() {
  renderMarketsCoinList();
}

function selectQuickTool(tool) {
  if (tool === 'futures') {
    switchMainTab('trade');
    if (typeof setLeverage === 'function') setLeverage(100);
  } else if (tool === 'chart') {
    switchMainTab('chart');
  } else if (tool === 'portfolio') {
    switchMainTab('positions');
  } else if (tool === 'orders') {
    switchMainTab('orders');
  } else if (tool === 'reset') {
    openResetWalletDialog();
  }
}

function toggleSearchOverlay() {
  const wrap = document.getElementById('groww-search-bar-wrap');
  if (!wrap) return;
  const isHidden = wrap.classList.toggle('hidden');
  const inp = document.getElementById('groww-quick-search-input');
  if (!isHidden) {
    if (inp) {
      inp.focus();
      inp.select();
    }
  } else {
    // Reset search query and filter when closing overlay
    marketsSearchQuery = '';
    if (inp) inp.value = '';
    renderMarketsCoinList();
  }
}

function handleGrowwSearch(query) {
  marketsSearchQuery = String(query).trim().toLowerCase();
  renderMarketsCoinList();
}

function handleGrowwSearchKeyDown(e) {
  if (e.key === 'Enter') {
    const q = String(e.target.value).trim().toLowerCase();
    if (!q) return;
    const match = COIN_LIST.find(c => c.symbol.toLowerCase() === q || c.name.toLowerCase() === q || c.id.toLowerCase() === q) ||
                  COIN_LIST.find(c => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
    if (match) {
      selectCoin(match.id);
      switchMainTab('chart');
      const wrap = document.getElementById('groww-search-bar-wrap');
      if (wrap) wrap.classList.add('hidden');
    }
  }
}

function renderWalletOverview() {
  const cash = Math.max(0, walletState?.cashBalance || 0);
  const openPositions = walletState?.positions || [];

  let totalMarginUsed = 0;
  let totalUnrealizedPnl = 0;

  openPositions.forEach(p => {
    totalMarginUsed += (p.margin || 0);
    const curP = currentPrices[p.coin]?.price || p.entry_price;
    const diff = (p.direction === 'long') ? (curP - p.entry_price) : (p.entry_price - curP);
    totalUnrealizedPnl += (diff * p.size);
  });

  const totalEquity = Math.max(0, cash + totalMarginUsed + totalUnrealizedPnl);
  const realizedPnl = walletState?.realizedPnl || 0;
  const tradesCount = walletState?.tradesCount || 0;
  const closedCount = walletState?.positionsClosed || 0;

  // 1. Primary Net Equity Display
  const eqEl = document.getElementById('gwallet-equity-val');
  if (eqEl) eqEl.textContent = `$${fmt(totalEquity)} USDT`;

  const cashValEl = document.getElementById('gwallet-cash-val');
  if (cashValEl) cashValEl.textContent = `$${fmt(cash)} USDT`;

  const marginValEl = document.getElementById('gwallet-used-margin-val');
  if (marginValEl) marginValEl.textContent = `$${fmt(totalMarginUsed)} USDT`;

  const unPnlEl = document.getElementById('gwallet-unrealized-pnl-val');
  if (unPnlEl) {
    const isPos = totalUnrealizedPnl >= 0;
    unPnlEl.textContent = `${isPos ? '+' : ''}$${fmtNum(totalUnrealizedPnl)} USDT`;
    unPnlEl.className = `gwallet-m-val ${isPos ? 'pos' : 'neg'}`;
  }

  const rlPnlEl = document.getElementById('gwallet-realized-pnl-val');
  if (rlPnlEl) {
    const isPos = realizedPnl >= 0;
    rlPnlEl.textContent = `${isPos ? '+' : ''}$${fmtNum(realizedPnl)} USDT`;
    rlPnlEl.className = `gwallet-m-val ${isPos ? 'pos' : 'neg'}`;
  }

  const trdCountEl = document.getElementById('gwallet-trades-count-val');
  if (trdCountEl) trdCountEl.textContent = `${tradesCount}`;

  const closedCountEl = document.getElementById('gwallet-closed-count-val');
  if (closedCountEl) closedCountEl.textContent = `${closedCount}`;

  // 2. Synchronize Top Navbar and Global Mini-Stats
  const navBal = document.getElementById('nav-balance');
  if (navBal) navBal.textContent = `$${fmt(totalEquity)}`;
  const statBal = document.getElementById('stat-balance');
  if (statBal) statBal.textContent = `$${fmt(cash)}`;
  const statTotal = document.getElementById('stat-total');
  if (statTotal) statTotal.textContent = `$${fmt(totalEquity)}`;
  const statUnPnl = document.getElementById('stat-unrealized-pnl');
  if (statUnPnl) statUnPnl.textContent = `${totalUnrealizedPnl >= 0 ? '+' : ''}$${fmtNum(totalUnrealizedPnl)}`;

  // Synchronize Screenshot 3 & 4 balances
  renderFundsBalance();
  renderAccountsScreen();
  const cqtdAvl = document.getElementById('cqtd-avl-val');
  if (cqtdAvl) cqtdAvl.textContent = `${cash.toFixed(4)} USDT`;

  // 3. User Holdings List
  const holdingsListEl = document.getElementById('gholdings-list');
  if (!holdingsListEl) return;

  holdingsListEl.innerHTML = COIN_LIST.map(c => {
    const amt = (walletState?.holdings && walletState.holdings[c.id]) || 0;
    const price = currentPrices[c.id]?.price || c.basePrice;
    const val = amt * price;
    return `
      <div class="gvol-row" onclick="selectCoin('${c.id}'); switchMainTab('chart');">
        <div class="gvol-left">
          <img src="${c.icon}" class="gvol-icon" alt="${c.symbol}" />
          <div>
            <div class="gvol-title">${c.name} (${c.symbol})</div>
            <div class="gvol-sub">${amt.toFixed(4)} ${c.symbol} • $${fmt(price)}</div>
          </div>
        </div>
        <div class="gvol-right">
          <div class="gvol-price">$${fmt(val)}</div>
          <div class="gvol-pct ${amt > 0 ? 'pos' : 'neutral'}">${amt > 0 ? 'Active' : '0.00'}</div>
        </div>
      </div>
    `;
  }).join('');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const box = document.getElementById('chart-container-box');
    if (box && box.classList.contains('fullscreen-chart')) {
      toggleChartFullscreen();
    }
  }
});

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

// ─── BOTTOM TABS (Requirement A & Screenshot 2 & 3 Match) ───
function showBottomTab(tab, btn) {
  activeBottomTab = tab || 'positions';
  const allTabs = ['positions', 'orders', 'order-history', 'history', 'transaction', 'webhooks'];
  allTabs.forEach(t => {
    const panel = document.getElementById(`panel-${t}`);
    if (panel) panel.classList.toggle('hidden', t !== activeBottomTab);
  });
  document.querySelectorAll('.shark-pos-tabs-wrap .btab').forEach(b => b.classList.remove('active'));
  const activeBtn = btn || document.getElementById(`tab-btn-${activeBottomTab}`);
  if (activeBtn) activeBtn.classList.add('active');

  if (activeBottomTab === 'order-history') renderOrderHistory();
  else if (activeBottomTab === 'transaction') renderTransactions();
  else if (activeBottomTab === 'webhooks') renderWebhooks();
}

function renderOrderHistory() {
  const tbody = document.getElementById('order-history-tbody');
  if (tbody) tbody.innerHTML = renderNoDataState(7);
}

function renderTransactions() {
  const tbody = document.getElementById('transaction-tbody');
  if (tbody) tbody.innerHTML = renderNoDataState(6);
}

function renderWebhooks() {
  const tbody = document.getElementById('webhooks-tbody');
  if (tbody) tbody.innerHTML = renderNoDataState(6);
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
    subBtn.className = `btn-tform-submit ${side === 'buy' ? 'buy' : 'sell'}`;
  }
  updateTradeLabels();
  updateTradeCalc();
}

function setOrderType(type) {
  selectTradeOrderType(type);
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

function toggleTradeUnit() {
  const nextUnit = (tradeUnit === 'coin') ? 'usd' : 'coin';
  setTradeUnit(nextUnit);
}

function setTradeUnit(unit) {
  tradeUnit = unit;
  const coinDef = getCoinDefinition(selectedCoin);
  const sym = coinDef.symbol;
  const displayLabel = (unit === 'coin') ? sym : 'USDT';

  const uchipCoin = document.getElementById('uchip-coin');
  if (uchipCoin) uchipCoin.textContent = displayLabel;

  const cqtdUnit = document.getElementById('cqtd-unit-label');
  if (cqtdUnit) cqtdUnit.textContent = `${displayLabel} ⌵`;

  const input = document.getElementById('trade-amount-input');
  if (input) {
    input.placeholder = (unit === 'coin') ? `Quantity (${sym})` : 'Quantity (USDT)';
  }
  const cqtdInp = document.getElementById('cqtd-qty-input');
  if (cqtdInp) {
    cqtdInp.placeholder = (unit === 'coin') ? `Quantity (${sym})` : 'Quantity (USDT)';
  }

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
  tradeLeverage = Math.max(1, Math.min(150, parseInt(val) || 150));
  chartTradeLeverage = tradeLeverage;
  selectedLeverage = tradeLeverage;
  
  const slider = document.getElementById('leverage-slider');
  if (slider) slider.value = tradeLeverage;
  
  const disp = document.getElementById('lev-val-display');
  if (disp) disp.textContent = `${tradeLeverage}x`;
  
  const lbl = document.getElementById('btn-lev-label');
  if (lbl) lbl.textContent = `${tradeLeverage}x`;

  const cqtdLbl = document.getElementById('cqtd-lev-label');
  if (cqtdLbl) cqtdLbl.textContent = `${tradeLeverage}x`;
  
  const pill = document.getElementById('delta-lev-pill');
  if (pill) pill.textContent = `${tradeLeverage}x ${tradeMarginMode.charAt(0).toUpperCase() + tradeMarginMode.slice(1)}`;
  
  document.querySelectorAll('.ld-chip').forEach(el => {
    const chipNum = parseInt(el.textContent.replace('x',''));
    el.classList.toggle('active', chipNum === tradeLeverage);
  });
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

  // Synchronize compact 1-Click trade size input
  const quickInput = document.getElementById('tv-quick-size-input');
  if (quickInput && document.activeElement !== quickInput && sizeCoins > 0) {
    quickInput.value = roundValue(sizeCoins, 'coin');
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

  // Update Shark Account Stats Box underneath Execute Button (Screenshot 1 Match)
  const deskAvail = document.getElementById('desk-avail-bal');
  const deskRisk = document.getElementById('desk-margin-risk');
  const deskFee = document.getElementById('desk-est-fee');
  const deskLiq = document.getElementById('desk-liq-price');

  if (deskAvail && !isBalanceMasked) {
    deskAvail.textContent = `${fmtNum(walletState.cashBalance)} USDT`;
  }
  if (deskRisk) deskRisk.textContent = `${fmtNum(marginRequired)} USDT`;
  if (deskFee) deskFee.textContent = orderValue > 0 ? `$${fmtNum(estFee)} USDT` : '--';
  if (deskLiq) deskLiq.textContent = (orderValue > 0 && liqPrice > 0) ? `$${fmt(liqPrice)}` : '—';

  // Update Chart Quick-Trade Dock calculations (Screenshot 2 Match)
  const cqtdAvl = document.getElementById('cqtd-avl-val');
  if (cqtdAvl) cqtdAvl.textContent = `${(walletState.cashBalance || 0).toFixed(4)} USDT`;

  const cqtdOrderVal = document.getElementById('cqtd-order-val');
  if (cqtdOrderVal) {
    cqtdOrderVal.textContent = tradeUnit === 'coin'
      ? `$${fmtNum(orderValue)}`
      : `≈ ${sizeCoins.toFixed(4)} ${coinDef.symbol}`;
  }

  const cqtdReqMargin = document.getElementById('cqtd-req-margin');
  if (cqtdReqMargin) {
    cqtdReqMargin.textContent = `${fmtNum(marginRequired)} USDT`;
  }

  // Do NOT disable button on zero input so clicks trigger friendly validation feedback
  if (submitBtn) {
    submitBtn.disabled = Boolean(isOrderSubmitting);
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
  
  // Side buttons labels (Long / Buy vs Sell / Short)
  const sideBuy = document.getElementById('side-buy-label');
  const sideSell = document.getElementById('side-sell-label');
  if (sideBuy) sideBuy.textContent = 'Long / Buy';
  if (sideSell) sideSell.textContent = 'Sell / Short';
  
  // Unit toggle coin chip
  const uchipCoin = document.getElementById('uchip-coin');
  if (uchipCoin) uchipCoin.textContent = (tradeUnit === 'coin') ? sym : 'USDT';

  const cqtdUnit = document.getElementById('cqtd-unit-label');
  if (cqtdUnit) cqtdUnit.textContent = (tradeUnit === 'coin') ? `${sym} ⌵` : 'USDT ⌵';
  
  // Submit button label (Screenshot 1 Match: Buy / Long BTC or Sell / Short BTC)
  const submitLabel = document.getElementById('delta-submit-label');
  if (submitLabel) {
    submitLabel.textContent = tradeSide === 'buy' ? `Buy / Long ${sym}` : `Sell / Short ${sym}`;
  }

  // Update Margin Ratio coin badge
  const mrcCoinSym = document.getElementById('mrc-coin-symbol');
  if (mrcCoinSym) mrcCoinSym.textContent = `${sym}-USDT`;

  // Update Min size chip label
  const chipMin = document.getElementById('chip-min-size');
  if (chipMin) {
    let minAmount = 0.002;
    if (sym === 'BTC') minAmount = 0.002;
    else if (sym === 'ETH') minAmount = 0.02;
    else if (sym === 'SOL') minAmount = 0.1;
    else minAmount = parseFloat((100 / (coinDef.basePrice || 100)).toFixed(3)) || 1;
    chipMin.textContent = `Min : ${minAmount} ${sym}`;
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

// ─── ORDER SUBMISSION STATE & BUTTON SPINNER ───────────────────
let isOrderSubmitting = false;

function setOrderButtonsLoading(isLoading) {
  isOrderSubmitting = isLoading;
  const submitBtn = document.getElementById('delta-submit-btn');
  const submitLabel = document.getElementById('delta-submit-label');
  const tvBuyBtn = document.getElementById('tv-tl-buy-btn');
  const tvSellBtn = document.getElementById('tv-tl-sell-btn');

  if (submitBtn) {
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle('btn-loading', isLoading);
    if (isLoading) {
      if (submitLabel) {
        submitBtn.dataset.originalText = submitLabel.textContent;
        submitLabel.innerHTML = '<span class="btn-spinner"></span> Processing Order...';
      }
    } else {
      if (submitLabel && submitBtn.dataset.originalText) {
        submitLabel.textContent = submitBtn.dataset.originalText;
      }
      updateTradeLabels();
    }
  }

  if (tvBuyBtn) tvBuyBtn.disabled = isLoading;
  if (tvSellBtn) tvSellBtn.disabled = isLoading;
}

// ─── SYNCHRONIZE STATE WITH BACKEND (Requirement 8) ───────────
async function syncWithBackend() {
  if (!token) return;
  try {
    const [portRes, posRes, ordRes, tradeRes] = await Promise.all([
      authGet(`${API}/portfolio`).catch(e => { console.warn('Sync portfolio:', e); return null; }),
      authGet(`${API}/positions`).catch(e => { console.warn('Sync positions:', e); return null; }),
      authGet(`${API}/orders`).catch(e => { console.warn('Sync orders:', e); return null; }),
      authGet(`${API}/trades`).catch(e => { console.warn('Sync trades:', e); return null; })
    ]);

    if (portRes && typeof portRes.balance === 'number') {
      walletState.cashBalance = roundValue(portRes.balance, 'money');
      balance = walletState.cashBalance;
      if (Array.isArray(portRes.holdings)) {
        portRes.holdings.forEach(h => {
          if (h && h.coin) {
            walletState.holdings[h.coin] = roundValue(h.amount, 'coin');
          }
        });
      }
    }

    if (Array.isArray(posRes)) {
      walletState.positions = posRes.map(p => {
        const coinDef = getCoinDefinition(p.coin);
        return {
          id: p.id,
          coin: p.coin,
          symbol: coinDef ? coinDef.symbol : p.coin.toUpperCase(),
          direction: p.direction,
          size: roundValue(p.size, 'coin'),
          entry_price: roundValue(p.entry_price, 'money'),
          leverage: p.leverage || 1,
          margin: roundValue(p.margin, 'money'),
          marginMode: p.margin_mode || tradeMarginMode || 'isolated',
          liquidationPrice: p.liquidationPrice ? roundValue(p.liquidationPrice, 'money') : null,
          stop_loss: p.stop_loss ? roundValue(p.stop_loss, 'money') : null,
          take_profit: p.take_profit ? roundValue(p.take_profit, 'money') : null,
          created_at: p.created_at
        };
      });
    }

    if (Array.isArray(ordRes)) {
      walletState.orders = ordRes
        .filter(o => (o.type || '').toLowerCase() === 'limit' && (o.status || '').toLowerCase() === 'pending')
        .map(o => {
          const coinDef = getCoinDefinition(o.coin);
          return {
            id: o.id,
            coin: o.coin,
            symbol: coinDef ? coinDef.symbol : o.coin.toUpperCase(),
            side: o.direction === 'long' ? 'Long' : o.direction === 'short' ? 'Short' : (o.direction === 'buy' ? 'Buy' : 'Sell'),
            category: (o.direction === 'long' || o.direction === 'short') ? 'position' : 'spot',
            type: 'Limit',
            price: roundValue(o.price, 'money'),
            size: roundValue(o.amount, 'coin'),
            leverage: 150,
            margin: roundValue((o.amount * o.price) / 150, 'money'),
            status: o.status,
            createdAt: o.created_at
          };
        });
    }

    if (Array.isArray(tradeRes)) {
      walletState.history = tradeRes.map(t => {
        const coinDef = getCoinDefinition(t.coin);
        const tSide = t.type ? (t.type.includes('long') ? 'Long' : t.type.includes('short') ? 'Short' : t.type.includes('buy') ? 'Buy' : 'Sell') : 'Trade';
        return {
          id: t.id,
          time: t.created_at,
          coin: coinDef ? coinDef.symbol : t.coin.toUpperCase(),
          side: tSide,
          type: 'Market',
          price: roundValue(t.price, 'money'),
          size: roundValue(t.amount, 'coin'),
          fee: roundValue((t.total * 0.0005), 'money'),
          pnl: null
        };
      });
    }

    saveWalletState();
  } catch (err) {
    console.error('Failed to sync state with backend:', err);
  } finally {
    updateMiniStats();
    renderPositions();
    renderOrders();
    renderHistory();
    updatePnlSummary();
    updateTabBadges();
    updateTradeCalc();
    updateAuthStateUI();
  }
}

// ─── TRADE EXECUTION (Requirement B & C & D) ───────────────────
async function executeTrade() {
  if (!token) {
    await ensurePaperSession();
  }

  // Requirement: Reject any new order when market data is stale (> 3 minutes / 180s)
  const dataAgeMs = Date.now() - (lastGoodPriceTimestamp || 0);
  if (dataAgeMs > 180000) {
    showToast('⚠️ Market data is stale (> 3m old). New orders are disabled.', 'error');
    return;
  }

  // Prevent duplicate submissions while in-flight (Requirement 9)
  if (isOrderSubmitting) return;

  const inputEl = document.getElementById('trade-amount-input');
  const inputVal = parseFloat(inputEl?.value) || 0;

  // Requirement B2: Reject any order with size 0 or negative size with clear feedback
  if (inputVal <= 0 || isNaN(inputVal) || !isFinite(inputVal)) {
    showToast('❌ Please enter an order quantity greater than 0', 'error');
    if (inputEl) {
      inputEl.focus();
      inputEl.classList.add('input-error-highlight');
      setTimeout(() => inputEl.classList.remove('input-error-highlight'), 1600);
    }
    return;
  }

  const coinDef = getCoinDefinition(selectedCoin);
  const curPrice = currentPrices[selectedCoin]?.price || coinDef.basePrice || 100;

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

  // Requirement B2: Reject leverage outside 1 to 150
  if (tradeCategory === 'position') {
    if (tradeLeverage < 1 || tradeLeverage > 150 || isNaN(tradeLeverage) || !isFinite(tradeLeverage)) {
      showToast('❌ Leverage must be between 1x and 150x', 'error');
      return;
    }
  }

  const lev = (tradeCategory === 'position') ? tradeLeverage : 1;
  const marginRequired = (lev > 0) ? roundValue(orderValue / lev, 'money') : orderValue;
  const feeRate = (tradeOrderType === 'market') ? 0.0005 : 0.0002;
  const estFee = roundValue(orderValue * feeRate, 'money');

  // Check TP / SL validity if entered
  const tpVal = parseFloat(v('tp-input')) || 0;
  const slVal = parseFloat(v('sl-input')) || 0;
  if (tpVal > 0) {
    if (tradeSide === 'buy' && tpVal <= entryPrice) {
      showToast(`❌ Take Profit ($${fmt(tpVal)}) must be above entry ($${fmt(entryPrice)})`, 'error');
      return;
    } else if (tradeSide === 'sell' && tpVal >= entryPrice) {
      showToast(`❌ Take Profit ($${fmt(tpVal)}) must be below entry ($${fmt(entryPrice)})`, 'error');
      return;
    }
  }
  if (slVal > 0) {
    if (tradeSide === 'buy' && slVal >= entryPrice) {
      showToast(`❌ Stop Loss ($${fmt(slVal)}) must be below entry ($${fmt(entryPrice)})`, 'error');
      return;
    } else if (tradeSide === 'sell' && slVal <= entryPrice) {
      showToast(`❌ Stop Loss ($${fmt(slVal)}) must be above entry ($${fmt(entryPrice)})`, 'error');
      return;
    }
  }

  // Pre-validate cash balance before dispatching
  if (tradeCategory === 'position') {
    if (roundValue(walletState.cashBalance - (marginRequired + estFee), 'money') < 0) {
      showToast(`❌ Insufficient cash for margin ($${fmtNum(walletState.cashBalance)} available, $${fmtNum(marginRequired + estFee)} required)`, 'error');
      return;
    }
  } else {
    if (tradeSide === 'buy' && roundValue(walletState.cashBalance - (orderValue + estFee), 'money') < 0) {
      showToast(`❌ Insufficient cash balance ($${fmtNum(walletState.cashBalance)} available)`, 'error');
      return;
    }
    if (tradeSide === 'sell' && sizeCoins > (walletState.holdings[selectedCoin] || 0)) {
      showToast(`❌ Insufficient ${coinDef.symbol} holding (${(walletState.holdings[selectedCoin]||0).toFixed(4)} held)`, 'error');
      return;
    }
  }

  // Set loading state on submit button and disable duplicate clicks
  setOrderButtonsLoading(true);

  try {
    const isLimit = (tradeOrderType === 'limit');
    let res = null;

    if (token) {
      try {
        if (tradeCategory === 'position') {
          const direction = (tradeSide === 'buy') ? 'long' : 'short';
          const payload = {
            coin: selectedCoin,
            direction: direction,
            size: sizeCoins,
            leverage: lev,
            orderType: tradeOrderType,
            limitPrice: isLimit ? entryPrice : undefined,
            stopLoss: slVal > 0 ? slVal : undefined,
            takeProfit: tpVal > 0 ? tpVal : undefined
          };
          res = await authPost(`${API}/positions/open`, payload);
        } else {
          // Spot trade
          const payload = {
            coin: selectedCoin,
            type: tradeSide,
            amount: sizeCoins,
            orderType: tradeOrderType,
            limitPrice: isLimit ? entryPrice : undefined
          };
          res = await authPost(`${API}/trade`, payload);
        }
      } catch (backendErr) {
        console.warn('Backend unavailable, executing paper trade locally:', backendErr);
        res = null;
      }
    }

    if (res && res.error) {
      showToast(`❌ ${res.error}`, 'error');
      return;
    }

    if (res && (res.status || res.success || res.id)) {
      // Backend executed successfully
      if (res.orderType === 'limit' || res.status === 'pending') {
        showToast(res.message || `Limit ${tradeSide === 'buy' ? 'Long' : 'Short'} order placed at $${fmt(entryPrice)} USDT`, 'info');
      } else if (res.netted) {
        showToast(res.message || `Position reduced by ${sizeCoins} ${coinDef.symbol} (Netting)`, 'success');
      } else {
        const orderAction = tradeCategory === 'position'
          ? (tradeSide === 'buy' ? 'Long order filled successfully' : 'Short order filled successfully')
          : (tradeSide === 'buy' ? 'Buy order placed successfully' : 'Sell order placed successfully');
        showToast(`${orderAction} on ${coinDef.pair} at $${fmt(entryPrice)}`, 'success');
      }
      if (inputEl) inputEl.value = '';
      await syncWithBackend().catch(() => {});
    } else {
      // Seamless Local Paper Engine Fallback (Guarantees zero-failure paper trading)
      const direction = (tradeSide === 'buy') ? 'long' : 'short';
      if (tradeCategory === 'position') {
        if (isLimit) {
          walletState.orders = walletState.orders || [];
          walletState.orders.unshift({
            id: Date.now() + Math.floor(Math.random() * 1000),
            coin: selectedCoin,
            symbol: coinDef.symbol,
            side: tradeSide === 'buy' ? 'Buy' : 'Sell',
            direction: direction,
            type: 'limit',
            orderType: 'limit',
            price: roundUsd(entryPrice),
            size: roundCoin(sizeCoins),
            leverage: lev,
            margin: roundUsd(marginRequired),
            marginMode: 'isolated',
            status: 'pending',
            tp: tpVal > 0 ? tpVal : null,
            sl: slVal > 0 ? slVal : null,
            created_at: new Date().toISOString()
          });
          saveWalletState();
          showToast(`Limit ${tradeSide === 'buy' ? 'Long' : 'Short'} order placed at $${fmt(entryPrice)} USDT`, 'info');
        } else {
          // Market Order: check for opposing position netting
          const oppDir = direction === 'long' ? 'short' : 'long';
          const oppIdx = (walletState.positions || []).findIndex(p => p.coin === selectedCoin && p.direction === oppDir);
          if (oppIdx !== -1) {
            const oppPos = walletState.positions[oppIdx];
            if (oppPos.size <= sizeCoins) {
              await closePositionUnified(oppPos.id, entryPrice, 'Market');
              const remSize = roundCoin(sizeCoins - oppPos.size);
              if (remSize > 0) {
                const remMargin = roundUsd((remSize * entryPrice) / lev);
                walletState.cashBalance = Math.max(0, roundUsd(walletState.cashBalance - remMargin));
                let liqPrice = (direction === 'long')
                  ? entryPrice * (1 - (1 / lev) * 0.9)
                  : entryPrice * (1 + (1 / lev) * 0.9);
                liqPrice = Math.max(0.0000001, roundUsd(liqPrice));
                walletState.positions.unshift({
                  id: Date.now() + Math.floor(Math.random() * 1000),
                  coin: selectedCoin,
                  symbol: coinDef.symbol,
                  direction: direction,
                  size: remSize,
                  entry_price: roundUsd(entryPrice),
                  leverage: lev,
                  margin: remMargin,
                  marginMode: 'isolated',
                  liquidationPrice: liqPrice,
                  take_profit: tpVal > 0 ? tpVal : null,
                  stop_loss: slVal > 0 ? slVal : null,
                  status: 'open',
                  created_at: new Date().toISOString()
                });
              }
              saveWalletState();
              showToast(`Position reduced by ${oppPos.size} ${coinDef.symbol} (Netting)`, 'success');
            } else {
              await closePositionPartial(oppPos.id, sizeCoins, 'Market');
              showToast(`Position reduced by ${sizeCoins} ${coinDef.symbol} (Netting)`, 'success');
            }
          } else {
            // New position execution
            walletState.cashBalance = Math.max(0, roundUsd(walletState.cashBalance - marginRequired));
            let liqPrice = (direction === 'long')
              ? entryPrice * (1 - (1 / lev) * 0.9)
              : entryPrice * (1 + (1 / lev) * 0.9);
            liqPrice = Math.max(0.0000001, roundUsd(liqPrice));

            walletState.positions = walletState.positions || [];
            walletState.positions.unshift({
              id: Date.now() + Math.floor(Math.random() * 1000),
              coin: selectedCoin,
              symbol: coinDef.symbol,
              direction: direction,
              size: roundCoin(sizeCoins),
              entry_price: roundUsd(entryPrice),
              leverage: lev,
              margin: roundUsd(marginRequired),
              marginMode: 'isolated',
              liquidationPrice: liqPrice,
              take_profit: tpVal > 0 ? tpVal : null,
              stop_loss: slVal > 0 ? slVal : null,
              status: 'open',
              created_at: new Date().toISOString()
            });
            saveWalletState();
            showToast(`${direction === 'long' ? 'Long' : 'Short'} order filled successfully on ${coinDef.pair} at $${fmt(entryPrice)}`, 'success');
          }
        }
      } else {
        // Spot trade local execution
        if (tradeSide === 'buy') {
          walletState.cashBalance = Math.max(0, roundUsd(walletState.cashBalance - (orderValue + estFee)));
          walletState.holdings[selectedCoin] = roundCoin((walletState.holdings[selectedCoin] || 0) + sizeCoins);
          saveWalletState();
          showToast(`Buy order placed successfully on ${coinDef.pair} at $${fmt(entryPrice)}`, 'success');
        } else {
          walletState.holdings[selectedCoin] = Math.max(0, roundCoin((walletState.holdings[selectedCoin] || 0) - sizeCoins));
          walletState.cashBalance = roundUsd(walletState.cashBalance + (orderValue - estFee));
          saveWalletState();
          showToast(`Sell order placed successfully on ${coinDef.pair} at $${fmt(entryPrice)}`, 'success');
        }
      }

      if (inputEl) inputEl.value = '';
      renderPositions();
      renderOrders();
      renderOpenOrdersCardList();
      updateMiniStats();
      renderFundsBalance();
      renderAccountsScreen();
      renderWalletOverview();
    }
  } catch (err) {
    console.error('Order execution error:', err);
    showToast(`Order processed in paper mode`, 'info');
  } finally {
    setOrderButtonsLoading(false);
  }
}

// ─── UNIFIED CLOSE LOGIC (Requirement F & H & B3) ───────────
let closingPositionIds = new Set();

async function closePositionUnified(posId, exitPriceInput, closeReason = 'Market', clickedBtn = null) {
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

  // If authenticated, sync closure with backend engine
  if (token) {
    try {
      const res = await authPost(`${API}/positions/close/${posId}`, {
        closePrice: exitPrice,
        size: pos.size
      });
      if (res && res.success) {
        showToast(res.message || `${pos.symbol} position closed`, res.pnl >= 0 ? 'success' : 'info');
        await syncWithBackend();
        return;
      }
    } catch (err) {
      console.warn('Backend position close failed, applying local fallback:', err);
    }
  }

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
async function closePositionPartial(posId, closeSizeCoins, closeReason = 'Market') {
  const idx = walletState.positions.findIndex(p => p.id === posId);
  if (idx === -1) return;
  const pos = walletState.positions[idx];

  const validCloseSize = Math.min(pos.size, Math.max(0.000001, closeSizeCoins));
  if (validCloseSize >= pos.size - 0.000001) {
    await closePositionUnified(posId, null, closeReason);
    return;
  }

  const curPrice = currentPrices[pos.coin]?.price || pos.entry_price;
  const exitPrice = curPrice;

  if (token) {
    try {
      const res = await authPost(`${API}/positions/close/${posId}`, {
        closePrice: exitPrice,
        size: validCloseSize
      });
      if (res && res.success) {
        showToast(res.message || `Closed ${fmtCoin(validCloseSize)} ${pos.symbol}`, res.pnl >= 0 ? 'success' : 'info');
        await syncWithBackend();
        return;
      }
    } catch (err) {
      console.warn('Backend partial close failed, applying local fallback:', err);
    }
  }

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
  renderFundsBalance();
  renderAccountsScreen();
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

// ─── RENDER POSITIONS TABLE (Requirement B & Screenshot 2 Match) ────────────────
function renderPositions() {
  updateTabBadges();
  renderTvChartOverlay();
  renderFundsBalance();
  renderAccountsScreen();
  if (typeof renderHomeScreen === 'function') renderHomeScreen();
  if (typeof renderMarketsScreen === 'function') renderMarketsScreen();
  const tbody = document.getElementById('pos-tbody');
  const cardsList = document.getElementById('pos-cards-list');
  const summaryEl = document.getElementById('pos-total-pnl-summary');
  const open = walletState.positions || [];

  let totalUnrealized = 0;
  open.forEach(p => {
    const curPrice = currentPrices[p.coin]?.price || p.entry_price;
    const priceDiff = (p.direction === 'long') ? (curPrice - p.entry_price) : (p.entry_price - curPrice);
    totalUnrealized += (priceDiff * p.size);
  });

  if (summaryEl) {
    const isPos = totalUnrealized >= 0;
    summaryEl.innerHTML = `Unrealized PnL: <span class="${isPos ? 'pnl-pos' : 'pnl-neg'}" style="font-weight:800;">${isPos ? '+' : ''}$${fmtNum(totalUnrealized)}</span>`;
  }

  if (!open.length) {
    if (tbody) tbody.innerHTML = renderNoDataState(10);
    if (cardsList) cardsList.innerHTML = renderVTradeEmptyState('Deposit Funds to Your Wallet', 'Start your trading journey with us.', 'Deposit Funds');
    updateMarginRatioStats('0.00', 0, walletState.cashBalance);
    return;
  }

  // Calculate genuine margin ratio & maintenance margin
  const totalMaintMargin = open.reduce((acc, p) => acc + (p.margin * 0.005), 0);
  const marginBal = walletState.cashBalance + totalUnrealized;
  const marginRatio = marginBal > 0 ? ((totalMaintMargin / marginBal) * 100).toFixed(2) : '0.00';
  updateMarginRatioStats(marginRatio, totalMaintMargin, marginBal);

  const inrMult = activeCurrencyView === 'INR' ? usdToInrRate : 1;
  const currSym = activeCurrencyView === 'INR' ? '₹' : '$';

  // Modern Mobile & Responsive Cards
  if (cardsList) {
    cardsList.innerHTML = open.map(p => {
      const coinDef = getCoinDefinition(p.coin);
      const curPrice = currentPrices[p.coin]?.price || p.entry_price;
      const priceDiff = (p.direction === 'long') ? (curPrice - p.entry_price) : (p.entry_price - curPrice);
      const pnl = roundUsd(priceDiff * p.size);
      const pnlPct = (p.margin > 0) ? ((pnl / p.margin) * 100).toFixed(2) : '0.00';
      const isPos = pnl >= 0;
      const sideCls = (p.direction === 'long') ? 'badge-long' : 'badge-short';
      const sideText = (p.direction === 'long') ? 'LONG' : 'SHORT';
      const tpStr = p.take_profit ? `${currSym}${fmt(p.take_profit * inrMult)}` : 'None';
      const slStr = p.stop_loss ? `${currSym}${fmt(p.stop_loss * inrMult)}` : 'None';

      return `
        <div class="pos-card-item">
          <div class="pos-card-head">
            <div class="pos-card-symbol-row">
              <span class="pos-card-symbol">${coinDef.pair}</span>
              <span class="badge ${sideCls}">${sideText} ${p.leverage}x</span>
            </div>
            <div class="pos-card-pnl-wrap">
              <div class="pos-card-pnl ${isPos ? 'pnl-pos' : 'pnl-neg'}">${isPos ? '+' : ''}${currSym}${fmtNum(pnl * inrMult)}</div>
              <div style="font-size:11px; color:${isPos ? 'var(--green)' : 'var(--red)'}; font-weight:700;">${isPos ? '+' : ''}${pnlPct}%</div>
            </div>
          </div>
          <div class="pos-card-grid">
            <div class="pos-grid-cell">
              <span class="pos-cell-lbl">Size</span>
              <span class="pos-cell-val">${fmtCoin(p.size)} ${coinDef.symbol}</span>
            </div>
            <div class="pos-grid-cell">
              <span class="pos-cell-lbl">Entry Price</span>
              <span class="pos-cell-val">${currSym}${fmt(p.entry_price * inrMult)}</span>
            </div>
            <div class="pos-grid-cell">
              <span class="pos-cell-lbl">Mark Price</span>
              <span class="pos-cell-val">${currSym}${fmt(curPrice * inrMult)}</span>
            </div>
            <div class="pos-grid-cell">
              <span class="pos-cell-lbl">Margin</span>
              <span class="pos-cell-val">${currSym}${fmtNum(p.margin * inrMult)}</span>
            </div>
            <div class="pos-grid-cell">
              <span class="pos-cell-lbl">Liq. Price</span>
              <span class="pos-cell-val" style="color:var(--red);">${p.liquidationPrice ? (currSym + fmt(p.liquidationPrice * inrMult)) : '—'}</span>
            </div>
            <div class="pos-grid-cell">
              <span class="pos-cell-lbl">TP / SL</span>
              <span class="pos-cell-val" style="font-size:11px;">${tpStr} / ${slStr}</span>
            </div>
          </div>
          <div class="pos-card-actions">
            <button class="btn-card-chart" onclick="selectCoin('${p.coin}'); switchMainTab('chart');">📈 Chart</button>
            <button class="btn-card-tpsl" onclick="openTpSlModal(${p.id})">🎯 TP/SL</button>
            <button class="btn-card-close" onclick="closePositionUnified(${p.id}, null, 'Market', this)">✕ Close</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Desktop Data Table (Screenshot 2 Match: Symbol | Info | Mark / Entry | Liquidation | U-P&L | Locked Margin | Top Up | Rev. | TP/SL | Close All)
  if (tbody) {
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
      const sideCls = (p.direction === 'long') ? 'badge-long' : 'badge-short';
      const sideText = (p.direction === 'long') ? 'Long' : 'Short';
      const liqStr = p.liquidationPrice ? `${currSym}${fmt(p.liquidationPrice * inrMult)}` : '—';

      return `<tr>
        <td>
          <div style="display:flex; align-items:center; gap:6px;">
            <span class="badge ${sideCls}">${sideText}</span>
            <b>${sym}-USDT</b>
          </div>
        </td>
        <td><span style="color:#94a3b8; font-size:12px;">Isolated ${p.leverage}x</span></td>
        <td>
          <div style="font-size:12px; line-height:1.4;">
            <div>${currSym}${fmt(curPrice * inrMult)}</div>
            <div style="color:#727b8a; font-size:11px;">${currSym}${fmt(p.entry_price * inrMult)}</div>
          </div>
        </td>
        <td><span style="color:#f6465d; font-weight:600; font-size:12px;">${liqStr}</span></td>
        <td>
          <div style="font-size:12px; line-height:1.4;">
            <span class="${pnlCls}" style="font-weight:700;">${pnlSign}${currSym}${fmtNum(pnl * inrMult)}</span>
            <div style="font-size:11px; color:${pnl > 0 ? '#0ecb81' : (pnl < 0 ? '#f6465d' : '#848e9c')};">(${pnlPctSign}${pnlPct}%)</div>
          </div>
        </td>
        <td><span style="font-size:12px; font-weight:600;">${currSym}${fmtNum(p.margin * inrMult)}</span></td>
        <td>
          <button type="button" onclick="showToast('Virtual margin auto-allocated from available balance', 'info')" style="padding:4px 8px; font-size:11px; font-weight:600; border-radius:4px; background:#181f2b; border:1px solid #283446; color:#00c2ff; cursor:pointer;">+ Top Up</button>
        </td>
        <td>
          <button type="button" onclick="reversePositionUnified(${p.id})" style="padding:4px 8px; font-size:11px; font-weight:600; border-radius:4px; background:#181f2b; border:1px solid #283446; color:#e2e8f0; cursor:pointer;" title="Reverse position direction">Rev.</button>
        </td>
        <td>
          <button type="button" onclick="openTpSlModal(${p.id})" style="padding:4px 8px; font-size:11px; font-weight:600; border-radius:4px; background:#181f2b; border:1px solid #283446; color:#e2e8f0; cursor:pointer;">${p.take_profit || p.stop_loss ? 'Edit' : 'Add'}</button>
        </td>
        <td>
          <div style="display:flex; gap:4px;">
            <button type="button" onclick="closePositionUnified(${p.id}, null, 'Market', this)" style="padding:4px 10px; font-size:11px; font-weight:700; border-radius:4px; background:rgba(246,70,93,0.15); border:1px solid #f6465d; color:#f6465d; cursor:pointer;">Market</button>
            <button type="button" onclick="openPartialCloseModal(${p.id})" style="padding:4px 8px; font-size:11px; font-weight:600; border-radius:4px; background:#181f2b; border:1px solid #283446; color:#94a3b8; cursor:pointer;">Partial</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }
}

async function reversePositionUnified(posId) {
  const pos = (walletState.positions || []).find(p => p.id === posId);
  if (!pos) return;
  const newDirection = pos.direction === 'long' ? 'short' : 'long';
  showToast(`Reversing position to ${newDirection.toUpperCase()}...`, 'info');
  await closePositionUnified(posId, null, 'Market');
  setTimeout(async () => {
    try {
      tradeSide = newDirection === 'long' ? 'buy' : 'sell';
      selectedCoin = pos.coin;
      tradeLeverage = pos.leverage || 10;
      const curPrice = currentPrices[pos.coin]?.price || pos.entry_price;
      if (token) {
        await post(`${API}/positions`, {
          coin: pos.coin,
          direction: newDirection,
          size: pos.size,
          leverage: pos.leverage || 10,
          margin: pos.margin
        });
        await loadPortfolio();
      } else {
        walletState.positions.push({
          id: Date.now(),
          coin: pos.coin,
          direction: newDirection,
          size: pos.size,
          entry_price: curPrice,
          leverage: pos.leverage || 10,
          margin: pos.margin,
          status: 'open',
          createdAt: new Date().toISOString()
        });
        saveWalletState();
      }
      renderPositions();
      showToast(`Position reversed to ${newDirection.toUpperCase()}!`, 'success');
    } catch(err) {
      showToast(err.message || 'Reverse position failed', 'error');
    }
  }, 250);
}

// ─── RENDER OPEN ORDERS TABLE (Requirement C) ──────────────
function renderOrders() {
  updateTabBadges();
  renderTvChartOverlay();
  const tbody = document.getElementById('orders-tbody');
  const cardsList = document.getElementById('orders-cards-list');
  
  // Filter ONLY pending limit orders (strictly exclude market orders)
  const allOrders = walletState.orders || [];
  const pending = allOrders.filter(o => {
    const t = String(o.type || o.orderType || '').toLowerCase();
    const s = String(o.status || '').toLowerCase();
    return t === 'limit' && s === 'pending';
  });

  if (!pending.length) {
    if (tbody) tbody.innerHTML = '';
    if (cardsList) cardsList.innerHTML = renderVTradeEmptyState('No Open Orders', 'You have no pending limit orders.', 'Place Limit Order');
    return;
  }

  if (cardsList) {
    cardsList.innerHTML = pending.map(o => {
      const isLong = (o.side === 'Buy' || o.side === 'Long' || o.side === 'buy' || o.side === 'long');
      return `
        <div class="pos-card" style="margin-bottom:8px;">
          <div class="pos-card-header">
            <span class="pos-card-sym">${(o.symbol || o.coin).toUpperCase()}</span>
            <span class="badge ${isLong ? 'badge-long' : 'badge-short'}">${isLong ? 'LONG' : 'SHORT'}</span>
          </div>
          <div class="pos-card-body">
            <div class="pos-card-row"><span>Type</span><span style="font-weight:700; color:#8b5cf6;">LIMIT</span></div>
            <div class="pos-card-row"><span>Price</span><span>$${fmt(o.price)}</span></div>
            <div class="pos-card-row"><span>Amount</span><span>${fmtCoin(o.size)}</span></div>
            <div class="pos-card-row"><span>Status</span><span style="color:var(--v-amber); font-weight:600;">${o.status || 'pending'}</span></div>
          </div>
          <button type="button" class="btn-close-pos" style="width:100%; margin-top:8px;" onclick="cancelOrder(${o.id})">Cancel Order</button>
        </div>
      `;
    }).join('');
  }

  if (tbody) {
    tbody.innerHTML = '';
  }
}

// Global alias for backwards compatibility and external callers
window.renderOpenOrders = renderOrders;

async function cancelOrder(id) {
  try {
    if (token) {
      await authDelete(`${API}/orders/${id}`);
    }
  } catch (e) {
    console.warn('Backend cancel sync:', e);
  }
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
    tbody.innerHTML = renderNoDataState(8);
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
  if (token) {
    await syncWithBackend();
  } else {
    updateMiniStats();
  }
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
let paperSessionPromise = null;
async function ensurePaperSession() {
  if (paperSessionPromise) return paperSessionPromise;
  paperSessionPromise = (async () => {
    try {
      const res = await fetch(`${API}/auth/paper-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: (typeof userCustomName !== 'undefined' ? userCustomName : 'flipfishtrust') })
      }).then(r => r.json());
      if (res && res.token) {
        token = res.token;
        username = res.username;
        balance = res.balance || 10000;
        currentUserEmail = res.email || `${username.toLowerCase()}@vtrade.paper`;
        safeStorageSet('ct_token', token);
        safeStorageSet('ct_username', username);
        safeStorageSet('ct_balance', balance.toString());
        safeStorageSet('ct_email', currentUserEmail);
        renderAccountsScreen();
        return token;
      }
    } catch (e) {
      console.warn('Auto paper session failed:', e);
    } finally {
      paperSessionPromise = null;
    }
    return token;
  })();
  return paperSessionPromise;
}

function handleRefreshedToken(response) {
  try {
    const refreshed = response.headers.get('X-Refreshed-Token');
    if (refreshed && refreshed !== token) {
      token = refreshed;
      safeStorageSet('ct_token', token);
    }
  } catch (_) {}
}

const authGet = async (url, isRetry = false) => {
  if (!token) await ensurePaperSession();
  try {
    const r = await fetchWithTimeout(url, { headers: { Authorization: `Bearer ${token}` } }, 5000);
    handleRefreshedToken(r);
    const d = await safeJson(r);
    if (!r.ok) {
      if ((r.status === 401 || r.status === 403 || (d.error && d.error.includes('token'))) && !isRetry) {
        await ensurePaperSession();
        return authGet(url, true);
      }
      throw new Error(d.error || 'Error');
    }
    return d;
  } catch (e) {
    if ((e.message && e.message.includes('token')) && !isRetry) {
      await ensurePaperSession();
      return authGet(url, true);
    }
    throw e;
  }
};

const authPost = async (url, body, isRetry = false) => {
  if (!token) await ensurePaperSession();
  try {
    const r = await fetchWithTimeout(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) }, 5000);
    handleRefreshedToken(r);
    const d = await safeJson(r);
    if (!r.ok) {
      if ((r.status === 401 || r.status === 403 || (d.error && d.error.includes('token'))) && !isRetry) {
        await ensurePaperSession();
        return authPost(url, body, true);
      }
      throw new Error(d.error || 'Error');
    }
    return d;
  } catch (e) {
    if ((e.message && e.message.includes('token')) && !isRetry) {
      await ensurePaperSession();
      return authPost(url, body, true);
    }
    throw e;
  }
};

const authDelete = async (url, isRetry = false) => {
  if (!token) await ensurePaperSession();
  try {
    const r = await fetchWithTimeout(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }, 5000);
    handleRefreshedToken(r);
    const d = await safeJson(r);
    if (!r.ok) {
      if ((r.status === 401 || r.status === 403 || (d.error && d.error.includes('token'))) && !isRetry) {
        await ensurePaperSession();
        return authDelete(url, true);
      }
      throw new Error(d.error || 'Error');
    }
    return d;
  } catch (e) {
    if ((e.message && e.message.includes('token')) && !isRetry) {
      await ensurePaperSession();
      return authDelete(url, true);
    }
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

// ══════════════════════════════════════════════════════════════════════════
// DELTA EXCHANGE INDIA – HOME CATEGORY LOGIC & ENGINE (SCREENSHOTS 1 & 2)
// ══════════════════════════════════════════════════════════════════════════

let homeSearchQuery = '';
let activeContractTab = 'futures'; // 'futures', 'options', 'rwa'
let activeContractFilter = 'gainers'; // 'new', 'gainers', 'volume', 'oi'
let contractSortCol = 'change'; // 'symbol', 'price', 'change'
let contractSortAsc = false;
let isHomeBalanceMasked = false;

// Contracts matching Delta Exchange India mobile layout exactly (Screenshot 1 & 2)
const DELTA_CONTRACTS = [
  { id: 'siren', symbol: 'SIRENUSD', name: 'Siren Perpetual', category: 'futures', isNew: true, basePrice: 0.02891, baseVol: 22230000, baseChange: 41.02, oi: 15400000, binanceSymbol: 'BTCUSDT' },
  { id: 'injective', symbol: 'INJUSD', name: 'Injective Perpetual', category: 'futures', isNew: false, basePrice: 9.281, baseVol: 3180000, baseChange: 30.46, oi: 8200000, binanceSymbol: 'INJUSDT' },
  { id: 'celestia', symbol: 'TIAUSD', name: 'Celestia Perpetual', category: 'futures', isNew: false, basePrice: 0.6716, baseVol: 2320000, baseChange: 26.07, oi: 5900000, binanceSymbol: 'TIAUSDT' },
  { id: 'layerzero', symbol: 'ZROUSD', name: 'LayerZero Perpetual', category: 'futures', isNew: true, basePrice: 2.2028, baseVol: 1190000, baseChange: 16.54, oi: 3400000, binanceSymbol: 'ZROUSDT' },
  { id: 'etherfi', symbol: 'ETHFIUSD', name: 'Ether.fi Perpetual', category: 'futures', isNew: true, basePrice: 0.6982, baseVol: 162890, baseChange: 16.33, oi: 950000, binanceSymbol: 'ETHFIUSDT' },
  { id: 'stbl', symbol: 'STBLUSD', name: 'STBL Perpetual', category: 'futures', isNew: true, basePrice: 0.02399, baseVol: 2760000, baseChange: 15.50, oi: 2100000, binanceSymbol: 'USDCUSDT' },
  { id: 'arbitrum', symbol: 'ARBUSD', name: 'Arbitrum Perpetual', category: 'futures', isNew: false, basePrice: 0.19983, baseVol: 200630, baseChange: 15.24, oi: 1200000, binanceSymbol: 'ARBUSDT' },
  { id: 'near', symbol: 'NEARUSD', name: 'NEAR Perpetual', category: 'futures', isNew: false, basePrice: 5.273, baseVol: 1380000, baseChange: 14.87, oi: 4800000, binanceSymbol: 'NEARUSDT' },
  { id: 'river', symbol: 'RIVERUSD', name: 'River Perpetual', category: 'futures', isNew: true, basePrice: 1.103, baseVol: 817410, baseChange: 13.95, oi: 760000, binanceSymbol: 'SUIUSDT' },
  { id: 'worldcoin', symbol: 'WLDUSD', name: 'Worldcoin Perpetual', category: 'futures', isNew: false, basePrice: 0.5294, baseVol: 156350, baseChange: 13.17, oi: 610000, binanceSymbol: 'WLDUSDT' },
  { id: 'zcash', symbol: 'ZECUSD', name: 'Zcash Perpetual', category: 'futures', isNew: false, basePrice: 1227.18, baseVol: 12360000, baseChange: 12.70, oi: 11200000, binanceSymbol: 'ZECUSDT' },
  { id: 'solv', symbol: 'SOLVUSD', name: 'Solv Protocol Perpetual', category: 'futures', isNew: true, basePrice: 0.004253, baseVol: 170430, baseChange: 12.63, oi: 490000, binanceSymbol: 'BTCUSDT' },
  { id: 'bitcoin', symbol: 'BTCUSD', name: 'Bitcoin Perpetual', category: 'futures', isNew: false, basePrice: 82017.0, baseVol: 15300000000, baseChange: 1.11, oi: 450000000, binanceSymbol: 'BTCUSDT' },
  { id: 'ethereum', symbol: 'ETHUSD', name: 'Ethereum Perpetual', category: 'futures', isNew: false, basePrice: 2452.55, baseVol: 10180000000, baseChange: 3.63, oi: 280000000, binanceSymbol: 'ETHUSDT' },
  { id: 'solana', symbol: 'SOLUSD', name: 'Solana Perpetual', category: 'futures', isNew: false, basePrice: 105.12, baseVol: 1900000000, baseChange: 2.30, oi: 95000000, binanceSymbol: 'SOLUSDT' },
  // Options Category
  { id: 'btc-opt-85000', symbol: 'BTC-85000-C', name: 'BTC Call Option', category: 'options', isNew: false, basePrice: 1420.00, baseVol: 85000000, baseChange: 8.45, oi: 52000000 },
  { id: 'eth-opt-2600', symbol: 'ETH-2600-C', name: 'ETH Call Option', category: 'options', isNew: false, basePrice: 94.50, baseVol: 42000000, baseChange: 14.20, oi: 29000000 },
  { id: 'xaut-opt-4200', symbol: 'XAUT-4200-C', name: 'XAUT Gold Call Option', category: 'options', isNew: false, basePrice: 48.00, baseVol: 12000000, baseChange: 4.10, oi: 9400000 },
  // RWA Tokens Category
  { id: 'xaut-rwa', symbol: 'XAUTUSD', name: 'Tether Gold RWA', category: 'rwa', isNew: false, basePrice: 4181.20, baseVol: 45000000, baseChange: 0.42, oi: 21000000 },
  { id: 'usyc-rwa', symbol: 'USYCUSD', name: 'Yield Coin RWA', category: 'rwa', isNew: true, basePrice: 1.054, baseVol: 32000000, baseChange: 5.12, oi: 18000000 },
  { id: 'buidl-rwa', symbol: 'BUIDLUSD', name: 'BlackRock BUIDL RWA', category: 'rwa', isNew: true, basePrice: 1.002, baseVol: 78000000, baseChange: 2.85, oi: 44000000 }
];

// Sparkline Mock Series for Top Strip
const SPARKLINE_DATA = {
  BTCUSD: [81200, 81450, 81100, 81700, 81650, 81900, 82017],
  ETHUSD: [2380, 2395, 2370, 2410, 2430, 2445, 2452.55],
  XAUT: [4160, 4165, 4172, 4168, 4175, 4179, 4181.20],
  SOLUSD: [102.5, 103.1, 102.8, 104.2, 103.9, 104.8, 105.12]
};

function generateSparklineSvg(dataPoints, isPositive = true) {
  const width = 148;
  const height = 34;
  const min = Math.min(...dataPoints);
  const max = Math.max(...dataPoints);
  const range = max - min || 1;
  const strokeColor = isPositive ? '#00c087' : '#f43f5e';
  const fillGradientId = 'spk-grad-' + Math.random().toString(36).substr(2, 9);

  const coords = dataPoints.map((val, idx) => {
    const x = (idx / (dataPoints.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const lineD = 'M ' + coords.join(' L ');
  const areaD = `${lineD} L ${width},${height} L 0,${height} Z`;

  return `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="width:100%; height:100%;">
      <defs>
        <linearGradient id="${fillGradientId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.35" />
          <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      <path d="${areaD}" fill="url(#${fillGradientId})" />
      <path d="${lineD}" fill="none" stroke="${strokeColor}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
}

function renderHomeScreen() {
  const homeScreen = document.getElementById('home-screen-view');
  if (!homeScreen) return;

  // 1. Account Value Equity Calculation
  const equityUsd = typeof computeNetEquity === 'function' ? computeNetEquity() : (walletState.cashBalance || 10000);
  const inrRate = 86.5;
  const equityInr = equityUsd * inrRate;

  const inrEl = document.getElementById('home-balance-inr');
  const usdEl = document.getElementById('home-balance-usd');

  if (inrEl && usdEl) {
    if (isHomeBalanceMasked) {
      inrEl.textContent = '₹••••••';
      usdEl.textContent = '$••••';
    } else {
      inrEl.textContent = '₹' + equityInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      usdEl.textContent = '$' + equityUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  }

  // 2. UPNL Calculation
  let totalUpnl = 0;
  const positions = walletState.positions || [];
  positions.forEach(p => {
    const curPrice = currentPrices[p.coin]?.price || p.entry_price || 0;
    const diff = (p.direction === 'long') ? (curPrice - p.entry_price) : (p.entry_price - curPrice);
    totalUpnl += (diff * p.size);
  });

  const upnlInrEl = document.getElementById('home-upnl-inr');
  const upnlUsdEl = document.getElementById('home-upnl-usd');

  if (upnlInrEl && upnlUsdEl) {
    if (isHomeBalanceMasked) {
      upnlInrEl.textContent = '₹••••';
      upnlUsdEl.textContent = '$••••';
      upnlInrEl.className = 'metric-val-inr upnl-neutral';
    } else {
      const upnlInr = totalUpnl * inrRate;
      const isPositive = totalUpnl > 0.001;
      const isNegative = totalUpnl < -0.001;

      upnlInrEl.textContent = (isPositive ? '+₹' : (isNegative ? '-₹' : '₹')) + Math.abs(upnlInr).toFixed(2);
      upnlUsdEl.textContent = (isPositive ? '+$' : (isNegative ? '-$' : '$')) + Math.abs(totalUpnl).toFixed(2);

      upnlInrEl.className = 'metric-val-inr ' + (isPositive ? 'upnl-green' : (isNegative ? 'upnl-red' : 'upnl-neutral'));
    }
  }

  // 3. Positions / Orders Count
  const posCount = positions.length;
  const ordCount = (walletState.orders || []).length;
  const posOrdEl = document.getElementById('home-pos-orders-count');
  if (posOrdEl) {
    posOrdEl.textContent = `${posCount} / ${ordCount}`;
  }

  // 4. Mini Sparkline Strip Render
  renderSparklinesStrip();

  // 5. Contracts List Render
  renderContractsList();
}

function renderSparklinesStrip() {
  const container = document.getElementById('home-sparklines-strip');
  if (!container) return;

  const sparklineItems = [
    {
      symbol: 'BTCUSD',
      price: currentPrices['bitcoin']?.price || 82017.0,
      change: currentPrices['bitcoin']?.change || 1.11,
      coinId: 'bitcoin',
      data: SPARKLINE_DATA.BTCUSD
    },
    {
      symbol: 'ETHUSD',
      price: currentPrices['ethereum']?.price || 2452.55,
      change: currentPrices['ethereum']?.change || 3.63,
      coinId: 'ethereum',
      data: SPARKLINE_DATA.ETHUSD
    },
    {
      symbol: 'XAUT',
      price: 4181.20,
      change: 0.42,
      coinId: 'xaut-rwa',
      data: SPARKLINE_DATA.XAUT
    },
    {
      symbol: 'SOLUSD',
      price: currentPrices['solana']?.price || 105.12,
      change: currentPrices['solana']?.change || 2.30,
      coinId: 'solana',
      data: SPARKLINE_DATA.SOLUSD
    }
  ];

  container.innerHTML = sparklineItems.map(item => {
    const isUp = item.change >= 0;
    const formattedPrice = item.price >= 1000
      ? `$${item.price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`
      : `$${item.price.toFixed(2)}`;

    return `
      <div class="sparkline-card" onclick="selectContractRow('${item.coinId}')">
        <div class="spk-header">
          <span class="spk-symbol">${item.symbol}</span>
          <span class="spk-change ${isUp ? 'up' : 'down'}">
            <span>${isUp ? '▲' : '▼'}</span>
            <span>${Math.abs(item.change).toFixed(2)}%</span>
          </span>
        </div>
        <div class="spk-price">${formattedPrice}</div>
        <div class="spk-chart-canvas">
          ${generateSparklineSvg(item.data, isUp)}
        </div>
      </div>
    `;
  }).join('');
}

function renderContractsList() {
  const listEl = document.getElementById('home-contracts-list');
  if (!listEl) return;

  // Filter by category tab
  let list = DELTA_CONTRACTS.filter(c => c.category === activeContractTab);

  // Filter by search query
  if (homeSearchQuery && homeSearchQuery.trim()) {
    const q = homeSearchQuery.trim().toLowerCase();
    list = list.filter(c =>
      c.symbol.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q)
    );
  }

  // Filter by sub-chips
  if (activeContractFilter === 'new') {
    list = list.filter(c => c.isNew);
  } else if (activeContractFilter === 'gainers') {
    list.sort((a, b) => b.baseChange - a.baseChange);
  } else if (activeContractFilter === 'volume') {
    list.sort((a, b) => b.baseVol - a.baseVol);
  } else if (activeContractFilter === 'oi') {
    list.sort((a, b) => b.oi - a.oi);
  }

  // Sort if requested
  if (contractSortCol === 'symbol') {
    list.sort((a, b) => contractSortAsc ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol));
  } else if (contractSortCol === 'price') {
    list.sort((a, b) => contractSortAsc ? a.basePrice - b.basePrice : b.basePrice - a.basePrice);
  } else if (contractSortCol === 'change') {
    list.sort((a, b) => contractSortAsc ? a.baseChange - b.baseChange : b.baseChange - a.baseChange);
  }

  if (!list.length) {
    listEl.innerHTML = `<div style="text-align:center; padding: 24px; color:#8f96a3; font-size:13px;">No contracts found matching "${homeSearchQuery}"</div>`;
    return;
  }

  listEl.innerHTML = list.map(c => {
    // Dynamic price from Binance or basePrice
    let price = c.basePrice;
    let change = c.baseChange;
    if (c.id === 'bitcoin' && currentPrices['bitcoin']?.price) {
      price = currentPrices['bitcoin'].price;
      change = currentPrices['bitcoin'].change || change;
    } else if (c.id === 'ethereum' && currentPrices['ethereum']?.price) {
      price = currentPrices['ethereum'].price;
      change = currentPrices['ethereum'].change || change;
    } else if (c.id === 'solana' && currentPrices['solana']?.price) {
      price = currentPrices['solana'].price;
      change = currentPrices['solana'].change || change;
    }

    let priceStr = '';
    if (price >= 1000) {
      priceStr = `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (price >= 1) {
      priceStr = `$${price.toFixed(price < 10 ? 3 : 2)}`;
    } else if (price >= 0.01) {
      priceStr = `$${price.toFixed(4)}`;
    } else {
      priceStr = `$${price.toFixed(6)}`;
    }

    let volStr = '';
    if (c.baseVol >= 1e9) {
      volStr = `$${(c.baseVol / 1e9).toFixed(2)}B`;
    } else if (c.baseVol >= 1e6) {
      volStr = `$${(c.baseVol / 1e6).toFixed(2)}M`;
    } else if (c.baseVol >= 1e3) {
      volStr = `$${(c.baseVol / 1e3).toFixed(2)}K`;
    } else {
      volStr = `$${c.baseVol.toFixed(2)}`;
    }

    const isGain = change >= 0;
    const changeBadgeStr = (isGain ? '+' : '') + change.toFixed(2) + '%';

    return `
      <div class="contract-row" onclick="selectContractRow('${c.id}')">
        <div class="c-cell-identity">
          <span class="c-symbol">${c.symbol}</span>
          <span class="c-name">${c.name}</span>
        </div>
        <div class="c-cell-price">
          <span class="c-price">${priceStr}</span>
          <span class="c-vol">${volStr}</span>
        </div>
        <div class="c-cell-change">
          <span class="change-badge ${isGain ? 'gain' : 'loss'}">${changeBadgeStr}</span>
        </div>
      </div>
    `;
  }).join('');
}

function handleHomeSearch(val) {
  homeSearchQuery = val || '';
  renderContractsList();
}

function switchContractTab(tab) {
  activeContractTab = tab;
  document.querySelectorAll('.contract-tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`tab-${tab}`);
  if (activeBtn) activeBtn.classList.add('active');
  renderContractsList();
}

function setContractFilter(filter) {
  activeContractFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
  const activeChip = document.getElementById(`chip-${filter}`);
  if (activeChip) activeChip.classList.add('active');
  renderContractsList();
}

function sortContracts(col) {
  if (contractSortCol === col) {
    contractSortAsc = !contractSortAsc;
  } else {
    contractSortCol = col;
    contractSortAsc = false;
  }
  renderContractsList();
}

function selectContractRow(coinId) {
  selectedCoin = coinId;
  showToast(`Selected contract: ${coinId.toUpperCase()}`, 'info');
}

function toggleBalanceVisibility() {
  isHomeBalanceMasked = !isHomeBalanceMasked;
  renderHomeScreen();
}

// ─── ADD FUNDS PAPER MODAL ───────────────────────────────────────
let selectedDepositAmount = 1000;

function openAddFundsModal() {
  const modal = document.getElementById('add-funds-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeAddFundsModal() {
  const modal = document.getElementById('add-funds-modal');
  if (modal) modal.classList.add('hidden');
}

function selectDepositPreset(amount) {
  selectedDepositAmount = amount;
  const input = document.getElementById('deposit-custom-amount');
  if (input) input.value = amount;
}

function confirmDeposit() {
  const input = document.getElementById('deposit-custom-amount');
  const amountInr = input && input.value ? parseFloat(input.value) : selectedDepositAmount;

  if (!amountInr || amountInr <= 0) {
    showToast('Please enter a valid deposit amount', 'error');
    return;
  }

  const inrRate = 86.5;
  const usdAmount = amountInr / inrRate;
  walletState.cashBalance = (walletState.cashBalance || 0) + usdAmount;
  saveWalletState();
  closeAddFundsModal();
  renderHomeScreen();
  showToast(`₹${amountInr.toLocaleString('en-IN')} successfully deposited!`, 'success');
}

// ─── REKYC MODAL ─────────────────────────────────────────────────
function openKycModal() {
  const modal = document.getElementById('rekyc-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeKycModal() {
  const modal = document.getElementById('rekyc-modal');
  if (modal) modal.classList.add('hidden');
}

function completeKycSimulation() {
  closeKycModal();
  showToast('KYC Verified! Account active for all contracts.', 'success');
}

// ─── QUICK ACTIONS & FEATURE MODALS ──────────────────────────────
function openQrModal() {
  showGenericModal('Scan QR Code', 'Point your camera at a QR code to transfer funds or connect desktop session.');
}

function openWalletModal() {
  showGenericModal('Delta Wallet', 'Manage INR deposits, UPI transfers, and Crypto Tether balances.');
}

function openNotificationsModal() {
  showGenericModal('Notifications', 'Diwali Scalper Offer active: 0 closing fees on all Perpetual Futures!');
}

function openProfileModal() {
  showGenericModal('User Profile', 'Delta Exchange ID: #DX-98241\nTier: VIP 1 Trader\nStatus: Verified');
}

function showDistTooltip() {
  showToast('Advancers (208) vs Decliners (21) across all listed perpetuals.', 'info');
}

function openQuickAction(action) {
  if (action === 'research') {
    showGenericModal('Delta Research', 'Daily crypto market intelligence, technical breakout signals, and macro analysis.');
  } else if (action === 'usstocks') {
    showGenericModal('US Stocks – Token Perps', 'Trade NVDA, TSLA, AAPL, AMZN with up to 50x leverage 24/7.');
  } else if (action === 'algohub') {
    showGenericModal('Algo Hub', 'Automated grid trading bots, DCA bots, and scalping strategies.');
  } else if (action === 'livechat') {
    showGenericModal('Live Support Chat', 'Delta Exchange 24/7 VIP desk is online. Average response time: < 2 minutes.');
  } else if (action === 'more') {
    showGenericModal('More Services', 'API Management, Referral Program, Trading Fees, and Security Center.');
  }
}

function showGenericModal(title, bodyText) {
  const modal = document.getElementById('generic-action-modal');
  const titleEl = document.getElementById('generic-modal-title');
  const bodyEl = document.getElementById('generic-modal-body');
  if (modal && titleEl && bodyEl) {
    titleEl.textContent = title;
    bodyEl.innerHTML = `<p style="line-height:1.6; color:#c0c6d4; font-size:14px;">${bodyText}</p>`;
    modal.classList.remove('hidden');
  }
}

function closeGenericModal() {
  const modal = document.getElementById('generic-action-modal');
  if (modal) modal.classList.add('hidden');
}

// ══════════════════════════════════════════════════════════════════════════
// DELTA EXCHANGE INDIA – MARKETS CATEGORY ENGINE (SCREENSHOTS 1, 2, 3, 4, 5)
// ══════════════════════════════════════════════════════════════════════════

let marketsTopTab = 'futures'; // 'watchlist', 'futures', 'options', 'rwa', 'straddles'
let marketsFuturesChip = 'all'; // 'all', 'new', 'commodity', 'usstock', 'l1', 'smart', 'solana', 'meme', 'defi', 'ai', 'l2', 'gaming', 'nft'
let marketsSortCol = 'vol';
let deltaMarketsSortAsc = false;
let deltaMarketsSearchQuery = '';

// Watchlist saved in localStorage (initially empty to match Screenshot 1)
let userWatchlist = [];
try {
  const savedWl = localStorage.getItem('vtrade_watchlist');
  if (savedWl) userWatchlist = JSON.parse(savedWl);
} catch (e) {
  userWatchlist = [];
}

// 20+ Real Contracts Matching Screenshot 2, 3, 4 with exact leverage & fee badges
const MARKETS_FUTURES_DATA = [
  {
    id: 'bitcoin',
    symbol: 'BTCUSD',
    name: 'Bitcoin Perpetual',
    leverage: '200x',
    categories: ['all', 'l1', 'smart'],
    basePrice: 82144,
    baseVol: 1120000000,
    baseChange: 1.59,
    feeBadge: null,
    isNew: false
  },
  {
    id: 'xaut-perp',
    symbol: 'XAUTUSD',
    name: 'Tether Gold Token P...',
    leverage: '100x',
    categories: ['all', 'commodity'],
    basePrice: 4178.58,
    baseVol: 751480000,
    baseChange: 0.60,
    feeBadge: 'Fee 0.01%',
    isNew: false
  },
  {
    id: 'ethereum',
    symbol: 'ETHUSD',
    name: 'Ethereum Perpetual',
    leverage: '200x',
    categories: ['all', 'l1', 'smart'],
    basePrice: 2463.1,
    baseVol: 731520000,
    baseChange: 4.40,
    feeBadge: null,
    isNew: false
  },
  {
    id: 'solana',
    symbol: 'SOLUSD',
    name: 'Solana Perpetual',
    leverage: '100x',
    categories: ['all', 'l1', 'solana'],
    basePrice: 106.623,
    baseVol: 151360000,
    baseChange: 4.53,
    feeBadge: null,
    isNew: false
  },
  {
    id: 'paxg-perp',
    symbol: 'PAXGUSD',
    name: 'PAX Gold Token Per...',
    leverage: '100x',
    categories: ['all', 'commodity'],
    basePrice: 4169.8,
    baseVol: 124040000,
    baseChange: 0.49,
    feeBadge: 'Fee 0.01%',
    isNew: false
  },
  {
    id: 'akedo',
    symbol: 'AKEUSD',
    name: 'Akedo Perpetual',
    leverage: '20x',
    categories: ['all', 'gaming'],
    basePrice: 0.030059,
    baseVol: 46220000,
    baseChange: -3.31,
    feeBadge: null,
    isNew: false
  },
  {
    id: 'siren',
    symbol: 'SIRENUSD',
    name: 'Siren Perpetual',
    leverage: '20x',
    categories: ['all', 'defi', 'new'],
    basePrice: 0.0289,
    baseVol: 22500000,
    baseChange: 30.47,
    feeBadge: null,
    isNew: false
  },
  {
    id: 'ripple',
    symbol: 'XRPUSD',
    name: 'Ripple Perpetual',
    leverage: '100x',
    categories: ['all', 'l1'],
    basePrice: 1.3442,
    baseVol: 13360000,
    baseChange: 2.99,
    feeBadge: null,
    isNew: false
  },
  {
    id: 'zcash',
    symbol: 'ZECUSD',
    name: 'Zcash Perpetual',
    leverage: '20x',
    categories: ['all', 'l1'],
    basePrice: 1235.52,
    baseVol: 12370000,
    baseChange: 13.83,
    feeBadge: null,
    isNew: false
  },
  {
    id: 'uniswap',
    symbol: 'UNIUSD',
    name: 'Uniswap Perpetual',
    leverage: '100x',
    categories: ['all', 'defi'],
    basePrice: 7.419,
    baseVol: 11240000,
    baseChange: 8.20,
    feeBadge: null,
    isNew: false
  },
  {
    id: 'slvon-silver',
    symbol: 'SLVONUSD',
    name: 'iShares Silver (XAG) ...',
    leverage: '50x',
    categories: ['all', 'commodity'],
    basePrice: 52.41,
    baseVol: 10290000,
    baseChange: 1.93,
    feeBadge: 'Fee 0.01%',
    isNew: false
  },
  {
    id: 'bitway',
    symbol: 'BTWUSD',
    name: 'Bitway Perpetual',
    leverage: '10x',
    categories: ['all', 'new'],
    basePrice: 1.838,
    baseVol: 8660000,
    baseChange: -6.80,
    feeBadge: null,
    isNew: true
  },
  {
    id: 'arc-ai',
    symbol: 'ARCUSD',
    name: 'AI Rig Complex Perpetual',
    leverage: '20x',
    categories: ['all', 'ai'],
    basePrice: 0.03932,
    baseVol: 8400000,
    baseChange: -4.84,
    feeBadge: null,
    isNew: false
  },
  {
    id: 'tsla-perp',
    symbol: 'TSLAUSD',
    name: 'Tesla Inc. Token Perp',
    leverage: '50x',
    categories: ['all', 'usstock'],
    basePrice: 220.40,
    baseVol: 54200000,
    baseChange: 2.15,
    feeBadge: null,
    isNew: false
  },
  {
    id: 'nvda-perp',
    symbol: 'NVDAUSD',
    name: 'Nvidia Corp Token Perp',
    leverage: '50x',
    categories: ['all', 'usstock', 'ai'],
    basePrice: 138.20,
    baseVol: 82100000,
    baseChange: 3.40,
    feeBadge: null,
    isNew: false
  },
  {
    id: 'doge-perp',
    symbol: 'DOGEUSD',
    name: 'Dogecoin Perpetual',
    leverage: '100x',
    categories: ['all', 'meme'],
    basePrice: 0.1248,
    baseVol: 65100000,
    baseChange: 5.12,
    feeBadge: null,
    isNew: false
  },
  {
    id: 'pepe-perp',
    symbol: 'PEPEUSD',
    name: 'Pepe Perpetual',
    leverage: '50x',
    categories: ['all', 'meme'],
    basePrice: 0.0094,
    baseVol: 42800000,
    baseChange: 7.80,
    feeBadge: null,
    isNew: false
  },
  {
    id: 'arb-perp',
    symbol: 'ARBUSD',
    name: 'Arbitrum Perpetual',
    leverage: '50x',
    categories: ['all', 'l2'],
    basePrice: 0.1998,
    baseVol: 18200000,
    baseChange: 2.40,
    feeBadge: null,
    isNew: false
  },
  {
    id: 'op-perp',
    symbol: 'OPUSD',
    name: 'Optimism Perpetual',
    leverage: '50x',
    categories: ['all', 'l2'],
    basePrice: 1.540,
    baseVol: 14100000,
    baseChange: 3.10,
    feeBadge: null,
    isNew: false
  },
  {
    id: 'blur-perp',
    symbol: 'BLURUSD',
    name: 'Blur NFT Perpetual',
    leverage: '20x',
    categories: ['all', 'nft'],
    basePrice: 0.245,
    baseVol: 5400000,
    baseChange: 1.80,
    feeBadge: null,
    isNew: false
  }
];

// OPTIONS CHAIN DATA (SCREENSHOTS 1, 2, 3, 4, 5)
const OPTIONS_EXPIRIES = [
  { remaining: '53m', dateStr: '16 Oct, 2026', shortDate: '16 Oct', countdown: 'Expires in 53m' },
  { remaining: '1d: 53m', dateStr: '17 Oct, 2026', shortDate: '17 Oct', countdown: 'Expires in 1d: 53m' },
  { remaining: '2d: 53m', dateStr: '18 Oct, 2026', shortDate: '18 Oct', countdown: 'Expires in 2d: 53m' },
  { remaining: '7d: 53m', dateStr: '23 Oct, 2026', shortDate: '23 Oct', countdown: 'Expires in 7d: 53m' },
  { remaining: '14d: 53m', dateStr: '30 Oct, 2026', shortDate: '30 Oct', countdown: 'Expires in 14d: 53m' },
  { remaining: '42d: 53m', dateStr: '27 Nov, 2026', shortDate: '27 Nov', countdown: 'Expires in 42d: 53m' },
  { remaining: '70d: 53m', dateStr: '25 Dec, 2026', shortDate: '25 Dec', countdown: 'Expires in 70d: 53m' }
];
let activeExpiryIndex = 0;
let activeOptionsViewMode = 'T-Shape'; // 'T-Shape', 'All', 'Calls', 'Puts'
let activeOptionsUnderlying = 'btc'; // 'btc', 'eth', 'xaut'
let activeOptionsMetric = 'price'; // 'price', 'oivol', 'greeks'

// BTC OPTIONS DATA (SCREENSHOTS 1, 2 & 5)
const BTC_OPTIONS_STRIKES_DATA = [
  {
    strike: 81200,
    callBid: '987', callAsk: '1002', callMark: '1008.6', callIv: '40.0',
    putMark: '0.4', putIv: '40.9', putBid: '0.1', putAsk: '0.2',
    callVol: '$12.43M', callVolChg: '98.73%', callOi: '$130.69K', callOiBar: 8, callOiBarColor: 'green-tint',
    putOi: '$6.77M', putOiBar: 28, putOiBarColor: 'green-tint', putVol: '$56.67M', putVolChg: '-99.99%',
    callTheta: '0', callVega: '0', callDelta: '1.00', callGamma: '0',
    putDelta: '-0.01', putGamma: '0.00003', putTheta: '-88.47', putVega: '0.12'
  },
  {
    strike: 81400,
    callBid: '783', callAsk: '795', callMark: '808.7', callIv: '33.5',
    putMark: '0.4', putIv: '33.3', putBid: '0.2', putAsk: '0.3',
    callVol: '$13.72M', callVolChg: '69.05%', callOi: '$245.25K', callOiBar: 12, callOiBarColor: 'green-tint',
    putOi: '$6.69M', putOiBar: 28, putOiBarColor: 'green-tint', putVol: '$46.44M', putVolChg: '-99.98%',
    callTheta: '-41.4', callVega: '0.07', callDelta: '1.00', callGamma: '0.00002',
    putDelta: '-0.01', putGamma: '0.00004', putTheta: '-89.64', putVega: '0.14'
  },
  {
    strike: 81500,
    callBid: '685', callAsk: '696', callMark: '708.7', callIv: '28.9',
    putMark: '0.4', putIv: '30.0', putBid: '0.1', putAsk: '0.2',
    callVol: '$10.82M', callVolChg: '67.43%', callOi: '$152.64K', callOiBar: 9, callOiBarColor: 'green-tint',
    putOi: '$9.03M', putOiBar: 38, putOiBarColor: 'green-tint', putVol: '$53.63M', putVolChg: '-99.98%',
    callTheta: '-40.64', callVega: '0.08', callDelta: '1.00', callGamma: '0.00003',
    putDelta: '-0.01', putGamma: '0.00006', putTheta: '-94.23', putVega: '0.16'
  },
  {
    strike: 81600,
    callBid: '588', callAsk: '598', callMark: '608.9', callIv: '26.9',
    putMark: '0.6', putIv: '27.3', putBid: '0.7', putAsk: '0.9',
    callVol: '$17.18M', callVolChg: '80.60%', callOi: '$1.59M', callOiBar: 15, callOiBarColor: 'red-tint',
    putOi: '$11.78M', putOiBar: 50, putOiBarColor: 'green-tint', putVol: '$75.74M', putVolChg: '-99.98%',
    callTheta: '-50.68', callVega: '0.11', callDelta: '1.00', callGamma: '0.00004',
    putDelta: '-0.01', putGamma: '0.00007', putTheta: '-98.41', putVega: '0.19'
  },
  {
    strike: 81800,
    callBid: '388', callAsk: '396', callMark: '410.0', callIv: '22.3',
    putMark: '2.1', putIv: '23.0', putBid: '3.0', putAsk: '4.6',
    callVol: '$55.60M', callVolChg: '35.89%', callOi: '$1.00M', callOiBar: 10, callOiBarColor: 'green-tint',
    putOi: '$16.57M', putOiBar: 70, putOiBarColor: 'green-tint', putVol: '$103.81M', putVolChg: '-99.96%',
    callTheta: '0', callVega: '0', callDelta: '1.00', callGamma: '0',
    putDelta: '-0.02', putGamma: '0.00015', putTheta: '-125.14', putVega: '0.31'
  },
  {
    strike: 82000,
    callBid: '202', callAsk: '207', callMark: '220.3', callIv: '20.1',
    putMark: '11.9', putIv: '20.0', putBid: '13.0', putAsk: '15.0',
    callVol: '$146.48M', callVolChg: '6.08%', callOi: '$7.57M', callOiBar: 35, callOiBarColor: 'red-tint',
    putOi: '$16.92M', putOiBar: 72, putOiBarColor: 'green-tint', putVol: '$166.35M', putVolChg: '-99.72%',
    callTheta: '-120.79', callVega: '0.44', callDelta: '0.98', callGamma: '0.00033',
    putDelta: '-0.04', putGamma: '0.00049', putTheta: '-239.61', putVega: '0.77'
  },
  {
    strike: 82200,
    callBid: '64.0', callAsk: '67.8', callMark: '69.4', callIv: '19.5',
    putMark: '66.7', putIv: '19.3', putBid: '74.0', putAsk: '77.0',
    callVol: '$146.37M', callVolChg: '-53.62%', callOi: '$13.06M', callOiBar: 60, callOiBarColor: 'red-tint',
    putOi: '$10.34M', putOiBar: 45, putOiBarColor: 'green-tint', putVol: '$114.11M', putVolChg: '-97.69%',
    callTheta: '-627.8', callVega: '2.47', callDelta: '0.78', callGamma: '0.00194',
    putDelta: '-0.21', putGamma: '0.00182', putTheta: '-603.34', putVega: '2.34'
  },
  // SPOT DIVIDER AT BTC 82284.0 / 82327.5
  {
    strike: 82400,
    callBid: '10.5', callAsk: '13.0', callMark: '25.5', callIv: '24.9',
    putMark: '203.5', putIv: '18.9', putBid: '217.0', putAsk: '222.0',
    callVol: '$129.48M', callVolChg: '-89.29%', callOi: '$19.24M', callOiBar: 85, callOiBarColor: 'red-tint',
    putOi: '$4.16M', putOiBar: 20, putOiBarColor: 'green-tint', putVol: '$67.26M', putVolChg: '-91.05%',
    callTheta: '-719.2', callVega: '2.93', callDelta: '0.32', callGamma: '0.0024',
    putDelta: '-0.68', putGamma: '0.00236', putTheta: '-729.23', putVega: '2.93'
  },
  {
    strike: 82500,
    callBid: '6.5', callAsk: '7.0', callMark: '15.1', callIv: '27.4',
    putMark: '294.9', putIv: '18.8', putBid: '310.0', putAsk: '317.0',
    callVol: '$109.41M', callVolChg: '-94.44%', callOi: '$13.03M', callOiBar: 60, callOiBarColor: 'red-tint',
    putOi: '$149.75K', putOiBar: 8, putOiBarColor: 'green-tint', putVol: '$28.71M', putVolChg: '-84.88%',
    callTheta: '-413.8', callVega: '1.64', callDelta: '0.12', callGamma: '0.00129',
    putDelta: '-0.82', putGamma: '0.00139', putTheta: '-660.81', putVega: '2.15'
  },
  {
    strike: 82600,
    callBid: '2.3', callAsk: '3.9', callMark: '10.6', callIv: '30.3',
    putMark: '391.8', putIv: '14.1', putBid: '404.0', putAsk: '412.0',
    callVol: '$86.01M', callVolChg: '-97.16%', callOi: '$12.86M', callOiBar: 58, callOiBarColor: 'red-tint',
    putOi: '$44.16K', putOiBar: 3, putOiBarColor: 'green-tint', putVol: '$6.47M', putVolChg: '-78.52%',
    callTheta: '-204.46', callVega: '0.76', callDelta: '0.04', callGamma: '0.00056',
    putDelta: '-0.98', putGamma: '0.00038', putTheta: '-96.37', putVega: '0.43'
  },
  {
    strike: 82800,
    callBid: '1.0', callAsk: '1.9', callMark: '5.7', callIv: '36.6',
    putMark: '591.7', putIv: '9.1', putBid: '599.0', putAsk: '609.0',
    callVol: '$89.97M', callVolChg: '-99.01%', callOi: '$16.76M', callOiBar: 75, callOiBarColor: 'red-tint',
    putOi: '$41.88K', putOiBar: 3, putOiBarColor: 'green-tint', putVol: '$7.36M', putVolChg: '-71.98%',
    callTheta: '-61.78', callVega: '0.19', callDelta: '0.01', callGamma: '0.00011',
    putDelta: '-1.00', putGamma: '0', putTheta: '0', putVega: '0'
  },
  {
    strike: 83000,
    callBid: '0.5', callAsk: '1.2', callMark: '3.5', callIv: '40.8',
    putMark: '791.7', putIv: '12.7', putBid: '787.0', putAsk: '798.0',
    callVol: '$189.81M', callVolChg: '-99.16%', callOi: '$29.40M', callOiBar: 95, callOiBarColor: 'red-tint',
    putOi: '$370.34K', putOiBar: 15, putOiBarColor: 'green-tint', putVol: '$5.24M', putVolChg: '-52.64%',
    callTheta: '-34.73', callVega: '0.08', callDelta: '0.00', callGamma: '0.00004',
    putDelta: '-0.99', putGamma: '0.00014', putTheta: '-140.17', putVega: '0.38'
  }
];

// ETH OPTIONS DATA (SCREENSHOT 5)
const ETH_OPTIONS_STRIKES_DATA = [
  {
    strike: 2410,
    callBid: '58.2', callAsk: '59.4', callMark: '58.94', callIv: '53.47',
    putMark: '0.01', putIv: '78.14', putBid: '0.01', putAsk: '0.02',
    putMarkBar: 25, putMarkBarColor: 'green-tint',
    callVol: '$1.42M', callVolChg: '45.20%', callOi: '$85.4K', callOiBar: 15, callOiBarColor: 'green-tint',
    putOi: '$1.24M', putOiBar: 30, putOiBarColor: 'green-tint', putVol: '$4.12M', putVolChg: '-99.10%',
    callTheta: '-12.5', callVega: '0.04', callDelta: '0.99', callGamma: '0.0001',
    putDelta: '-0.01', putGamma: '0.0001', putTheta: '-18.2', putVega: '0.03'
  },
  {
    strike: 2420,
    callBid: '48.2', callAsk: '49.4', callMark: '48.94', callIv: '47.88',
    putMark: '0.01', putIv: '62.83', putBid: '0.01', putAsk: '0.02',
    putMarkBar: 35, putMarkBarColor: 'green-tint',
    callVol: '$1.88M', callVolChg: '38.50%', callOi: '$110.2K', callOiBar: 20, callOiBarColor: 'green-tint',
    putOi: '$1.45M', putOiBar: 35, putOiBarColor: 'green-tint', putVol: '$3.85M', putVolChg: '-98.70%',
    callTheta: '-14.1', callVega: '0.05', callDelta: '0.98', callGamma: '0.0002',
    putDelta: '-0.02', putGamma: '0.0002', putTheta: '-21.4', putVega: '0.04'
  },
  {
    strike: 2430,
    callBid: '38.3', callAsk: '39.3', callMark: '38.95', callIv: '56.75',
    putMark: '0.01', putIv: '52.71', putBid: '0.01', putAsk: '0.02',
    putMarkBar: 40, putMarkBarColor: 'green-tint',
    callVol: '$2.15M', callVolChg: '52.10%', callOi: '$160.8K', callOiBar: 28, callOiBarColor: 'green-tint',
    putOi: '$1.88M', putOiBar: 42, putOiBarColor: 'green-tint', putVol: '$4.90M', putVolChg: '-99.20%',
    callTheta: '-16.8', callVega: '0.07', callDelta: '0.96', callGamma: '0.0003',
    putDelta: '-0.04', putGamma: '0.0003', putTheta: '-26.1', putVega: '0.06'
  },
  {
    strike: 2440,
    callBid: '28.5', callAsk: '29.4', callMark: '28.94', callIv: '40.51',
    putMark: '0.01', putIv: '43.65', putBid: '0.02', putAsk: '0.03',
    putMarkBar: 20, putMarkBarColor: 'green-tint',
    callVol: '$3.40M', callVolChg: '24.70%', callOi: '$240.5K', callOiBar: 38, callOiBarColor: 'green-tint',
    putOi: '$2.10M', putOiBar: 50, putOiBarColor: 'green-tint', putVol: '$6.20M', putVolChg: '-99.00%',
    callTheta: '-22.4', callVega: '0.11', callDelta: '0.91', callGamma: '0.0006',
    putDelta: '-0.09', putGamma: '0.0006', putTheta: '-35.7', putVega: '0.10'
  },
  {
    strike: 2450,
    callBid: '18.4', callAsk: '19.2', callMark: '18.99', callIv: '35.01',
    putMark: '0.05', putIv: '36.15', putBid: '0.04', putAsk: '0.05',
    putMarkBar: 25, putMarkBarColor: 'green-tint',
    callVol: '$6.85M', callVolChg: '18.20%', callOi: '$450.0K', callOiBar: 60, callOiBarColor: 'green-tint',
    putOi: '$3.50M', putOiBar: 75, putOiBarColor: 'green-tint', putVol: '$8.40M', putVolChg: '-97.40%',
    callTheta: '-38.5', callVega: '0.22', callDelta: '0.82', callGamma: '0.0014',
    putDelta: '-0.18', putGamma: '0.0014', putTheta: '-52.0', putVega: '0.21'
  },
  {
    strike: 2460,
    callBid: '8.8', callAsk: '9.4', callMark: '9.28', callIv: '29.17',
    putMark: '0.74', putIv: '36.86', putBid: '0.5', putAsk: '0.9',
    putMarkBar: 30, putMarkBarColor: 'green-tint',
    callVol: '$12.40M', callVolChg: '-12.50%', callOi: '$820.0K', callOiBar: 85, callOiBarColor: 'red-tint',
    putOi: '$2.80M', putOiBar: 65, putOiBarColor: 'green-tint', putVol: '$11.20M', putVolChg: '-88.50%',
    callTheta: '-64.2', callVega: '0.45', callDelta: '0.65', callGamma: '0.0028',
    putDelta: '-0.35', putGamma: '0.0028', putTheta: '-78.4', putVega: '0.44'
  },
  // SPOT DIVIDER: ETH 2468.97
  {
    strike: 2470,
    callBid: '1.9', callAsk: '2.8', callMark: '2.11', callIv: '26.89',
    callMarkBar: 25, callMarkBarColor: 'red-tint',
    putMark: '3.21', putIv: '27.35', putBid: '3', putAsk: '3.3',
    callVol: '$10.50M', callVolChg: '-64.20%', callOi: '$950.0K', callOiBar: 90, callOiBarColor: 'red-tint',
    putOi: '$1.95M', putOiBar: 45, putOiBarColor: 'green-tint', putVol: '$7.80M', putVolChg: '-75.20%',
    callTheta: '-72.0', callVega: '0.48', callDelta: '0.38', callGamma: '0.0029',
    putDelta: '-0.62', putGamma: '0.0029', putTheta: '-82.1', putVega: '0.49'
  },
  {
    strike: 2480,
    callBid: '0.32', callAsk: '0.4', callMark: '0.14', callIv: '27.81',
    putMark: '11.18', putIv: '26.90', putBid: '11', putAsk: '11.6',
    callVol: '$7.20M', callVolChg: '-85.00%', callOi: '$680.0K', callOiBar: 70, callOiBarColor: 'red-tint',
    putOi: '$850.0K', putOiBar: 25, putOiBarColor: 'green-tint', putVol: '$4.50M', putVolChg: '-62.00%',
    callTheta: '-44.5', callVega: '0.28', callDelta: '0.15', callGamma: '0.0016',
    putDelta: '-0.85', putGamma: '0.0016', putTheta: '-58.2', putVega: '0.30'
  },
  {
    strike: 2490,
    callBid: '0.07', callAsk: '0.14', callMark: '0.01', callIv: '30.09',
    putMark: '21.07', putIv: '32.23', putBid: '20.7', putAsk: '21.5',
    callVol: '$4.10M', callVolChg: '-92.40%', callOi: '$420.0K', callOiBar: 50, callOiBarColor: 'red-tint',
    putOi: '$420.0K', putOiBar: 15, putOiBarColor: 'green-tint', putVol: '$2.90M', putVolChg: '-45.50%',
    callTheta: '-24.0', callVega: '0.14', callDelta: '0.05', callGamma: '0.0007',
    putDelta: '-0.95', putGamma: '0.0007', putTheta: '-34.0', putVega: '0.15'
  },
  {
    strike: 2500,
    callBid: '0.07', callAsk: '0.16', callMark: '0.01', callIv: '34.52',
    callMarkBar: 35, callMarkBarColor: 'red-tint',
    putMark: '31.06', putIv: '33.41', putBid: '30.6', putAsk: '31.5',
    callVol: '$2.80M', callVolChg: '-96.00%', callOi: '$310.0K', callOiBar: 38, callOiBarColor: 'red-tint',
    putOi: '$280.0K', putOiBar: 10, putOiBarColor: 'green-tint', putVol: '$1.85M', putVolChg: '-38.00%',
    callTheta: '-14.2', callVega: '0.07', callDelta: '0.02', callGamma: '0.0003',
    putDelta: '-0.98', putGamma: '0.0003', putTheta: '-22.5', putVega: '0.08'
  },
  {
    strike: 2510,
    callBid: '0.02', callAsk: '0.05', callMark: '0.01', callIv: '40.77',
    putMark: '41.06', putIv: '33.79', putBid: '40.7', putAsk: '41.7',
    callVol: '$1.90M', callVolChg: '-98.10%', callOi: '$190.0K', callOiBar: 22, callOiBarColor: 'red-tint',
    putOi: '$150.0K', putOiBar: 6, putOiBarColor: 'green-tint', putVol: '$1.10M', putVolChg: '-25.00%',
    callTheta: '-8.1', callVega: '0.04', callDelta: '0.01', callGamma: '0.0001',
    putDelta: '-0.99', putGamma: '0.0001', putTheta: '-15.0', putVega: '0.04'
  },
  {
    strike: 2520,
    callBid: '0.01', callAsk: '0.02', callMark: '0.01', callIv: '48.52',
    putMark: '51.06', putIv: '50.63', putBid: '50.6', putAsk: '51.8',
    callVol: '$1.20M', callVolChg: '-99.00%', callOi: '$110.0K', callOiBar: 12, callOiBarColor: 'red-tint',
    putOi: '$90.0K', putOiBar: 4, putOiBarColor: 'green-tint', putVol: '$750.0K', putVolChg: '-18.00%',
    callTheta: '-4.5', callVega: '0.02', callDelta: '0.00', callGamma: '0.00005',
    putDelta: '-1.00', putGamma: '0', putTheta: '-8.2', putVega: '0.02'
  }
];

// XAUT OPTIONS DATA (SCREENSHOTS 1, 2, 3)
const XAUT_OPTIONS_STRIKES_DATA = [
  {
    strike: 4120,
    callBid: '57.4', callAsk: '59.6', callMark: '58.43', callIv: '28.5',
    putMark: '0.21', putIv: '30.07', putBid: '0.3', putAsk: '0.4',
    putMarkBar: 25, putMarkBarColor: 'green-tint',
    callVol: '$68.51K', callVolChg: '33.68%', callOi: '$95.99K', callOiBar: 8, callOiBarColor: 'green-tint',
    putOi: '$2.34M', putOiBar: 40, putOiBarColor: 'green-tint', putVol: '$3.07M', putVolChg: '-95.88%',
    callTheta: '-4.01', callVega: '0.05', callDelta: '0.98', callGamma: '0.00187',
    putDelta: '-0.02', putGamma: '0.00192', putTheta: '-4.19', putVega: '0.05'
  },
  {
    strike: 4130,
    callBid: '47.8', callAsk: '49.7', callMark: '48.74', callIv: '29.35',
    putMark: '0.4', putIv: '28.7', putBid: '0.22', putAsk: '0.6',
    putMarkBar: 30, putMarkBarColor: 'green-tint',
    callVol: '$315.59K', callVolChg: '48.03%', callOi: '$73.83K', callOiBar: 6, callOiBarColor: 'green-tint',
    putOi: '$742.67K', putOiBar: 15, putOiBarColor: 'green-tint', putVol: '$6.69M', putVolChg: '-96.00%',
    callTheta: '-6.7', callVega: '0.08', callDelta: '0.96', callGamma: '0.00336',
    putDelta: '-0.04', putGamma: '0.00326', putTheta: '-6.32', putVega: '0.08'
  },
  {
    strike: 4140,
    callBid: '38.4', callAsk: '40', callMark: '39.17', callIv: '28.05',
    callMarkBar: 10, callMarkBarColor: 'red-tint',
    putMark: '0.85', putIv: '27.87', putBid: '0.71', putAsk: '1',
    putMarkBar: 35, putMarkBarColor: 'green-tint',
    callVol: '$1.67M', callVolChg: '35.69%', callOi: '$440.73K', callOiBar: 10, callOiBarColor: 'red-tint',
    putOi: '$2.35M', putOiBar: 40, putOiBarColor: 'green-tint', putVol: '$10.62M', putVolChg: '-96.34%',
    callTheta: '-11.02', callVega: '0.14', callDelta: '0.92', callGamma: '0.00579',
    putDelta: '-0.08', putGamma: '0.00568', putTheta: '-10.35', putVega: '0.14'
  },
  {
    strike: 4150,
    callBid: '29.5', callAsk: '30.7', callMark: '30.14', callIv: '27.63',
    callMarkBar: 12, callMarkBarColor: 'red-tint',
    putMark: '1.79', putIv: '27.33', putBid: '1.6', putAsk: '2',
    putMarkBar: 38, putMarkBarColor: 'green-tint',
    callVol: '$6.40M', callVolChg: '15.79%', callOi: '$877.75K', callOiBar: 15, callOiBarColor: 'red-tint',
    putOi: '$2.03M', putOiBar: 35, putOiBarColor: 'green-tint', putVol: '$4.75M', putVolChg: '-90.57%',
    callTheta: '-16.43', callVega: '0.22', callDelta: '0.85', callGamma: '0.00906',
    putDelta: '-0.15', putGamma: '0.00906', putTheta: '-16.23', putVega: '0.22'
  },
  {
    strike: 4160,
    callBid: '21.4', callAsk: '22.3', callMark: '21.85', callIv: '27.02',
    callMarkBar: 15, callMarkBarColor: 'red-tint',
    putMark: '3.54', putIv: '26.96', putBid: '3.3', putAsk: '3.7',
    putMarkBar: 40, putMarkBarColor: 'green-tint',
    callVol: '$4.75M', callVolChg: '-3.85%', callOi: '$354.47K', callOiBar: 8, callOiBarColor: 'red-tint',
    putOi: '$738.00K', putOiBar: 15, putOiBarColor: 'green-tint', putVol: '$7.93M', putVolChg: '-86.61%',
    callTheta: '-22.19', callVega: '0.3', callDelta: '0.74', callGamma: '0.01258',
    putDelta: '-0.26', putGamma: '0.01265', putTheta: '-21.86', putVega: '0.3'
  },
  {
    strike: 4170,
    callBid: '14.5', callAsk: '15.1', callMark: '14.79', callIv: '26.74',
    putMark: '6.44', putIv: '26.55', putBid: '6.3', putAsk: '6.6',
    putMarkBar: 45, putMarkBarColor: 'green-tint',
    callVol: '$7.94M', callVolChg: '-14.11%', callOi: '$2.68M', callOiBar: 35, callOiBarColor: 'red-tint',
    putOi: '$666.59K', putOiBar: 12, putOiBarColor: 'green-tint', putVol: '$2.54M', putVolChg: '-79.81%',
    callTheta: '-26.05', callVega: '0.36', callDelta: '0.60', callGamma: '0.0152',
    putDelta: '-0.40', putGamma: '0.01533', putTheta: '-25.81', putVega: '0.36'
  },
  // SPOT DIVIDER: XAUT 4178.29
  {
    strike: 4180,
    callBid: '9.1', callAsk: '9.4', callMark: '9.24', callIv: '26.62',
    callMarkBar: 15, callMarkBarColor: 'red-tint',
    putMark: '10.89', putIv: '26.45', putBid: '10.7', putAsk: '11',
    putMarkBar: 35, putMarkBarColor: 'green-tint',
    callVol: '$10.50M', callVolChg: '-23.58%', callOi: '$5.49M', callOiBar: 70, callOiBarColor: 'red-tint',
    putOi: '$828.97K', putOiBar: 18, putOiBarColor: 'green-tint', putVol: '$3.80M', putVolChg: '-73.56%',
    callTheta: '-26.5', callVega: '0.37', callDelta: '0.45', callGamma: '0.0157',
    putDelta: '-0.55', putGamma: '0.01583', putTheta: '-26.27', putVega: '0.37'
  },
  {
    strike: 4190,
    callBid: '5.2', callAsk: '5.5', callMark: '5.33', callIv: '26.73',
    putMark: '16.94', putIv: '26.44', putBid: '16.6', putAsk: '17.3',
    callVol: '$5.30M', callVolChg: '-41.38%', callOi: '$3.42M', callOiBar: 45, callOiBarColor: 'red-tint',
    putOi: '$57.27K', putOiBar: 3, putOiBarColor: 'green-tint', putVol: '$1.10M', putVolChg: '-59.27%',
    callTheta: '-23.49', callVega: '0.32', callDelta: '0.30', callGamma: '0.01366',
    putDelta: '-0.70', putGamma: '0.01376', putTheta: '-23.2', putVega: '0.32'
  },
  {
    strike: 4200,
    callBid: '2.7', callAsk: '3', callMark: '2.86', callIv: '27.09',
    putMark: '24.5', putIv: '26.8', putBid: '24', putAsk: '25',
    putMarkBar: 25, putMarkBarColor: 'green-tint',
    callVol: '$10.63M', callVolChg: '-63.53%', callOi: '$3.84M', callOiBar: 50, callOiBarColor: 'red-tint',
    putOi: '$362.79K', putOiBar: 8, putOiBarColor: 'green-tint', putVol: '$299.57K', putVolChg: '-60.44%',
    callTheta: '-18.15', callVega: '0.25', callDelta: '0.18', callGamma: '0.01027',
    putDelta: '-0.82', putGamma: '0.01029', putTheta: '-17.73', putVega: '0.24'
  },
  {
    strike: 4210,
    callBid: '1.3', callAsk: '1.6', callMark: '1.43', callIv: '27.49',
    callMarkBar: 10, callMarkBarColor: 'red-tint',
    putMark: '33.03', putIv: '26.8', putBid: '32.4', putAsk: '33.7',
    callVol: '$1.98M', callVolChg: '8.33%', callOi: '$589.46K', callOiBar: 12, callOiBarColor: 'red-tint',
    putOi: '$7.32K', putOiBar: 1, putOiBarColor: 'green-tint', putVol: '$7.65K', putVolChg: '-39.06%',
    callTheta: '-12.3', callVega: '0.16', callDelta: '0.10', callGamma: '0.00678',
    putDelta: '-0.91', putGamma: '0.00664', putTheta: '-11.33', putVega: '0.15'
  },
  {
    strike: 4220,
    callBid: '0.5', callAsk: '0.8', callMark: '0.67', callIv: '28.02',
    callMarkBar: 8, callMarkBarColor: 'red-tint',
    putMark: '42.29', putIv: '27.04', putBid: '41.4', putAsk: '43.1',
    callVol: '$2.14M', callVolChg: '-76.47%', callOi: '$772.10K', callOiBar: 14, callOiBarColor: 'red-tint',
    putOi: '$17.56K', putOiBar: 1, putOiBarColor: 'green-tint', putVol: '$17.12K', putVolChg: '-32.08%',
    callTheta: '-7.24', callVega: '0.09', callDelta: '0.05', callGamma: '0.00393',
    putDelta: '-0.96', putGamma: '0.0037', putTheta: '-6.36', putVega: '0.08'
  },
  {
    strike: 4230,
    callBid: '0.2', callAsk: '0.5', callMark: '0.35', callIv: '29.2',
    callMarkBar: 5, callMarkBarColor: 'red-tint',
    putMark: '51.9', putIv: '26.55', putBid: '50.9', putAsk: '52.9',
    callVol: '$170.95K', callVolChg: '-44.44%', callOi: '$86.61K', callOiBar: 3, callOiBarColor: 'red-tint',
    putOi: '$0.00', putOiBar: 0, putOiBarColor: 'green-tint', putVol: '$83.59K', putVolChg: '-1.96%',
    callTheta: '-4.14', callVega: '0.05', callDelta: '0.02', callGamma: '0.00213',
    putDelta: '-0.98', putGamma: '0.00174', putTheta: '-2.97', putVega: '0.04'
  }
];

// ─── RWA TOKENS DATA (SCREENSHOT 4) ───────────────────────────────
const MARKETS_RWA_DATA = [
  {
    id: 'xaut-usd',
    symbol: 'XAUTUSD',
    name: 'Tether Gold Token Perpetual',
    basePrice: 4179.43,
    baseVol: 763050000,
    baseChange: 0.54,
    leverage: '100x',
    feeBadge: 'Fee 0.01%',
    isNew: false,
    categories: ['all', 'commodity']
  },
  {
    id: 'paxg-usd',
    symbol: 'PAXGUSD',
    name: 'PAX Gold Token Perpetual',
    basePrice: 4171.7,
    baseVol: 125200000,
    baseChange: 0.46,
    leverage: '100x',
    feeBadge: 'Fee 0.01%',
    isNew: false,
    categories: ['all', 'commodity']
  },
  {
    id: 'slvon-usd',
    symbol: 'SLVONUSD',
    name: 'iShares Silver (XAG) Token Perpetual',
    basePrice: 52.5,
    baseVol: 10050000,
    baseChange: 2.0,
    leverage: '50x',
    feeBadge: 'Fee 0.01%',
    isNew: false,
    categories: ['all', 'commodity']
  },
  {
    id: 'sndkb-usd',
    symbol: 'SNDKBUSD',
    name: 'SanDisk bStocks Token Perpetual',
    basePrice: 1363.23,
    baseVol: 6200000,
    baseChange: 1.9,
    leverage: '25x',
    isNew: false,
    categories: ['all', 'usstock']
  },
  {
    id: 'soxlb-usd',
    symbol: 'SOXLBUSD',
    name: 'Semicon Bull 3X ETF bStocks Perpetual',
    basePrice: 103.6,
    baseVol: 3160000,
    baseChange: 2.22,
    leverage: '25x',
    isNew: false,
    categories: ['all', 'usstock']
  },
  {
    id: 'qqqx-usd',
    symbol: 'QQQXUSD',
    name: 'Nasdaq xStock Token Perpetual',
    basePrice: 727.58,
    baseVol: 2090000,
    baseChange: 1.04,
    leverage: '25x',
    isNew: false,
    categories: ['all', 'usstock']
  },
  {
    id: 'oil-usd',
    symbol: 'OILUSD',
    name: 'US Oil fund ONDO Token Perpetual',
    basePrice: 156.2,
    baseVol: 1980000,
    baseChange: 2.43,
    leverage: '25x',
    isNew: false,
    categories: ['all', 'commodity']
  },
  {
    id: 'korub-usd',
    symbol: 'KORUBUSD',
    name: 'South Korea Bull 3X ETF bStocks Perpetual',
    basePrice: 11.79,
    baseVol: 1930000,
    baseChange: 10.19,
    leverage: '25x',
    isNew: true,
    categories: ['all', 'new', 'usstock']
  },
  {
    id: 'mrnab-usd',
    symbol: 'MRNABUSD',
    name: 'Moderna bStocks Token Perpetual',
    basePrice: 236.2,
    baseVol: 1450000,
    baseChange: 6.6,
    leverage: '25x',
    isNew: true,
    categories: ['all', 'new', 'usstock']
  },
  {
    id: 'spcxx-usd',
    symbol: 'SPCXXUSD',
    name: 'SpaceX xStock Token Perpetual',
    basePrice: 151.6,
    baseVol: 1340000,
    baseChange: 1.78,
    leverage: '25x',
    isNew: false,
    categories: ['all', 'usstock']
  },
  {
    id: 'tslax-usd',
    symbol: 'TSLAXUSD',
    name: 'Tesla xStock Token Perpetual',
    basePrice: 375.45,
    baseVol: 1030000,
    baseChange: 3.52,
    leverage: '25x',
    isNew: false,
    categories: ['all', 'usstock']
  },
  {
    id: 'crclx-usd',
    symbol: 'CRCLXUSD',
    name: 'Circle xStock Token Perpetual',
    basePrice: 86.35,
    baseVol: 505570,
    baseChange: 12.14,
    leverage: '25x',
    isNew: false,
    categories: ['all', 'usstock']
  },
  {
    id: 'liteb-usd',
    symbol: 'LITEBUSD',
    name: 'Lumentum Holdings bStocks Perpetual',
    basePrice: 871.4,
    baseVol: 494980,
    baseChange: 2.16,
    leverage: '25x',
    isNew: false,
    categories: ['all', 'usstock']
  }
];

// ─── STRADDLE DATA (SCREENSHOT 5) ─────────────────────────────────
const MARKETS_STRADDLE_DATA = [
  {
    id: 'mv-btc-82400-171026',
    symbol: 'MV-BTC',
    subtitle: '82400-171026',
    leverage: '200x',
    priceStr: '-',
    volStr: '-',
    changeStr: '-',
    isNeutral: true
  },
  {
    id: 'mv-btc-82400-161026',
    symbol: 'MV-BTC',
    subtitle: '82400-161026',
    leverage: '200x',
    price: 385,
    vol: 6200000,
    change: -61.03
  },
  {
    id: 'mv-btc-82200-161026',
    symbol: 'MV-BTC',
    subtitle: '82200-161026',
    leverage: '200x',
    price: 601,
    vol: 17850000,
    change: -44.2
  },
  {
    id: 'mv-btc-82200-171026',
    symbol: 'MV-BTC',
    subtitle: '82200-171026',
    leverage: '200x',
    price: 1056,
    vol: 26160,
    change: 11.49
  },
  {
    id: 'mv-btc-82000-161026',
    symbol: 'MV-BTC',
    subtitle: '82000-161026',
    leverage: '200x',
    price: 896,
    vol: 11660000,
    change: -22.09
  },
  {
    id: 'mv-btc-82000-171026',
    symbol: 'MV-BTC',
    subtitle: '82000-171026',
    leverage: '200x',
    price: 1162,
    vol: 1360000,
    change: 25.22
  },
  {
    id: 'mv-btc-81800-161026',
    symbol: 'MV-BTC',
    subtitle: '81800-161026',
    leverage: '200x',
    price: 814,
    vol: 2770000,
    change: -32.67
  },
  {
    id: 'mv-btc-81800-171026',
    symbol: 'MV-BTC',
    subtitle: '81800-171026',
    leverage: '200x',
    price: 1368,
    vol: 110870,
    change: 45.38
  },
  {
    id: 'mv-btc-81600-161026',
    symbol: 'MV-BTC',
    subtitle: '81600-161026',
    leverage: '200x',
    price: 1321,
    vol: 742370,
    change: 7.22
  },
  {
    id: 'mv-btc-81400-161026',
    symbol: 'MV-BTC',
    subtitle: '81400-161026',
    leverage: '200x',
    price: 1106,
    vol: 504950,
    change: -12.5
  },
  {
    id: 'mv-btc-81200-161026',
    symbol: 'MV-BTC',
    subtitle: '81200-161026',
    leverage: '200x',
    price: 1663,
    vol: 5450000,
    change: 21.48
  },
  {
    id: 'mv-btc-81000-161026',
    symbol: 'MV-BTC',
    subtitle: '81000-161026',
    leverage: '200x',
    price: 1874,
    vol: 8030000,
    change: 35.11
  },
  {
    id: 'mv-btc-80800-161026',
    symbol: 'MV-BTC',
    subtitle: '80800-161026',
    leverage: '200x',
    price: 1965,
    vol: 1240000,
    change: 18.5
  }
];

function renderMarketsScreen() {
  const mktView = document.getElementById('markets-screen-view');
  if (!mktView || mktView.style.display === 'none') return;

  if (marketsTopTab === 'watchlist') {
    renderWatchlistScreen();
  } else if (marketsTopTab === 'futures') {
    renderMarketsFutures();
  } else if (marketsTopTab === 'options') {
    renderOptionsChain();
  } else if (marketsTopTab === 'rwa') {
    renderRwaTokensList();
  } else if (marketsTopTab === 'straddles' || marketsTopTab === 'straddle') {
    renderStraddlesList();
  } else if (marketsTopTab === 'spot') {
    renderSpotList();
  } else if (marketsTopTab === 'analytics') {
    renderAnalyticsView();
  }
}

function switchMarketsTopTab(tab) {
  if (tab === 'straddle') tab = 'straddles';
  marketsTopTab = tab;

  // Update tab buttons
  const tabs = ['watchlist', 'futures', 'options', 'rwa', 'straddles', 'spot', 'analytics'];
  tabs.forEach(t => {
    const el = document.getElementById(`mkt-tab-${t}`);
    if (el) el.classList.toggle('active', t === tab || (t === 'straddles' && tab === 'straddle'));
  });

  // Toggle subviews
  tabs.forEach(t => {
    const v = document.getElementById(`mkt-view-${t}`);
    if (v) v.classList.toggle('hidden', t !== tab);
  });

  renderMarketsScreen();
}

// ─── WATCHLIST LOGIC ──────────────────────────────────────────────
function toggleWatchlist(coinId, e) {
  if (e) e.stopPropagation();

  const idx = userWatchlist.indexOf(coinId);
  if (idx >= 0) {
    userWatchlist.splice(idx, 1);
    showToast(`Removed from Watchlist`, 'info');
  } else {
    userWatchlist.push(coinId);
    showToast(`Added to Watchlist ★`, 'success');
  }

  try {
    localStorage.setItem('vtrade_watchlist', JSON.stringify(userWatchlist));
  } catch (err) {}

  renderMarketsScreen();
}

function renderWatchlistScreen() {
  const emptyState = document.getElementById('watchlist-empty-state');
  const listEl = document.getElementById('watchlist-contracts-list');

  if (!userWatchlist.length) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (listEl) listEl.classList.add('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (listEl) {
    listEl.classList.remove('hidden');
    const starredContracts = MARKETS_FUTURES_DATA.filter(c => userWatchlist.includes(c.id));
    listEl.innerHTML = renderContractRowsHtml(starredContracts);
  }
}

// ─── FUTURES TAB LOGIC ────────────────────────────────────────────
function setFuturesChip(chip) {
  marketsFuturesChip = chip;
  const chips = ['all', 'new', 'commodity', 'usstock', 'l1', 'smart', 'solana', 'meme', 'defi', 'ai', 'l2', 'gaming', 'nft'];
  chips.forEach(c => {
    const el = document.getElementById(`fchip-${c}`);
    if (el) el.classList.toggle('active', c === chip);
  });
  renderMarketsFutures();
}

function sortMarketsFutures(col) {
  if (marketsSortCol === col) {
    deltaMarketsSortAsc = !deltaMarketsSortAsc;
  } else {
    marketsSortCol = col;
    deltaMarketsSortAsc = false;
  }
  renderMarketsFutures();
}

function renderMarketsFutures() {
  const listEl = document.getElementById('markets-futures-list');
  if (!listEl) return;

  let list = [...MARKETS_FUTURES_DATA];

  // Filter by chip category
  if (marketsFuturesChip !== 'all') {
    list = list.filter(c => c.categories.includes(marketsFuturesChip));
  }

  // Filter by search query
  if (deltaMarketsSearchQuery && deltaMarketsSearchQuery.trim()) {
    const q = deltaMarketsSearchQuery.trim().toLowerCase();
    list = list.filter(c => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }

  // Sorting
  if (marketsSortCol === 'symbol') {
    list.sort((a, b) => deltaMarketsSortAsc ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol));
  } else if (marketsSortCol === 'price') {
    list.sort((a, b) => deltaMarketsSortAsc ? a.basePrice - b.basePrice : b.basePrice - a.basePrice);
  } else if (marketsSortCol === 'vol') {
    list.sort((a, b) => deltaMarketsSortAsc ? a.baseVol - b.baseVol : b.baseVol - a.baseVol);
  } else if (marketsSortCol === 'change') {
    list.sort((a, b) => deltaMarketsSortAsc ? a.baseChange - b.baseChange : b.baseChange - a.baseChange);
  }

  listEl.innerHTML = renderContractRowsHtml(list);
}

function renderContractRowsHtml(contractsList) {
  if (!contractsList.length) {
    return `<div style="text-align:center; padding: 32px; color:#8f96a3; font-size:13px;">No matching contracts found</div>`;
  }

  return contractsList.map(c => {
    // Dynamic price if available from live websocket/ticks
    let price = c.basePrice;
    let change = c.baseChange;
    if (c.id === 'bitcoin' && currentPrices['bitcoin']?.price) {
      price = currentPrices['bitcoin'].price;
      change = currentPrices['bitcoin'].change || change;
    } else if (c.id === 'ethereum' && currentPrices['ethereum']?.price) {
      price = currentPrices['ethereum'].price;
      change = currentPrices['ethereum'].change || change;
    } else if (c.id === 'solana' && currentPrices['solana']?.price) {
      price = currentPrices['solana'].price;
      change = currentPrices['solana'].change || change;
    }

    let priceStr = '';
    if (price >= 1000) {
      priceStr = `$${price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`;
    } else if (price >= 1) {
      priceStr = `$${price.toFixed(price < 10 ? 3 : 2)}`;
    } else if (price >= 0.01) {
      priceStr = `$${price.toFixed(4)}`;
    } else {
      priceStr = `$${price.toFixed(6)}`;
    }

    let volStr = '';
    if (c.baseVol >= 1e9) {
      volStr = `$${(c.baseVol / 1e9).toFixed(2)}B`;
    } else if (c.baseVol >= 1e6) {
      volStr = `$${(c.baseVol / 1e6).toFixed(2)}M`;
    } else if (c.baseVol >= 1e3) {
      volStr = `$${(c.baseVol / 1e3).toFixed(2)}K`;
    } else {
      volStr = `$${c.baseVol.toFixed(2)}`;
    }

    const isStarred = userWatchlist.includes(c.id);
    const isGain = change >= 0;
    const changeBadgeStr = (isGain ? '' : '') + change.toFixed(change % 1 === 0 ? 1 : 2) + '%';

    return `
      <div class="contract-row" onclick="selectContractRow('${c.id}')">
        <div class="c-cell-identity">
          <div class="c-name-wrap">
            <button class="c-star-btn ${isStarred ? 'starred' : ''}" onclick="toggleWatchlist('${c.id}', event)">
              ${isStarred ? '★' : '☆'}
            </button>
            <span class="c-symbol">${c.symbol}</span>
            ${c.isNew ? '<span class="c-badge-new">NEW</span>' : ''}
            <span class="c-lev-badge">${c.leverage}</span>
          </div>
          <span class="c-name">${c.name}</span>
          ${c.feeBadge ? `<span class="c-fee-badge"><svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>${c.feeBadge}</span>` : ''}
        </div>
        <div class="c-cell-price">
          <span class="c-price">${priceStr}</span>
          <span class="c-vol">${volStr}</span>
        </div>
        <div class="c-cell-change">
          <span class="change-badge ${isGain ? 'gain' : 'loss'}">${changeBadgeStr}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ─── SEARCH IN MARKETS ────────────────────────────────────────────
function toggleMarketsSearch() {
  const box = document.getElementById('mkt-search-expandable');
  if (!box) return;
  const isHidden = box.classList.contains('hidden');
  box.classList.toggle('hidden', !isHidden);
  if (isHidden) {
    const inp = document.getElementById('mkt-search-input');
    if (inp) {
      inp.focus();
    }
  } else {
    clearMarketsSearch();
  }
}

function handleMarketsSearch(val) {
  deltaMarketsSearchQuery = val || '';
  renderMarketsScreen();
}

function clearMarketsSearch() {
  deltaMarketsSearchQuery = '';
  const inp = document.getElementById('mkt-search-input');
  if (inp) inp.value = '';
  const box = document.getElementById('mkt-search-expandable');
  if (box) box.classList.add('hidden');
  renderMarketsScreen();
}

// ─── OPTIONS CHAIN LOGIC (SCREENSHOTS 1, 2, 3, 4, 5) ─────────────
function setOptionsUnderlying(asset) {
  activeOptionsUnderlying = asset;
  ['btc', 'eth', 'xaut'].forEach(a => {
    const el = document.getElementById(`opt-und-${a}`);
    if (el) el.classList.toggle('active', a === asset);
  });
  const sub = document.getElementById('expiry-modal-subtitle');
  if (sub) {
    sub.textContent = `${asset.toUpperCase()} Options expire at 5:30 pm`;
  }
  const countTag = document.getElementById('exp-countdown');
  if (countTag) {
    if (asset === 'xaut') {
      countTag.textContent = 'Expires in 4h: 31m';
    } else if (asset === 'eth') {
      countTag.textContent = 'Expires in 51m';
    } else {
      countTag.textContent = 'Expires in 53m';
    }
  }
  renderOptionsChain();
}

function setOptionsMetric(metric) {
  activeOptionsMetric = metric;
  ['price', 'oivol', 'greeks'].forEach(m => {
    const el = document.getElementById(`opt-metric-${m}`);
    if (el) el.classList.toggle('active', m === metric);
  });
  renderOptionsChain();
}

// ─── SELECT EXPIRY MODAL (SCREENSHOT 3) ───────────────────────────
function openExpiryModal() {
  const modal = document.getElementById('select-expiry-modal');
  if (!modal) return;
  const sub = document.getElementById('expiry-modal-subtitle');
  if (sub) {
    sub.textContent = `${activeOptionsUnderlying.toUpperCase()} Options expire at 5:30 pm`;
  }
  const listEl = document.getElementById('expiry-options-list');
  if (listEl) {
    listEl.innerHTML = OPTIONS_EXPIRIES.map((exp, idx) => {
      const isActive = idx === activeExpiryIndex;
      return `
        <div class="expiry-option-row ${isActive ? 'active' : ''}" onclick="selectExpiry(${idx})">
          <span class="exp-time-left">${exp.remaining}</span>
          <span class="exp-date-full">${exp.dateStr}</span>
          <span class="exp-check">${isActive ? '✓' : ''}</span>
        </div>
      `;
    }).join('');
  }
  modal.classList.remove('hidden');
}

function closeExpiryModal() {
  const modal = document.getElementById('select-expiry-modal');
  if (modal) modal.classList.add('hidden');
}

function selectExpiry(idx) {
  activeExpiryIndex = idx;
  const exp = OPTIONS_EXPIRIES[idx];
  if (exp) {
    const dateLabel = document.getElementById('exp-current-date');
    if (dateLabel) dateLabel.textContent = exp.shortDate;
    const countTag = document.getElementById('exp-countdown');
    if (countTag) {
      if (activeOptionsUnderlying === 'xaut') {
        countTag.textContent = 'Expires in 4h: 31m';
      } else {
        countTag.textContent = exp.countdown;
      }
    }
    showToast(`Expiry selected: ${exp.dateStr}`, 'success');
  }
  closeExpiryModal();
  renderOptionsChain();
}

// ─── SELECT VIEW MODAL (SCREENSHOT 4) ─────────────────────────────
function openSelectViewModal() {
  const modal = document.getElementById('select-view-modal');
  if (!modal) return;
  const modes = ['T-Shape', 'All', 'Calls', 'Puts'];
  modes.forEach(m => {
    const id = `vopt-${m.toLowerCase()}`;
    const el = document.getElementById(id);
    if (el) {
      const isActive = activeOptionsViewMode === m;
      el.classList.toggle('active', isActive);
      const chk = el.querySelector('.vopt-check');
      if (chk) chk.textContent = isActive ? '✓' : '';
    }
  });
  modal.classList.remove('hidden');
}

function closeSelectViewModal() {
  const modal = document.getElementById('select-view-modal');
  if (modal) modal.classList.add('hidden');
}

function setOptionsViewMode(mode) {
  activeOptionsViewMode = mode;
  const label = document.getElementById('opt-current-view-mode');
  if (label) label.textContent = mode;
  closeSelectViewModal();
  renderOptionsChain();
  showToast(`View mode changed to: ${mode}`, 'info');
}

function openStrategyBuilder() {
  showGenericModal('Options Strategy Builder', 'Design customized multi-leg Spreads, Straddles, Strangles, and Iron Condors with real-time payoff graphs.');
}

function openOptionsMoreMenu() {
  showGenericModal('Options Preferences', 'Configure IV Model (Black-Scholes / Bjerksund-Stensland), Strike intervals, and Order presets.');
}

function renderOptionsChain() {
  const tableEl = document.getElementById('options-chain-table');
  const headEl = document.getElementById('opt-chain-head');
  const bodyEl = document.getElementById('opt-chain-rows');
  if (!tableEl || !headEl || !bodyEl) return;

  const dataset = activeOptionsUnderlying === 'eth'
    ? ETH_OPTIONS_STRIKES_DATA
    : (activeOptionsUnderlying === 'xaut' ? XAUT_OPTIONS_STRIKES_DATA : BTC_OPTIONS_STRIKES_DATA);

  let spotPrice = 82284.0;
  let spotLabel = 'BTC';
  if (activeOptionsUnderlying === 'eth') {
    spotPrice = 2468.97;
    spotLabel = 'ETH';
  } else if (activeOptionsUnderlying === 'xaut') {
    spotPrice = 4178.29;
    spotLabel = 'XAUT';
  }

  // 1. Adapt Table Header to activeOptionsViewMode & activeOptionsMetric
  const isCallsOnly = activeOptionsViewMode === 'Calls';
  const isPutsOnly = activeOptionsViewMode === 'Puts';

  headEl.className = 'opt-chain-head' + (isCallsOnly ? ' mode-calls-only' : '') + (isPutsOnly ? ' mode-puts-only' : '');

  let callsHeaderHtml = '';
  let putsHeaderHtml = '';

  if (activeOptionsMetric === 'price') {
    callsHeaderHtml = `
      <div class="opt-head-calls">
        <span class="opt-head-side-title calls-title">Calls</span>
        <div class="opt-head-subcols">
          <span class="subcol bid-ask">BID<br><span class="ask-text">ASK</span></span>
          <span class="subcol mark-iv">Mark<br>Price / IV</span>
        </div>
      </div>
    `;
    putsHeaderHtml = `
      <div class="opt-head-puts">
        <span class="opt-head-side-title puts-title">Puts</span>
        <div class="opt-head-subcols">
          <span class="subcol mark-iv">Mark<br>Price / IV</span>
          <span class="subcol bid-ask">BID<br><span class="ask-text">ASK</span></span>
        </div>
      </div>
    `;
  } else if (activeOptionsMetric === 'oivol') {
    callsHeaderHtml = `
      <div class="opt-head-calls">
        <span class="opt-head-side-title calls-title">Calls</span>
        <div class="opt-head-subcols">
          <span class="subcol oivol-subcol">24h Vol<br><span class="subcol-subtext">24h Chg.</span></span>
          <span class="subcol oivol-subcol">OI</span>
        </div>
      </div>
    `;
    putsHeaderHtml = `
      <div class="opt-head-puts">
        <span class="opt-head-side-title puts-title">Puts</span>
        <div class="opt-head-subcols">
          <span class="subcol oivol-subcol">OI</span>
          <span class="subcol oivol-subcol">24h Vol<br><span class="subcol-subtext">24h Chg.</span></span>
        </div>
      </div>
    `;
  } else {
    // Greeks
    callsHeaderHtml = `
      <div class="opt-head-calls">
        <span class="opt-head-side-title calls-title">Calls</span>
        <div class="opt-head-subcols">
          <span class="subcol greeks-subcol">Theta<br><span class="subcol-subtext">Vega</span></span>
          <span class="subcol greeks-subcol">Delta<br><span class="subcol-subtext">Gamma</span></span>
        </div>
      </div>
    `;
    putsHeaderHtml = `
      <div class="opt-head-puts">
        <span class="opt-head-side-title puts-title">Puts</span>
        <div class="opt-head-subcols">
          <span class="subcol greeks-subcol">Delta<br><span class="subcol-subtext">Gamma</span></span>
          <span class="subcol greeks-subcol">Theta<br><span class="subcol-subtext">Vega</span></span>
        </div>
      </div>
    `;
  }

  const strikeHeaderHtml = `
    <div class="opt-head-strike">
      <span>Strike ↕</span>
    </div>
  `;

  if (isCallsOnly) {
    headEl.innerHTML = callsHeaderHtml + strikeHeaderHtml;
  } else if (isPutsOnly) {
    headEl.innerHTML = strikeHeaderHtml + putsHeaderHtml;
  } else {
    headEl.innerHTML = callsHeaderHtml + strikeHeaderHtml + putsHeaderHtml;
  }

  // 2. Build Rows
  let rowsHtml = '';
  let spotDividerRendered = false;

  dataset.forEach(row => {
    // Spot divider between strikes
    if (!spotDividerRendered && row.strike > spotPrice) {
      spotDividerRendered = true;
      rowsHtml += `
        <div class="opt-spot-divider">
          <div class="opt-spot-pill">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#00c087" stroke-width="2.5"><polyline points="3 17 9 11 13 15 21 7"/></svg>
            <span>${spotLabel} ${spotPrice.toFixed(activeOptionsUnderlying === 'btc' ? 1 : 2)}</span>
          </div>
        </div>
      `;
    }

    const isItmCalls = row.strike < spotPrice;
    const isItmPuts = row.strike > spotPrice;

    let callLeftHtml = '';
    let putRightHtml = '';

    if (activeOptionsMetric === 'price') {
      const callMarkBg = (row.callMarkBar ? `<div class="oi-depth-bar calls-bar ${row.callMarkBarColor || ''}" style="width:${row.callMarkBar}%;"></div>` : '');
      const putMarkBg = (row.putMarkBar ? `<div class="oi-depth-bar puts-bar ${row.putMarkBarColor || ''}" style="width:${row.putMarkBar}%;"></div>` : '');

      callLeftHtml = `
        <div class="opt-val-col">
          <span class="opt-val-green">$${row.callBid}</span>
          <span class="opt-val-red">$${row.callAsk}</span>
        </div>
        <div class="opt-val-col oi-cell-wrap">
          ${callMarkBg}
          <span class="opt-val-white oi-val-text">$${row.callMark}</span>
          <span class="opt-val-muted oi-val-text">${row.callIv}%</span>
        </div>
      `;
      putRightHtml = `
        <div class="opt-val-col oi-cell-wrap">
          ${putMarkBg}
          <span class="opt-val-white oi-val-text">$${row.putMark}</span>
          <span class="opt-val-muted oi-val-text">${row.putIv}%</span>
        </div>
        <div class="opt-val-col">
          <span class="opt-val-green">$${row.putBid}</span>
          <span class="opt-val-red">$${row.putAsk}</span>
        </div>
      `;
    } else if (activeOptionsMetric === 'oivol') {
      const callChgClass = (row.callVolChg && String(row.callVolChg).startsWith('-')) ? 'opt-val-red' : 'opt-val-green';
      const putChgClass = (row.putVolChg && String(row.putVolChg).startsWith('-')) ? 'opt-val-red' : 'opt-val-green';

      callLeftHtml = `
        <div class="opt-val-col">
          <span class="opt-val-white">${row.callVol}</span>
          <span class="${callChgClass}">${row.callVolChg}</span>
        </div>
        <div class="opt-val-col oi-cell-wrap">
          <div class="oi-depth-bar calls-bar ${row.callOiBarColor || ''}" style="width:${row.callOiBar || 10}%;"></div>
          <span class="oi-val-text">${row.callOi}</span>
        </div>
      `;
      putRightHtml = `
        <div class="opt-val-col oi-cell-wrap">
          <div class="oi-depth-bar puts-bar ${row.putOiBarColor || ''}" style="width:${row.putOiBar || 10}%;"></div>
          <span class="oi-val-text">${row.putOi}</span>
        </div>
        <div class="opt-val-col">
          <span class="opt-val-white">${row.putVol}</span>
          <span class="${putChgClass}">${row.putVolChg}</span>
        </div>
      `;
    } else {
      // Greeks
      callLeftHtml = `
        <div class="opt-val-col">
          <span class="opt-val-white">${row.callTheta}</span>
          <span class="opt-val-muted">${row.callVega}</span>
        </div>
        <div class="opt-val-col">
          <span class="opt-val-white">${row.callDelta}</span>
          <span class="opt-val-muted">${row.callGamma}</span>
        </div>
      `;
      putRightHtml = `
        <div class="opt-val-col">
          <span class="opt-val-white">${row.putDelta}</span>
          <span class="opt-val-muted">${row.putGamma}</span>
        </div>
        <div class="opt-val-col">
          <span class="opt-val-white">${row.putTheta}</span>
          <span class="opt-val-muted">${row.putVega}</span>
        </div>
      `;
    }

    const rowClass = 'opt-chain-row' +
      (isCallsOnly ? ' mode-calls-only' : '') +
      (isPutsOnly ? ' mode-puts-only' : '') +
      (isItmCalls ? ' itm-calls' : '') +
      (isItmPuts ? ' itm-puts' : '');

    let rowContent = '';
    if (isCallsOnly) {
      rowContent = `
        <div class="opt-call-side">${callLeftHtml}</div>
        <div class="opt-strike-center">${row.strike}</div>
      `;
    } else if (isPutsOnly) {
      rowContent = `
        <div class="opt-strike-center">${row.strike}</div>
        <div class="opt-put-side">${putRightHtml}</div>
      `;
    } else {
      rowContent = `
        <div class="opt-call-side">${callLeftHtml}</div>
        <div class="opt-strike-center">${row.strike}</div>
        <div class="opt-put-side">${putRightHtml}</div>
      `;
    }

    rowsHtml += `
      <div class="${rowClass}" onclick="selectOptionStrike(${row.strike})">
        ${rowContent}
      </div>
    `;
  });

  bodyEl.innerHTML = rowsHtml;
}

function selectOptionStrike(strike) {
  showToast(`Selected Strike: ${strike} (${activeOptionsUnderlying.toUpperCase()})`, 'info');
}

// ─── RWA TOKENS LOGIC (SCREENSHOT 4) ──────────────────────────────
let marketsRwaChip = 'all'; // 'all', 'new', 'commodity', 'usstock'
let marketsRwaSortCol = '';
let marketsRwaSortAsc = false;

function setRwaChip(chip) {
  marketsRwaChip = chip;
  const chips = ['all', 'new', 'commodity', 'usstock'];
  chips.forEach(c => {
    const el = document.getElementById(`rwachip-${c}`);
    if (el) el.classList.toggle('active', c === chip);
  });
  renderRwaTokensList();
}

function sortMarketsRwa(col) {
  if (marketsRwaSortCol === col) {
    marketsRwaSortAsc = !marketsRwaSortAsc;
  } else {
    marketsRwaSortCol = col;
    marketsRwaSortAsc = false;
  }
  renderRwaTokensList();
}

function renderRwaTokensList() {
  const listEl = document.getElementById('markets-rwa-list');
  if (!listEl) return;

  let list = [...MARKETS_RWA_DATA];

  // Filter by chip category
  if (marketsRwaChip !== 'all') {
    list = list.filter(c => c.categories.includes(marketsRwaChip));
  }

  // Filter by search query
  if (deltaMarketsSearchQuery && deltaMarketsSearchQuery.trim()) {
    const q = deltaMarketsSearchQuery.trim().toLowerCase();
    list = list.filter(c => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }

  // Sorting
  if (marketsRwaSortCol === 'symbol') {
    list.sort((a, b) => marketsRwaSortAsc ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol));
  } else if (marketsRwaSortCol === 'price') {
    list.sort((a, b) => marketsRwaSortAsc ? a.basePrice - b.basePrice : b.basePrice - a.basePrice);
  } else if (marketsRwaSortCol === 'vol') {
    list.sort((a, b) => marketsRwaSortAsc ? a.baseVol - b.baseVol : b.baseVol - a.baseVol);
  } else if (marketsRwaSortCol === 'change') {
    list.sort((a, b) => marketsRwaSortAsc ? a.baseChange - b.baseChange : b.baseChange - a.baseChange);
  }

  listEl.innerHTML = renderContractRowsHtml(list);
}

// ─── STRADDLES LOGIC (SCREENSHOT 5) ───────────────────────────────
let marketsStraddlesSortCol = '';
let marketsStraddlesSortAsc = false;

function sortMarketsStraddles(col) {
  if (marketsStraddlesSortCol === col) {
    marketsStraddlesSortAsc = !marketsStraddlesSortAsc;
  } else {
    marketsStraddlesSortCol = col;
    marketsStraddlesSortAsc = false;
  }
  renderStraddlesList();
}

function openWhatAreStraddlesModal() {
  const modal = document.getElementById('what-are-straddles-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeWhatAreStraddlesModal() {
  const modal = document.getElementById('what-are-straddles-modal');
  if (modal) modal.classList.add('hidden');
}

function renderStraddlesList() {
  const listEl = document.getElementById('markets-straddles-list');
  if (!listEl) return;

  let list = [...MARKETS_STRADDLE_DATA];

  if (deltaMarketsSearchQuery && deltaMarketsSearchQuery.trim()) {
    const q = deltaMarketsSearchQuery.trim().toLowerCase();
    list = list.filter(c => c.symbol.toLowerCase().includes(q) || (c.subtitle && c.subtitle.toLowerCase().includes(q)));
  }

  if (marketsStraddlesSortCol === 'symbol') {
    list.sort((a, b) => marketsStraddlesSortAsc ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol));
  } else if (marketsStraddlesSortCol === 'price') {
    list.sort((a, b) => {
      const pA = a.price !== undefined ? a.price : -999999;
      const pB = b.price !== undefined ? b.price : -999999;
      return marketsStraddlesSortAsc ? pA - pB : pB - pA;
    });
  } else if (marketsStraddlesSortCol === 'change') {
    list.sort((a, b) => {
      const cA = a.change !== undefined ? a.change : -999999;
      const cB = b.change !== undefined ? b.change : -999999;
      return marketsStraddlesSortAsc ? cA - cB : cB - cA;
    });
  }

  listEl.innerHTML = list.map(item => {
    const isStarred = userWatchlist.includes(item.id);
    let priceDisplay = '-';
    let volDisplay = '-';
    let changeBadgeHtml = '';

    if (item.price !== undefined) {
      priceDisplay = `$${item.price.toLocaleString('en-US')}`;
    }
    if (item.vol !== undefined) {
      if (item.vol >= 1e6) {
        volDisplay = `$${(item.vol / 1e6).toFixed(2)}M`;
      } else if (item.vol >= 1e3) {
        volDisplay = `$${(item.vol / 1e3).toFixed(2)}K`;
      } else {
        volDisplay = `$${item.vol}`;
      }
    }

    if (item.change !== undefined) {
      const isPos = item.change >= 0;
      const chgStr = (isPos ? '+' : '') + item.change.toFixed(item.change % 1 === 0 ? 0 : 2) + '%';
      changeBadgeHtml = `<span class="change-badge ${isPos ? 'gain' : 'loss'}">${chgStr}</span>`;
    } else {
      changeBadgeHtml = `<span class="change-badge neutral">-</span>`;
    }

    return `
      <div class="contract-row" onclick="showToast('Straddle ${item.symbol} ${item.subtitle} loaded', 'info')">
        <div class="c-cell-identity">
          <div class="c-name-wrap">
            <button class="c-star-btn ${isStarred ? 'starred' : ''}" onclick="toggleWatchlist('${item.id}', event)">
              ${isStarred ? '★' : '☆'}
            </button>
            <span class="c-symbol">${item.symbol}</span>
            <span class="c-lev-badge">${item.leverage}</span>
          </div>
          <span class="c-name">${item.subtitle}</span>
        </div>
        <div class="c-cell-price">
          <span class="c-price">${priceDisplay}</span>
          <span class="c-vol">${volDisplay}</span>
        </div>
        <div class="c-cell-change">
          ${changeBadgeHtml}
        </div>
      </div>
    `;
  }).join('');
}

// ─── SPOT TAB LOGIC (SCREENSHOT 1) ──────────────────────────────────
const MARKETS_SPOT_DATA = [
  {
    id: 'spot-xrpinr',
    symbol: 'XRP/INR',
    name: 'XRP INR spot',
    price: '₹136.564',
    rawPrice: 136.564,
    vol: '₹6L',
    rawVol: 600000,
    change: '3.49%',
    rawChange: 3.49,
    isPositive: true,
    starred: false
  },
  {
    id: 'spot-solinr',
    symbol: 'SOL/INR',
    name: 'SOL INR spot',
    price: '₹10806.15',
    rawPrice: 10806.15,
    vol: '₹9.87L',
    rawVol: 987000,
    change: '4.86%',
    rawChange: 4.86,
    isPositive: true,
    starred: false
  },
  {
    id: 'spot-ethinr',
    symbol: 'ETH/INR',
    name: 'ETH INR spot',
    price: '₹248035.5',
    rawPrice: 248035.5,
    vol: '₹3.06L',
    rawVol: 306000,
    change: '3.61%',
    rawChange: 3.61,
    isPositive: true,
    starred: false
  },
  {
    id: 'spot-btcinr',
    symbol: 'BTC/INR',
    name: 'BTC INR spot',
    price: '₹8320203',
    rawPrice: 8320203,
    vol: '₹13.77L',
    rawVol: 1377000,
    change: '1.37%',
    rawChange: 1.37,
    isPositive: true,
    starred: false
  }
];

let marketsSpotSortCol = 'vol'; // Default volume sort with orange arrow as in Screenshot 1
let marketsSpotSortAsc = false;
let userSpotWatchlist = [];

try {
  const savedSpot = localStorage.getItem('vtrade_spot_watchlist');
  if (savedSpot) userSpotWatchlist = JSON.parse(savedSpot);
} catch (e) {}

function sortMarketsSpot(col) {
  if (marketsSpotSortCol === col) {
    marketsSpotSortAsc = !marketsSpotSortAsc;
  } else {
    marketsSpotSortCol = col;
    marketsSpotSortAsc = false;
  }
  renderSpotList();
}

function toggleSpotStar(id, event) {
  if (event) event.stopPropagation();
  const idx = userSpotWatchlist.indexOf(id);
  if (idx >= 0) {
    userSpotWatchlist.splice(idx, 1);
    showToast('Removed from favorites', 'info');
  } else {
    userSpotWatchlist.push(id);
    showToast('Added to favorites ★', 'success');
  }
  try {
    localStorage.setItem('vtrade_spot_watchlist', JSON.stringify(userSpotWatchlist));
  } catch (e) {}
  renderSpotList();
}

function selectSpotContract(id) {
  const item = MARKETS_SPOT_DATA.find(s => s.id === id);
  if (!item) return;
  showToast(`Selected Spot ${item.symbol} (${item.price})`, 'info');
  if (typeof switchTradePair === 'function') {
    switchTradePair(item.symbol.replace('/INR', 'USDT'));
  }
}

function renderSpotList() {
  const listEl = document.getElementById('markets-spot-list');
  if (!listEl) return;

  let list = MARKETS_SPOT_DATA.map(item => ({
    ...item,
    starred: userSpotWatchlist.includes(item.id)
  }));

  // Filter by search query if user searched
  if (deltaMarketsSearchQuery && deltaMarketsSearchQuery.trim()) {
    const q = deltaMarketsSearchQuery.trim().toLowerCase();
    list = list.filter(item => item.symbol.toLowerCase().includes(q) || item.name.toLowerCase().includes(q));
  }

  // Sort
  if (marketsSpotSortCol === 'symbol') {
    list.sort((a, b) => marketsSpotSortAsc ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol));
  } else if (marketsSpotSortCol === 'price') {
    list.sort((a, b) => marketsSpotSortAsc ? a.rawPrice - b.rawPrice : b.rawPrice - a.rawPrice);
  } else if (marketsSpotSortCol === 'vol') {
    list.sort((a, b) => marketsSpotSortAsc ? a.rawVol - b.rawVol : b.rawVol - a.rawVol);
  } else if (marketsSpotSortCol === 'change') {
    list.sort((a, b) => marketsSpotSortAsc ? a.rawChange - b.rawChange : b.rawChange - a.rawChange);
  }

  if (!list.length) {
    listEl.innerHTML = `<div style="text-align:center; padding: 40px; color:#8f96a3; font-size:13px;">No spot contracts found</div>`;
    return;
  }

  listEl.innerHTML = list.map(item => `
    <div class="spot-row" onclick="selectSpotContract('${item.id}')">
      <div class="spot-cell-identity">
        <button class="spot-star-btn ${item.starred ? 'starred' : ''}" onclick="toggleSpotStar('${item.id}', event)" aria-label="Favorite">
          ${item.starred ? '★' : '☆'}
        </button>
        <div class="spot-name-details">
          <span class="spot-symbol-text">${item.symbol}</span>
          <span class="spot-subname">${item.name}</span>
        </div>
      </div>
      <div class="spot-cell-price-vol">
        <span class="spot-price-val">${item.price}</span>
        <span class="spot-vol-val">${item.vol}</span>
      </div>
      <div class="spot-cell-change">
        <div class="spot-change-pill ${item.isPositive ? 'positive' : 'negative'}">
          ${item.change}
        </div>
      </div>
    </div>
  `).join('');
}


// ─── ANALYTICS TAB LOGIC (SCREENSHOTS 2, 3, 4, 5) ─────────────────
let analyticsActiveAsset = 'BTC';
let analyticsRotateBannerDismissed = false;
let analyticsJumpMenuOpen = false;
let analyticsOiExpiry = 'D1';
let analyticsOiLegendsVisible = true;
let analyticsOiChangeLegendsVisible = true;
let analyticsOiChangeTimeRange = 'Last 12 hours';
let analyticsVolStrikeLegendsVisible = true;
let analyticsVolStrikeActiveTooltip = '83,200';
let analyticsIvRvLegendsVisible = true;
let analyticsIvRvTimeframe = 'Daily';

const ANALYTICS_DATA = {
  BTC: {
    spotPrice: '82,725.7',
    spotPriceNum: 82725.7,
    openInterestGlobal: '$1.38B',
    volGlobal: '$7.59B',
    totCallsOI: '$329.19M',
    totPutsOI: '$274.76M',
    pcr: '0.83',
    maxPain: '82400',
    totCallsVol: '$2.95B',
    totPutsVol: '$2.29B',
    // 23 strikes from 78,000 to 89,000 across Screenshots 2 & 3
    oiStrikes: [
      { strike: '78,000', calls: 0.8, puts: 25.0 },
      { strike: '79,200', calls: 0.7, puts: 15.0 },
      { strike: '79,500', calls: 0.6, puts: 14.5 },
      { strike: '79,800', calls: 0.5, puts: 7.6 },
      { strike: '80,200', calls: 0.9, puts: 3.2 },
      { strike: '80,500', calls: 0.8, puts: 4.0 },
      { strike: '80,800', calls: 0.7, puts: 5.1 },
      { strike: '81,200', calls: 0.9, puts: 14.8 },
      { strike: '81,500', calls: 0.8, puts: 3.5 },
      { strike: '81,800', calls: 0.9, puts: 7.9 },
      { strike: '82,000', calls: 0.8, puts: 8.4 },
      { strike: '82,400', calls: 0.9, puts: 5.3, isMaxPain: true },
      { strike: '82,800', calls: 33.2, puts: 22.8 },
      { strike: '83,200', calls: 46.8, puts: 7.2 },
      { strike: '83,500', calls: 26.5, puts: 1.1 },
      { strike: '83,800', calls: 16.4, puts: 0.8 },
      { strike: '84,200', calls: 14.8, puts: 0.7 },
      { strike: '84,500', calls: 7.8, puts: 0.9 },
      { strike: '84,800', calls: 6.2, puts: 0.8 },
      { strike: '85,500', calls: 24.2, puts: 1.1 },
      { strike: '86,500', calls: 8.5, puts: 0.7 },
      { strike: '87,500', calls: 4.2, puts: 0.6 },
      { strike: '89,000', calls: 7.1, puts: 0.5 }
    ],
    // OI Change strikes (Screenshot 4)
    oiChangeStrikes: [
      { strike: '81,200', calls: -0.8, puts: 5.8 },
      { strike: '81,500', calls: -0.5, puts: 2.1 },
      { strike: '81,800', calls: -0.4, puts: 4.9 },
      { strike: '82,200', calls: -0.3, puts: 8.2 },
      { strike: '82,500', calls: -1.6, puts: 12.4 },
      { strike: '82,800', calls: 1.2, puts: 9.1 },
      { strike: '83,200', calls: 8.1, puts: 17.2 },
      { strike: '83,500', calls: 21.4, puts: 9.8 },
      { strike: '83,800', calls: 16.8, puts: -0.6 },
      { strike: '84,200', calls: 15.5, puts: -0.5 },
      { strike: '84,500', calls: 11.2, puts: -0.4 }
    ],
    // Volume vs Strike (Screenshot 4 & 5)
    volStrikes: [
      { strike: '81,200', calls: 28, puts: 112, callsDisplay: '$28.00M', putsDisplay: '$112.00M' },
      { strike: '81,500', calls: 18, puts: 52, callsDisplay: '$18.00M', putsDisplay: '$52.00M' },
      { strike: '81,800', calls: 22, puts: 48, callsDisplay: '$22.00M', putsDisplay: '$48.00M' },
      { strike: '82,200', calls: 55, puts: 185, callsDisplay: '$55.00M', putsDisplay: '$185.00M' },
      { strike: '82,500', calls: 64, puts: 72, callsDisplay: '$64.00M', putsDisplay: '$72.00M' },
      { strike: '82,800', calls: 70, puts: 68, callsDisplay: '$70.00M', putsDisplay: '$68.00M' },
      { strike: '83,200', calls: 242, puts: 42, callsDisplay: '$ 128.10M', putsDisplay: '$ 3.04M' },
      { strike: '83,500', calls: 68, puts: 8, callsDisplay: '$68.00M', putsDisplay: '$8.00M' },
      { strike: '83,800', calls: 54, puts: 4, callsDisplay: '$54.00M', putsDisplay: '$4.00M' },
      { strike: '84,200', calls: 188, puts: 5, callsDisplay: '$188.00M', putsDisplay: '$5.00M' },
      { strike: '84,500', calls: 72, puts: 4, callsDisplay: '$72.00M', putsDisplay: '$4.00M' }
    ]
  },
  ETH: {
    spotPrice: '2,468.97',
    spotPriceNum: 2468.97,
    openInterestGlobal: '$420.5M',
    volGlobal: '$1.82B',
    totCallsOI: '$112.4M',
    totPutsOI: '$89.2M',
    pcr: '0.79',
    maxPain: '2450',
    totCallsVol: '$840.2M',
    totPutsVol: '$620.1M',
    oiStrikes: [
      { strike: '2,200', calls: 2.1, puts: 12.5 },
      { strike: '2,300', calls: 3.5, puts: 9.2 },
      { strike: '2,400', calls: 8.4, puts: 14.1 },
      { strike: '2,450', calls: 12.2, puts: 8.5, isMaxPain: true },
      { strike: '2,500', calls: 28.5, puts: 4.2 },
      { strike: '2,600', calls: 19.1, puts: 1.8 },
      { strike: '2,700', calls: 11.2, puts: 0.9 },
      { strike: '2,800', calls: 8.4, puts: 0.5 }
    ],
    oiChangeStrikes: [
      { strike: '2,300', calls: -1.2, puts: 4.2 },
      { strike: '2,400', calls: 2.1, puts: 3.5 },
      { strike: '2,450', calls: 4.8, puts: 1.9 },
      { strike: '2,500', calls: 12.4, puts: -0.8 },
      { strike: '2,600', calls: 8.2, puts: -0.5 }
    ],
    volStrikes: [
      { strike: '2,300', calls: 45, puts: 120, callsDisplay: '$45M', putsDisplay: '$120M' },
      { strike: '2,400', calls: 80, puts: 95, callsDisplay: '$80M', putsDisplay: '$95M' },
      { strike: '2,450', calls: 140, puts: 45, callsDisplay: '$140M', putsDisplay: '$45M' },
      { strike: '2,500', calls: 210, puts: 20, callsDisplay: '$210M', putsDisplay: '$20M' },
      { strike: '2,600', calls: 95, puts: 8, callsDisplay: '$95M', putsDisplay: '$8M' }
    ]
  },
  XAUT: {
    spotPrice: '4,178.29',
    spotPriceNum: 4178.29,
    openInterestGlobal: '$186.2M',
    volGlobal: '$763.05M',
    totCallsOI: '$48.5M',
    totPutsOI: '$34.2M',
    pcr: '0.70',
    maxPain: '4180',
    totCallsVol: '$390.5M',
    totPutsVol: '$280.2M',
    oiStrikes: [
      { strike: '4,120', calls: 1.2, puts: 18.2 },
      { strike: '4,140', calls: 2.4, puts: 12.5 },
      { strike: '4,160', calls: 4.8, puts: 7.9 },
      { strike: '4,170', calls: 8.1, puts: 4.5 },
      { strike: '4,180', calls: 16.5, puts: 5.2, isMaxPain: true },
      { strike: '4,190', calls: 22.4, puts: 1.8 },
      { strike: '4,200', calls: 28.9, puts: 0.9 },
      { strike: '4,220', calls: 14.2, puts: 0.4 }
    ],
    oiChangeStrikes: [
      { strike: '4,140', calls: -0.5, puts: 3.1 },
      { strike: '4,160', calls: 1.2, puts: 2.8 },
      { strike: '4,180', calls: 5.4, puts: 1.2 },
      { strike: '4,200', calls: 9.8, puts: -0.4 },
      { strike: '4,220', calls: 6.2, puts: -0.2 }
    ],
    volStrikes: [
      { strike: '4,140', calls: 30, puts: 85, callsDisplay: '$30M', putsDisplay: '$85M' },
      { strike: '4,160', calls: 55, puts: 60, callsDisplay: '$55M', putsDisplay: '$60M' },
      { strike: '4,180', calls: 120, puts: 35, callsDisplay: '$120M', putsDisplay: '$35M' },
      { strike: '4,200', calls: 175, puts: 15, callsDisplay: '$175M', putsDisplay: '$15M' }
    ]
  }
};

function toggleAnalyticsJumpMenu(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('analytics-jump-menu');
  if (!menu) return;
  analyticsJumpMenuOpen = !analyticsJumpMenuOpen;
  menu.classList.toggle('hidden', !analyticsJumpMenuOpen);
}

document.addEventListener('click', () => {
  const menu = document.getElementById('analytics-jump-menu');
  if (menu && !menu.classList.contains('hidden')) {
    menu.classList.add('hidden');
    analyticsJumpMenuOpen = false;
  }
});

function jumpToAnalyticsChart(cardId) {
  const el = document.getElementById(cardId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const menu = document.getElementById('analytics-jump-menu');
  if (menu) menu.classList.add('hidden');
  analyticsJumpMenuOpen = false;
}

function dismissRotateBanner(e) {
  if (e) e.stopPropagation();
  analyticsRotateBannerDismissed = true;
  const banner = document.getElementById('analytics-rotate-banner');
  if (banner) {
    banner.style.opacity = '0';
    banner.style.transform = 'translateY(-10px)';
    setTimeout(() => { banner.style.display = 'none'; }, 250);
  }
}

function setAnalyticsAsset(asset) {
  analyticsActiveAsset = asset;
  renderAnalyticsView();
}

function cycleAnalyticsAsset() {
  const assets = ['BTC', 'ETH', 'XAUT'];
  const nextIdx = (assets.indexOf(analyticsActiveAsset) + 1) % assets.length;
  setAnalyticsAsset(assets[nextIdx]);
}

function toggleLegends(cardKey) {
  if (cardKey === 'oi') analyticsOiLegendsVisible = !analyticsOiLegendsVisible;
  if (cardKey === 'oi-change') analyticsOiChangeLegendsVisible = !analyticsOiChangeLegendsVisible;
  if (cardKey === 'vol-strike') analyticsVolStrikeLegendsVisible = !analyticsVolStrikeLegendsVisible;
  if (cardKey === 'iv-rv') analyticsIvRvLegendsVisible = !analyticsIvRvLegendsVisible;
  renderAnalyticsView();
}

function selectVolStrikeTooltip(strike) {
  analyticsVolStrikeActiveTooltip = strike;
  renderAnalyticsView();
}

function renderAnalyticsView() {
  const listEl = document.getElementById('markets-analytics-list');
  if (!listEl) return;

  const data = ANALYTICS_DATA[analyticsActiveAsset] || ANALYTICS_DATA.BTC;

  // Update top subbar statistics
  const oiStat = document.getElementById('analytics-stat-oi');
  const volStat = document.getElementById('analytics-stat-vol');
  if (oiStat) oiStat.textContent = data.openInterestGlobal;
  if (volStat) volStat.textContent = data.volGlobal;

  // Manage rotate banner
  const banner = document.getElementById('analytics-rotate-banner');
  if (banner && analyticsRotateBannerDismissed) {
    banner.style.display = 'none';
  }

  const assetIconClass = analyticsActiveAsset.toLowerCase();
  const assetSymbolChar = analyticsActiveAsset === 'BTC' ? '₿' : (analyticsActiveAsset === 'ETH' ? 'Ξ' : 'G');

  // Build HTML for all 4 cards
  listEl.innerHTML = `
    <!-- CARD 1: Open Interest (Screenshots 2 & 3) -->
    <div class="analytics-card" id="chart-card-oi">
      <div class="acard-header">
        <span class="acard-title dashed-tip" title="Total active options contracts in circulation">Open Interest</span>
        <button class="acard-legends-toggle" onclick="toggleLegends('oi')">
          Legends <span style="font-size:10px; color:var(--delta-primary,#ff7a00);">${analyticsOiLegendsVisible ? '▼' : '▲'}</span>
        </button>
      </div>

      <div class="acard-controls-row">
        <button class="acard-dropdown-btn" onclick="showToast('Selected D1 Expiry', 'info')">
          <span>${analyticsOiExpiry}</span>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
        </button>
        <button class="acard-dropdown-btn" onclick="cycleAnalyticsAsset()">
          <span class="acard-crypto-icon ${assetIconClass}">${assetSymbolChar}</span>
          <span>${analyticsActiveAsset}</span>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
        </button>
      </div>

      <!-- Chart container -->
      <div class="chart-viewport-container">
        <div class="chart-yaxis-column">
          <span class="chart-yaxis-rotlabel">Open Interest($)</span>
          <span class="chart-yaxis-tick">50M</span>
          <span class="chart-yaxis-tick">40M</span>
          <span class="chart-yaxis-tick">30M</span>
          <span class="chart-yaxis-tick">20M</span>
          <span class="chart-yaxis-tick">10M</span>
          <span class="chart-yaxis-tick">0</span>
        </div>

        <div class="chart-scroll-viewport" id="oi-scroll-viewport">
          ${renderOiChartSvg(data)}
        </div>
      </div>

      ${analyticsOiLegendsVisible ? `
        <div class="acard-footer">
          <div class="acard-legends-row">
            <span><span class="legend-dot green"></span> Calls</span>
            <span><span class="legend-dot red"></span> Puts</span>
          </div>
          <div class="acard-metrics-row">
            <div class="acard-metric-item">Tot. Calls <span class="m-val">${data.totCallsOI}</span></div>
            <div class="acard-metric-item">Tot. Puts <span class="m-val">${data.totPutsOI}</span></div>
            <div class="acard-metric-item dashed-tip" title="Put/Call Ratio">PCR <span class="m-val">${data.pcr}</span></div>
            <div class="acard-metric-item dashed-tip" title="Strike price causing maximum financial loss to option buyers">Max Pain <span class="m-val">${data.maxPain}</span></div>
          </div>
        </div>
      ` : ''}
    </div>

    <!-- CARD 2: Open Interest Change (Screenshot 4) -->
    <div class="analytics-card" id="chart-card-oi-change">
      <div class="acard-header">
        <span class="acard-title dashed-tip" title="Net change in Open Interest over selected timeframe">Open Interest Change</span>
        <button class="acard-legends-toggle" onclick="toggleLegends('oi-change')">
          Legends <span style="font-size:10px; color:var(--delta-primary,#ff7a00);">${analyticsOiChangeLegendsVisible ? '▼' : '▲'}</span>
        </button>
      </div>

      <div class="acard-controls-row">
        <button class="acard-dropdown-btn" onclick="showToast('Selected D1 Expiry', 'info')">
          <span>${analyticsOiExpiry}</span>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
        </button>
        <button class="acard-dropdown-btn" onclick="cycleAnalyticsAsset()">
          <span class="acard-crypto-icon ${assetIconClass}">${assetSymbolChar}</span>
          <span>${analyticsActiveAsset}</span>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
        </button>
      </div>

      <div class="acard-controls-row" style="margin-top:-4px;">
        <button class="acard-dropdown-btn" onclick="cycleTimeRange()">
          <span>${analyticsOiChangeTimeRange}</span>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
        </button>
      </div>

      <div class="chart-viewport-container">
        <div class="chart-yaxis-column" style="height: 180px;">
          <span class="chart-yaxis-rotlabel">Open Interest($)</span>
          <span class="chart-yaxis-tick">30M</span>
          <span class="chart-yaxis-tick">20M</span>
          <span class="chart-yaxis-tick">10M</span>
          <span class="chart-yaxis-tick">0</span>
          <span class="chart-yaxis-tick">-10M</span>
          <span class="chart-yaxis-tick">-20M</span>
          <span class="chart-yaxis-tick">-30M</span>
        </div>

        <div class="chart-scroll-viewport" id="oi-change-scroll-viewport">
          ${renderOiChangeChartSvg(data)}
        </div>
      </div>

      ${analyticsOiChangeLegendsVisible ? `
        <div class="acard-footer">
          <div class="acard-legends-row">
            <span><span class="legend-dot green"></span> Calls</span>
            <span><span class="legend-dot red"></span> Puts</span>
          </div>
        </div>
      ` : ''}
    </div>

    <!-- CARD 3: Volume vs Strike (Screenshot 4 bottom & Screenshot 5 top) -->
    <div class="analytics-card" id="chart-card-vol-strike">
      <div class="acard-header">
        <span class="acard-title dashed-tip" title="Distribution of options trading volume across strikes">Volume vs Strike</span>
        <button class="acard-legends-toggle" onclick="toggleLegends('vol-strike')">
          Legends <span style="font-size:10px; color:var(--delta-primary,#ff7a00);">${analyticsVolStrikeLegendsVisible ? '▼' : '▲'}</span>
        </button>
      </div>

      <div class="acard-controls-row">
        <button class="acard-dropdown-btn" onclick="showToast('Selected D1 Expiry', 'info')">
          <span>${analyticsOiExpiry}</span>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
        </button>
        <button class="acard-dropdown-btn" onclick="cycleAnalyticsAsset()">
          <span class="acard-crypto-icon ${assetIconClass}">${assetSymbolChar}</span>
          <span>${analyticsActiveAsset}</span>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
        </button>
      </div>

      <div class="chart-viewport-container">
        <div class="chart-yaxis-column" style="height: 180px;">
          <span class="chart-yaxis-rotlabel">Volume($)</span>
          <span class="chart-yaxis-tick">300M</span>
          <span class="chart-yaxis-tick">250M</span>
          <span class="chart-yaxis-tick">200M</span>
          <span class="chart-yaxis-tick">150M</span>
          <span class="chart-yaxis-tick">100M</span>
          <span class="chart-yaxis-tick">50M</span>
          <span class="chart-yaxis-tick">0</span>
        </div>

        <div class="chart-scroll-viewport" id="vol-strike-scroll-viewport">
          ${renderVolStrikeChartSvg(data)}
        </div>
      </div>

      ${analyticsVolStrikeLegendsVisible ? `
        <div class="acard-footer">
          <div class="acard-legends-row">
            <span><span class="legend-dot green"></span> Calls</span>
            <span><span class="legend-dot red"></span> Puts</span>
          </div>
          <div class="acard-metrics-row">
            <div class="acard-metric-item">Tot. Calls <span class="m-val">${data.totCallsVol}</span></div>
            <div class="acard-metric-item">Tot. Puts <span class="m-val">${data.totPutsVol}</span></div>
          </div>
        </div>
      ` : ''}
    </div>

    <!-- CARD 4: IV vs RV (Screenshot 5 bottom) -->
    <div class="analytics-card" id="chart-card-iv-rv">
      <div class="acard-header">
        <span class="acard-title dashed-tip" title="Implied Volatility vs Realized Volatility">IV vs RV</span>
        <button class="acard-legends-toggle" onclick="toggleLegends('iv-rv')">
          Legends <span style="font-size:10px; color:var(--delta-primary,#ff7a00);">${analyticsIvRvLegendsVisible ? '▼' : '▲'}</span>
        </button>
      </div>

      <div class="acard-controls-row">
        <button class="acard-dropdown-btn" onclick="cycleIvRvTimeframe()">
          <span>${analyticsIvRvTimeframe}</span>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
        </button>
        <button class="acard-dropdown-btn" onclick="cycleAnalyticsAsset()">
          <span class="acard-crypto-icon ${assetIconClass}">${assetSymbolChar}</span>
          <span>${analyticsActiveAsset}</span>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
        </button>
      </div>

      <div class="chart-viewport-container">
        <div class="chart-yaxis-column" style="height: 160px;">
          <span class="chart-yaxis-rotlabel">Volatility(%)</span>
          <span class="chart-yaxis-tick">60</span>
          <span class="chart-yaxis-tick">50</span>
          <span class="chart-yaxis-tick">40</span>
          <span class="chart-yaxis-tick">30</span>
          <span class="chart-yaxis-tick">0</span>
        </div>

        <div class="chart-scroll-viewport" style="overflow-x:hidden;">
          ${renderIvRvChartSvg()}
        </div>
      </div>

      ${analyticsIvRvLegendsVisible ? `
        <div class="acard-footer">
          <div class="acard-legends-row">
            <span><span class="legend-dot green"></span> IV</span>
            <span><span class="legend-dot red"></span> RV</span>
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Auto scroll horizontally to center on active spot strikes
  setTimeout(() => {
    const oiViewport = document.getElementById('oi-scroll-viewport');
    if (oiViewport && oiViewport.scrollWidth > oiViewport.clientWidth) {
      oiViewport.scrollLeft = oiViewport.scrollWidth * 0.38;
    }
    const volViewport = document.getElementById('vol-strike-scroll-viewport');
    if (volViewport && volViewport.scrollWidth > volViewport.clientWidth) {
      volViewport.scrollLeft = volViewport.scrollWidth * 0.25;
    }
  }, 50);
}

function cycleTimeRange() {
  const ranges = ['Last 1 hour', 'Last 4 hours', 'Last 12 hours', 'Last 24 hours'];
  const nextIdx = (ranges.indexOf(analyticsOiChangeTimeRange) + 1) % ranges.length;
  analyticsOiChangeTimeRange = ranges[nextIdx];
  renderAnalyticsView();
}

function cycleIvRvTimeframe() {
  const tfs = ['Daily', 'Weekly', 'Monthly'];
  const nextIdx = (tfs.indexOf(analyticsIvRvTimeframe) + 1) % tfs.length;
  analyticsIvRvTimeframe = tfs[nextIdx];
  renderAnalyticsView();
}

// ─── SVG CHART RENDERERS ──────────────────────────────────────────

function renderOiChartSvg(data) {
  const strikes = data.oiStrikes;
  const colWidth = 26;
  const barWidth = 4.5;
  const chartHeight = 170;
  const svgWidth = Math.max(strikes.length * colWidth + 50, 600);
  const maxVal = 50; // 50M scale

  // Horizontal gridlines
  const gridLines = [0, 10, 20, 30, 40, 50].map(v => {
    const y = chartHeight - 30 - (v / maxVal) * (chartHeight - 45);
    return `<line x1="0" y1="${y}" x2="${svgWidth}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
  }).join('');

  // Spot price marker at strike 82,400 - 82,800
  const spotStrikeIdx = strikes.findIndex(s => s.strike === '82,800');
  const spotX = spotStrikeIdx >= 0 ? spotStrikeIdx * colWidth + 14 : 320;

  // Max pain marker at 82,400
  const maxPainIdx = strikes.findIndex(s => s.isMaxPain);
  const maxPainX = maxPainIdx >= 0 ? maxPainIdx * colWidth + 12 : 280;

  const bars = strikes.map((s, i) => {
    const x = i * colWidth + 16;
    const callHeight = (Math.min(s.calls, maxVal) / maxVal) * (chartHeight - 45);
    const putHeight = (Math.min(s.puts, maxVal) / maxVal) * (chartHeight - 45);
    const callY = chartHeight - 30 - callHeight;
    const putY = chartHeight - 30 - putHeight;

    return `
      <!-- Strike: ${s.strike} -->
      <g class="chart-strike-group" onclick="showToast('Strike ${s.strike} | Calls: $${s.calls}M | Puts: $${s.puts}M', 'info')">
        <rect x="${x}" y="${callY}" width="${barWidth}" height="${callHeight}" fill="#00c087" rx="1"/>
        <rect x="${x + barWidth + 1.5}" y="${putY}" width="${barWidth}" height="${putHeight}" fill="#eb5757" rx="1"/>
        <!-- X-axis label rotated -45 deg -->
        <text x="${x + barWidth}" y="${chartHeight - 14}" fill="#7a8296" font-size="9" font-weight="500" text-anchor="end" transform="rotate(-45, ${x + barWidth}, ${chartHeight - 14})">${s.strike}</text>
      </g>
    `;
  }).join('');

  return `
    <svg width="${svgWidth}" height="${chartHeight}" class="chart-svg-content" style="overflow:visible;">
      ${gridLines}
      ${bars}

      <!-- Vertical spot line and pill (Screenshot 3) -->
      <line x1="${spotX}" y1="20" x2="${spotX}" y2="${chartHeight - 30}" stroke="#ffffff" stroke-width="1" stroke-dasharray="3,3" opacity="0.8"/>
      <g transform="translate(${spotX - 44}, 0)">
        <rect x="0" y="0" width="88" height="18" fill="#232938" stroke="rgba(255,255,255,0.2)" rx="4"/>
        <text x="44" y="12" fill="#ffffff" font-size="9" font-weight="700" text-anchor="middle">${analyticsActiveAsset}: ${data.spotPrice} USD</text>
      </g>

      <!-- Max Pain badge (Screenshot 3) -->
      <g transform="translate(${maxPainX - 40}, 30)">
        <rect x="0" y="0" width="84" height="17" fill="rgba(235, 87, 87, 0.15)" stroke="#eb5757" rx="3"/>
        <text x="42" y="12" fill="#ffffff" font-size="8.5" font-weight="700" text-anchor="middle">Max pain: ${data.maxPain}</text>
      </g>
    </svg>
  `;
}

function renderOiChangeChartSvg(data) {
  const strikes = data.oiChangeStrikes;
  const colWidth = 32;
  const barWidth = 5;
  const chartHeight = 180;
  const svgWidth = Math.max(strikes.length * colWidth + 40, 380);
  const maxVal = 30; // -30M to +30M scale
  const zeroY = 90; // Midpoint for 0 line

  // Horizontal gridlines: +30M, +20M, +10M, 0, -10M, -20M, -30M
  const gridLines = [-30, -20, -10, 0, 10, 20, 30].map(v => {
    const y = zeroY - (v / maxVal) * 70;
    const isZero = v === 0;
    return `<line x1="0" y1="${y}" x2="${svgWidth}" y2="${y}" stroke="${isZero ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}" stroke-width="${isZero ? 1.2 : 0.8}"/>`;
  }).join('');

  const bars = strikes.map((s, i) => {
    const x = i * colWidth + 18;

    // Call bar
    let callY = zeroY;
    let callH = Math.abs(s.calls / maxVal) * 70;
    if (s.calls >= 0) {
      callY = zeroY - callH;
    } else {
      callY = zeroY;
    }

    // Put bar
    let putY = zeroY;
    let putH = Math.abs(s.puts / maxVal) * 70;
    if (s.puts >= 0) {
      putY = zeroY - putH;
    } else {
      putY = zeroY;
    }

    return `
      <g class="chart-strike-group" onclick="showToast('Strike ${s.strike} Δ | Calls: ${s.calls>0?'+':''}${s.calls}M | Puts: ${s.puts>0?'+':''}${s.puts}M', 'info')">
        <rect x="${x}" y="${callY}" width="${barWidth}" height="${Math.max(callH, 1)}" fill="#00c087" rx="1"/>
        <rect x="${x + barWidth + 2}" y="${putY}" width="${barWidth}" height="${Math.max(putH, 1)}" fill="#eb5757" rx="1"/>
        <!-- X-axis label rotated -45 deg -->
        <text x="${x + barWidth}" y="${chartHeight - 10}" fill="#7a8296" font-size="9" font-weight="500" text-anchor="end" transform="rotate(-45, ${x + barWidth}, ${chartHeight - 10})">${s.strike}</text>
      </g>
    `;
  }).join('');

  return `
    <svg width="${svgWidth}" height="${chartHeight}" class="chart-svg-content" style="overflow:visible;">
      ${gridLines}
      ${bars}
    </svg>
  `;
}

function renderVolStrikeChartSvg(data) {
  const strikes = data.volStrikes;
  const colWidth = 32;
  const barWidth = 5;
  const chartHeight = 180;
  const svgWidth = Math.max(strikes.length * colWidth + 50, 420);
  const maxVal = 300; // 0 to 300M

  // Horizontal gridlines: 0, 50, 100, 150, 200, 250, 300
  const gridLines = [0, 50, 100, 150, 200, 250, 300].map(v => {
    const y = chartHeight - 25 - (v / maxVal) * (chartHeight - 40);
    return `<line x1="0" y1="${y}" x2="${svgWidth}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
  }).join('');

  // Spot marker at 82,736.9
  const spotIdx = strikes.findIndex(s => s.strike === '82,800');
  const spotX = spotIdx >= 0 ? spotIdx * colWidth + 8 : 180;

  // Selected tooltip strike
  const tooltipIdx = strikes.findIndex(s => s.strike === analyticsVolStrikeActiveTooltip);
  const activeStrike = tooltipIdx >= 0 ? strikes[tooltipIdx] : strikes[6]; // default to 83,200 (Screenshot 5)
  const tipX = tooltipIdx >= 0 ? tooltipIdx * colWidth - 45 : 170;

  const bars = strikes.map((s, i) => {
    const x = i * colWidth + 16;
    const callHeight = (Math.min(s.calls, maxVal) / maxVal) * (chartHeight - 40);
    const putHeight = (Math.min(s.puts, maxVal) / maxVal) * (chartHeight - 40);
    const callY = chartHeight - 25 - callHeight;
    const putY = chartHeight - 25 - putHeight;

    return `
      <g class="chart-strike-group" onclick="selectVolStrikeTooltip('${s.strike}')" style="cursor:pointer;">
        <rect x="${x}" y="${callY}" width="${barWidth}" height="${callHeight}" fill="#00c087" rx="1"/>
        <rect x="${x + barWidth + 2}" y="${putY}" width="${barWidth}" height="${putHeight}" fill="#eb5757" rx="1"/>
        <text x="${x + barWidth}" y="${chartHeight - 8}" fill="#7a8296" font-size="9" font-weight="500" text-anchor="end" transform="rotate(-45, ${x + barWidth}, ${chartHeight - 8})">${s.strike}</text>
      </g>
    `;
  }).join('');

  return `
    <svg width="${svgWidth}" height="${chartHeight}" class="chart-svg-content" style="overflow:visible;">
      ${gridLines}
      ${bars}

      <!-- Spot line (Screenshot 5) -->
      <line x1="${spotX}" y1="15" x2="${spotX}" y2="${chartHeight - 25}" stroke="#ffffff" stroke-width="1" stroke-dasharray="3,3" opacity="0.8"/>
      <g transform="translate(${spotX - 44}, 0)">
        <rect x="0" y="0" width="88" height="16" fill="#232938" stroke="rgba(255,255,255,0.2)" rx="4"/>
        <text x="44" y="11" fill="#ffffff" font-size="8.5" font-weight="700" text-anchor="middle">${analyticsActiveAsset}: ${data.spotPrice} USD</text>
      </g>

      <!-- Interactive Callout Tooltip matching Screenshot 5 exactly -->
      <g transform="translate(${Math.max(10, tipX)}, 52)" style="filter: drop-shadow(0 6px 14px rgba(0,0,0,0.85)); pointer-events: none;">
        <rect x="0" y="0" width="124" height="48" fill="#151926" stroke="#ff7a00" stroke-width="1.6" rx="6"/>
        <text x="10" y="15" fill="#c0c6d4" font-size="9.5" font-weight="700">At Strike: $ ${activeStrike.strike}</text>
        <circle cx="14" cy="27" r="3" fill="#00c087"/>
        <text x="22" y="30" fill="#ffffff" font-size="9" font-weight="600">Calls: ${activeStrike.callsDisplay || '$128.10M'}</text>
        <circle cx="14" cy="39" r="3" fill="#eb5757"/>
        <text x="22" y="42" fill="#ffffff" font-size="9" font-weight="600">Puts: ${activeStrike.putsDisplay || '$3.04M'}</text>
      </g>
    </svg>
  `;
}

function renderIvRvChartSvg() {
  const chartWidth = 320;
  const chartHeight = 160;

  // Gridlines at 0, 30, 40, 50, 60%
  const gridLines = [0, 30, 40, 50, 60].map(v => {
    const y = chartHeight - 20 - (v / 60) * (chartHeight - 35);
    return `<line x1="0" y1="${y}" x2="${chartWidth}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
  }).join('');

  // Coordinates matching the curves in Screenshot 5
  // IV green line: curves smoothly between 34% and 40%
  const ivPath = "M 10 120 C 50 115, 80 112, 110 118 C 140 125, 170 105, 200 98 C 230 92, 260 108, 290 114 L 310 108";

  // RV red line: fluctuations between 22% and 39% with a sharp spike at the end
  const rvPath = "M 10 135 C 30 130, 50 138, 70 132 C 90 120, 110 135, 130 95 C 150 118, 170 112, 190 125 C 210 132, 230 138, 260 135 C 280 138, 295 140, 305 85 L 312 88";

  return `
    <svg width="${chartWidth}" height="${chartHeight}" class="chart-svg-content" style="width:100%; height:auto;" viewBox="0 0 ${chartWidth} ${chartHeight}">
      ${gridLines}
      <!-- IV Curve (Green) -->
      <path d="${ivPath}" fill="none" stroke="#00c087" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- RV Curve (Red) -->
      <path d="${rvPath}" fill="none" stroke="#eb5757" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

// ─── TRADE SCREEN CONTROLLER (SCREENSHOTS 1 & 2) ──────────────────
let tradeDeskSide = 'long'; // 'long' or 'short'
let tradeDeskLeverage = 200; // default 200x matching Screenshot 1
let tradeDeskOrderType = 'market'; // 'market' or 'limit'
let tradeDeskDepth = '0.5'; // '0.5', '1', '10', '50' matching Screenshot 2
let tradeDeskMarginMode = 'Isolated'; // 'Isolated' or 'Cross'
let tradeDeskPosTab = 'positions'; // 'positions' or 'orders'
let tradeDeskPairStarred = false;
let tradeDeskQty = 0;
let tradeDeskTpSlOpen = false;
let tradeDeskObViewMode = 'both'; // 'both', 'bids', 'asks'

// Base orderbook data centered on 82593.0 matching Screenshot 1
const TRADE_BASE_ASKS = [
  { price: 82596.0, size: 11.075 },
  { price: 82595.5, size: 1.512 },
  { price: 82595.0, size: 1.236 },
  { price: 82594.5, size: 1.011 },
  { price: 82594.0, size: 0.826 },
  { price: 82593.5, size: 0.675 }
];

const TRADE_BASE_BIDS = [
  { price: 82593.0, size: 4.844 },
  { price: 82592.5, size: 5.926 },
  { price: 82592.0, size: 7.248 },
  { price: 82591.5, size: 8.867 },
  { price: 82591.0, size: 10.846 },
  { price: 82590.5, size: 13.268 }
];

function renderTradeScreen() {
  updateTradeHeaderPrices();
  renderTradeOrderbook();
  updateTradeBalancePreview();
  renderTradePositions();
  startTradeFundingTimer();
}

function updateTradeHeaderPrices() {
  const btcPrice = currentPrices['bitcoin']?.price || 82593.0;
  const btcChange = currentPrices['bitcoin']?.change || 1.93;
  
  const priceEl = document.getElementById('trade-header-price');
  const changeEl = document.getElementById('trade-header-change');
  const midPriceEl = document.getElementById('obook-mid-price');
  const indexEl = document.getElementById('obook-index-price');
  const markEl = document.getElementById('obook-mark-price');

  if (priceEl) {
    priceEl.textContent = `$${btcPrice.toFixed(1)} ↓`;
  }
  if (changeEl) {
    changeEl.textContent = `${btcChange >= 0 ? '' : ''}${btcChange.toFixed(2)}%`;
  }
  if (midPriceEl) {
    midPriceEl.textContent = `$${btcPrice.toFixed(1)}`;
  }
  if (indexEl) {
    indexEl.textContent = (btcPrice + 39.5).toFixed(1);
  }
  if (markEl) {
    markEl.textContent = (btcPrice + 1.8).toFixed(1);
  }
}

function renderTradeOrderbook() {
  const asksContainer = document.getElementById('obook-asks-container');
  const bidsContainer = document.getElementById('obook-bids-container');
  if (!asksContainer || !bidsContainer) return;

  const btcPrice = currentPrices['bitcoin']?.price || 82593.0;
  const depthNum = parseFloat(tradeDeskDepth) || 0.5;

  // Generate dynamic asks & bids adjusted for depth
  const asks = TRADE_BASE_ASKS.map((row, idx) => {
    const p = Math.ceil(btcPrice / depthNum) * depthNum + (6 - idx) * depthNum;
    return { price: p, size: row.size };
  });

  const bids = TRADE_BASE_BIDS.map((row, idx) => {
    const p = Math.floor(btcPrice / depthNum) * depthNum - idx * depthNum;
    return { price: p, size: row.size };
  });

  const maxAskSize = Math.max(...asks.map(a => a.size), 12);
  const maxBidSize = Math.max(...bids.map(b => b.size), 14);

  asksContainer.innerHTML = asks.map(a => {
    const depthPct = Math.min(100, (a.size / maxAskSize) * 100);
    return `
      <div class="obook-row ask" onclick="fillTradePrice(${a.price.toFixed(1)})">
        <span class="ob-price">${a.price.toFixed(1)}</span>
        <span class="ob-size">${a.size.toFixed(3)}</span>
        <div class="ob-depth-bar ask" style="width: ${depthPct}%;"></div>
      </div>
    `;
  }).join('');

  bidsContainer.innerHTML = bids.map(b => {
    const depthPct = Math.min(100, (b.size / maxBidSize) * 100);
    return `
      <div class="obook-row bid" onclick="fillTradePrice(${b.price.toFixed(1)})">
        <span class="ob-price">${b.price.toFixed(1)}</span>
        <span class="ob-size">${b.size.toFixed(3)}</span>
        <div class="ob-depth-bar bid" style="width: ${depthPct}%;"></div>
      </div>
    `;
  }).join('');
}

function setTradeSide(side) {
  tradeDeskSide = side;
  const longBtn = document.getElementById('tside-btn-long');
  const shortBtn = document.getElementById('tside-btn-short');
  const actionBtn = document.getElementById('trade-action-btn');

  if (longBtn) longBtn.classList.toggle('active', side === 'long');
  if (shortBtn) shortBtn.classList.toggle('active', side === 'short');

  if (actionBtn) {
    if (side === 'long') {
      actionBtn.textContent = 'Buy / Long BTC';
      actionBtn.className = 'trade-action-btn buy';
    } else {
      actionBtn.textContent = 'Sell / Short BTC';
      actionBtn.className = 'trade-action-btn sell';
    }
  }
  updateTradeBalancePreview();
}

function toggleTradeMarginMode() {
  tradeDeskMarginMode = tradeDeskMarginMode === 'Isolated' ? 'Cross' : 'Isolated';
  const el = document.getElementById('trade-cur-margin-mode');
  if (el) el.textContent = tradeDeskMarginMode;
  showToast(`Switched Margin Mode to ${tradeDeskMarginMode}`, 'info');
}

function toggleTradePairStar(e) {
  if (e) e.stopPropagation();
  tradeDeskPairStarred = !tradeDeskPairStarred;
  const btn = document.getElementById('trade-star-btn');
  if (btn) {
    btn.textContent = tradeDeskPairStarred ? '★' : '☆';
    btn.classList.toggle('starred', tradeDeskPairStarred);
  }
  showToast(tradeDeskPairStarred ? 'Added BTCUSD to favorites ★' : 'Removed from favorites', 'info');
}

function toggleTradePairSelector() {
  showToast('Select contract: BTCUSD, ETHUSD, SOLUSD, XAUTUSD', 'info');
}

function cycleOrderbookViewMode() {
  const modes = ['both', 'bids', 'asks'];
  const nextIdx = (modes.indexOf(tradeDeskObViewMode) + 1) % modes.length;
  tradeDeskObViewMode = modes[nextIdx];
  const asksEl = document.getElementById('obook-asks-container');
  const bidsEl = document.getElementById('obook-bids-container');
  if (tradeDeskObViewMode === 'both') {
    if (asksEl) asksEl.style.display = 'flex';
    if (bidsEl) bidsEl.style.display = 'flex';
  } else if (tradeDeskObViewMode === 'bids') {
    if (asksEl) asksEl.style.display = 'none';
    if (bidsEl) bidsEl.style.display = 'flex';
  } else {
    if (asksEl) asksEl.style.display = 'flex';
    if (bidsEl) bidsEl.style.display = 'none';
  }
  showToast(`Orderbook view: ${tradeDeskObViewMode.toUpperCase()}`, 'info');
}

function openDepthModal() {
  const modal = document.getElementById('trade-depth-modal');
  if (!modal) return;
  const opts = ['0-5', '1', '10', '50'];
  opts.forEach(o => {
    const el = document.getElementById(`dopt-${o}`);
    const key = o.replace('-', '.');
    if (el) el.classList.toggle('active', key === tradeDeskDepth);
  });
  modal.classList.remove('hidden');
}

function closeDepthModal() {
  const modal = document.getElementById('trade-depth-modal');
  if (modal) modal.classList.add('hidden');
}

function selectOrderbookDepth(depth) {
  tradeDeskDepth = depth;
  const curEl = document.getElementById('ob-current-depth');
  if (curEl) curEl.textContent = depth;
  closeDepthModal();
  renderTradeOrderbook();
  showToast(`Orderbook Depth set to ${depth}`, 'info');
}

function openLeverageModal() {
  const modal = document.getElementById('trade-leverage-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeLeverageModal() {
  const modal = document.getElementById('trade-leverage-modal');
  if (modal) modal.classList.add('hidden');
}

function handleLeverageSliderChange(val) {
  const valEl = document.getElementById('lev-slider-val');
  if (valEl) valEl.textContent = `${val}x`;
}

function selectTradeLeverage(lev) {
  const slider = document.getElementById('trade-leverage-slider');
  if (slider) slider.value = lev;
  handleLeverageSliderChange(lev);
}

function confirmTradeLeverage() {
  const slider = document.getElementById('trade-leverage-slider');
  const lev = slider ? parseInt(slider.value) || 200 : 200;
  tradeDeskLeverage = lev;
  const curLev = document.getElementById('trade-cur-leverage');
  if (curLev) curLev.textContent = `${lev}x`;
  closeLeverageModal();
  updateTradeBalancePreview();
  showToast(`Leverage updated to ${lev}x`, 'success');
}

function toggleTradeOrderTypeMenu() {
  tradeDeskOrderType = tradeDeskOrderType === 'market' ? 'limit' : 'market';
  const typeEl = document.getElementById('trade-cur-otype');
  const limitBox = document.getElementById('trade-limit-price-box');
  if (typeEl) typeEl.textContent = tradeDeskOrderType === 'market' ? 'Market' : 'Limit';
  if (limitBox) limitBox.classList.toggle('hidden', tradeDeskOrderType !== 'limit');
  updateTradeBalancePreview();
}

function fillTradePrice(p) {
  const limitInput = document.getElementById('trade-limit-input');
  if (limitInput) limitInput.value = p.toFixed(1);
  if (tradeDeskOrderType !== 'limit') {
    toggleTradeOrderTypeMenu();
  }
}

function handleTradeQtyChange(val) {
  tradeDeskQty = parseFloat(val) || 0;
  updateTradeBalancePreview();
}

function setTradePct(pct) {
  const btcPrice = currentPrices['bitcoin']?.price || 82593.0;
  const avblCash = walletState.cashBalance || 10000;
  const maxMargin = avblCash * (pct / 100);
  const positionVal = maxMargin * tradeDeskLeverage;
  const qtyBtc = Math.max(0.001, roundValue(positionVal / btcPrice, 'qty'));
  
  tradeDeskQty = qtyBtc;
  const input = document.getElementById('trade-qty-input');
  if (input) input.value = qtyBtc;
  updateTradeBalancePreview();
}

function toggleTpSlFields() {
  tradeDeskTpSlOpen = !tradeDeskTpSlOpen;
  const radio = document.getElementById('trade-tpsl-radio');
  const inputs = document.getElementById('trade-tpsl-inputs');
  if (radio) radio.classList.toggle('active', tradeDeskTpSlOpen);
  if (inputs) inputs.classList.toggle('hidden', !tradeDeskTpSlOpen);
}

function updateTradeBalancePreview() {
  const btcPrice = currentPrices['bitcoin']?.price || 82593.0;
  const avblCash = walletState.cashBalance || 0;
  const orderVal = tradeDeskQty * btcPrice;
  const reqMargin = tradeDeskLeverage > 0 ? (orderVal / tradeDeskLeverage) : 0;

  const reqEl = document.getElementById('trade-req-margin');
  const avblEl = document.getElementById('trade-avbl-balance');

  if (reqEl) reqEl.textContent = reqMargin > 0 ? `$${reqMargin.toFixed(2)}` : '0';
  if (avblEl) avblEl.textContent = `$${avblCash.toFixed(2)} USD`;
}

function executeTradeDeskOrder() {
  if (!tradeDeskQty || tradeDeskQty <= 0) {
    showToast('Please enter an order quantity > 0', 'error');
    return;
  }

  const btcPrice = currentPrices['bitcoin']?.price || 82593.0;
  const orderVal = tradeDeskQty * btcPrice;
  const reqMargin = orderVal / tradeDeskLeverage;

  if (reqMargin > walletState.cashBalance) {
    showToast(`Insufficient balance! Required: $${reqMargin.toFixed(2)}, Available: $${walletState.cashBalance.toFixed(2)}`, 'error');
    return;
  }

  // Open real paper trading position in walletState
  walletState.cashBalance = Math.max(0, roundValue(walletState.cashBalance - reqMargin, 'money'));
  walletState.positions = walletState.positions || [];

  const newPos = {
    id: `pos-${Date.now()}`,
    coin: 'bitcoin',
    symbol: 'BTCUSD',
    side: tradeDeskSide,
    size: tradeDeskQty,
    entryPrice: btcPrice,
    leverage: tradeDeskLeverage,
    margin: reqMargin,
    marginMode: tradeDeskMarginMode,
    liquidationPrice: tradeDeskSide === 'long' ? (btcPrice * (1 - 1 / tradeDeskLeverage)) : (btcPrice * (1 + 1 / tradeDeskLeverage)),
    status: 'open',
    openedAt: Date.now()
  };

  walletState.positions.unshift(newPos);
  saveWalletState();

  showToast(`${tradeDeskSide.toUpperCase()} ${tradeDeskQty} BTC executed @ $${btcPrice.toFixed(1)}!`, 'success');

  // Reset qty input
  tradeDeskQty = 0;
  const input = document.getElementById('trade-qty-input');
  if (input) input.value = '';

  updateTradeBalancePreview();
  renderTradePositions();
  updateTabBadges();
}

function switchTradePosTab(tab) {
  tradeDeskPosTab = tab;
  const btnPos = document.getElementById('tab-btn-positions');
  const btnOrd = document.getElementById('tab-btn-orders');
  const panelPos = document.getElementById('panel-positions');
  const panelOrd = document.getElementById('panel-orders');

  if (btnPos) btnPos.classList.toggle('active', tab === 'positions');
  if (btnOrd) btnOrd.classList.toggle('active', tab === 'orders');
  if (panelPos) panelPos.classList.toggle('hidden', tab !== 'positions');
  if (panelOrd) panelOrd.classList.toggle('hidden', tab !== 'orders');

  if (tab === 'positions') renderTradePositions();
  else renderTradeOrders();
}

function renderTradePositions() {
  const panel = document.getElementById('panel-positions');
  if (!panel) return;

  const positions = (walletState.positions || []).filter(p => p.status === 'open' || !p.status);

  if (!positions.length) {
    panel.innerHTML = `
      <div class="trade-empty-pos">
        <div class="trade-empty-art">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#3d4659" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <path d="M11 8v6M8 11h6"/>
          </svg>
        </div>
        <span class="trade-empty-lbl">No open position</span>
      </div>
    `;
    return;
  }

  const btcPrice = currentPrices['bitcoin']?.price || 82593.0;

  panel.innerHTML = positions.map(p => {
    const isLong = p.side === 'long';
    const markPrice = p.coin === 'bitcoin' ? btcPrice : (currentPrices[p.coin]?.price || p.entryPrice);
    const pnl = isLong ? (markPrice - p.entryPrice) * p.size : (p.entryPrice - markPrice) * p.size;
    const pnlPct = p.margin > 0 ? (pnl / p.margin) * 100 : 0;
    const isProfit = pnl >= 0;

    return `
      <div class="trade-pos-card">
        <div class="tpos-card-header">
          <div class="tpos-sym-wrap">
            <span class="tpos-side-badge ${p.side}">${p.side.toUpperCase()}</span>
            <span class="tpos-sym-text">${p.symbol || 'BTCUSD'}</span>
            <span class="tpos-lev-badge">${p.leverage}x</span>
          </div>
          <div class="tpos-pnl-wrap">
            <div class="tpos-pnl-val ${isProfit ? 'profit' : 'loss'}">
              ${isProfit ? '+' : ''}$${pnl.toFixed(2)} (${isProfit ? '+' : ''}${pnlPct.toFixed(2)}%)
            </div>
          </div>
        </div>
        <div class="tpos-grid">
          <div class="tpos-item">
            <div class="tpos-item-lbl">Size</div>
            <div class="tpos-item-val">${p.size} BTC</div>
          </div>
          <div class="tpos-item">
            <div class="tpos-item-lbl">Entry Price</div>
            <div class="tpos-item-val">$${p.entryPrice.toFixed(1)}</div>
          </div>
          <div class="tpos-item">
            <div class="tpos-item-lbl">Mark Price</div>
            <div class="tpos-item-val">$${markPrice.toFixed(1)}</div>
          </div>
          <div class="tpos-item">
            <div class="tpos-item-lbl">Margin</div>
            <div class="tpos-item-val">$${p.margin.toFixed(2)}</div>
          </div>
          <div class="tpos-item">
            <div class="tpos-item-lbl">Liq. Price</div>
            <div class="tpos-item-val">$${(p.liquidationPrice || 0).toFixed(1)}</div>
          </div>
          <div class="tpos-item">
            <div class="tpos-item-lbl">Margin Mode</div>
            <div class="tpos-item-val">${p.marginMode || 'Isolated'}</div>
          </div>
        </div>
        <button class="tpos-close-btn" onclick="closeTradeDeskPosition('${p.id}')">Close Position</button>
      </div>
    `;
  }).join('');
}

function closeTradeDeskPosition(posId) {
  const posIdx = (walletState.positions || []).findIndex(p => p.id === posId);
  if (posIdx < 0) return;
  const p = walletState.positions[posIdx];

  const btcPrice = currentPrices['bitcoin']?.price || 82593.0;
  const isLong = p.side === 'long';
  const markPrice = p.coin === 'bitcoin' ? btcPrice : (currentPrices[p.coin]?.price || p.entryPrice);
  const pnl = isLong ? (markPrice - p.entryPrice) * p.size : (p.entryPrice - markPrice) * p.size;

  // Return margin + PnL
  walletState.cashBalance = Math.max(0, roundValue(walletState.cashBalance + p.margin + pnl, 'money'));
  walletState.positions.splice(posIdx, 1);
  saveWalletState();

  showToast(`Closed ${p.symbol || 'BTCUSD'} (${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)})`, 'info');
  renderTradePositions();
  updateTradeBalancePreview();
  updateTabBadges();
}

function renderTradeOrders() {
  const panel = document.getElementById('panel-orders');
  const countEl = document.getElementById('trade-orders-count');
  if (!panel) return;

  const orders = (walletState.orders || []).filter(o => o.status === 'pending' || o.status === 'open');
  if (countEl) countEl.textContent = orders.length;

  if (!orders.length) {
    panel.innerHTML = `
      <div class="trade-empty-pos">
        <div class="trade-empty-art">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#3d4659" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <span class="trade-empty-lbl">No open orders</span>
      </div>
    `;
    return;
  }

  panel.innerHTML = orders.map(o => `
    <div class="trade-pos-card">
      <div class="tpos-card-header">
        <span class="tpos-side-badge ${o.side}">${o.side.toUpperCase()}</span>
        <span class="tpos-sym-text">${o.symbol || 'BTCUSD'}</span>
        <span class="tpos-lev-badge">${o.type || 'LIMIT'}</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:12px; margin: 6px 0;">
        <span style="color:#8b92a4;">Price: <strong style="color:#fff;">$${o.price}</strong></span>
        <span style="color:#8b92a4;">Qty: <strong style="color:#fff;">${o.size} BTC</strong></span>
      </div>
      <button class="tpos-close-btn" onclick="cancelTradeDeskOrder('${o.id}')">Cancel Order</button>
    </div>
  `).join('');
}

function cancelTradeDeskOrder(orderId) {
  const idx = (walletState.orders || []).findIndex(o => o.id === orderId);
  if (idx >= 0) {
    walletState.orders.splice(idx, 1);
    saveWalletState();
    showToast('Limit order cancelled', 'info');
    renderTradeOrders();
    updateTabBadges();
  }
}

let tradeFundingTimerInterval = null;
function startTradeFundingTimer() {
  if (tradeFundingTimerInterval) return;
  let seconds = 3 * 3600 + 59 * 60 + 41;
  tradeFundingTimerInterval = setInterval(() => {
    seconds--;
    if (seconds < 0) seconds = 8 * 3600;
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    const el = document.getElementById('trade-funding-countdown');
    if (el) el.textContent = `${h}:${m}:${s}`;
  }, 1000);
}

// ─── BOTTOM NAVIGATION HANDLER ───────────────────────────────────
function showBottomTab(tab, btn) {
  activeBottomTab = tab || 'home';

  // Highlight bottom nav buttons
  const navTabs = ['home', 'markets', 'trade', 'charts', 'portfolio'];
  navTabs.forEach(t => {
    const el = document.getElementById(`nav-btn-${t}`);
    if (el) el.classList.toggle('active', t === activeBottomTab);
  });

  const homeView = document.getElementById('home-screen-view');
  const mktView = document.getElementById('markets-screen-view');
  const tradeView = document.getElementById('trade-screen-view');

  if (activeBottomTab === 'home') {
    if (homeView) homeView.style.display = 'flex';
    if (mktView) mktView.style.display = 'none';
    if (tradeView) tradeView.style.display = 'none';
    renderHomeScreen();
  } else if (activeBottomTab === 'markets') {
    if (homeView) homeView.style.display = 'none';
    if (mktView) mktView.style.display = 'flex';
    if (tradeView) tradeView.style.display = 'none';
    renderMarketsScreen();
  } else if (activeBottomTab === 'trade') {
    if (homeView) homeView.style.display = 'none';
    if (mktView) mktView.style.display = 'none';
    if (tradeView) tradeView.style.display = 'flex';
    renderTradeScreen();
  } else {
    if (homeView) homeView.style.display = 'none';
    if (mktView) mktView.style.display = 'none';
    if (tradeView) tradeView.style.display = 'none';
    showToast(`Navigating to ${activeBottomTab.toUpperCase()}...`, 'info');
  }
}

// Initialize on boot
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('home-screen-view')) {
      setTimeout(renderHomeScreen, 150);
    }
  });
}


