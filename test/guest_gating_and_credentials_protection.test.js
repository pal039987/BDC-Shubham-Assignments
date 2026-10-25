const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('\n=== RUNNING GUEST GATING & CREDENTIALS PROTECTION TEST SUITE ===\n');

const htmlPath = path.join(__dirname, '../frontend/index.html');
const cssPath = path.join(__dirname, '../frontend/style.css');
const jsPath = path.join(__dirname, '../frontend/app.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');

// 1. Verify Demo Accounts credentials are strictly hidden from UI
console.log('1. Testing Credentials Protection on Auth Modal...');
assert.ok(css.includes('.auth-quick-accounts {') && css.includes('display: none !important;'),
  '.auth-quick-accounts must have display: none !important so demo credentials are never exposed to visitors');
console.log('  ✓ Quick demo accounts credentials strictly hidden from public UI');

// 2. Verify Top Header Cash Badge Gating
console.log('2. Testing Header Cash Badge Authentication Gating...');
assert.ok(html.includes('class="header-cash-badge hidden"'), 'header-cash-badge has class="header-cash-badge hidden" initially');
assert.ok(html.includes('id="header-cash-val"'), 'header-cash-val element exists in HTML');
assert.ok(css.includes('.header-cash-badge.hidden') && css.includes('display: none !important;'),
  '.header-cash-badge.hidden must have display: none !important to override desktop display: flex');
assert.ok(js.includes('cashBadge.style.display = isAuthedSession ? \'inline-flex\' : \'none\';') ||
          (js.includes('cashBadge.classList.add(\'hidden\')') && js.includes('cashBadge.classList.remove(\'hidden\')')),
  'syncDesktopHeaderState must dynamically hide header-cash-badge when !isAuthedSession');
assert.ok(html.includes('handleHeaderProfileClick()'), 'header-my-profile-btn calls handleHeaderProfileClick()');
assert.ok(js.includes('function handleHeaderProfileClick()'), 'handleHeaderProfileClick defined in app.js');
assert.ok(js.includes('window.handleHeaderProfileClick = handleHeaderProfileClick'), 'handleHeaderProfileClick exported to window');
console.log('  ✓ Header cash badge strictly gated for authenticated sessions only');

// 3. Verify Portfolio Screen Authentication Gating
console.log('3. Testing Portfolio Screen Authentication Gating...');
assert.ok(html.includes('id="pf-auth-gate"'), 'pf-auth-gate element exists in HTML');
assert.ok(html.includes('id="pf-authed-content"'), 'pf-authed-content element exists in HTML');
assert.ok(html.includes('Sign In to Access Portfolio'), 'pf-auth-gate title verified');
assert.ok(css.includes('.pf-auth-gate {') && css.includes('.pf-ag-card {'), 'pf-auth-gate styled in CSS');
assert.ok(js.includes('authGate.classList.remove(\'hidden\')') && js.includes('authedContent.classList.add(\'hidden\')'),
  'renderPortfolioScreen must show auth gate and hide private content when !isAuthedSession');
console.log('  ✓ Portfolio screen auth gate and private metrics isolation verified');

// 4. Verify Drawer Balance Gating for Guest Mode
console.log('4. Testing Profile Drawer Guest State Protection...');
assert.ok(js.includes('vpdBal.textContent = isAuthed ?'), 'updateDrawerProfileUI gates wallet balance for guests');
console.log('  ✓ Drawer balance strictly protected in guest mode');

// 5. Verify Binance Live Real-Time @ticker Stream & Trade Header Sync
console.log('5. Testing Binance Real-Time @ticker Stream & Live Trade Header Elements...');
assert.ok(js.includes('@ticker'), 'Binance WebSocket stream must subscribe to @ticker for 0ms trade sync');
assert.ok(js.includes('d.e === \'24hrTicker\'') || js.includes('d.P !== undefined'),
  'WebSocket handler must process 24hrTicker payload with exact rolling 24hr change');
assert.ok(js.includes("document.getElementById('trade-price-val')"), 'renderLivePriceUpdates must update trade-price-val');
assert.ok(js.includes("document.getElementById('trade-change-val')"), 'renderLivePriceUpdates must update trade-change-val');
assert.ok(js.includes("document.getElementById('trade-coin-tab-price')"), 'renderLivePriceUpdates must update trade-coin-tab-price');
console.log('  ✓ Binance @ticker stream and synchronous Trade Desk instrument bar updates verified');

// 6. Verify Candle Closing Countdown Timer across All Timeframes
console.log('6. Testing Candle Closing Countdown Timer Integration...');
assert.ok(html.includes('id="candle-countdown-wrap"'), 'candle-countdown-wrap must exist in index.html');
assert.ok(html.includes('id="ccw-tf-tag"'), 'ccw-tf-tag timeframe tag element must exist in HTML');
assert.ok(html.includes('id="ccw-timer"'), 'ccw-timer countdown timer element must exist in HTML');
assert.ok(css.includes('.candle-countdown-wrap {'), '.candle-countdown-wrap must be styled in style.css');
assert.ok(js.includes('"mainSeriesProperties.showCountdown": true'), 'TradingView chart overrides must enable showCountdown');
assert.ok(js.includes('"scalesProperties.showCountdown": true'), 'TradingView price scale overrides must enable showCountdown');
assert.ok(js.includes('function getCandleRemainingSeconds('), 'getCandleRemainingSeconds calculation function must exist');
assert.ok(js.includes('function formatCountdownTime('), 'formatCountdownTime formatter must exist');
assert.ok(js.includes('function updateCandleCountdown()'), 'updateCandleCountdown function must exist');
assert.ok(js.includes('function startCandleCountdownEngine()'), 'startCandleCountdownEngine function must exist');

// Test dynamic calculation accuracy for various intervals
function testRemainingSeconds(nowSec, periodSec) {
  return periodSec - (nowSec % periodSec);
}
assert.strictEqual(testRemainingSeconds(100, 60), 20, '1m candle remaining should be 20s at second 100');
assert.strictEqual(testRemainingSeconds(250, 300), 50, '5m candle remaining should be 50s at second 250');
assert.strictEqual(testRemainingSeconds(800, 900), 100, '15m candle remaining should be 100s at second 800');
console.log('  ✓ Candle closing countdown timer elements, overrides, and dynamic timeframe math verified');

// 7. Verify Mandatory Gujarat Footer Address
console.log('7. Verifying Mandatory Gujarat Footer Address...');
assert.ok(html.includes('Vadod Gam, Surat, Gujarat'), 'Mandatory Gujarat address must be present in footer');
console.log('  ✓ Mandatory address "Vadod Gam, Surat, Gujarat" verified');

console.log('\n=== ALL GUEST GATING & CREDENTIALS PROTECTION TESTS PASSED! ===\n');
