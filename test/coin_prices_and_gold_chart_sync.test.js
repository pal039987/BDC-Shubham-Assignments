/**
 * Test Suite: Coin Prices & Gold Chart Sync
 * Validates accurate price baseline, complete 56-coin TradingView symbol mapping,
 * and seamless real-time sync for Gold Spot (TVC:GOLD) and crypto assets.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('\n=== RUNNING COIN PRICES & GOLD CHART SYNC TEST SUITE ===\n');

// 1. Verify COINS array accurate baseline in frontend/app.js
console.log('1. Testing COINS array accurate baseline in frontend/app.js...');
const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');
const coinsMatch = appJs.match(/const COINS = (\[[\s\S]*?\n\];)/);
assert.ok(coinsMatch, 'COINS array must be defined in app.js');
const coins = eval(coinsMatch[1]);
assert.strictEqual(coins.length, 56, 'COINS array must contain exactly 56 assets');

const goldCoin = coins.find(c => c.id === 'gold');
assert.ok(goldCoin, 'Gold Spot must be present in COINS array');
assert.ok(goldCoin.price >= 3800 && goldCoin.price <= 4200, `Gold price must be in realistic market range (~4022.74), found: ${goldCoin.price}`);
assert.ok(goldCoin.price !== 4134.90, 'Stale hardcoded gold price (4134.90) must be replaced with accurate market rate');
assert.strictEqual(goldCoin.tvSymbol, 'TVC:GOLD', 'Gold TradingView symbol must be TVC:GOLD');
assert.strictEqual(goldCoin.binanceSym, 'PAXGUSDT', 'Gold Binance symbol must be PAXGUSDT');
console.log('  ✓ COINS array contains 56 assets with accurate Gold Spot price (~' + goldCoin.price + ')');

// 2. Testing complete coinSymMap in frontend/index.html early chart loader
console.log('2. Testing coinSymMap in frontend/index.html early chart loader...');
const indexHtml = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const mapMatch = indexHtml.match(/var coinSymMap = \{([\s\S]*?)\};/);
assert.ok(mapMatch, 'coinSymMap must exist in index.html inline script');
const coinSymMap = eval('({' + mapMatch[1] + '})');

// Verify all 56 coins plus gold are mapped
coins.forEach(c => {
  const expectedSym = c.tvSymbol || ('BINANCE:' + c.binanceSym);
  assert.ok(coinSymMap[c.id], `coinSymMap must map coin id: ${c.id}`);
  assert.strictEqual(coinSymMap[c.id], expectedSym, `coinSymMap[${c.id}] must equal ${expectedSym}`);
});
assert.strictEqual(coinSymMap['gold'], 'TVC:GOLD', 'coinSymMap must map gold to TVC:GOLD');
console.log('  ✓ All 56 coins and Gold accurately mapped in index.html early chart loader');

// 3. Testing COIN_METADATA accurate baseline in backend/server.js
console.log('3. Testing COIN_METADATA baseline in backend/server.js...');
const serverJs = fs.readFileSync(path.join(__dirname, '../backend/server.js'), 'utf8');
assert.ok(serverJs.includes("'gold': { symbol: 'XAU'"), 'Gold metadata must exist in server.js');
assert.ok(serverJs.includes('basePrice: 4022.74') || serverJs.match(/'gold':\s*\{[^}]*basePrice:\s*(40[0-9]{2})/), 'Gold basePrice in server.js must be updated to realistic market rate');
assert.ok(!serverJs.includes('basePrice: 4134.90'), 'Stale basePrice 4134.90 must be removed from server.js');
assert.ok(serverJs.includes('goldDailySessionOpen = 3992.60'), 'goldDailySessionOpen must match TVC:GOLD session open (3992.60)');
console.log('  ✓ server.js COIN_METADATA and session open updated with accurate prices');

// 4. Testing Gold Spot immediate polling in fetchFastCoinTicker
console.log('4. Testing Gold Spot immediate polling in fetchFastCoinTicker...');
assert.ok(appJs.includes("if (selectedCoin && (selectedCoin.id === 'gold' || binanceSym === 'PAXGUSDT'))"), 'fetchFastCoinTicker must immediately poll live gold price');
assert.ok(appJs.includes('await pollLiveGoldPrice()'), 'fetchFastCoinTicker must await pollLiveGoldPrice');
console.log('  ✓ Zero-latency gold price sync on coin select verified');

// 5. Testing TVC:GOLD full property synchronization in pollLiveGoldPrice
console.log('5. Testing TVC:GOLD full property synchronization in pollLiveGoldPrice...');
assert.ok(appJs.includes('gold.chartChange = gold.change;'), 'pollLiveGoldPrice must synchronize chartChange');
assert.ok(appJs.includes('selectedCoin.candleOpen = gold.candleOpen || gold.open;'), 'pollLiveGoldPrice must synchronize candleOpen');
assert.ok(appJs.includes('if (typeof updateDesktopOrderCalculations === \'function\') updateDesktopOrderCalculations();'), 'pollLiveGoldPrice must update desktop order dock calculations');
console.log('  ✓ TVC:GOLD full property sync and order dock update verified');

// 6. Testing Gold chart change calculation in fetchRealBinanceCandles
console.log('6. Testing Gold chart change calculation in fetchRealBinanceCandles...');
assert.ok(appJs.includes("if (selectedCoin.id === 'gold')"), 'fetchRealBinanceCandles must handle Gold spot alignment');
assert.ok(appJs.includes("selectedCoin.chartChange = parseFloat(((diff / selectedCoin.candleOpen) * 100).toFixed(2))"), 'fetchRealBinanceCandles must align chartChange with candleOpen');
console.log('  ✓ Chart candle change sync verified');

// 7. Verify Mandatory Gujarat Address
console.log('7. Verifying Mandatory Gujarat Footer Address...');
assert.ok(indexHtml.includes('Vadod Gam, Surat, Gujarat'), 'Mandatory Gujarat address must be present in index.html');
console.log('  ✓ Mandatory address "Vadod Gam, Surat, Gujarat" verified');

console.log('\n=== ALL COIN PRICES & GOLD CHART SYNC TESTS PASSED! ===\n');
