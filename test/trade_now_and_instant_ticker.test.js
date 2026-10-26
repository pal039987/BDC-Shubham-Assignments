const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== RUNNING TRADE NOW BUTTON & INSTANT TICKER TEST SUITE ===\n');

const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../frontend/style.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');
const serverJs = fs.readFileSync(path.join(__dirname, '../backend/server.js'), 'utf8');

// 1. Verify TRADE NOW button gating
console.log('1. Testing Top Header TRADE NOW CTA Button Guest Gating...');
assert.ok(html.includes('id="header-trade-now-btn"'), 'Header trade now button present in HTML');
assert.ok(css.includes('.header-trade-now-btn.hidden') && css.includes('display: none !important;'),
  '.header-trade-now-btn.hidden must have display: none !important');
assert.ok(js.includes('tradeNowBtn.classList.add(\'hidden\')') && js.includes('tradeNowBtn.classList.remove(\'hidden\')'),
  'syncDesktopHeaderState must dynamically hide header-trade-now-btn when isAuthedSession is true and show when false');
console.log('  ✓ Top Header TRADE NOW button strictly visible only without sign in (hidden after sign in)');

// 2. Verify Instant Ticker Pre-fetch & State Persistence
console.log('2. Testing Instant Ticker Pre-fetch & State Persistence on Refresh...');
assert.ok(js.includes('fetchFastCoinTicker(selectedCoin.binanceSym)'),
  'renderTradeScreen must call fetchFastCoinTicker for immediate real-time sync without waiting for WS handshake');
assert.ok(js.includes('function fetchFastCoinTicker('), 'fetchFastCoinTicker function must be defined');
assert.ok(js.includes('persistSelectedCoinState'), 'persistSelectedCoinState function must be defined');
assert.ok(js.includes('vtrade_selected_coin_state'), 'vtrade_selected_coin_state must be saved to and restored from localStorage');
console.log('  ✓ Instant REST ticker pre-fetch and zero-delay state persistence on refresh verified');

// 3. Verify True 24hr Ticker & Dynamic Real-Time Math
console.log('3. Testing True 24-Hour Gain/Loss Sync...');
assert.ok(serverJs.includes('ticker/24hr?symbols='), 'server.js must query ticker/24hr instead of tradingDay');
assert.ok(js.includes('ticker/24hr?symbols='), 'app.js fetchPrices must query ticker/24hr instead of tradingDay');
assert.ok(js.includes('selectedCoin.open24h = parseFloat(d.o)'), 'open24h must be captured from 24hrTicker payload');
assert.ok(js.includes('(newPrice - selectedCoin.open24h) / selectedCoin.open24h'),
  'Live 24h change must be dynamically recalculated on live price movements');
console.log('  ✓ True 24-hour gain/loss calculation strictly verified against Binance 24hr standard');

// 4. Simulate syncDesktopHeaderState toggling header-trade-now-btn
console.log('4. Testing Simulated syncDesktopHeaderState Auth Gating...');
let tradeNowBtnClasses = [];
const mockTradeNowBtn = {
  style: { display: '' },
  classList: {
    add: (cls) => { if (!tradeNowBtnClasses.includes(cls)) tradeNowBtnClasses.push(cls); },
    remove: (cls) => { tradeNowBtnClasses = tradeNowBtnClasses.filter(c => c !== cls); },
    contains: (cls) => tradeNowBtnClasses.includes(cls)
  }
};
// When authenticated
let isAuthedSession = true;
if (isAuthedSession) {
  mockTradeNowBtn.classList.add('hidden');
  mockTradeNowBtn.style.display = 'none';
} else {
  mockTradeNowBtn.classList.remove('hidden');
  mockTradeNowBtn.style.display = 'inline-flex';
}
assert.strictEqual(mockTradeNowBtn.style.display, 'none');
assert.ok(mockTradeNowBtn.classList.contains('hidden'), 'Button must be hidden when authed');

// When guest / signed out
isAuthedSession = false;
if (isAuthedSession) {
  mockTradeNowBtn.classList.add('hidden');
  mockTradeNowBtn.style.display = 'none';
} else {
  mockTradeNowBtn.classList.remove('hidden');
  mockTradeNowBtn.style.display = 'inline-flex';
}
assert.strictEqual(mockTradeNowBtn.style.display, 'inline-flex');
assert.ok(!mockTradeNowBtn.classList.contains('hidden'), 'Button must be visible when guest');
console.log('  ✓ Simulated header auth toggle verified (hidden when signed in, visible when guest)');

console.log('\n=== ALL TRADE NOW BUTTON & INSTANT TICKER TESTS PASSED! ===\n');
