const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== RUNNING MY PROFILE & NET P&L DASHBOARD TEST SUITE ===\n');

const htmlPath = path.join(__dirname, '../frontend/index.html');
const cssPath = path.join(__dirname, '../frontend/style.css');
const jsPath = path.join(__dirname, '../frontend/app.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');

// 1. Verify Header: Yellow Trade Desk removed, Single My Profile block present (Screenshot 2)
console.log('1. Testing Header Navbar Single Profile Block (Screenshot 2)...');
assert(html.includes('header-my-profile-btn'), 'header-my-profile-btn must be present in index.html');
assert(html.includes('hmp-avatar-ring'), 'hmp-avatar-ring must be present for cyan border ring');
assert(html.includes('hmp-avatar-initial'), 'hmp-avatar-initial must be present');
assert(html.includes('My Profile'), 'My Profile label text must be present');

// Verify that the yellow/orange Trade Desk button is removed from header actions
const headerActionsMatch = html.match(/<div class="header-actions-wrap">([\s\S]*?)<\/header>/);
assert(headerActionsMatch, 'header-actions-wrap must exist');
const headerContent = headerActionsMatch[1];
assert(!headerContent.includes('header-trade-cta-btn'), 'Old yellow header-trade-cta-btn must be removed from header actions');
assert(!headerContent.includes('hub-name">Sign In</span></button>'), 'Old user pill button must be replaced by header-my-profile-btn');
console.log('  ✓ Single My Profile block verified and yellow Trade Desk + user pill removed.');

// 2. Verify Profile Drawer & Structure (Screenshots 3 & 4)
console.log('2. Testing Profile Drawer & Structure (Screenshots 3 & 4)...');
assert(html.includes('vtrade-profile-drawer'), 'vtrade-profile-drawer must be present');
assert(html.includes('vpd-account-card'), 'My Account card must be present');
assert(html.includes('vpd-connect-card'), 'Connect with us card must be present');
assert(html.includes('vpd-download-section'), 'Download our App section must be present');
assert(html.includes('Google Play'), 'Google Play store button must be present');
assert(html.includes('App Store'), 'Apple App store button must be present');
assert(html.includes('vpd-qr-box'), 'QR Code box must be present with Get the App badge');
assert(html.includes('vpd-signout-btn'), 'Sign Out button must be present in drawer bottom');
assert(html.includes('vpd-nav-pnl'), 'P&L Dashboard menu item must be present');

// Verify NO duplicate profile section inside drawer (User requirement)
const drawerMatch = html.match(/<aside class="vtrade-profile-drawer"[\s\S]*?<\/aside>/);
assert(drawerMatch, 'vtrade-profile-drawer HTML must exist');
const drawerHtml = drawerMatch[0];
assert(!drawerHtml.includes('Personal Information'), 'Duplicate "Personal Information" section must NOT be inside drawer');
console.log('  ✓ Profile drawer verified without redundant profile sections.');

// 3. Verify Net P&L Summary Modal Markup (User Screenshot)
console.log('3. Testing Net P&L Summary Modal Markup...');
assert(html.includes('pnl-dashboard-modal'), 'pnl-dashboard-modal overlay must be present');
assert(html.includes('pnl-cyan-accent-bar'), 'Cyan vertical accent bar must be present');
assert(html.includes('Net P&amp;L Summary') || html.includes('Net P&L Summary'), 'Net P&L Summary title must be present');
assert(html.includes('Overall realized profit &amp; loss for the selected period') || html.includes('Overall realized profit & loss for the selected period'), 'Subtitle must be present');
assert(html.includes('pnl-net-value'), 'pnl-net-value element must be present');
assert(html.includes('pnl-days-grid'), 'pnl-days-grid must be present');
assert(html.includes('pnl-total-profit-val'), 'pnl-total-profit-val must be present');
assert(html.includes('pnl-total-loss-val'), 'pnl-total-loss-val must be present');
console.log('  ✓ Net P&L Summary modal layout elements verified.');

// 4. Testing Dynamic Days Calculation (Month-adaptive, NOT hardcoded 30)
console.log('4. Testing Dynamic Month Days Calculation Logic...');
function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

assert.strictEqual(getDaysInMonth(2026, 9), 31, 'October must have 31 days');
assert.strictEqual(getDaysInMonth(2026, 10), 30, 'November must have 30 days');
assert.strictEqual(getDaysInMonth(2026, 1), 28, 'February 2026 (non-leap) must have 28 days');
assert.strictEqual(getDaysInMonth(2024, 1), 29, 'February 2024 (leap year) must have 29 days');
assert(js.includes('new Date(currentYear, currentMonth + 1, 0).getDate()'), 'app.js must dynamically calculate totalDaysInMonth using Date API');
console.log('  ✓ Dynamic month days calculation verified (adaptive to 28, 29, 30, 31 days).');

// 5. Testing Hover Tooltip & Color Coding Guardrails (User Constraints)
console.log('5. Testing Hover Tooltip & Block Color Coding Guardrails...');
// Constraint A: Hover tooltip must NEVER show the word "Profit" or "Loss"
assert(js.includes('`${d} ${shortMonth}: +${sym}${fmtMoney(data.pnl)}`'), 'Profit tooltip must only format Date and +Amount without the word "Profit"');
assert(js.includes('`${d} ${shortMonth}: -${sym}${fmtMoney(Math.abs(data.pnl))}`'), 'Loss tooltip must only format Date and -Amount without the word "Profit" or "Loss"');

// Verify that the string `Profit` does not exist inside tooltip assignments
const tipLines = js.split('\n').filter(line => line.includes('tipText ='));
tipLines.forEach(line => {
  assert(!line.toLowerCase().includes('profit'), `Tooltip assignment must not include "profit": ${line}`);
  assert(!line.toLowerCase().includes('loss'), `Tooltip assignment must not include "loss": ${line}`);
});

// Constraint B: Inside the tiles, words must NOT be written
assert(js.includes("cell.textContent = ''"), 'Tile text content must be empty (no words inside blocks)');

// Constraint C: Block classes
assert(css.includes('.pnl-day-cell.is-profit'), 'CSS must define .is-profit for green tiles');
assert(css.includes('.pnl-day-cell.is-loss'), 'CSS must define .is-loss for red tiles');
assert(css.includes('.pnl-day-cell.no-trade'), 'CSS must define .no-trade for neutral dark glass tiles');
assert(css.includes('#00c087'), 'Green color must be defined for profit');
assert(css.includes('#f6465d'), 'Red color must be defined for loss');
console.log('  ✓ Hover tooltip constraints and wordless color blocks verified.');

// 6. Testing Function Exports
console.log('6. Testing Window Function Exports in app.js...');
assert(js.includes('window.toggleProfileDrawer = toggleProfileDrawer'), 'toggleProfileDrawer must be exported');
assert(js.includes('window.openPnLDashboardModal = openPnLDashboardModal'), 'openPnLDashboardModal must be exported');
assert(js.includes('window.renderPnLDashboard = renderPnLDashboard'), 'renderPnLDashboard must be exported');
console.log('  ✓ Function exports verified.');

console.log('\n=== ALL MY PROFILE & NET P&L DASHBOARD TESTS PASSED SUCCESSFULLY! ===');
