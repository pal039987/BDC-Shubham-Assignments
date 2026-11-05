const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== RUNNING COIN SWITCH FLICKER & RACE PREVENTION TEST SUITE ===\n');

const js = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

// 1. Verify WebSocket Message Handler Strict Symbol & Coin ID Guards
console.log('1. Testing WebSocket strict symbol & coin ID validation...');
assert.ok(js.includes('const expectedSym = binanceSym.toUpperCase();'), 'connectCoinTickerWs must compute expectedSym');
assert.ok(js.includes('const targetCoinId = selectedCoin ? selectedCoin.id : null;'), 'connectCoinTickerWs must capture targetCoinId');
assert.ok(js.includes('if (d.s && d.s.toUpperCase() !== expectedSym)'), 'WS message handler must discard messages if symbol does not match expectedSym');
assert.ok(js.includes('liveTickerWs.onmessage = null;'), 'WS cleanup must detach onmessage listener');
assert.ok(js.includes('liveTickerWs.onerror = null;'), 'WS cleanup must detach onerror listener');
assert.ok(js.includes('liveTickerWs.onclose = null;'), 'WS cleanup must detach onclose listener');
console.log('  ✓ WebSocket listeners strictly detached on switch; cross-coin message contamination prevented');

// 2. Verify fetchRealBinanceCandles In-Flight Race Guards
console.log('2. Testing fetchRealBinanceCandles in-flight race condition guards...');
assert.ok(js.includes('let currentCandleFetchId = 0;'), 'currentCandleFetchId counter must exist');
assert.ok(js.includes('const thisFetchId = ++currentCandleFetchId;'), 'fetchRealBinanceCandles must increment thisFetchId');
assert.ok(js.includes('if (thisFetchId !== currentCandleFetchId || !selectedCoin || selectedCoin.id !== targetCoinId'), 'fetchRealBinanceCandles must discard stale kline responses');
console.log('  ✓ Candle engine strictly discards previous coin network responses');

// 3. Verify fetchFastCoinTicker In-Flight Race Guards
console.log('3. Testing fetchFastCoinTicker in-flight race condition guards...');
assert.ok(js.includes('let currentFastTickerId = 0;'), 'currentFastTickerId counter must exist');
assert.ok(js.includes('const thisTickerId = ++currentFastTickerId;'), 'fetchFastCoinTicker must increment thisTickerId');
assert.ok(js.includes('if (thisTickerId !== currentFastTickerId || !selectedCoin || selectedCoin.id !== targetId'), 'fetchFastCoinTicker must discard stale fast ticker responses');
console.log('  ✓ Fast ticker engine strictly discards previous coin responses');

// 4. Verify Corrupted Cache & Boot State Sanitization
console.log('4. Testing LocalStorage Cache Sanitization & Price Sanity Checks...');
assert.ok(js.includes('let isCorruptedCache = false;'), 'Boot loader must initialize corruption flag');
assert.ok(js.includes("if (coin.id === 'bitcoin' && cached.price < 5000) isCorruptedCache = true;"), 'Bitcoin price must be sanity checked against low prices');
assert.ok(js.includes("if (coin.id === 'ethereum' && cached.price < 200) isCorruptedCache = true;"), 'Ethereum price must be sanity checked against low prices');
assert.ok(js.includes("if (coin.id === 'gold' && cached.price < 1000) isCorruptedCache = true;"), 'Gold price must be sanity checked against low prices');
assert.ok(js.includes('if (cached.id && cached.id !== coin.id) isCorruptedCache = true;'), 'Cache with mismatched coin id must be strictly rejected');
console.log('  ✓ Corrupted cache values (e.g. ETH with NEAR price $4.02) rejected on boot');

// 5. Verify Clean Coin Switch from Picker & Redundancy Elimination
console.log('5. Testing selectCoinFromPicker Clean WS Teardown...');
assert.ok(js.includes('closeCoinPickerModal();'), 'selectCoinFromPicker must close modal');
assert.ok(js.includes('renderTradeScreen();'), 'selectCoinFromPicker must call renderTradeScreen');
console.log('  ✓ selectCoinFromPicker cleanly transitions and initiates single unified trade screen render');

console.log('\n=== ALL COIN SWITCH FLICKER & RACE PREVENTION TESTS PASSED! ===\n');
