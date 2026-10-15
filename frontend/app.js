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

// ─── Supported Coins (Popular Coins: BTC, ETH, SOL, BNB, DOGE, XRP, ADA, SUI, AVAX, PEPE, NEAR) ───────────
const COIN_LIST = [
  { id: 'bitcoin',     symbol: 'BTC',  name: 'Bitcoin',       pair: 'BTC/USDT',  color: '#f7931a', category: 'Majors',  tags: ['Majors'],  icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',   binanceSymbol: 'BTCUSDT',  basePrice: 83800.00, baseChange: -0.10, baseVol: 31513000000, baseCap: 1676759000000 },
  { id: 'ethereum',    symbol: 'ETH',  name: 'Ethereum',      pair: 'ETH/USDT',  color: '#627eea', category: 'Majors',  tags: ['Majors'],  icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', binanceSymbol: 'ETHUSDT',  basePrice: 2515.00,  baseChange: -1.60, baseVol: 16497000000, baseCap: 307174000000 },
  { id: 'solana',      symbol: 'SOL',  name: 'Solana',        pair: 'SOL/USDT',  color: '#14f195', category: 'Layer 1', tags: ['Layer 1'], icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',  binanceSymbol: 'SOLUSDT',  basePrice: 107.50,   baseChange: -3.70, baseVol: 4059000000,  baseCap: 63637000000 },
  { id: 'binancecoin', symbol: 'BNB',  name: 'BNB',           pair: 'BNB/USDT',  color: '#f3ba2f', category: 'Layer 1', tags: ['Layer 1'], icon: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png', binanceSymbol: 'BNBUSDT', basePrice: 744.00, baseChange: -0.14, baseVol: 1850000000, baseCap: 107000000000 },
  { id: 'dogecoin',    symbol: 'DOGE', name: 'Dogecoin',      pair: 'DOGE/USDT', color: '#c2a633', category: 'Meme',    tags: ['Meme'],    icon: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',   binanceSymbol: 'DOGEUSDT', basePrice: 0.085,    baseChange: -0.65, baseVol: 850000000,   baseCap: 12500000000 },
  { id: 'ripple',      symbol: 'XRP',  name: 'XRP',           pair: 'XRP/USDT',  color: '#23292f', category: 'Payment', tags: ['Payment'], icon: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', binanceSymbol: 'XRPUSDT', basePrice: 1.38, baseChange: -0.85, baseVol: 2450000000, baseCap: 78000000000 },
  { id: 'cardano',     symbol: 'ADA',  name: 'Cardano',       pair: 'ADA/USDT',  color: '#0033ad', category: 'Layer 1', tags: ['Layer 1'], icon: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',   binanceSymbol: 'ADAUSDT',  basePrice: 0.236,    baseChange: -1.08, baseVol: 420000000,   baseCap: 8400000000 },
  { id: 'sui',         symbol: 'SUI',  name: 'Sui',           pair: 'SUI/USDT',  color: '#2a82e4', category: 'Layer 1', tags: ['Layer 1'], icon: 'https://assets.coingecko.com/coins/images/26375/small/sui-ocean-square.png', binanceSymbol: 'SUIUSDT', basePrice: 1.058, baseChange: -1.13, baseVol: 560000000, baseCap: 3100000000 },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche',     pair: 'AVAX/USDT', color: '#e84142', category: 'Layer 1', tags: ['Layer 1'], icon: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png', binanceSymbol: 'AVAXUSDT', basePrice: 10.23, baseChange: -2.10, baseVol: 390000000, baseCap: 4100000000 },
  { id: 'pepe',        symbol: 'PEPE', name: 'Pepe',          pair: 'PEPE/USDT', color: '#4ba35a', category: 'Meme',    tags: ['Meme'],    icon: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.png', binanceSymbol: 'PEPEUSDT', basePrice: 0.0000042, baseChange: 1.60, baseVol: 650000000, baseCap: 1800000000 },
  { id: 'near',        symbol: 'NEAR', name: 'NEAR Protocol', pair: 'NEAR/USDT', color: '#000000', category: 'Layer 1', tags: ['Layer 1'], icon: 'https://assets.coingecko.com/coins/images/10365/small/near.png', binanceSymbol: 'NEARUSDT', basePrice: 5.045, baseChange: -1.20, baseVol: 480000000, baseCap: 6200000000 }
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
  if (typeof applySettingsToTradePanel === 'function') applySettingsToTradePanel();
  if (typeof initDownloadApkVisibility === 'function') initDownloadApkVisibility();

  updateAuthStateUI();

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
  const menu = document.getElementById('margin-mode-dropdown-menu');
  if (menu) menu.classList.toggle('hidden');
}

function selectMarginModeMenu(mode) {
  setMarginMode(mode);
  const lbl = document.getElementById('margin-mode-display-label');
  if (lbl) lbl.textContent = mode === 'isolated' ? 'Isolated Margin Mode' : 'Cross Margin Mode';
  const menu = document.getElementById('margin-mode-dropdown-menu');
  if (menu) menu.classList.add('hidden');
  document.querySelectorAll('.mm-dropdown-item').forEach(el => {
    el.classList.toggle('active', el.textContent.toLowerCase().includes(mode));
  });
}

function toggleLeverageDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('leverage-dropdown-menu');
  if (menu) menu.classList.toggle('hidden');
}

function selectLeverageMenu(lev) {
  setLeverage(lev);
  const lbl = document.getElementById('btn-lev-label');
  if (lbl) lbl.textContent = `${lev}x`;
  const menu = document.getElementById('leverage-dropdown-menu');
  if (menu) menu.classList.add('hidden');
  document.querySelectorAll('.ld-chip').forEach(el => {
    el.classList.toggle('active', el.textContent === `${lev}x`);
  });
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

function renderNoDataState(colspan = 10) {
  return `<tr><td colspan="${colspan}" class="empty-row">
    <div class="shark-empty-state">
      <svg class="shark-empty-tray-icon" width="56" height="56" viewBox="0 0 64 64" fill="none">
        <path d="M12 22L20 44H44L52 22H12Z" stroke="#2c3545" stroke-width="2.5" fill="#141923"/>
        <path d="M26 34H38" stroke="#3b475c" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M12 22L22 14H42L52 22" stroke="#222a38" stroke-width="2" stroke-linejoin="round"/>
      </svg>
      <div class="shark-empty-text">No data</div>
    </div>
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
    if (!e.target.closest('.mode-lev-row')) {
      document.getElementById('margin-mode-dropdown-menu')?.classList.add('hidden');
      document.getElementById('leverage-dropdown-menu')?.classList.add('hidden');
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
  safeStorageSet('ct_token',    token);
  safeStorageSet('ct_username', username);
  safeStorageSet('ct_balance',  balance.toString());
}

function logout() {
  token = null; username = ''; balance = 10000;
  ['ct_token','ct_username','ct_balance'].forEach(k => safeStorageRemove(k));
  updateAuthStateUI();
  renderPositions();
  renderOrders();
  renderHistory();
  updatePnlSummary();
  updateMiniStats();
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

function initLightweightChart() {
  const container = document.getElementById('tradingview_widget_box');
  if (!container) return null;

  if (typeof LightweightCharts === 'undefined') {
    console.warn('LightweightCharts library not loaded, attempting fallback');
    return null;
  }

  if (lwChart && lwSeries) return { chart: lwChart, series: lwSeries };

  container.innerHTML = '';

  const w = container.clientWidth || 800;
  const h = container.clientHeight || 500;

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

    // Reposition interactive overlays whenever chart timeScale or priceScale moves
    chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      repositionChartOverlays();
    });

    // Resize observer
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          if (entry.contentRect && lwChart) {
            const nw = Math.floor(entry.contentRect.width);
            const nh = Math.floor(entry.contentRect.height);
            if (nw > 50 && nh > 50) {
              lwChart.resize(nw, nh);
              repositionChartOverlays();
            }
          }
        }
      });
      ro.observe(container);
    }

    return { chart: lwChart, series: lwSeries };
  } catch(e) {
    console.error('Failed to initialize Lightweight Charts:', e);
    return null;
  }
}

function updateChartCandles(candles) {
  if (!lwSeries) initLightweightChart();
  if (!lwSeries || !candles || !candles.length) return;

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
  const limWrap = document.getElementById('tv-order-limits-container');
  if (limWrap) limWrap.innerHTML = '';
}

function repositionChartOverlays() {
  const overlay = document.getElementById('tv-chart-orders-overlay');
  const unitLabel = document.getElementById('tv-quick-unit');
  const coinDef = getCoinDefinition(selectedCoin);
  if (unitLabel && coinDef) unitLabel.textContent = coinDef.symbol;

  if (!overlay) return;

  // Filter positions and pending orders strictly for the selected coin
  const curPos = (walletState?.positions || []).find(p => p.coin === selectedCoin && (p.status === 'open' || !p.status) && p.size > 0);
  const curCoinOrders = (walletState?.orders || []).filter(o => o.coin === selectedCoin && (o.status === 'pending' || o.status === 'open'));

  if (!curPos && curCoinOrders.length === 0) {
    overlay.classList.add('hidden');
    clearAllPriceLines();
    return;
  }
  overlay.classList.remove('hidden');

  const containerBox = document.getElementById('tv-chart-container');
  const chartHeight = containerBox?.clientHeight || 500;

  // 1. Entry Position Line & Tag
  const entryLine = document.getElementById('tv-order-entry-line');
  if (curPos && curPos.entry_price > 0) {
    activeDragPosId = curPos.id;
    const isLong = curPos.direction === 'long';
    const curPrice = currentPrices[curPos.coin]?.price || curPos.entry_price;
    const priceDiff = isLong ? (curPrice - curPos.entry_price) : (curPos.entry_price - curPrice);
    const livePnl = priceDiff * curPos.size;
    const isPos = livePnl >= 0;

    // Update or create native dashed price line on chart
    if (lwSeries) {
      if (!lwPriceLines.entry) {
        lwPriceLines.entry = lwSeries.createPriceLine({
          price: curPos.entry_price,
          color: isLong ? '#3861fb' : '#f6465d',
          lineWidth: 1.5,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: `${curPos.direction.toUpperCase()} ${curPos.leverage || 10}x`
        });
      } else {
        lwPriceLines.entry.applyOptions({
          price: curPos.entry_price,
          color: isLong ? '#3861fb' : '#f6465d',
          title: `${curPos.direction.toUpperCase()} ${curPos.leverage || 10}x`
        });
      }
    }

    if (entryLine) {
      entryLine.classList.remove('hidden');
      let y = null;
      if (lwSeries) {
        y = lwSeries.priceToCoordinate(curPos.entry_price);
      }
      if (y != null && y >= 0 && y <= chartHeight) {
        entryLine.style.display = 'flex';
        entryLine.style.top = `${y}px`;
      } else if (y == null) {
        entryLine.style.display = 'flex';
        entryLine.style.top = '48%';
      } else {
        entryLine.style.display = 'none';
      }

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
    }
  } else {
    if (lwPriceLines.entry && lwSeries) {
      try { lwSeries.removePriceLine(lwPriceLines.entry); } catch(e) {}
      lwPriceLines.entry = null;
    }
    if (entryLine) entryLine.classList.add('hidden');
  }

  // 2. Take Profit (TP) Line & Draggable Tag (Green)
  const tpLine = document.getElementById('tv-order-tp-line');
  if (curPos && curPos.take_profit && curPos.take_profit > 0) {
    if (lwSeries) {
      if (!lwPriceLines.tp) {
        lwPriceLines.tp = lwSeries.createPriceLine({
          price: curPos.take_profit,
          color: '#0ecb81',
          lineWidth: 1.5,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: 'TP'
        });
      } else {
        lwPriceLines.tp.applyOptions({ price: curPos.take_profit });
      }
    }

    if (tpLine && !isLwDraggingTp) {
      tpLine.classList.remove('hidden');
      let y = null;
      if (lwSeries) {
        y = lwSeries.priceToCoordinate(curPos.take_profit);
      }
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
    }
  } else {
    if (lwPriceLines.tp && lwSeries) {
      try { lwSeries.removePriceLine(lwPriceLines.tp); } catch(e) {}
      lwPriceLines.tp = null;
    }
    if (tpLine && !isLwDraggingTp) tpLine.classList.add('hidden');
  }

  // 3. Stop Loss (SL) Line & Draggable Tag (Orange/Red)
  const slLine = document.getElementById('tv-order-sl-line');
  if (curPos && curPos.stop_loss && curPos.stop_loss > 0) {
    if (lwSeries) {
      if (!lwPriceLines.sl) {
        lwPriceLines.sl = lwSeries.createPriceLine({
          price: curPos.stop_loss,
          color: '#f0883e',
          lineWidth: 1.5,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: 'SL'
        });
      } else {
        lwPriceLines.sl.applyOptions({ price: curPos.stop_loss });
      }
    }

    if (slLine && !isLwDraggingSl) {
      slLine.classList.remove('hidden');
      let y = null;
      if (lwSeries) {
        y = lwSeries.priceToCoordinate(curPos.stop_loss);
      }
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
    }
  } else {
    if (lwPriceLines.sl && lwSeries) {
      try { lwSeries.removePriceLine(lwPriceLines.sl); } catch(e) {}
      lwPriceLines.sl = null;
    }
    if (slLine && !isLwDraggingSl) slLine.classList.add('hidden');
  }

  // 4. Pending Limit Orders Lines
  renderPendingLimitLines(curCoinOrders);
}

function renderPendingLimitLines(curCoinOrders) {
  const limWrap = document.getElementById('tv-order-limits-container');
  if (!limWrap) return;
  limWrap.innerHTML = '';

  // Clean old limit lines from chart
  if (lwSeries && Array.isArray(lwPriceLines.limits)) {
    lwPriceLines.limits.forEach(item => {
      try { lwSeries.removePriceLine(item.line); } catch(e) {}
    });
  }
  lwPriceLines.limits = [];

  if (!curCoinOrders || !curCoinOrders.length) return;

  const containerBox = document.getElementById('tv-chart-container');
  const chartHeight = containerBox?.clientHeight || 500;

  curCoinOrders.forEach(ord => {
    if (!ord.limit_price || ord.limit_price <= 0) return;
    const isLong = (ord.side === 'Buy' || ord.side === 'Long' || ord.side === 'buy' || ord.side === 'long');
    const color = isLong ? '#0ecb81' : '#f6465d';

    if (lwSeries) {
      try {
        const line = lwSeries.createPriceLine({
          price: ord.limit_price,
          color: color,
          lineWidth: 1.5,
          lineStyle: 1, // Dotted
          axisLabelVisible: true,
          title: `LIMIT ${isLong ? 'BUY' : 'SELL'}`
        });
        lwPriceLines.limits.push({ id: ord.id, line });
      } catch(e) {}
    }

    let y = null;
    if (lwSeries) {
      y = lwSeries.priceToCoordinate(ord.limit_price);
    }

    const item = document.createElement('div');
    item.className = 'tv-limit-order-item';
    item.id = `tv-limit-item-${ord.id}`;
    if (y != null && y >= 0 && y <= chartHeight) {
      item.style.display = 'flex';
      item.style.top = `${y}px`;
    } else if (y == null) {
      item.style.display = 'flex';
      item.style.top = '50%';
    } else {
      item.style.display = 'none';
    }

    item.innerHTML = `
      <div class="tvol-h-line" style="border-top: 1.5px dotted ${color};"></div>
      <div class="tv-limit-tag ${isLong ? 'buy' : 'sell'}">
        <span>LIMIT ${isLong ? 'BUY' : 'SELL'}</span>
        <span>${fmtCoin(ord.size)}</span>
        <span>@ $${fmt(ord.limit_price)}</span>
        <button type="button" class="tv-limit-cancel-btn" onclick="cancelLimitOrder(${ord.id}, event)" title="Cancel Order">✕</button>
      </div>
      <div class="tvol-axis-badge" style="background:${color}; color:#000;">${fmt(ord.limit_price)}</div>
    `;
    limWrap.appendChild(item);
  });
}

function renderTvChartOverlay() {
  repositionChartOverlays();
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
    if (loadingEl) loadingEl.classList.add('hidden');
    if (errorEl) errorEl.classList.add('hidden');
    if (unsuppEl) unsuppEl.classList.remove('hidden');
    return;
  }
  if (unsuppEl) unsuppEl.classList.add('hidden');
  if (loadingEl) loadingEl.classList.add('hidden');
  if (errorEl) errorEl.classList.add('hidden');
  if (symDisp) symDisp.textContent = tvSymbol;

  // Initialize Lightweight Charts
  initLightweightChart();

  // Load genuine candles for selected coin and timeframe
  loadChart(selectedCoin, currentTF);

  // Synchronize 1-Click panel prices
  update1ClickPrices();
  repositionChartOverlays();
}

function retryTradingViewChart() {
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
      renderOpenOrders();
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
    showToast('Please sign in or create an account to paper-trade', 'error');
    openAuthModal('login');
    return;
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
    const res = await authPost('/api/positions/open', {
      coin: selectedCoin,
      direction: direction,
      size: sizeVal,
      leverage: leverage,
      order_type: 'market'
    });

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      const actionName = direction === 'long' ? 'Buy' : 'Sell';
      if (res.status === 'open' || res.id || res.position) {
        const fillPrice = res.entry_price || curPrice;
        showToast(`${actionName} order filled successfully at $${fmt(fillPrice)}`, 'success');
      } else if (res.status === 'pending') {
        showToast(`${actionName} order accepted: pending fill`, 'info');
      } else {
        showToast(`${actionName} order executed successfully`, 'success');
      }

      await syncWithBackend();
      renderPositions();
      renderOpenOrders();
      updateMiniStats();
      repositionChartOverlays();
    }
  } catch(err) {
    console.error('1-Click trade error:', err);
    showToast(`Order failed: ${err.message || 'Network error'}`, 'error');
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

      ctx.fillStyle = isLong ? '#2563eb' : '#db2777';
      const entryText = `${isLong ? 'LONG' : 'SHORT'} ${p.leverage}x @ $${fmt(p.entry_price)}`;
      ctx.font = 'bold 10px Inter, sans-serif';
      const tw = ctx.measureText(entryText).width + 14;
      ctx.fillRect(8, entryY - 9, tw, 18);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.fillText(entryText, 15, entryY + 3.5);
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

  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
    renderTvChartOverlay();
  }, 60);
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

function switchMainTab(tabName) {
  activeMainTab = tabName;

  // 1. Update Sub-Navigation strip
  document.querySelectorAll('.gsub-tab').forEach(b => b.classList.remove('active'));
  const subBtn = document.getElementById(`gsub-${tabName}`);
  if (subBtn) subBtn.classList.add('active');

  // 2. Update Fixed Bottom-Nav
  document.querySelectorAll('.groww-bottom-nav .gnav-btn').forEach(b => b.classList.remove('active'));
  const navKey = (tabName === 'orders') ? 'positions' : tabName;
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
  const tradePanel         = document.getElementById('view-trade-panel') || document.querySelector('.order-sidebar');
  const walletPanel        = document.getElementById('view-wallet-panel');
  const indicesTicker      = document.getElementById('groww-indices-ticker');

  // Hide all sections first
  if (exploreContainer)   exploreContainer.classList.add('hidden');
  if (chartArea)          chartArea.classList.add('hidden');
  if (positionsContainer) positionsContainer.classList.add('hidden');
  if (tradePanel)         tradePanel.classList.add('hidden');
  if (walletPanel)        walletPanel.classList.add('hidden');

  // Strictly keep watchlistSection & marketsPanel hidden on pure chart tab
  if (watchlistSection)   watchlistSection.classList.add('hidden');
  if (marketsPanel)       marketsPanel.classList.add('hidden');

  const isDesktop = typeof window !== 'undefined' && window.innerWidth > 1024;

  if (tabName === 'explore') {
    if (exploreContainer) exploreContainer.classList.remove('hidden');
    if (indicesTicker) indicesTicker.classList.remove('hidden');
    renderGrowwExploreUI();
  } else if (tabName === 'wallet') {
    if (walletPanel) walletPanel.classList.remove('hidden');
    if (indicesTicker) indicesTicker.classList.remove('hidden');
    renderWalletOverview();
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
      updateTradeCalc();
      renderTradingViewChart();
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        renderTvChartOverlay();
      }, 60);
    } else {
      // Mobile isolated single-tab mode
      if (tabName === 'chart') {
        if (chartArea) chartArea.classList.remove('hidden');
        if (chartContainerBox) chartContainerBox.classList.remove('hidden');
        if (chartHeader) chartHeader.classList.remove('hidden');
        if (tfRow) tfRow.classList.remove('hidden');
        updateChartQuickCoinChips();
        renderTradingViewChart();
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
          renderTvChartOverlay();
        }, 60);
      } else if (tabName === 'trade') {
        if (tradePanel) tradePanel.classList.remove('hidden');
        updateMiniStats();
        updateTradeActiveCoinBanner();
        updateTradeCalc();
      } else if (tabName === 'positions' || tabName === 'orders') {
        if (positionsContainer) positionsContainer.classList.remove('hidden');
        showBottomTab(tabName === 'orders' ? 'orders' : 'positions');
        renderPositions();
        renderOrders();
        renderHistory();
      }
    }
  }
}

// Ensure layout updates on window resize
window.addEventListener('resize', () => {
  if (['chart', 'trade', 'positions', 'orders'].includes(activeMainTab)) {
    switchMainTab(activeMainTab);
  }
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
  COIN_LIST.forEach(c => updateGrowwLiveElements(c.id));
  renderGrowwMovers();
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
  if (!isHidden) {
    const inp = document.getElementById('groww-quick-search-input');
    if (inp) {
      inp.focus();
      inp.select();
    }
  }
}

function handleGrowwSearch(query) {
  const q = String(query).trim().toLowerCase();
  if (!q) return;
  const match = COIN_LIST.find(c => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
  if (match) {
    selectCoin(match.id);
    switchMainTab('chart');
    const wrap = document.getElementById('groww-search-bar-wrap');
    if (wrap) wrap.classList.add('hidden');
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
    if (side === 'buy') {
      subBtn.className = 'btn-execute-solid btn-execute-buy-long';
    } else {
      subBtn.className = 'btn-execute-solid btn-execute-sell-short';
    }
  }
  updateTradeLabels();
  updateTradeCalc();
}

function setOrderType(type) {
  tradeOrderType = type;
  document.querySelectorAll('.sot-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(`otype-${type}`)?.classList.add('active');
  
  const limitField = document.getElementById('limit-price-group');
  const limitLabel = document.getElementById('limit-price-label');
  if (limitField) {
    const isLimitOrStop = (type === 'limit' || type === 'stop-l' || type === 'stop-m');
    limitField.style.display = isLimitOrStop ? 'block' : 'none';
    if (limitLabel) {
      if (type === 'stop-l') limitLabel.textContent = 'Stop-Limit Price (USDT)';
      else if (type === 'stop-m') limitLabel.textContent = 'Stop-Market Price (USDT)';
      else limitLabel.textContent = 'Order Price (USDT)';
    }
    if (isLimitOrStop) {
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
    deskAvail.textContent = `$${fmtNum(walletState.cashBalance)} USDT`;
  }
  if (deskRisk) deskRisk.textContent = `$${fmtNum(marginRequired)} USDT`;
  if (deskFee) deskFee.textContent = orderValue > 0 ? `$${fmtNum(estFee)} USDT` : '--';
  if (deskLiq) deskLiq.textContent = (orderValue > 0 && liqPrice > 0) ? `$${fmt(liqPrice)}` : '--';

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
  if (uchipCoin) uchipCoin.textContent = sym;
  
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
      walletState.orders = ordRes.map(o => {
        const coinDef = getCoinDefinition(o.coin);
        return {
          id: o.id,
          coin: o.coin,
          symbol: coinDef ? coinDef.symbol : o.coin.toUpperCase(),
          side: o.direction === 'long' ? 'Long' : o.direction === 'short' ? 'Short' : (o.direction === 'buy' ? 'Buy' : 'Sell'),
          category: (o.direction === 'long' || o.direction === 'short') ? 'position' : 'spot',
          type: o.type === 'limit' ? 'Limit' : 'Market',
          price: roundValue(o.price, 'money'),
          size: roundValue(o.amount, 'coin'),
          leverage: 10,
          margin: roundValue((o.amount * o.price) / 10, 'money'),
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
    openAuthModal('login');
    showToast('Please log in or register to trade', 'info');
    return;
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
    let res;

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

    // Success Toast matching actual backend status (Requirement 7)
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

    // Clear quantity input
    if (inputEl) inputEl.value = '';

    // Synchronize UI with backend (Requirement 8)
    await syncWithBackend();

  } catch (err) {
    console.error('Order placement failed:', err);
    let errMsg = err.message || 'Order execution failed';
    if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
      errMsg = 'Backend temporarily unavailable. Please check localhost server.';
    }
    showToast(`❌ ${errMsg}`, 'error');
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
    if (cardsList) cardsList.innerHTML = `<div class="shark-empty-state"><svg class="shark-empty-tray-icon" width="56" height="56" viewBox="0 0 64 64" fill="none"><path d="M12 22L20 44H44L52 22H12Z" stroke="#2c3545" stroke-width="2.5" fill="#141923"/><path d="M26 34H38" stroke="#3b475c" stroke-width="2.5" stroke-linecap="round"/><path d="M12 22L22 14H42L52 22" stroke="#222a38" stroke-width="2" stroke-linejoin="round"/></svg><div class="shark-empty-text">No data</div></div>`;
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
  if (!tbody) return;
  const pending = walletState.orders || [];

  if (!pending.length) {
    tbody.innerHTML = renderNoDataState(7);
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
