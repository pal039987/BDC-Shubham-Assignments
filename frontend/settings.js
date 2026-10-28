/* ==========================================================================
   PART 5: SETTINGS, ACCOUNT AND DOWNLOAD BUTTON
   Testing Checklist:
   - default leverage applies on app open
   - RESET requires the exact word
   - CSV opens in Android Documents folder
   ========================================================================== */

const CTP_SETTINGS_KEY = 'ctp_settings';

const DEFAULT_SETTINGS = {
  defaultLeverage: 10,
  defaultOrderType: 'market',     // 'market' | 'limit'
  defaultMarginMode: 'isolated',   // 'isolated' | 'cross'
  priceDecimals: 'auto',          // 'auto' | '2' | '4'
  defaultUnit: 'coin',            // 'coin' | 'usd'
  compactNumbers: true,           // boolean
  toastSound: false,              // boolean
  vibration: true                 // boolean
};

// ─── SETTINGS STORAGE ────────────────────────────────────────────────────────
function getSettings() {
  try {
    const raw = localStorage.getItem(CTP_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

function updateSettings(patch) {
  const current = getSettings();
  const next = { ...current, ...patch };
  try {
    localStorage.setItem(CTP_SETTINGS_KEY, JSON.stringify(next));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
  return next;
}

// ─── SOUND & VIBRATION FEEDBACK ──────────────────────────────────────────────
function playToastChime() {
  const s = getSettings();
  if (!s.toastSound) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.1); // G5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {}
}

function triggerVibrate(pattern = [35]) {
  const s = getSettings();
  if (!s.vibration) return;
  try {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch (e) {}
}

// ─── SETTINGS BOTTOM SHEET CONTROLS ──────────────────────────────────────────
function openSettingsSheet() {
  renderSettingsUI();
  const sheet = document.getElementById('settings-sheet');
  if (sheet) {
    sheet.classList.remove('hidden');
    triggerVibrate([20]);
  }
}

function closeSettingsSheet() {
  const sheet = document.getElementById('settings-sheet');
  if (sheet) {
    sheet.classList.add('hidden');
  }
}

function renderSettingsUI() {
  const s = getSettings();

  // 1. Trading Defaults
  const levSlider = document.getElementById('setting-default-leverage');
  const levDisplay = document.getElementById('setting-lev-display');
  if (levSlider) levSlider.value = s.defaultLeverage;
  if (levDisplay) levDisplay.textContent = `${s.defaultLeverage}x`;

  document.querySelectorAll('.set-otype-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === s.defaultOrderType);
  });
  document.querySelectorAll('.set-mm-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === s.defaultMarginMode);
  });

  // 2. Display
  document.querySelectorAll('.set-dec-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === String(s.priceDecimals));
  });
  document.querySelectorAll('.set-unit-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === s.defaultUnit);
  });
  const compactSwitch = document.getElementById('setting-compact-numbers');
  if (compactSwitch) compactSwitch.checked = !!s.compactNumbers;

  // 3. Sound and Feedback
  const soundSwitch = document.getElementById('setting-toast-sound');
  if (soundSwitch) soundSwitch.checked = !!s.toastSound;
  const vibeSwitch = document.getElementById('setting-vibration');
  if (vibeSwitch) vibeSwitch.checked = !!s.vibration;

  // 4. Version Display
  const verEl = document.getElementById('settings-app-version');
  if (verEl && typeof APP_VERSION !== 'undefined') {
    verEl.textContent = `VTrade ${APP_VERSION}`;
  }
}

// Handler functions for settings UI interactions
function handleSettingLeverageChange(val) {
  const lev = parseInt(val, 10) || 10;
  updateSettings({ defaultLeverage: lev });
  const levDisplay = document.getElementById('setting-lev-display');
  if (levDisplay) levDisplay.textContent = `${lev}x`;
}

function handleSettingOrderType(type) {
  updateSettings({ defaultOrderType: type });
  document.querySelectorAll('.set-otype-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === type);
  });
}

function handleSettingMarginMode(mode) {
  updateSettings({ defaultMarginMode: mode });
  document.querySelectorAll('.set-mm-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === mode);
  });
}

function handleSettingDecimals(dec) {
  updateSettings({ priceDecimals: dec });
  document.querySelectorAll('.set-dec-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === dec);
  });
  if (typeof updateChartPriceDisplay === 'function') updateChartPriceDisplay();
  if (typeof renderPositions === 'function') renderPositions();
}

function handleSettingUnit(unit) {
  updateSettings({ defaultUnit: unit });
  document.querySelectorAll('.set-unit-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === unit);
  });
  if (typeof setTradeUnit === 'function') setTradeUnit(unit);
}

function handleSettingToggle(key, inputEl) {
  const checked = !!inputEl.checked;
  const update = {};
  update[key] = checked;
  updateSettings(update);
  if (key === 'toastSound' && checked) {
    playToastChime();
  } else if (key === 'vibration' && checked) {
    triggerVibrate([40]);
  }
}

// ─── APPLY SETTINGS ON APP OPEN (Requirement A4) ─────────────────────────────
function applySettingsToTradePanel() {
  const s = getSettings();

  // Apply default leverage
  if (typeof setLeverage === 'function') setLeverage(s.defaultLeverage);
  if (typeof setOrderSheetLeverage === 'function') setOrderSheetLeverage(s.defaultLeverage);
  if (typeof setDesktopLeverage === 'function') setDesktopLeverage(s.defaultLeverage);

  // Apply default order type
  if (typeof setOrderType === 'function') setOrderType(s.defaultOrderType);
  if (typeof setOrderSheetType === 'function') setOrderSheetType(s.defaultOrderType);
  if (typeof setDesktopOrderType === 'function') setDesktopOrderType(s.defaultOrderType);

  // Apply default margin mode
  if (typeof setMarginMode === 'function') setMarginMode(s.defaultMarginMode);

  // Apply default unit
  if (typeof setTradeUnit === 'function') setTradeUnit(s.defaultUnit);

  // Hide Download APK button if running as installed Android app (Requirement D3)
  initDownloadApkVisibility();
}

// ─── RESET WALLET (SAFE) (Requirement B) ─────────────────────────────────────
function openResetWalletDialog() {
  const modal = document.getElementById('reset-confirm-modal');
  const input = document.getElementById('reset-confirm-input');
  const btn = document.getElementById('btn-confirm-reset');
  if (input) input.value = '';
  if (btn) btn.disabled = true;
  if (modal) modal.classList.remove('hidden');
}

function closeResetWalletDialog() {
  const modal = document.getElementById('reset-confirm-modal');
  if (modal) modal.classList.add('hidden');
}

function handleResetInputKeyup(val) {
  const btn = document.getElementById('btn-confirm-reset');
  if (btn) {
    btn.disabled = (val.trim() !== 'RESET');
  }
}

function executeSafeWalletReset() {
  const input = document.getElementById('reset-confirm-input');
  const typed = (input?.value || '').trim();

  // Requirement B2: Only reset when user types RESET exactly
  if (typed !== 'RESET') {
    if (typeof showToast === 'function') showToast('Type RESET to confirm', 'error');
    return;
  }

  // Requirement B3: Reset wallet sets cash to $10,000, clears holdings, open positions, open orders and trade history. Does NOT reset settings.
  if (typeof walletState !== 'undefined') {
    walletState = {
      version: 1,
      cashBalance: 10000.00,
      holdings: {},
      positions: [],
      orders: [],
      history: [],
      tradesHistory: [],
      balanceVisible: true,
      currency: 'USD',
      realizedPnl: 0,
      tradesCount: 0,
      positionsClosed: 0,
      lastUpdated: Date.now()
    };
    if (typeof saveWalletState === 'function') saveWalletState();
    if (typeof updateMiniStats === 'function') updateMiniStats();
    if (typeof renderPositions === 'function') renderPositions();
    if (typeof renderOrders === 'function') renderOrders();
    if (typeof renderHistory === 'function') renderHistory();
    if (typeof updatePnlSummary === 'function') updatePnlSummary();
    if (typeof updateTabBadges === 'function') updateTabBadges();
    if (typeof renderTradeBottomLedger === 'function') renderTradeBottomLedger();
    if (typeof renderPortfolioScreen === 'function') renderPortfolioScreen();
    if (typeof renderHomeBalanceCard === 'function') renderHomeBalanceCard();
    if (typeof renderAllViews === 'function') renderAllViews();
    if (typeof syncWalletWithCloud === 'function') syncWalletWithCloud(true);
  }

  closeResetWalletDialog();
  closeSettingsSheet();
  triggerVibrate([40, 50, 40]);
  if (typeof showToast === 'function') {
    showToast('Wallet reset to $10,000.00', 'success');
  }
}

function clearTradeHistoryOnly() {
  if (typeof walletState !== 'undefined') {
    walletState.history = [];
    walletState.tradesHistory = [];
    walletState.tradesCount = 0;
    walletState.positionsClosed = 0;
    walletState.realizedPnl = 0;
    if (typeof saveWalletState === 'function') saveWalletState();
    if (typeof renderHistory === 'function') renderHistory();
    if (typeof updatePnlSummary === 'function') updatePnlSummary();
    if (typeof updateTabBadges === 'function') updateTabBadges();
    if (typeof renderTradeBottomLedger === 'function') renderTradeBottomLedger();
    if (typeof renderPortfolioScreen === 'function') renderPortfolioScreen();
  }
  if (typeof showToast === 'function') showToast('Trade history cleared', 'info');
}

// ─── CSV EXPORT (Requirement C) ──────────────────────────────────────────────
async function exportTradeHistoryCsv() {
  let hist = [];
  if (typeof walletState !== 'undefined') {
    if (Array.isArray(walletState.tradesHistory) && walletState.tradesHistory.length) {
      hist = walletState.tradesHistory;
    } else if (Array.isArray(walletState.history) && walletState.history.length) {
      hist = walletState.history;
    }
  }
  if (!hist.length) {
    if (typeof showToast === 'function') showToast('No trades to export', 'info');
    return;
  }

  // Header: time, coin, side, type, price, size, fee, realized_pnl
  const header = 'time,coin,side,type,price,size,fee,realized_pnl';
  const rows = hist.map(h => {
    const timeStr = `"${h.closed_at || h.time || new Date().toISOString()}"`;
    const coinStr = `"${h.symbol || h.coin || ''}"`;
    const sideStr = `"${h.side || ''}"`;
    const typeStr = `"${h.type || (h.leverage ? `${h.leverage}x` : 'market')}"`;
    const priceVal = Number(h.closePrice || h.price || h.entryPrice || 0).toFixed(2);
    const sizeVal = Number(h.size || 0).toFixed(4);
    const feeVal = Number(h.fee || 0).toFixed(2);
    const pnlVal = h.pnl != null ? Number(h.pnl).toFixed(2) : '0.00';
    return `${timeStr},${coinStr},${sideStr},${typeStr},${priceVal},${sizeVal},${feeVal},${pnlVal}`;
  });

  const csvContent = [header, ...rows].join('\n');
  const nowStr = new Date().toISOString().slice(0, 10);
  const fileName = `VTrade_History_${nowStr}.csv`;

  // Check Capacitor Filesystem plugin on Android
  const hasCapFilesystem = !!(window.Capacitor?.isNativePlatform?.() && window.Capacitor?.Plugins?.Filesystem);

  if (hasCapFilesystem) {
    try {
      const { Filesystem, Directory } = window.Capacitor.Plugins;
      await Filesystem.writeFile({
        path: fileName,
        data: csvContent,
        directory: Directory?.Documents || 'DOCUMENTS',
        encoding: 'utf8'
      });
      triggerVibrate([40]);
      if (typeof showToast === 'function') {
        showToast(`Saved ${fileName} to Documents`, 'success');
      }
      return;
    } catch (err) {
      // Fallback silently handled below
    }
  }

  // Browser download fallback
  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerVibrate([30]);
    if (typeof showToast === 'function') {
      showToast(`Exported ${fileName}`, 'success');
    }
  } catch (e) {
    if (typeof showToast === 'function') showToast('Failed to export CSV', 'error');
  }
}

// ─── DOWNLOAD APK BUTTON (Requirement D) ─────────────────────────────────────
async function handleDownloadApk(event) {
  if (event) event.preventDefault();

  const candidateUrls = ['/apk', '/downloads/VTrade.apk', '/downloads/cryptotrader.apk'];
  let successfulUrl = null;

  for (const apkUrl of candidateUrls) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try {
      const res = await fetch(apkUrl, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        successfulUrl = apkUrl;
        break;
      }
    } catch (e) {
      clearTimeout(timer);
    }
  }

  if (successfulUrl) {
    // APK is available, initiate download
    const a = document.createElement('a');
    a.href = successfulUrl;
    a.download = 'VTrade.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (typeof showToast === 'function') {
      showToast('Downloading VTrade APK...', 'success');
    }
  } else {
    // If missing, show toast
    if (typeof showToast === 'function') {
      showToast('APK not available yet', 'error');
    }
  }
}

function initDownloadApkVisibility() {
  // Requirement D3: Hide this button when app is running as an installed Android app
  const isNative = typeof window !== 'undefined' && (
    window.Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'capacitor:' ||
    document.documentElement.classList.contains('is-native-apk')
  );
  if (isNative) {
    const selectors = ['.nav-btn-apk', '.lhs-btn-download', '#apk-download-android-btn'];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => { el.style.display = 'none'; });
    });
  }
}
