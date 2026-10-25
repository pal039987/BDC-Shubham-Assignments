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
assert.ok(html.includes('id="header-cash-badge"'), 'header-cash-badge element exists in HTML');
assert.ok(html.includes('id="header-cash-val"'), 'header-cash-val element exists in HTML');
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

// 5. Verify Mandatory Gujarat Footer Address
console.log('5. Verifying Mandatory Gujarat Footer Address...');
assert.ok(html.includes('Vadod Gam, Surat, Gujarat'), 'Mandatory Gujarat address must be present in footer');
console.log('  ✓ Mandatory address "Vadod Gam, Surat, Gujarat" verified');

console.log('\n=== ALL GUEST GATING & CREDENTIALS PROTECTION TESTS PASSED! ===\n');
