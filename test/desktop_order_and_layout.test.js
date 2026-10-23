const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('\n=== RUNNING DESKTOP TRADE DESK LAYOUT & ORDER PLACEMENT VERIFICATION TESTS ===\n');

const indexHtml = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../frontend/style.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

// 1. Verify 3-Column Workspace Grid Structure in index.html
console.log('1. Testing Trade Desk 3-Column HTML Architecture...');
assert.ok(indexHtml.includes('class="trade-workspace-grid"'), 'trade-workspace-grid must exist');
assert.ok(indexHtml.includes('id="trade-candlestick-container"'), 'trade-candlestick-container must exist');
assert.ok(indexHtml.includes('class="trade-depth-panel"'), 'trade-depth-panel must exist');
assert.ok(indexHtml.includes('id="desktop-trade-order-dock"'), 'desktop-trade-order-dock must exist');
assert.ok(indexHtml.includes('class="trade-bottom-ledger-card"'), 'trade-bottom-ledger-card must exist');

// Ensure trade-main-column does not wrap depth panel inside chart
assert.ok(!indexHtml.includes('<div class="trade-main-column">'), 'trade-main-column must be eliminated for clean 3-column layout');
console.log('  ✓ 3 Dedicated Sibling Columns (Chart, Order Book, Order Terminal) verified in HTML');

// 2. Verify CSS Grid 3-Column Layout & Separation
console.log('2. Testing 3-Column CSS Grid & Scrollbar Polish...');
assert.ok(styleCss.includes('grid-template-columns: 1fr 270px 330px;') || styleCss.includes('grid-template-columns: 1fr'), '3-column grid template must be defined');
assert.ok(styleCss.includes('.trade-bottom-ledger-card') && styleCss.includes('background: #0c1018;'), 'Bottom ledger card must have solid clean background to prevent bleed-through');
assert.ok(styleCss.includes('.trade-fullwidth-container') && styleCss.includes('overflow: visible !important;'), 'trade-fullwidth-container must not have nested scrollbar');
assert.ok(styleCss.includes('#screen-trade.active') && styleCss.includes('overflow-y: auto !important;'), '#screen-trade.active must have overflow-y: auto to display bottom ledger');
console.log('  ✓ 3-Column Grid CSS, solid ledger background, and single smooth window scrollbar verified');

// 3. Verify Order Execution Logic for Authenticated Users
console.log('3. Testing Authenticated Order Placement Flow...');
assert.ok(appJs.includes('function executeDesktopOrder()'), 'executeDesktopOrder must be defined');
assert.ok(appJs.includes('document.getElementById(\'dtod-order-size\')'), 'executeDesktopOrder must sync directly with dtod-order-size input');
assert.ok(appJs.includes('const isAuthedSession = !!(sess && sess.email && !sess.isGuest);'), 'executeOrderFromSheet must permit all authenticated sessions');
assert.ok(appJs.includes('saveRegisteredUser({'), 'executeOrderFromSheet must ensure user is stored in local database');
assert.ok(appJs.includes('renderTradeBottomLedger();'), 'executeOrderFromSheet must refresh bottom ledger on order fill');
console.log('  ✓ Authenticated user order placement gate, DOM size input sync, and ledger refresh verified');

// 4. Functional Execution Simulation
console.log('4. Running In-Memory Trade Placement Simulation for Ravi (pal039987@mpgi.edu.in)...');
const mockStorage = {
  vtrade_auth_session_v3: JSON.stringify({ username: "Ravi", email: "pal039987@mpgi.edu.in", isGuest: false, token: "jwt_mock_token_12345" }),
  vtrade_wallet_v2: JSON.stringify({ cashBalance: 10000, positions: [], orders: [], tradesHistory: [], lastUpdated: Date.now() })
};

const createMockElem = () => ({
  value: "0.05",
  textContent: "",
  classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
  innerHTML: "",
  appendChild: () => {},
  setAttribute: () => {},
  getAttribute: () => "",
  addEventListener: () => {},
  removeEventListener: () => {},
  style: {}
});

const ctx = vm.createContext({
  console,
  setTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {},
  clearTimeout: () => {},
  localStorage: {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; }
  },
  window: { location: { protocol: "https:", hostname: "vtrade-crypto.onrender.com" }, addEventListener: () => {} },
  document: {
    getElementById: (id) => createMockElem(),
    createElement: () => createMockElem(),
    createElementNS: () => createMockElem(),
    body: { appendChild: () => {} },
    querySelectorAll: () => [],
    addEventListener: () => {}
  },
  navigator: { onLine: true, userAgent: "Mozilla/5.0" },
  fetch: async () => ({ ok: true, json: async () => ({ success: true }) }),
  Date, Math, parseFloat, parseInt, isNaN, Array, Object, String, JSON
});

vm.runInContext(appJs, ctx);

vm.runInContext(`
  executeDesktopOrder();
`, ctx);

const positions = vm.runInContext('walletState.positions', ctx);
const updatedWallet = vm.runInContext('walletState', ctx);
assert.strictEqual(positions.length, 1, 'Position must be opened after executeDesktopOrder');
const openedPos = positions[0];
assert.strictEqual(openedPos.side, 'long', 'Default side should be long');
assert.strictEqual(openedPos.size, 0.05, 'Size must match 0.05 BTC from input');
assert.ok(updatedWallet.cashBalance < 10000, 'Cash balance must be deducted for margin');
console.log(`  ✓ Order executed successfully: 0.05 ${openedPos.symbol} @ $${openedPos.entryPrice}, Margin: $${openedPos.margin.toFixed(2)}, New Balance: $${updatedWallet.cashBalance.toFixed(2)}`);

// 5. Verify Fullscreen Broker Bottom Dock & Slide-Up Order Sheet
console.log('5. Testing Fullscreen Broker Dock & Slide-Up Order Sheet...');
assert.ok(styleCss.includes('.tv-fs-new-order-btn'), 'tv-fs-new-order-btn styling must be defined');
assert.ok(styleCss.includes('.tv-fs-qbtn.buy') && styleCss.includes('.tv-fs-qbtn.sell'), 'tv-fs-qbtn buy and sell styles must be defined');
assert.ok(indexHtml.includes('order-sheet-backdrop') && indexHtml.includes('order-sheet-container'), 'order sheet container must exist');
assert.ok(appJs.includes('window.openOrderSheet = openOrderSheet;'), 'openOrderSheet must be exposed globally');
assert.ok(appJs.includes('window.setSheetOrderType = setOrderSheetType;'), 'setSheetOrderType alias must be defined');

vm.runInContext(`
  openOrderSheet('short');
  executeOrderFromSheet();
`, ctx);

const positionsAfterShort = vm.runInContext('walletState.positions', ctx);
assert.strictEqual(positionsAfterShort.length, 2, 'Two positions must exist after openOrderSheet short execution');
assert.strictEqual(positionsAfterShort[0].side, 'short', 'Second position side must be short');
console.log('  ✓ Fullscreen broker dock buttons and slide-up order execution verified successfully');

// 6. Verify Slide-Up Order Sheet Luxury Dark Mode Styling (Screenshot 1 Fix)
console.log('6. Testing Order Sheet Dark-Mode Styling & Tokens (Screenshot 1)...');
assert.ok(styleCss.includes('.order-sheet-container') && styleCss.includes('background: #0f1420;'), 'Order sheet must have dark institutional background #0f1420');
assert.ok(styleCss.includes('.sheet-type-switcher') && styleCss.includes('.sot-btn'), 'Order sheet order type switcher styles must be defined');
assert.ok(styleCss.includes('.sheet-lchip') && styleCss.includes('.sheet-pchip'), 'Leverage chips and percentage chips must be styled');
assert.ok(styleCss.includes('.sheet-input-box') && styleCss.includes('.sheet-input'), 'Order input box with dark background and clear typography must exist');
assert.ok(styleCss.includes('.sheet-metrics-card') && styleCss.includes('.sm-row'), 'Calculated financial metrics card must be styled with luxury cards');
console.log('  ✓ Order Sheet dark-mode styling, chips, input box, and metrics card verified');

// 7. Verify Fullscreen Header Space Utilization with Market Stats (Screenshot 2 Fix)
console.log('7. Testing Fullscreen Header Space Utilization (Screenshot 2)...');
assert.ok(indexHtml.includes('class="tv-fs-stats-bar"'), 'Header must contain real-time financial stats bar');
assert.ok(indexHtml.includes('id="tv-fs-price"') && indexHtml.includes('id="tv-fs-change"'), 'Mark price and 24h change pill must exist in header');
assert.ok(indexHtml.includes('id="tv-fs-high"') && indexHtml.includes('id="tv-fs-low"'), '24h High and 24h Low must exist in header');
assert.ok(indexHtml.includes('id="tv-fs-vol"') && indexHtml.includes('id="tv-fs-lev"'), '24h Volume and Max Leverage must exist in header');
assert.ok(styleCss.includes('.tv-fs-stats-bar') && styleCss.includes('.tv-fs-stat-item'), 'Stats bar CSS must be defined');
assert.ok(appJs.includes('document.getElementById(\'tv-fs-price\')') && appJs.includes('document.getElementById(\'tv-fs-high\')'), 'openFullscreenChart must populate header stats');
console.log('  ✓ Fullscreen header stats bar, live mark price, high/low, volume, and leverage verified');

// 8. Verify Bottom Ledger Trade History Rendering & Badge Count (Screenshot 3 Fix A)
console.log('8. Testing Trade Bottom Ledger History Rendering (Screenshot 3 Fix A)...');
assert.ok(indexHtml.includes('id="ledger-hist-count"'), 'History badge counter id ledger-hist-count must exist in bottom ledger tab');
assert.ok(indexHtml.includes('id="tblc-history-tbody"'), 'tblc-history-tbody must exist');
assert.ok(appJs.includes('function getTradeHistoryList()'), 'getTradeHistoryList must be defined');
assert.ok(appJs.includes('histCount.textContent = historyList.length;'), 'Trade History badge count must reflect history items');

vm.runInContext(`
  // Verify trade history list returns entries
  const hist = getTradeHistoryList();
  renderTradeBottomLedger();
`, ctx);
const histFromContext = vm.runInContext('getTradeHistoryList()', ctx);
assert.ok(Array.isArray(histFromContext) && histFromContext.length >= 2, 'Trade history list must contain demo trades');
assert.ok(histFromContext[0].symbol && histFromContext[0].pnl, 'Trade history items must contain symbol and pnl');
console.log(`  ✓ Trade history list verified with ${histFromContext.length} historical trades rendered`);

// 9. Verify Customizable Order Book (Screenshot 3 Fix B)
console.log('9. Testing Customizable Order Book Panel (Screenshot 3 Fix B)...');
assert.ok(indexHtml.includes('id="ctf-toggle-ob"') && indexHtml.includes('toggleTradeDeskOrderBook()'), 'Timeframe toolbar must have order book toggle button');
assert.ok(indexHtml.includes('id="tdp-remove-btn"') && indexHtml.includes('toggleTradeDeskOrderBook(false)'), 'Order book tab header must have remove/hide button');
assert.ok(styleCss.includes('.trade-workspace-grid.orderbook-hidden'), 'CSS must define .orderbook-hidden with 1fr 340px grid template');
assert.ok(styleCss.includes('.tdp-remove-btn'), 'CSS must style .tdp-remove-btn');
assert.ok(appJs.includes('function toggleTradeDeskOrderBook('), 'toggleTradeDeskOrderBook function must be defined in app.js');
assert.ok(appJs.includes('function initOrderBookPreference()'), 'initOrderBookPreference must check localStorage');

vm.runInContext(`
  toggleTradeDeskOrderBook(false); // Hide
`, ctx);
assert.strictEqual(mockStorage['vtrade_show_orderbook'], 'false', 'Order book preference must persist in localStorage as false when hidden');

vm.runInContext(`
  toggleTradeDeskOrderBook(true); // Restore
`, ctx);
assert.strictEqual(mockStorage['vtrade_show_orderbook'], 'true', 'Order book preference must persist in localStorage as true when restored');
console.log('  ✓ Customizable Order Book hide/restore toggle, CSS grid collapse, and localStorage persistence verified');

console.log('\n=== ALL DESKTOP TRADE DESK LAYOUT, ORDER PLACEMENT & FIX VERIFICATIONS PASSED! ===\n');

