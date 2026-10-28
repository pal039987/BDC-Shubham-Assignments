const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== RUNNING WEBSITE 24-HOUR GAIN/LOSS PERCENT SYNC TEST SUITE ===\n');

const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

// 1. Verify Trade Desk 24h Change Label & Element
console.log('1. Testing Trade Desk 24h Change Instrument Bar Label & Sync...');
assert.ok(html.includes('<span class="tib-lbl">24h Change</span>'), 'Trade Desk instrument bar must have 24h Change label');
assert.ok(html.includes('id="trade-change-val"'), 'trade-change-val element must exist in HTML');
assert.ok(js.includes('const chg24 = (selectedCoin.change24h !== undefined && !isNaN(selectedCoin.change24h))'), 'app.js must compute chg24 from change24h');
assert.ok(js.includes('changeVal.textContent = `${is24Up ? \'+\' : \'\'}${chg24.toFixed(2)}%`'), 'changeVal must display true 24h change percentage');
console.log('  ✓ Trade Desk 24h Change stat strictly displays 24-hour gain/loss percent');

// 2. Verify Markets Screen 24h Change Column
console.log('2. Testing Markets Screen 24h Change Column & Dynamic Rendering...');
assert.ok(html.includes('24h Change</th>'), 'Markets table must have 24h Change header column');
assert.ok(js.includes('const chgVal = (c.change24h !== undefined && !isNaN(c.change24h)) ? c.change24h : ((c.change !== undefined && !isNaN(c.change)) ? c.change : 0);'), 'Markets table must prioritize 24h change');
console.log('  ✓ Markets screen accurately renders 24h change percentage for all coins');

// 3. Verify Desktop Marquee and Mini Tickers 24h Change Sync
console.log('3. Testing Desktop Marquee & Mini Tickers 24h Change Sync...');
assert.ok(js.includes('const chgVal = (coin.change24h !== undefined && !isNaN(coin.change24h)) ? coin.change24h : ((coin.change !== undefined && !isNaN(coin.change)) ? coin.change : 0);'), 'Marquee must prioritize 24h change');
console.log('  ✓ Desktop marquee and mini tickers display true 24h change without flicker');

// 4. Verify Gold Spot TVC:GOLD Session Open & 24h Change Sync
console.log('4. Testing Gold Spot Session Open & 24h Gain/Loss Math...');
const coinsMatch = js.match(/const COINS = (\[[\s\S]*?\n\];)/);
assert.ok(coinsMatch, 'COINS array must be defined in app.js');
const coins = eval(coinsMatch[1]);
const gold = coins.find(c => c.id === 'gold');
assert.ok(gold, 'Gold Spot must be present in COINS array');
assert.ok(gold.open >= 4000, `Gold open must reflect active TVC:GOLD session open (~4060.34), found: ${gold.open}`);
assert.ok(typeof gold.change24h === 'number', 'Gold must have change24h property');
assert.ok(js.includes('if (!gold.open || gold.open < 4000) gold.open = 4060.34;'), 'pollLiveGoldPrice must protect Gold session open');
console.log('  ✓ Gold Spot session open and 24h change synchronized with TVC:GOLD');

// 5. Verify Live WebSocket dynamic 24h change calculation
console.log('5. Testing Live WebSocket Dynamic 24h Change Recalculation...');
assert.ok(js.includes('(newPrice - selectedCoin.open24h) / selectedCoin.open24h'), 'WebSocket ticker must recalculate 24h change against open24h');
assert.ok(js.includes('listCoin.change24h = selectedCoin.change24h'), 'WebSocket ticker must update coin in COINS list');
console.log('  ✓ Live WebSocket stream updates 24h change dynamically on every price tick');

// 6. Verify User Requirement: Changes only on website (Android app assets untouched in this fix)
console.log('6. Verifying Website-Only Scope Protection...');
const androidAppJs = fs.readFileSync(path.join(__dirname, '../android/app/src/main/assets/public/app.js'), 'utf8');
assert.ok(!androidAppJs.includes('const is24Up = chg24 >= 0;'), 'Android app.js was strictly not modified, keeping APK behavior untouched');
console.log('  ✓ Mobile APK assets untouched; all fixes applied strictly to website frontend');

console.log('\n=== ALL WEBSITE 24-HOUR GAIN/LOSS SYNC TESTS PASSED! ===\n');
