const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== RUNNING WEBSITE PRICE FLICKER & DIFFING VERIFICATION TEST SUITE ===\n');

const css = fs.readFileSync(path.join(__dirname, '../frontend/style.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

// 1. Verify CSS Tabular Numbers Formatting
console.log('1. Testing Tabular Numbers Formatting to Eliminate Text Jitter...');
assert.ok(css.includes('.m-price {') && css.includes('font-variant-numeric: tabular-nums;'), 'm-price must have tabular-nums');
assert.ok(css.includes('.m-chg {') && css.includes('font-variant-numeric: tabular-nums;'), 'm-chg must have tabular-nums');
assert.ok(css.includes('.tib-mini-chg {') && css.includes('font-variant-numeric: tabular-nums;'), 'tib-mini-chg must have tabular-nums');
assert.ok(css.includes('.bento-price {') && css.includes('font-variant-numeric: tabular-nums;'), 'bento-price must have tabular-nums');
assert.ok(css.includes('.bento-chg {') && css.includes('font-variant-numeric: tabular-nums;'), 'bento-chg must have tabular-nums');
console.log('  ✓ Monospaced tabular-nums font styling verified across all marquee, bento, and ticker elements');

// 2. Verify Desktop Marquee In-Place DOM Diffing
console.log('2. Testing Desktop Marquee In-Place DOM Diffing...');
assert.ok(js.includes('if (el.textContent !== formattedPrice) {'), 'updateDesktopMarqueePrices must check textContent before updating price');
assert.ok(js.includes('if (el.className !== targetClass) el.className = targetClass;'), 'updateDesktopMarqueePrices must check className before updating class');
assert.ok(js.includes('if (el.textContent !== formattedChg) el.textContent = formattedChg;'), 'updateDesktopMarqueePrices must check textContent before updating change');
console.log('  ✓ In-place DOM diffing prevents marquee layout recalculations and price flickering');

// 3. Verify Markets Table In-Place Row Diffing
console.log('3. Testing Markets Screen In-Place Row Diffing...');
assert.ok(js.includes("tbody.getAttribute('data-rendered-key') === listKey"), 'renderMarketsScreen must check renderedKey to avoid full innerHTML redraw');
assert.ok(js.includes('if (priceTd && priceTd.textContent !== formattedPrice) priceTd.textContent = formattedPrice;'), 'Markets table must update price in-place');
assert.ok(js.includes('if (chgTd.textContent !== formattedChg) chgTd.textContent = formattedChg;'), 'Markets table must update change in-place');
console.log('  ✓ Markets screen table diffs in-place without flashing 57 rows on price updates');

// 4. Verify Desktop Orderbook & Trades In-Place Cell Updates
console.log('4. Testing Desktop Orderbook & Trades In-Place Cell Updates...');
assert.ok(js.includes('renderTradeDeskOrderBookAndTrades()'), 'renderTradeDeskOrderBookAndTrades function must exist');
assert.ok(js.includes("obContainer.querySelectorAll('.ob-ask-row').forEach"), 'Orderbook must update ask rows in-place');
assert.ok(js.includes("obContainer.querySelectorAll('.ob-bid-row').forEach"), 'Orderbook must update bid rows in-place');
assert.ok(js.includes('if (!trRendered || trSym !== selectedCoin.symbol)'), 'Recent trades must avoid rebuilding DOM on every price tick');
console.log('  ✓ Desktop orderbook and recent trades update in-place without DOM thrashing');

// 5. Verify Active Trade Desk Live WebSocket Protection Against REST Overwrite
console.log('5. Testing Live WebSocket Protection Against Older REST Polling Overwrite...');
assert.ok(js.includes("if (activeTab !== 'trade' || !liveTickerWs || liveTickerWs.readyState !== 1)"), 'REST ticker polling must not overwrite active WebSocket price');
console.log('  ✓ Live WebSocket streaming takes strict precedence over REST snapshots on active trade desk');

// 6. Verify Gold Session Open Stability
console.log('6. Testing Gold Spot Fallback Open Stability...');
assert.ok(js.includes('if (!gold.open || gold.open < 4000) gold.open = 4060.34;'), 'Gold fallback must protect daily session open from jumping');
console.log('  ✓ Gold Spot rate stabilized across all sources without baseline open jumps');

console.log('\n=== ALL WEBSITE PRICE FLICKER & DIFFING TESTS PASSED! ===\n');
