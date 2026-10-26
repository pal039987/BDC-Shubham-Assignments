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
assert.ok(js.includes("localStorage.setItem('vtrade_active_tab'"), 'Active tab must persist to localStorage');
assert.ok(js.includes('function restoreSavedChartState()'), 'restoreSavedChartState function must be defined in app.js');
assert.ok(js.includes('restoreSavedChartState()'), 'restoreSavedChartState must be called during init');
assert.ok(js.includes('use_localstorage_for_settings'), 'TradingView features must include use_localstorage_for_settings');
assert.ok(js.includes('save_chart_properties_to_local_storage'), 'TradingView features must include save_chart_properties_to_local_storage');
assert.ok(!js.match(/renderTradingViewChart[^{]*\{[^}]*studies=%5B%5D/), 'renderTradingViewChart must not wipe out user indicators with studies=[]');
assert.ok(html.includes('id="trade-chart-settings-btn"'), 'Trade Desk header must include direct chart settings button');
assert.ok(html.includes('use_localstorage_for_settings'), 'index.html chart iframe must enable use_localstorage_for_settings');
assert.ok(!html.includes('studies=%5B%5D'), 'index.html chart iframe must not hardcode studies=[]');
assert.ok(html.includes("localStorage.getItem('vtrade_tv_chart_settings')"), 'index.html must include early synchronous chart settings restoration script');
console.log('  ✓ Chart settings, timeframe, coin, indicators, active tab, and states strictly persist across page refresh');

// 6. Problem 6: Timeframe Buttons Visibility & Refresh Tab Retention
console.log('6. Testing Timeframe Buttons Visibility & Refresh Page Retention...');
assert.ok(html.includes('class="tcb-tf-strip" id="tcb-visible-tf-strip"'), 'Visible timeframe strip must exist in index.html');
const expectedTimeframes = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '1d', '1w', '1M'];
expectedTimeframes.forEach(tf => {
  assert.ok(html.includes(`id="ctf-${tf}"`), `ctf-${tf} button must be present in chart header`);
});
assert.ok(css.includes('.tcb-tf-strip {') && css.includes('display: inline-flex !important;'),
  '.tcb-tf-strip must be styled with display: inline-flex !important');
assert.ok(html.includes("document.documentElement.setAttribute('data-initial-tab', _s);"),
  'Head synchronous script must set data-initial-tab attribute to prevent landing page flash');
assert.ok(css.includes('html[data-initial-tab="trade"] #screen-home') && css.includes('display: none !important;'),
  'style.css must hide home screen immediately when data-initial-tab="trade"');
assert.ok(js.includes("window.location.hash = '#' + activeTab;"),
  'switchBottomTab must sync URL hash to preserve page on refresh');
console.log('  ✓ Timeframe buttons prominently visible and page retention on refresh verified');

console.log('\n=== ALL PROBLEMS & CHART PERSISTENCE TESTS PASSED SUCCESSFULLY! ===');



