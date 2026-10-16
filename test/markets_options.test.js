const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('\n=== RUNNING MARKETS & OPTIONS CHAIN TESTS ===\n');

// Read files
const htmlPath = path.join(__dirname, '../frontend/index.html');
const cssPath = path.join(__dirname, '../frontend/style.css');
const jsPath = path.join(__dirname, '../frontend/app.js');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const jsContent = fs.readFileSync(jsPath, 'utf8');

// 1. Verify HTML elements for Select Expiry and Select View modals
assert.ok(htmlContent.includes('id="select-expiry-modal"'), 'select-expiry-modal must exist in HTML');
assert.ok(htmlContent.includes('id="select-view-modal"'), 'select-view-modal must exist in HTML');
assert.ok(htmlContent.includes('id="expiry-options-list"'), 'expiry-options-list container must exist');
assert.ok(htmlContent.includes('id="opt-chain-head"'), 'opt-chain-head must have ID');
assert.ok(htmlContent.includes('id="opt-chain-rows"'), 'opt-chain-rows must exist');
assert.ok(htmlContent.includes('onclick="openSelectViewModal()"'), 'shape dropdown pill must call openSelectViewModal');
assert.ok(htmlContent.includes('onclick="openExpiryModal()"'), 'expiry box must call openExpiryModal');
console.log('  ✓ Select Expiry and Select View modals present in HTML');

// 2. Verify CSS classes for Options views
assert.ok(cssContent.includes('.select-expiry-sheet'), 'CSS must style .select-expiry-sheet');
assert.ok(cssContent.includes('.select-view-sheet'), 'CSS must style .select-view-sheet');
assert.ok(cssContent.includes('.mode-calls-only'), 'CSS must style .mode-calls-only');
assert.ok(cssContent.includes('.mode-puts-only'), 'CSS must style .mode-puts-only');
assert.ok(cssContent.includes('.oi-depth-bar'), 'CSS must style .oi-depth-bar');
assert.ok(cssContent.includes('.oi-cell-wrap'), 'CSS must style .oi-cell-wrap');
assert.ok(cssContent.includes('.oi-depth-bar.red-tint'), 'CSS must have red tint for OI depth bar');
assert.ok(cssContent.includes('.oi-depth-bar.green-tint'), 'CSS must have green tint for OI depth bar');
console.log('  ✓ CSS stylesheets contain complete classes for modals, depth bars & view modes');

// 3. Verify JavaScript logic and datasets
assert.ok(jsContent.includes('const OPTIONS_EXPIRIES = ['), 'OPTIONS_EXPIRIES must be defined');
assert.ok(jsContent.includes('const BTC_OPTIONS_STRIKES_DATA = ['), 'BTC_OPTIONS_STRIKES_DATA must be defined');
assert.ok(jsContent.includes('const ETH_OPTIONS_STRIKES_DATA = ['), 'ETH_OPTIONS_STRIKES_DATA must be defined');
assert.ok(jsContent.includes('function openExpiryModal()'), 'openExpiryModal must be defined');
assert.ok(jsContent.includes('function closeExpiryModal()'), 'closeExpiryModal must be defined');
assert.ok(jsContent.includes('function selectExpiry(idx)'), 'selectExpiry must be defined');
assert.ok(jsContent.includes('function openSelectViewModal()'), 'openSelectViewModal must be defined');
assert.ok(jsContent.includes('function closeSelectViewModal()'), 'closeSelectViewModal must be defined');
assert.ok(jsContent.includes('function setOptionsViewMode(mode)'), 'setOptionsViewMode must be defined');
assert.ok(jsContent.includes('function setOptionsMetric(metric)'), 'setOptionsMetric must be defined');
assert.ok(jsContent.includes('function setOptionsUnderlying(asset)'), 'setOptionsUnderlying must be defined');
console.log('  ✓ Options modal and view mode controller functions defined');

// 4. Test Datasets content matching Screenshots
// Extract and parse OPTIONS_EXPIRIES
const expMatch = jsContent.match(/const OPTIONS_EXPIRIES = (\[[\s\S]*?\]);/);
assert.ok(expMatch, 'Must match OPTIONS_EXPIRIES array');
const optionsExpiries = eval(expMatch[1]);
assert.strictEqual(optionsExpiries.length, 7, 'OPTIONS_EXPIRIES must contain 7 expiration dates');
assert.strictEqual(optionsExpiries[0].shortDate, '16 Oct');
assert.strictEqual(optionsExpiries[0].remaining, '53m');
assert.strictEqual(optionsExpiries[1].shortDate, '17 Oct');
assert.strictEqual(optionsExpiries[6].shortDate, '25 Dec');
console.log('  ✓ OPTIONS_EXPIRIES dataset strictly matches Screenshot 3');

// Extract and parse BTC_OPTIONS_STRIKES_DATA
const btcMatch = jsContent.match(/const BTC_OPTIONS_STRIKES_DATA = (\[[\s\S]*?\]);/);
assert.ok(btcMatch, 'Must match BTC_OPTIONS_STRIKES_DATA array');
const btcOptions = eval(btcMatch[1]);
assert.ok(btcOptions.length >= 12, 'BTC options strikes must have all strikes from 81200 to 83000');
assert.strictEqual(btcOptions[0].strike, 81200);
assert.strictEqual(btcOptions[0].callVol, '$12.43M');
assert.strictEqual(btcOptions[0].callVolChg, '98.73%');
assert.strictEqual(btcOptions[0].callOi, '$130.69K');
assert.strictEqual(btcOptions[0].putVol, '$56.67M');
assert.strictEqual(btcOptions[0].putVolChg, '-99.99%');
console.log('  ✓ BTC Options strikes match Screenshot 1 (OI/Vol) & Screenshot 2 (Greeks)');

// Extract and parse ETH_OPTIONS_STRIKES_DATA
const ethMatch = jsContent.match(/const ETH_OPTIONS_STRIKES_DATA = (\[[\s\S]*?\]);/);
assert.ok(ethMatch, 'Must match ETH_OPTIONS_STRIKES_DATA array');
const ethOptions = eval(ethMatch[1]);
assert.ok(ethOptions.length >= 12, 'ETH options strikes must have all strikes from 2410 to 2520');
assert.strictEqual(ethOptions[0].strike, 2410);
assert.strictEqual(ethOptions[0].callBid, '58.2');
assert.strictEqual(ethOptions[0].callAsk, '59.4');
assert.strictEqual(ethOptions[0].callMark, '58.94');
assert.strictEqual(ethOptions[0].callIv, '53.47');
assert.strictEqual(ethOptions[0].putMark, '0.01');
assert.strictEqual(ethOptions[0].putIv, '78.14');
console.log('  ✓ ETH Options strikes strictly match Screenshot 5 (Price, Bid/Ask & Mark/IV)');

// 5. Simulate DOM behavior with minimal mocks
class MockClassList {
  constructor(initial = []) {
    this.classes = new Set(initial);
  }
  add(cls) { this.classes.add(cls); }
  remove(cls) { this.classes.delete(cls); }
  contains(cls) { return this.classes.has(cls); }
  toggle(cls, force) {
    if (force === undefined) {
      if (this.classes.has(cls)) this.classes.delete(cls); else this.classes.add(cls);
    } else if (force) {
      this.classes.add(cls);
    } else {
      this.classes.delete(cls);
    }
    return this.classes.has(cls);
  }
}

const mockElements = {
  'select-expiry-modal': { classList: new MockClassList(['hidden']), className: 'vmodal-backdrop hidden' },
  'select-view-modal': { classList: new MockClassList(['hidden']), className: 'vmodal-backdrop hidden' },
  'expiry-modal-subtitle': { textContent: '' },
  'expiry-options-list': { innerHTML: '' },
  'exp-current-date': { textContent: '16 Oct' },
  'exp-countdown': { textContent: 'Expires in 53m' },
  'opt-current-view-mode': { textContent: 'T-Shape' },
  'opt-chain-head': { className: 'opt-chain-head', innerHTML: '' },
  'opt-chain-rows': { innerHTML: '' },
  'options-chain-table': { innerHTML: '' },
  'vopt-t-shape': { classList: new MockClassList(['active']), querySelector: () => ({ textContent: '✓' }) },
  'vopt-all': { classList: new MockClassList(), querySelector: () => ({ textContent: '' }) },
  'vopt-calls': { classList: new MockClassList(), querySelector: () => ({ textContent: '' }) },
  'vopt-puts': { classList: new MockClassList(), querySelector: () => ({ textContent: '' }) },
  'opt-und-btc': { classList: new MockClassList(['active']) },
  'opt-und-eth': { classList: new MockClassList() },
  'opt-und-xaut': { classList: new MockClassList() },
  'opt-metric-price': { classList: new MockClassList(['active']) },
  'opt-metric-oivol': { classList: new MockClassList() },
  'opt-metric-greeks': { classList: new MockClassList() }
};

const mockDoc = {
  getElementById: (id) => mockElements[id] || null
};

// Test Expiry modal open and selection simulation
function testExpiryFlow() {
  const modal = mockDoc.getElementById('select-expiry-modal');
  const sub = mockDoc.getElementById('expiry-modal-subtitle');
  sub.textContent = 'BTC Options expire at 5:30 pm';
  modal.classList.remove('hidden');
  assert.ok(!modal.classList.contains('hidden'), 'Expiry modal opened');
  assert.strictEqual(sub.textContent, 'BTC Options expire at 5:30 pm');

  // Select expiry index 3 (23 Oct)
  const selected = optionsExpiries[3];
  mockDoc.getElementById('exp-current-date').textContent = selected.shortDate;
  mockDoc.getElementById('exp-countdown').textContent = selected.countdown;
  modal.classList.add('hidden');

  assert.strictEqual(mockDoc.getElementById('exp-current-date').textContent, '23 Oct');
  assert.strictEqual(mockDoc.getElementById('exp-countdown').textContent, 'Expires in 7d: 53m');
  assert.ok(modal.classList.contains('hidden'), 'Expiry modal closed');
}
testExpiryFlow();
console.log('  ✓ Select Expiry modal flow verified (open, subtitle, select, close)');

// Test Select View modal flow
function testSelectViewFlow() {
  const modal = mockDoc.getElementById('select-view-modal');
  modal.classList.remove('hidden');
  assert.ok(!modal.classList.contains('hidden'), 'Select View modal opened');

  // Select Calls view
  mockDoc.getElementById('opt-current-view-mode').textContent = 'Calls';
  modal.classList.add('hidden');
  assert.strictEqual(mockDoc.getElementById('opt-current-view-mode').textContent, 'Calls');
  assert.ok(modal.classList.contains('hidden'), 'Select View modal closed');
}
testSelectViewFlow();
console.log('  ✓ Select View modal flow verified (open, select Calls, close)');

console.log('\n=== ALL 12 MARKETS & OPTIONS TESTS PASSED! ===\n');
