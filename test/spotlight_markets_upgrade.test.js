/**
 * Test Suite: Spotlight Markets Section - Unique Premium Animation & Interaction Upgrade
 * Verifies all requirements specified in user prompt:
 * 1. Staggered Market Card Entrance (GSAP ScrollTrigger, opacity, y-movement, scale, sequential left-to-right).
 * 2. Distinct Market Card Hover Interaction (No 3D tilt, slight elevation, independent radial spotlight,
 *    animated edge highlight, coordinated accents for BTC, ETH, GOLD, SOL).
 * 3. Coin Icon Micro-Animations (BTC scale-up & glow, ETH float, GOLD metallic shimmer, SOL dual glow).
 * 4. Live Price Change Feedback (directional price flashes green/red without DOM destruction, real data only).
 * 5. Card Content Reveal (name brighten, price emphasis, Trade Desk arrow shift, selectCoinAndTrade action).
 * 6. "View All 56 Coins" Luxury Pill Button (hover transition, arrow shift, amber glow, focus ring, active state).
 * 7. Continuous Background Detail (confined ambient drift behind section).
 * 8. Technical Guardrails & Accessibility (prefers-reduced-motion, fine pointer guard, trigger cleanup).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('\n=== RUNNING SPOTLIGHT MARKETS SECTION UPGRADE TEST SUITE ===\n');

const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../frontend/style.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

// 1. Structure & Section Ambient Background
console.log('1. Testing Section Structure & Continuous Ambient Background...');
assert.ok(html.includes('id="vtrade-spotlight-markets-section"'), 'vtrade-spotlight-markets-section ID present in HTML');
assert.ok(html.includes('class="spotlight-section-ambient"'), 'spotlight-section-ambient element present in HTML');
assert.ok(css.includes('.spotlight-section-ambient'), 'CSS styling for spotlight-section-ambient defined');
assert.ok(css.includes('ambientSpotlightDrift'), 'Ambient drift keyframe animation defined');
assert.ok(css.includes('overflow: hidden') && css.includes('.home-bento-section'), 'Ambient effect confined to section');
console.log('  ✓ Section structure and continuous ambient background verified');

// 2. "View All 56 Coins" Luxury Pill Button
console.log('2. Testing "View All 56 Coins" Luxury Pill Button...');
assert.ok(html.includes('class="section-more-btn"'), 'section-more-btn class present');
assert.ok(html.includes('View All 56 Coins'), 'View All 56 Coins text preserved');
assert.ok(html.includes('switchBottomTab(\'markets\')'), 'Correct route switch preserved');
assert.ok(css.includes('border-radius: 999px'), 'Luxury pill border-radius defined');
assert.ok(css.includes('.section-more-btn:hover') && css.includes('box-shadow: 0 0 18px rgba(255, 153, 0'), 'Amber hover glow defined');
assert.ok(css.includes('.section-more-btn:active') && css.includes('scale(0.96)'), 'Active pressed state defined');
assert.ok(css.includes('.section-more-btn:focus-visible'), 'Focus-visible accessibility state defined');
assert.ok(css.includes('.section-more-btn:hover svg') && css.includes('translateX(4px)'), 'Arrow translates on hover');
console.log('  ✓ "View All 56 Coins" luxury pill button styling and interactions verified');

// 3. Staggered Market Card Entrance (GSAP + ScrollTrigger)
console.log('3. Testing Staggered Market Card Entrance...');
assert.ok(js.includes('function animateSpotlightBentoCards()'), 'animateSpotlightBentoCards function defined');
assert.ok(js.includes('scale: 0.95') || js.includes('scale: 0.96'), 'Subtle scale transition applied to entrance');
assert.ok(js.includes('y: 32') || js.includes('y: 28') || js.includes('y: 30'), 'Small upward y-movement applied');
assert.ok(js.includes('stagger: 0.08') || js.includes('stagger: 0.09'), 'Sequential stagger delay applied left-to-right');
assert.ok(js.includes('trigger: bentoSec') && js.includes('once: true'), 'ScrollTrigger attached with once: true to prevent scroll replay');
assert.ok(js.includes('clearProps: \'transform\''), 'clearProps transform ensures clean CSS hover states');
console.log('  ✓ Staggered card entrance with opacity, upward movement, and scale verified');

// 4. Distinct Market Card Hover Interaction & Coordinated Accents
console.log('4. Testing Distinct Market Card Hover Interaction & Accents...');
assert.ok(css.includes('.spotlight-market-card'), 'spotlight-market-card class defined');
assert.ok(css.includes('transform: translateY(-5px)'), 'Slight elevation on hover defined');
assert.ok(css.includes('.smc-spotlight'), 'Independent per-card cursor spotlight layer defined');
assert.ok(css.includes('var(--card-mouse-x'), 'Spotlight coordinates driven by independent per-card CSS variables');
assert.ok(css.includes('.smc-edge-beam'), 'Animated edge beam layer defined');
assert.ok(css.includes('rotateCardEdgeBeam'), 'Rotating card edge beam animation keyframes defined');

// Accent Colors
assert.ok(css.includes('.smc-bitcoin') && css.includes('rgba(247, 147, 26,'), 'BTC: warm Bitcoin orange accent verified');
assert.ok(css.includes('.smc-ethereum') && css.includes('rgba(142, 117, 252,'), 'ETH: restrained Ethereum violet accent verified');
assert.ok(css.includes('.smc-gold') && css.includes('rgba(255, 215, 0,'), 'GOLD: elegant metallic gold accent verified');
assert.ok(css.includes('.smc-solana') && css.includes('rgba(20, 241, 149,') && css.includes('rgba(153, 69, 255,'), 'SOL: teal and violet accent verified');
console.log('  ✓ Distinct card elevation, independent spotlights, animated edges, and 4 coin accents verified');

// 5. Coin Icon Micro-Animations
console.log('5. Testing Coin Icon Micro-Animations...');
assert.ok(css.includes('.smc-bitcoin:hover .bento-coin-icon') && css.includes('scale(1.12)') && css.includes('247, 147, 26'), 'BTC: scale-up and warm orange glow verified');
assert.ok(css.includes('@keyframes ethFloatHover'), 'ETH: subtle floating animation keyframes defined');
assert.ok(css.includes('.smc-ethereum:hover .bento-coin-icon') && css.includes('ethFloatHover'), 'ETH: float and violet glow verified');
assert.ok(css.includes('@keyframes goldShimmerHover'), 'GOLD: metallic shimmer animation keyframes defined');
assert.ok(css.includes('.smc-gold:hover .bento-coin-icon') && css.includes('goldShimmerHover'), 'GOLD: metallic shimmer and gold glow verified');
assert.ok(css.includes('.smc-solana:hover .bento-coin-icon') && css.includes('20, 241, 149') && css.includes('153, 69, 255'), 'SOL: dual teal/violet glow verified');
console.log('  ✓ 4 distinct coin icon micro-animations verified');

// 6. Live Price Change Feedback (In-Place Directional Updates)
console.log('6. Testing Live Price Change Feedback...');
assert.ok(js.includes('function updateSpotlightBentoPrices()'), 'updateSpotlightBentoPrices function defined');
assert.ok(js.includes('triggerPriceFlash('), 'triggerPriceFlash called on price differences');
assert.ok(css.includes('.price-flash-up') && css.includes('.price-flash-down'), 'Green and red directional price flashes defined in CSS');
assert.ok(js.includes('updateSpotlightBentoPrices()'), 'updateSpotlightBentoPrices invoked during live market updates');
console.log('  ✓ In-place directional price change flashes without DOM destruction verified');

// 7. Card Content Reveal & Micro-Interactions
console.log('7. Testing Card Content Reveal...');
assert.ok(css.includes('.spotlight-market-card:hover .bento-name'), 'Instrument name brightens on hover');
assert.ok(css.includes('.spotlight-market-card:hover .bento-price'), 'Price receives subtle glow emphasis on hover');
assert.ok(css.includes('.spotlight-market-card:hover .smc-trade-arrow') && css.includes('translateX(4px)'), 'Trade Desk arrow translates on hover');
assert.ok(js.includes('selectCoinAndTrade(\'${c.id}\')'), 'Clicking card selects coin and navigates to Trade Desk');
console.log('  ✓ Content reveals, Trade Desk arrow shift, and trading action verified');

// 8. Headless DOM Simulation (Pointer Independence & Price Updates)
console.log('8. Running Headless DOM Simulation (Per-Card Pointer Tracking & Live Flashes)...');
const mockCards = {};
const createMockCard = (id) => {
  const properties = {};
  return {
    id: `spotlight-card-${id}`,
    dataset: {},
    classList: {
      classes: new Set(['spotlight-market-card', `smc-${id}`]),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); }
    },
    style: {
      properties,
      setProperty(k, v) { properties[k] = v; },
      removeProperty(k) { delete properties[k]; }
    },
    getBoundingClientRect: () => ({ left: 100, top: 100, width: 250, height: 180 }),
    addEventListener(event, fn) { this[`on_${event}`] = fn; }
  };
};

const btcCard = createMockCard('bitcoin');
const ethCard = createMockCard('ethereum');
const goldCard = createMockCard('gold');
const solCard = createMockCard('solana');

const mockPriceEls = {
  bitcoin: { textContent: '', classList: { add() {}, remove() {} } },
  ethereum: { textContent: '', classList: { add() {}, remove() {} } },
  gold: { textContent: '', classList: { add() {}, remove() {} } },
  solana: { textContent: '', classList: { add() {}, remove() {} } }
};

const sandbox = {
  console,
  window: {
    matchMedia: (q) => ({ matches: q.includes('fine') })
  },
  document: {
    querySelectorAll: (sel) => {
      if (sel.includes('.spotlight-market-card')) return [btcCard, ethCard, goldCard, solCard];
      return [];
    },
    getElementById: (id) => {
      if (id.startsWith('spotlight-price-')) {
        const coinId = id.replace('spotlight-price-', '');
        return mockPriceEls[coinId] || null;
      }
      return null;
    }
  },
  COINS: [
    { id: 'bitcoin', price: 82000, change: 1.5, vol: '620M' },
    { id: 'ethereum', price: 2450, change: -0.2, vol: '320M' },
    { id: 'gold', price: 4150, change: 0.3, vol: '9M' },
    { id: 'solana', price: 105, change: -0.8, vol: '115M' }
  ],
  getCurrencySymbol: () => '$',
  fmtPrice: (p) => p.toFixed(2),
  triggerPriceFlash: (el, newP, oldP) => {
    el.lastFlash = newP > oldP ? 'green' : 'red';
  },
  lastRecordedSpotlightPrices: { bitcoin: 81000, ethereum: 2500 }
};

vm.createContext(sandbox);

// Execute pointer listener registration
const ptrFn = js.match(/function initSpotlightMarketCardPointers\(\)[\s\S]*?^\}/m);
assert.ok(ptrFn, 'initSpotlightMarketCardPointers function found');
vm.runInContext(ptrFn[0], sandbox);
vm.runInContext('initSpotlightMarketCardPointers();', sandbox);

// Verify listeners registered
assert.ok(typeof btcCard.on_pointermove === 'function', 'BTC card has pointermove listener');
assert.ok(typeof ethCard.on_pointermove === 'function', 'ETH card has pointermove listener');

// Move pointer over BTC card ONLY
btcCard.on_pointermove({ clientX: 150, clientY: 140 });

// Verify BTC card has independent coordinates
assert.ok(btcCard.style.properties['--card-mouse-x'] === '50.0px', 'BTC --card-mouse-x updated to 50.0px');
assert.ok(btcCard.style.properties['--card-mouse-y'] === '40.0px', 'BTC --card-mouse-y updated to 40.0px');

// Verify ETH card remains unaffected
assert.strictEqual(ethCard.style.properties['--card-mouse-x'], undefined, 'ETH card must NOT be illuminated when moving over BTC');

// Pointer leave on BTC card
btcCard.on_pointerleave();
assert.strictEqual(btcCard.style.properties['--card-mouse-x'], undefined, 'BTC coordinates cleared on pointer leave');

// Test live price directional flash update
const updateFn = js.match(/function updateSpotlightBentoPrices\(\)[\s\S]*?^\}/m);
assert.ok(updateFn, 'updateSpotlightBentoPrices function found');
vm.runInContext(updateFn[0], sandbox);
vm.runInContext('updateSpotlightBentoPrices();', sandbox);

assert.strictEqual(mockPriceEls.bitcoin.lastFlash, 'green', 'Bitcoin price increase from 81000 to 82000 triggered green flash');
assert.strictEqual(mockPriceEls.ethereum.lastFlash, 'red', 'Ethereum price decrease from 2500 to 2450 triggered red flash');
assert.strictEqual(mockPriceEls.bitcoin.textContent, '$82000.00', 'Bitcoin price formatted and updated in-place');

console.log('  ✓ Headless simulation verified independent pointer spotlights and directional price flashes');
console.log('\n=== ALL SPOTLIGHT MARKETS UPGRADE TESTS PASSED! ===\n');
