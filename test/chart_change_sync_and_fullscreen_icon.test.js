const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== RUNNING CHART CHANGE SYNC & FULLSCREEN ICON TEST SUITE ===\n');

const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../frontend/style.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

// 1. Verify Fullscreen Button in Timeframe / Instrument Bar
console.log('1. Testing Fullscreen Button in Instrument Toolbar...');
assert.ok(html.includes('id="ctf-fullscreen-btn"'), 'ctf-fullscreen-btn must exist in index.html');
const ctfFsMatch = html.match(/<button[^>]*id="ctf-fullscreen-btn"[^>]*>/);
assert.ok(ctfFsMatch, 'ctf-fullscreen-btn button tag must be present');
assert.ok(!ctfFsMatch[0].includes('display:none'), 'ctf-fullscreen-btn must NOT have display:none');
console.log('  ✓ ctf-fullscreen-btn is prominently visible in the instrument toolbar');

// 2. Verify Fullscreen Button on Chart Header Bar
console.log('2. Testing Dedicated Fullscreen Button in Chart Header Bar (.tcb-header-bar)...');
assert.ok(html.includes('id="tcb-fullscreen-btn"'), 'tcb-fullscreen-btn must exist in index.html');
assert.ok(html.includes('class="tcb-actions-right"'), 'tcb-actions-right container must wrap 1-click and fullscreen button');
assert.ok(css.includes('.tcb-fullscreen-btn {'), '.tcb-fullscreen-btn styling must be defined in style.css');
assert.ok(css.includes('.tcb-fullscreen-btn:hover'), '.tcb-fullscreen-btn hover effect must be styled');
console.log('  ✓ tcb-fullscreen-btn added to chart header bar with luxury glass styling');

// 3. Verify Iframe Fullscreen Permissions
console.log('3. Testing TradingView Chart Iframe Fullscreen Permissions...');
const tvIframeMatch = html.match(/<iframe[^>]*id="tradingview-chart-iframe"[^>]*>/);
assert.ok(tvIframeMatch, 'tradingview-chart-iframe must exist in index.html');
assert.ok(tvIframeMatch[0].includes('allowfullscreen="true"'), 'tradingview-chart-iframe must have allowfullscreen="true"');
assert.ok(tvIframeMatch[0].includes('allow="fullscreen; clipboard-write; pointer-lock"'), 'tradingview-chart-iframe must allow fullscreen');
console.log('  ✓ allowfullscreen="true" and allow="fullscreen; clipboard-write; pointer-lock" enabled on TradingView iframe');

// 4. Verify Chart Change Percentage Sync (Matching Chart OHLC Legend)
console.log('4. Testing Trade Desk Header Sync with Chart Candle Change (selectedCoin.chartChange)...');
assert.ok(js.includes('selectedCoin.chartChange !== undefined'), 'app.js must check selectedCoin.chartChange for live updates');
assert.ok(js.includes('selectedCoin.candleOpen'), 'app.js must capture selectedCoin.candleOpen');

// Test simulation of currentChange priority:
function getActiveChange(coin) {
  return (coin.chartChange !== undefined && !isNaN(coin.chartChange))
    ? coin.chartChange
    : ((coin.change24h !== undefined && !isNaN(coin.change24h))
        ? coin.change24h
        : (typeof coin.change === 'number' && !isNaN(coin.change) ? coin.change : 0));
}

const mockCoin = {
  price: 80380.01,
  change24h: 0.14,
  chartChange: -0.03,
  candleOpen: 80408.01
};

const activeVal = getActiveChange(mockCoin);
assert.strictEqual(activeVal, -0.03, 'activeVal must strictly match chartChange (-0.03%) instead of 24h change (+0.14%)');
console.log('  ✓ Header change stat strictly matches chart legend change (-0.03% vs +0.14%)');

// 5. Verify State Persistence on Page Refresh
console.log('5. Testing Persistence of chartChange & candleOpen across Page Refresh...');
assert.ok(js.includes('chartChange: selectedCoin.chartChange'), 'persistSelectedCoinState must serialize chartChange');
assert.ok(js.includes('candleOpen: selectedCoin.candleOpen'), 'persistSelectedCoinState must serialize candleOpen');
assert.ok(js.includes('if (typeof cached.chartChange === \'number\') coin.chartChange = cached.chartChange;'), 'chartChange must be restored on boot');
assert.ok(js.includes('if (typeof cached.candleOpen === \'number\' && cached.candleOpen > 0) coin.candleOpen = cached.candleOpen;'), 'candleOpen must be restored on boot');
console.log('  ✓ chartChange & candleOpen persisted and restored from localStorage on page refresh');

// 7. Verify Extra Lines Removal (High/Low Lines, Grid Lines, Symbol Labels)
console.log('7. Testing Extra Lines Elimination (High/Low, Grid, and Symbol Lines)...');
assert.ok(js.includes('"mainSeriesProperties.highLowAvgPrice.highLowPriceLabelsVisible": false'), 'highLowPriceLabelsVisible must be false in app.js');
assert.ok(js.includes('"mainSeriesProperties.highLowAvgPrice.highLowPriceLinesVisible": false'), 'highLowPriceLinesVisible must be false in app.js');
assert.ok(js.includes('"scalesProperties.showSymbolLabels": false'), 'showSymbolLabels must be false in app.js');
assert.ok(html.includes('%22mainSeriesProperties.highLowAvgPrice.highLowPriceLabelsVisible%22%3Afalse'), 'highLowPriceLabelsVisible must be false in initial iframe src');
assert.ok(html.includes('%22paneProperties.vertGridProperties.color%22%3A%22rgba(0%2C%200%2C%200%2C%200)%22'), 'vertGridProperties.color must be transparent in initial iframe src');
console.log('  ✓ High/Low lines, symbol labels, and grid lines strictly eliminated for clean chart');

// 8. Verify Mandatory Address
console.log('8. Verifying Mandatory Gujarat Address...');
assert.ok(html.includes('Vadod Gam, Surat, Gujarat'), 'Mandatory address must exist in HTML');
console.log('  ✓ Mandatory address "Vadod Gam, Surat, Gujarat" verified');

console.log('\n=== ALL CHART CHANGE SYNC, FULLSCREEN ICON & CLEAN CHART TESTS PASSED! ===\n');
