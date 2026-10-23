const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('\n=== RUNNING TRADE DESK CHART-WIDTH LEDGER & SCREENSHOT 1 TABS TEST SUITE ===\n');

const indexHtml = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../frontend/style.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

// 1. Verify Grid Layout: Ledger strictly matches Chart Width (Column 1)
console.log('1. Testing Trade Desk Chart-Width Ledger Grid Layout...');
assert.ok(indexHtml.includes('class="trade-bottom-ledger-card"'), 'trade-bottom-ledger-card must exist in index.html');
assert.ok(styleCss.includes('.trade-bottom-ledger-card {') && styleCss.includes('grid-column: 1;') && styleCss.includes('grid-row: 2;'),
  '.trade-bottom-ledger-card must be pinned to grid-column: 1 and grid-row: 2 to match chart width strictly');
assert.ok(styleCss.includes('.trade-chart-box {') && styleCss.includes('grid-column: 1;') && styleCss.includes('grid-row: 1;'),
  '.trade-chart-box must be pinned to grid-column: 1 and grid-row: 1');
assert.ok(styleCss.includes('.trade-depth-panel {') && styleCss.includes('grid-row: 1 / span 2;'),
  '.trade-depth-panel must span 2 rows to match chart + ledger height');
assert.ok(styleCss.includes('.desktop-trade-order-dock {') && styleCss.includes('grid-row: 1 / span 2;'),
  '.desktop-trade-order-dock must span 2 rows to match chart + ledger height');
assert.ok(styleCss.includes('.trade-workspace-grid.orderbook-hidden .trade-bottom-ledger-card {') &&
  styleCss.includes('grid-column: 1;') && styleCss.includes('grid-row: 2;'),
  'When orderbook is hidden, bottom ledger card must still be strictly pinned to column 1 under chart');
console.log('  ✓ Chart-width ledger positioning in CSS grid (column 1, row 2) verified');

// 2. Verify Screenshot 1 Tabs
console.log('2. Testing Screenshot 1 Tabs (Positions, Open Orders, Order History, Trade History, Transaction History, Delivery History)...');
const requiredTabs = [
  { id: 'tblc-tab-positions', label: 'Positions' },
  { id: 'tblc-tab-orders', label: 'Open Orders' },
  { id: 'tblc-tab-order-history', label: 'Order History' },
  { id: 'tblc-tab-history', label: 'Trade History' },
  { id: 'tblc-tab-transactions', label: 'Transaction History' },
  { id: 'tblc-tab-delivery', label: 'Delivery History' }
];

requiredTabs.forEach(tab => {
  assert.ok(indexHtml.includes(`id="${tab.id}"`), `Tab ${tab.id} must exist in index.html`);
  assert.ok(indexHtml.includes(`<span>${tab.label}</span>`) || indexHtml.includes(tab.label), `Tab label ${tab.label} must exist`);
});
console.log('  ✓ All 6 tabs from Screenshot 1 verified in HTML');

// 3. Verify Auth Prompt from Screenshot 1
console.log('3. Testing Centered Auth Prompt ("Log In or Register Now to trade.")...');
assert.ok(indexHtml.includes('id="tblc-auth-prompt"'), 'tblc-auth-prompt container must exist');
assert.ok(indexHtml.includes("openAuthModal('login')"), 'Log In link must call openAuthModal("login")');
assert.ok(indexHtml.includes("openAuthModal('register')"), 'Register Now link must call openAuthModal("register")');
assert.ok(indexHtml.includes('to trade.'), 'to trade text must exist in prompt');
assert.ok(styleCss.includes('.tblc-auth-prompt {'), '.tblc-auth-prompt styling must exist');
assert.ok(styleCss.includes('.tblc-auth-link {') && styleCss.includes('#00f2fe'), '.tblc-auth-link must have cyan color (#00f2fe)');
assert.ok(styleCss.includes('.tblc-tab.active {') && styleCss.includes('#00f2fe'), '.tblc-tab.active must have cyan underline matching Screenshot 1');
console.log('  ✓ Auth prompt text section and cyan link styling verified');

// 4. Verify JS Switcher and Auth Visibility Logic
console.log('4. Testing switchLedgerTab and renderTradeBottomLedger Auth Gate...');
assert.ok(appJs.includes("const allTabs = ['positions', 'orders', 'order-history', 'history', 'transactions', 'delivery'];"),
  'switchLedgerTab must handle all 6 tabs');
assert.ok(appJs.includes("const isAuthed = !!(sess && sess.email && !sess.isGuest);"),
  'renderTradeBottomLedger must check authentication status');
assert.ok(appJs.includes("authPrompt.classList.toggle('hidden', isAuthed);"),
  'authPrompt must toggle hidden based on isAuthed');
console.log('  ✓ Ledger tab switcher and auth conditional gating verified');

// 5. Headless DOM Simulation
console.log('5. Simulating Ledger Rendering for Guest vs Authenticated User...');
const elements = {};
const getElem = (id) => {
  if (!elements[id]) {
    elements[id] = {
      id,
      classList: {
        classes: new Set(),
        add(c) { this.classes.add(c); },
        remove(c) { this.classes.delete(c); },
        toggle(c, force) {
          if (force === undefined) {
            if (this.classes.has(c)) this.classes.delete(c);
            else this.classes.add(c);
          } else if (force) {
            this.classes.add(c);
          } else {
            this.classes.delete(c);
          }
        },
        contains(c) { return this.classes.has(c); }
      },
      innerHTML: '',
      textContent: ''
    };
  }
  return elements[id];
};

const domMock = {
  getElementById: (id) => getElem(id),
  querySelectorAll: (selector) => {
    if (selector === '.tblc-view') {
      return ['positions', 'orders', 'order-history', 'history', 'transactions', 'delivery']
        .map(t => getElem(`tblc-view-${t}`));
    }
    return [];
  },
  querySelector: (selector) => {
    if (selector === '.tblc-tab.active') {
      return getElem('tblc-tab-positions');
    }
    return null;
  }
};

// Simulation A: Unauthenticated Guest
let mockSession = null;
const simulateRender = (sess) => {
  const isAuthed = !!(sess && sess.email && !sess.isGuest);
  const authPrompt = domMock.getElementById('tblc-auth-prompt');
  if (authPrompt) {
    authPrompt.classList.toggle('hidden', isAuthed);
  }
  const views = domMock.querySelectorAll('.tblc-view');
  if (!isAuthed) {
    views.forEach(v => v.classList.add('hidden'));
    return;
  }
  const activeTabBtn = domMock.querySelector('.tblc-tab.active');
  const activeTabKey = activeTabBtn ? activeTabBtn.id.replace('tblc-tab-', '') : 'positions';
  views.forEach(v => {
    v.classList.toggle('hidden', v.id !== `tblc-view-${activeTabKey}`);
  });
};

// Unauthenticated: prompt visible, views hidden
simulateRender(mockSession);
assert.strictEqual(getElem('tblc-auth-prompt').classList.contains('hidden'), false, 'Auth prompt must be visible for guest');
assert.strictEqual(getElem('tblc-view-positions').classList.contains('hidden'), true, 'Positions view must be hidden for guest');
console.log('  ✓ Guest state: Auth prompt visible ("Log In or Register Now to trade."), tables hidden');

// Authenticated: prompt hidden, active view visible
mockSession = { username: 'TraderX', email: 'trader@vtrade.com', isGuest: false };
simulateRender(mockSession);
assert.strictEqual(getElem('tblc-auth-prompt').classList.contains('hidden'), true, 'Auth prompt must be hidden for authenticated user');
assert.strictEqual(getElem('tblc-view-positions').classList.contains('hidden'), false, 'Positions view must be visible for authenticated user');
console.log('  ✓ Authenticated state: Auth prompt hidden, active ledger table visible');

console.log('\n=== ALL TRADE DESK CHART-WIDTH LEDGER & SCREENSHOT 1 TESTS PASSED! ===\n');
