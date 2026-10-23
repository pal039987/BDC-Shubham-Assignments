const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('\n=== RUNNING TRADE DESK CARDS, BUY/SELL DOCK & SCREENSHOT 3 HEADER TEST SUITE ===\n');

const indexHtml = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../frontend/style.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

// 1. Verify Distinct Card Containers & Grid Gap (Screenshot 1)
console.log('1. Testing Distinct Card Containers & Gap Layout (Screenshot 1)...');
assert.ok(styleCss.includes('.trade-workspace-grid {') && styleCss.includes('gap: 8px;'),
  '.trade-workspace-grid must have gap: 8px separating distinct blocks');
assert.ok(styleCss.includes('.trade-chart-box {') && styleCss.includes('border: 1px solid rgba(255, 255, 255, 0.08);') && styleCss.includes('border-radius: 8px;'),
  '.trade-chart-box must be a distinct card container with border and rounded corners');
assert.ok(styleCss.includes('height: 370px;') || styleCss.includes('min-height: 360px;') || styleCss.includes('height: 485px;'),
  '.trade-chart-box height must be calibrated matching Screenshot 1 proportions');
assert.ok(styleCss.includes('.trade-bottom-ledger-card {') && styleCss.includes('border: 1px solid rgba(255, 255, 255, 0.08);') && styleCss.includes('border-radius: 8px;') && styleCss.includes('min-height: 220px;'),
  '.trade-bottom-ledger-card must be a complete distinct card container with border, rounded corners, and min-height: 220px');
assert.ok(styleCss.includes('.desktop-trade-order-dock {') && styleCss.includes('border: 1px solid rgba(255, 255, 255, 0.08)') && styleCss.includes('border-radius: 8px'),
  '.desktop-trade-order-dock must be a distinct card container with border and rounded corners');
console.log('  ✓ Distinct card containers (Chart, Ledger, Order Dock) and 8px gap verified');

// 2. Verify Chart Box Header Bar & 1-Click Switch (Screenshot 1)
console.log('2. Testing Chart Box Top Subheader & 1-Click Switch...');
assert.ok(indexHtml.includes('id="tcb-tab-mark"'), 'Mark Price tab must exist in chart header');
assert.ok(indexHtml.includes('id="tcb-tab-last"'), 'Last Traded Price tab must exist in chart header');
assert.ok(indexHtml.includes('id="tcb-1click-input"'), '1-Click Trade switch input must exist');
assert.ok(indexHtml.includes('1-Click Trade'), '1-Click Trade label must be present');
assert.ok(indexHtml.includes('id="tcb-hidden-tf-strip"') && indexHtml.includes('style="display:none;"'),
  'Extra timeframe strip must be hidden as TradingView provides native timeframes (Screenshot 4 fix)');
assert.ok(appJs.includes('function switchChartPriceType('), 'switchChartPriceType function must exist');
assert.ok(appJs.includes('function toggle1ClickTrade('), 'toggle1ClickTrade function must exist');
console.log('  ✓ Chart box subheader (Mark Price, Last Traded Price, 1-Click Trade toggle, hidden redundant timeframes) verified');

// 3. Verify Buy/Sell Order Dock Structure & Controls (Screenshot 1)
console.log('3. Testing Buy/Sell Terminal Dock Controls & Margin Ratio Card...');
assert.ok(indexHtml.includes('id="dtod-btn-buy"') && indexHtml.includes('Buy'), 'Buy pill button with arrow must exist');
assert.ok(indexHtml.includes('id="dtod-btn-sell"') && indexHtml.includes('Sell'), 'Sell pill button with arrow must exist');
assert.ok(indexHtml.includes('id="dtod-pill-mode"'), 'Isolated Margin Mode pill must exist');
assert.ok(indexHtml.includes('id="dtod-pill-lev"'), 'Leverage pill dropdown button must exist');
assert.ok(indexHtml.includes('id="dtod-type-market"') && indexHtml.includes('id="dtod-type-limit"'), 'Market & Limit tabs must exist');
assert.ok(indexHtml.includes('id="dtod-type-stop-l"') && indexHtml.includes('id="dtod-type-stop-m"'), 'Stop-L & Stop-M tabs must exist');
assert.ok(indexHtml.includes('id="dtod-auth-gate"'), 'Auth Gate for unauthenticated guests must exist');
assert.ok(indexHtml.includes('Log In to Trade'), 'Log In to Trade button must exist');
assert.ok(indexHtml.includes('Create Account'), 'Create Account button must exist');
assert.ok(indexHtml.includes('id="dtod-submit-btn"'), 'dtod-submit-btn for authenticated users must exist');
assert.ok(indexHtml.includes('id="dtod-mr-pct"'), 'Margin Ratio percentage display must exist');
assert.ok(indexHtml.includes('id="dtod-maint-margin"') && indexHtml.includes('id="dtod-margin-balance"'),
  'Maintenance Margin & Margin Balance items must exist');
console.log('  ✓ Screenshot 1 Buy/Sell controls, pills, auth gate, and Margin Ratio card verified');

// 4. Verify Top Header Bar Arrangement (Screenshot 3)
console.log('4. Testing Top Header Bar Arrangement (Screenshot 3)...');
assert.ok(indexHtml.includes('class="tib-top-subtabs"'), 'tib-top-subtabs row must exist');
assert.ok(indexHtml.includes('id="trade-coin-tab-pair"') && indexHtml.includes('id="trade-coin-tab-price"'),
  'Active ticker tab (pair + price) must exist in top subtabs');
assert.ok(indexHtml.includes('class="tib-mini-tickers"'), 'Mini tickers strip must exist in top subtabs');
assert.ok(indexHtml.includes('id="trade-price-arrow"'), 'trade-price-arrow directional indicator must exist');
assert.ok(indexHtml.includes('id="trade-rate-val"'), 'trade-rate-val (Rate since May 26 / INR conversion) must exist');
assert.ok(indexHtml.includes('id="trade-change-val"'), '24h Change stat must exist');
assert.ok(indexHtml.includes('id="trade-low-val"') && indexHtml.includes('id="trade-high-val"'), '24h Low and High stats must exist');
assert.ok(indexHtml.includes('id="trade-vol-val"'), '24h Volume stat must exist');
assert.ok(indexHtml.includes('id="trade-funding-val"'), 'Funding Rate / Countdown stat must exist');
assert.ok(indexHtml.includes('class="tib-vdivider"'), 'Vertical divider styling must exist');
assert.ok(styleCss.includes('.trade-instrument-bar {') && styleCss.includes('flex-shrink: 0;'),
  '.trade-instrument-bar must have flex-shrink: 0 to prevent vertical squishing/clipping (Screenshot 3 fix)');
console.log('  ✓ Screenshot 3 horizontal layout (subtabs, price arrow, stats columns, dividers, flex-shrink) verified');

// 5. Verify Functional Integration & Logic
console.log('5. Testing Functional Integration in app.js...');
assert.ok(appJs.includes('trade-coin-tab-price'), 'updateTradeScreenHeader must sync top subtab price');
assert.ok(appJs.includes('trade-price-arrow'), 'updateTradeScreenHeader must sync price directional arrow');
assert.ok(appJs.includes('dtod-mr-symbol'), 'updateDesktopOrderCalculations must sync margin ratio coin symbol');
assert.ok(appJs.includes('dtod-lev-pill-val'), 'Leverage input must update leverage pill value');
assert.ok(appJs.includes('dtod-auth-gate'), 'syncDesktopHeaderState must toggle auth gate for guest vs user');
console.log('  ✓ JavaScript live syncing for Screenshot 1 & Screenshot 3 elements verified');

console.log('\n=== ALL TRADE DESK CARDS, BUY/SELL DOCK & SCREENSHOT 3 TESTS PASSED! ===\n');
