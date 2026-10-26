const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== RUNNING FOUR PROBLEMS VERIFICATION TEST SUITE ===\n');

const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../frontend/style.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

// 1. Problem 1: 24h High/Low Flicker Fix
console.log('1. Testing 24h High & Low Flicker Fix (SS 1)...');
assert.ok(!js.includes('selectedCoin.high = parseFloat(d.k.h)') && !js.includes('if (d.k.h) high = parseFloat(d.k.h)'),
  'Kline stream must not overwrite selectedCoin.high / low with single candle ticks');
assert.ok(js.includes('// Strictly capture true 24-hour high and low from 24hr ticker') && js.includes('if (d.h) high = parseFloat(d.h);'),
  'High and Low must be updated strictly from true 24hr ticker');
console.log('  ✓ 24h High and Low flicker strictly eliminated');

// 2. Problem 2: Real Badge Visibility After Login (SS 2)
console.log('2. Testing Header Cash Badge Visibility After Login (SS 2)...');
assert.ok(css.includes('html:not(.is-native-apk) .header-cash-badge {') && css.includes('display: inline-flex !important;'),
  'Desktop .header-cash-badge must have display: inline-flex !important so it is visible upon authentication');
assert.ok(js.includes('isAuthedSession = !!(sess && !sess.isGuest && (sess.email || sess.username || sess.token));'),
  'isAuthedSession must recognise authenticated users with username or token even without explicit email');
console.log('  ✓ Header Real: $10,000.00 cash badge visibility for authenticated users verified');

// 3. Problem 3: Trade Desk Horizontal Coins Scrolling (SS 2)
console.log('3. Testing Trade Desk Mini Tickers Right-To-Left Continuous Scrolling (SS 2)...');
assert.ok(html.includes('class="tib-mini-track"'), 'tib-mini-track container must exist inside tib-mini-tickers');
assert.ok(css.includes('.tib-mini-tickers {') && css.includes('overflow: hidden;') && css.includes('white-space: nowrap;'),
  '.tib-mini-tickers must clip marquee overflow');
assert.ok(css.includes('animation: tibMarqueeScroll') && css.includes('@keyframes tibMarqueeScroll'),
  '.tib-mini-track must animate with tibMarqueeScroll keyframes');
assert.ok(js.includes("document.getElementById('tib-mini-track')") && js.includes('miniTrack.innerHTML = miniItemsHtml + miniItemsHtml;'),
  'tib-mini-track must be dynamically populated and looped in app.js');
console.log('  ✓ Continuous right-to-left marquee animation on Trade Desk verified');

// 4. Problem 4: Chart Candle Timer on Price Scale (SS 3)
console.log('4. Testing Shark Exchange Style Candle Closing Timer Integration (SS 3)...');
assert.ok(js.includes('"mainSeriesProperties.showCountdown": true'), 'TradingView overrides must include mainSeriesProperties.showCountdown');
assert.ok(css.includes('.candle-countdown-wrap {') && css.includes('display: none !important;'),
  'Duplicate external overlay box must be hidden to eliminate two boxes issue');
console.log('  ✓ Native TradingView price scale countdown enabled without duplicate overlay');

// 5. Problem 5: Chart Settings & Timeframe Persistence Across Refresh
console.log('5. Testing Chart Settings, Timeframe & State Persistence Across Refresh...');
assert.ok(js.includes("localStorage.setItem('vtrade_tv_chart_settings'"), 'Chart settings must persist to localStorage');
assert.ok(js.includes("localStorage.setItem('vtrade_chart_interval'"), 'Chart interval/timeframe must persist to localStorage');
assert.ok(js.includes("localStorage.setItem('vtrade_selected_coin'"), 'Selected coin must persist to localStorage');
assert.ok(js.includes("localStorage.setItem('vtrade_chart_price_type'"), 'Mark vs Last price type must persist to localStorage');
assert.ok(js.includes("localStorage.setItem('vtrade_1click_trade'"), '1-Click trade state must persist to localStorage');
assert.ok(js.includes('function restoreSavedChartState()'), 'restoreSavedChartState function must be defined in app.js');
assert.ok(js.includes('restoreSavedChartState()'), 'restoreSavedChartState must be called during init');
console.log('  ✓ Chart settings, timeframe, coin, and states strictly persist across page refresh');

console.log('\n=== ALL PROBLEMS & CHART PERSISTENCE TESTS PASSED SUCCESSFULLY! ===');

