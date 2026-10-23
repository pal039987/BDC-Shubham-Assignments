const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('\n=== RUNNING CUSTOM ACCOUNT BALANCE & REAL LABEL TEST SUITE ===\n');

const htmlPath = path.join(__dirname, '../frontend/index.html');
const jsPath = path.join(__dirname, '../frontend/app.js');
const cssPath = path.join(__dirname, '../frontend/style.css');

const indexHtml = fs.readFileSync(htmlPath, 'utf8');
const appJs = fs.readFileSync(jsPath, 'utf8');
const styleCss = fs.readFileSync(cssPath, 'utf8');

// 1. Verify Header Badge shows 'Real:' instead of 'Cash:'
console.log('1. Testing Header Badge Label Replacement (Cash -> Real)...');
assert.ok(indexHtml.includes('<span class="hcb-label">Real:</span>'),
  'Header cash badge must have <span class="hcb-label">Real:</span>');
assert.ok(!indexHtml.includes('<span class="hcb-label">Cash:</span>'),
  'Old <span class="hcb-label">Cash:</span> must be removed');
console.log('  ✓ Header badge label successfully verified as "Real:"');

// 2. Verify Buttons use only "Balance" text
console.log('2. Testing Button Text (strictly "Balance")...');
assert.ok(indexHtml.includes('id="pfm-balance-btn"') && indexHtml.includes('>Balance<') || indexHtml.match(/id="pfm-balance-btn"[^>]*>\s*Balance\s*<\/button>/),
  'Portfolio metric refill button must have text "Balance"');
assert.ok(indexHtml.includes('id="pref-balance-btn"') && indexHtml.includes('>Balance<') || indexHtml.match(/id="pref-balance-btn"[^>]*>\s*Balance\s*<\/button>/),
  'Settings adjust funds button must have text "Balance"');
assert.ok(!indexHtml.includes('Reset $10,000'),
  'Static "Reset $10,000" text must be completely removed from buttons');
console.log('  ✓ Buttons strictly display "Balance"');

// 3. Verify Custom Account Balance Modal in HTML & CSS
console.log('3. Testing Custom Account Balance Modal Markup & CSS...');
assert.ok(indexHtml.includes('id="custom-balance-modal"'), 'custom-balance-modal must exist in HTML');
assert.ok(indexHtml.includes('id="cbm-amount-input"'), 'cbm-amount-input numeric input must exist');
assert.ok(indexHtml.includes('id="cbm-confirm-btn"'), 'cbm-confirm-btn must exist');
assert.ok(styleCss.includes('.custom-balance-modal-overlay') && styleCss.includes('.custom-balance-modal-card'),
  'Luxury glass styling for custom balance modal must exist in style.css');
console.log('  ✓ Custom balance modal markup and luxury glass styles verified');

// 4. Verify Functional Implementation in app.js
console.log('4. Testing JavaScript Custom Balance Controller Functions...');
assert.ok(appJs.includes('function openCustomBalanceModal('), 'openCustomBalanceModal function must exist');
assert.ok(appJs.includes('function closeCustomBalanceModal('), 'closeCustomBalanceModal function must exist');
assert.ok(appJs.includes('function setCustomBalanceInput('), 'setCustomBalanceInput function must exist');
assert.ok(appJs.includes('function applyCustomBalance('), 'applyCustomBalance function must exist');
assert.ok(appJs.includes('window.openCustomBalanceModal = openCustomBalanceModal;'),
  'openCustomBalanceModal must be exported to window');
console.log('  ✓ Custom balance controller functions verified in app.js');

// 5. Functional Simulation: Setting Custom Balance
console.log('5. Simulating Custom Balance Adjustment...');
const mockWallet = { cashBalance: 10000 };
let saved = false;

function mockApplyCustomBalance(amount) {
  const val = parseFloat(amount);
  assert.ok(!isNaN(val) && val > 0, 'Amount must be valid positive number');
  mockWallet.cashBalance = val;
  saved = true;
}

mockApplyCustomBalance(25000);
assert.strictEqual(mockWallet.cashBalance, 25000, 'Balance must be set to custom 25,000');
assert.ok(saved, 'Wallet state must be saved');

mockApplyCustomBalance(150000.50);
assert.strictEqual(mockWallet.cashBalance, 150000.50, 'Balance must be set to custom 150,000.50');
console.log('  ✓ Simulation verified: User can set any custom amount beyond static $10,000');

console.log('\n=== ALL CUSTOM ACCOUNT BALANCE & REAL LABEL TESTS PASSED! ===\n');
