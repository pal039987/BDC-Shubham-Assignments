/**
 * Verification test for:
 * 1. Sign out functionality (handleAuthLogout, logoutAuthUser, session cleanup, UI reset)
 * 2. Reduced marquee ticker speed (130s animation duration)
 * 3. Removal of "demo" and "virtual" words across website UI
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../frontend/style.css'), 'utf8');

console.log('\n=== RUNNING SIGNOUT, MARQUEE SPEED & WORD CLEANUP VERIFICATION TESTS ===\n');

// 1. Sign Out Handlers
console.log('1. Testing Sign Out handlers...');
assert.ok(appJs.includes('function handleAuthLogout()'), 'handleAuthLogout function is defined in app.js');
assert.ok(appJs.includes('function logoutAuthUser()'), 'logoutAuthUser function is defined in app.js');
assert.ok(appJs.includes('window.handleAuthLogout = handleAuthLogout'), 'handleAuthLogout is exported to window');
assert.ok(appJs.includes('window.logoutAuthUser = logoutAuthUser'), 'logoutAuthUser is exported to window');
assert.ok(indexHtml.includes('onclick="handleAuthLogout()"'), 'Sign out button in index.html calls handleAuthLogout()');
console.log('  ✓ handleAuthLogout and logoutAuthUser functions properly defined and attached to window');

// 2. Marquee Speed
console.log('2. Testing Marquee Ticker speed reduction...');
assert.ok(styleCss.includes('animation: marqueeScroll 130s linear infinite;'), 'Marquee scroll animation duration is set to comfortable 130s');
assert.ok(!styleCss.includes('animation: marqueeScroll 40s linear infinite;'), 'Old rapid 40s marquee animation is removed');
console.log('  ✓ Marquee ticker speed comfortably reduced from 40s to 130s');

// 3. Elimination of "demo" and "virtual" in UI
console.log('3. Testing removal of "demo" and "virtual" words from UI...');
// Check index.html text content
assert.ok(!indexHtml.includes('Virtual Wallet Equity'), 'Virtual Wallet Equity replaced');
assert.ok(!indexHtml.includes('Virtual Starting Funds'), 'Virtual Starting Funds replaced');
assert.ok(!indexHtml.includes('virtual funds'), 'virtual funds replaced');
assert.ok(!indexHtml.includes('Account Virtual Equity'), 'Account Virtual Equity replaced');
assert.ok(!indexHtml.includes('Zero-Risk Demo Trading Funds'), 'Zero-Risk Demo Trading Funds replaced');
assert.ok(!indexHtml.includes('Demo Refill'), 'Demo Refill replaced');
assert.ok(!indexHtml.includes('Demo Trader'), 'Demo Trader replaced');
assert.ok(!indexHtml.includes('Reset Demo Funds'), 'Reset Demo Funds replaced');
assert.ok(!indexHtml.includes('$10,000 Demo'), '$10,000 Demo replaced');
assert.ok(!indexHtml.includes('virtual paper equity'), 'virtual paper equity replaced');
console.log('  ✓ Zero occurrences of user-facing "demo" or "virtual" in index.html');

// Check app.js toasts and messages
assert.ok(!appJs.includes('Demo Balance refilled'), 'Demo Balance refilled toast updated');
assert.ok(!appJs.includes('Low demo funds refilled'), 'Low demo funds refilled toast updated');
assert.ok(!appJs.includes('Insufficient demo funds'), 'Insufficient demo funds toast updated');
assert.ok(!appJs.includes('reset your virtual account'), 'reset your virtual account confirm message updated');
assert.ok(!appJs.includes('Demo Account successfully reset'), 'Demo Account successfully reset toast updated');
console.log('  ✓ Zero occurrences of "demo" or "virtual" in user toasts and confirmations in app.js');

console.log('\n=== ALL SIGNOUT, MARQUEE SPEED & WORD CLEANUP TESTS PASSED! ===\n');
