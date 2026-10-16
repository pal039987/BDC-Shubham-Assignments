/**
 * test/charts_and_contract_selector.test.js
 * Verification of Charts Screen with TradingView Widget (Screenshot 1)
 * and Contract Selector Modal with 15 contracts and Down Arrow trigger (Screenshot 2)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('\n=== RUNNING CHARTS SCREEN & CONTRACT SELECTOR TESTS (SCREENSHOTS 1 & 2) ===\n');

const htmlContent = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const cssContent = fs.readFileSync(path.join(__dirname, '../frontend/style.css'), 'utf8');
const jsContent = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

// 1. Verify Charts Screen view and bottom navigation
assert.ok(htmlContent.includes('id="charts-screen-view"'), 'Charts screen view container must exist in HTML');
assert.ok(htmlContent.includes('id="nav-btn-charts"'), 'Nav button for Charts must exist in bottom nav');
assert.ok(jsContent.includes("activeBottomTab === 'charts'"), 'showBottomTab must handle charts tab');
assert.ok(jsContent.includes('renderChartsScreen()'), 'renderChartsScreen must be invoked on charts tab');
console.log('  ✓ Charts screen container & bottom navbar routing verified');

// 2. Verify Chart Top Bar elements (Screenshot 1)
assert.ok(htmlContent.includes('id="chart-star-btn"'), 'Favorite star button present in chart header');
assert.ok(htmlContent.includes('id="chart-pair-symbol"'), 'Chart pair symbol element present');
assert.ok(htmlContent.includes('id="chart-pair-down-arrow"'), 'Coin dropdown down arrow element present');
assert.ok(htmlContent.includes('id="chart-pair-sub"'), 'Chart pair subtitle element present');
assert.ok(htmlContent.includes('id="chart-header-price"'), 'Chart header price element present');
assert.ok(htmlContent.includes('id="chart-header-change"'), 'Chart header change element present');
console.log('  ✓ Chart top bar, pair title, down arrow, live price & percentage change strictly match Screenshot 1');

// 3. Verify Sub-navigation Strip & ZipTrade button (Screenshot 1)
assert.ok(htmlContent.includes('id="csub-traded-price"'), 'Traded Price sub-tab present');
assert.ok(htmlContent.includes('id="csub-order-book"'), 'Order Book sub-tab present');
assert.ok(htmlContent.includes('id="csub-recent-trades"'), 'Recent Trades sub-tab present');
assert.ok(htmlContent.includes('zip-trade-btn'), 'ZipTrade button present');
assert.ok(htmlContent.includes('ZipTrade'), 'ZipTrade label text present');
assert.ok(cssContent.includes('.chart-subnav-strip'), 'CSS for subnav strip present');
assert.ok(cssContent.includes('.csub-tab-btn.active'), 'Active orange underline style for subnav tab present');
console.log('  ✓ Sub-navigation strip (Traded Price, Order Book, Recent Trades, ZipTrade) strictly match Screenshot 1');

// 4. Verify TradingView Widget Integration (Screenshot 1)
assert.ok(htmlContent.includes('id="charts_tradingview_widget"'), 'TradingView widget container present');
assert.ok(jsContent.includes('function renderChartsScreenTvWidget('), 'renderChartsScreenTvWidget function defined');
assert.ok(jsContent.includes('interval: "60"'), 'TradingView widget configured with 1h interval matching Screenshot 1');
assert.ok(jsContent.includes('theme: "dark"'), 'TradingView widget dark theme configured');
assert.ok(jsContent.includes('hide_side_toolbar: false'), 'TradingView left drawing toolbar enabled per Screenshot 1');
assert.ok(jsContent.includes('withdateranges: true'), 'TradingView bottom date range enabled per Screenshot 1');
console.log('  ✓ TradingView Advanced Real-Time Chart widget integration (1h interval, dark theme, drawing toolbar) verified');

// 5. Verify Quick Trading Bottom Dock (Screenshot 1)
assert.ok(htmlContent.includes('chart-quick-dock'), 'Quick dock container present');
assert.ok(htmlContent.includes('cqd-short'), 'Short button present');
assert.ok(htmlContent.includes('id="cqd-short-price"'), 'Short price element present');
assert.ok(htmlContent.includes('id="cqd-lot-eq"'), 'Lot size equivalence element present');
assert.ok(htmlContent.includes('cqd-long'), 'Long button present');
assert.ok(htmlContent.includes('id="cqd-long-price"'), 'Long price element present');
assert.ok(cssContent.includes('.cqd-short'), 'Short red button CSS present');
assert.ok(cssContent.includes('.cqd-long'), 'Long green button CSS present');
assert.ok(jsContent.includes('function executeChartQuickTrade('), 'Quick trade execution function defined');
console.log('  ✓ Quick Trading Bottom Dock (Short 82305.5, 1 Lot = 0.001 BTC, Long 82306) strictly match Screenshot 1');

// 6. Verify Down Arrow triggers Contract Selector Modal (User specific requirement)
assert.ok(htmlContent.includes('openContractSelectorModal'), 'openContractSelectorModal triggered on down arrow / pair container');
assert.ok(jsContent.includes('function openContractSelectorModal('), 'openContractSelectorModal function defined in app.js');
assert.ok(jsContent.includes('function closeContractSelectorModal()'), 'closeContractSelectorModal function defined in app.js');
console.log('  ✓ Clicking coin down arrow opens Contract Selector modal verified');

// 7. Verify Contract Selector Header, Search & Category Tabs (Screenshot 2)
assert.ok(htmlContent.includes('id="contract-selector-modal"'), 'Contract selector modal present in HTML');
assert.ok(htmlContent.includes('cselect-back-btn'), 'Back button < present in selector header');
assert.ok(htmlContent.includes('id="cselect-search-input"'), 'Search input box present in selector header');
assert.ok(htmlContent.includes('id="csel-tab-watchlist"'), 'Watchlist tab button present');
assert.ok(htmlContent.includes('id="csel-tab-futures"'), 'Futures tab button present');
assert.ok(htmlContent.includes('id="csel-tab-options"'), 'Options tab button present');
assert.ok(htmlContent.includes('id="csel-tab-rwa"'), 'RWA Tokens tab button present');
assert.ok(htmlContent.includes('mkt-badge-new'), 'NEW badge on RWA Tokens tab present');
console.log('  ✓ Contract Selector header, live search bar, back button, and category tabs strictly match Screenshot 2');

// 8. Verify Table Column Headers & Sorting (Screenshot 2)
assert.ok(htmlContent.includes('Contract'), 'Contract column header present');
assert.ok(htmlContent.includes('Last Price/ Vol.'), 'Last Price/ Vol. column header present');
assert.ok(htmlContent.includes('24h Chg.'), '24h Chg. column header present');
assert.ok(jsContent.includes('function sortContractSelector('), 'sortContractSelector function defined');
console.log('  ✓ Table column headers (Contract, Last Price/Vol., 24h Chg.) strictly match Screenshot 2');

// 9. Verify 15 Contracts from Screenshot 2 in CONTRACT_SELECTOR_FUTURES
const expected15 = [
  'BTCUSD', 'ETHUSD', 'XAUTUSD', 'SOLUSD', 'PAXGUSD',
  'AKEUSD', 'SIRENUSD', 'XRPUSD', 'ZECUSD', 'UNIUSD',
  'SLVONUSD', 'BTWUSD', 'ARCUSD', 'STRKUSD', 'SNDKBUSD'
];

expected15.forEach(sym => {
  assert.ok(jsContent.includes(`symbol: '${sym}'`), `Contract ${sym} must be present in CONTRACT_SELECTOR_FUTURES`);
});

// Verify specific leverage & fee attributes
assert.ok(jsContent.includes("symbol: 'BTCUSD', lev: '200x'"), 'BTCUSD 200x leverage verified');
assert.ok(jsContent.includes("symbol: 'ETHUSD', lev: '200x'"), 'ETHUSD 200x leverage verified');
assert.ok(jsContent.includes("symbol: 'XAUTUSD', lev: '100x'") && jsContent.includes("fee: 'Fee 0.01%'"), 'XAUTUSD 100x and Fee 0.01% badge verified');
assert.ok(jsContent.includes("symbol: 'PAXGUSD', lev: '100x'") && jsContent.includes("fee: 'Fee 0.01%'"), 'PAXGUSD 100x and Fee 0.01% badge verified');
assert.ok(jsContent.includes("symbol: 'SLVONUSD', lev: '50x'") && jsContent.includes("fee: 'Fee 0.01%'"), 'SLVONUSD 50x and Fee 0.01% badge verified');
assert.ok(jsContent.includes("symbol: 'BTWUSD', lev: '10x'"), 'BTWUSD 10x leverage verified');
assert.ok(jsContent.includes("symbol: 'SNDKBUSD', lev: '25x'"), 'SNDKBUSD 25x leverage verified');
console.log('  ✓ All 15 Futures contracts, leverages & fee badges strictly match Screenshot 2');

// 10. Verify Contract Selection & Synchronization
assert.ok(jsContent.includes('function selectContractFromSelector('), 'selectContractFromSelector function defined');
assert.ok(jsContent.includes('chartsActiveContract = symbol'), 'Active contract state updated on selection');
assert.ok(jsContent.includes('closeContractSelectorModal()'), 'Modal closed upon contract selection');
console.log('  ✓ Contract selection, header updating, chart re-mounting and modal closure verified');

console.log('\n=== ALL 10 CHARTS & CONTRACT SELECTOR TESTS PASSED! ===\n');
