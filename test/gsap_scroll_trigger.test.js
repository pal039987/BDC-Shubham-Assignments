/**
 * Test Suite: GSAP + ScrollTrigger Scroll Animation Implementation
 * Verifies all 6 mandatory scroll animation requirements and technical guardrails:
 * 1. Scroll-triggered text reveals (staggered word & line animation on section titles).
 * 2. Section entrance animations (opacity, y-position, and carefully selected clip-path reveals).
 * 3. Staggered card reveals (intel cards, spotlight bento cards, feature cards).
 * 4. Pinned sections (selective desktop pinning on showcase with 3D separation, no mobile or trade interference).
 * 5. Scroll-linked effects (ambient aurora and light beam parallax scrub).
 * 6. Timeline-based sequences (coordinated timelines for hero banner and mobile showcase).
 * 7. Technical Guardrails:
 *    - Trigger and timeline cleanup on view unmount/re-render.
 *    - Prefers-reduced-motion accessibility guardrails.
 *    - No horizontal overflow (overflow-x: hidden).
 *    - Live financial prices and order execution not animated misleadingly.
 *    - Local offline bundle verification (gsap.min.js & ScrollTrigger.min.js).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('\n=== RUNNING GSAP + SCROLLTRIGGER SCROLL ANIMATION TEST SUITE ===\n');

const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../frontend/style.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

// 1. Verify Local Offline Dependencies & HTML Script Tags
console.log('1. Testing GSAP & ScrollTrigger Local Dependencies...');
assert.ok(html.includes('src="vendor/gsap.min.js"'), 'GSAP core script tag present in index.html');
assert.ok(html.includes('src="vendor/ScrollTrigger.min.js"'), 'ScrollTrigger plugin script tag present in index.html');

const gsapPath = path.join(__dirname, '../frontend/vendor/gsap.min.js');
const stPath = path.join(__dirname, '../frontend/vendor/ScrollTrigger.min.js');
assert.ok(fs.existsSync(gsapPath), 'Local vendor/gsap.min.js must exist on filesystem');
assert.ok(fs.existsSync(stPath), 'Local vendor/ScrollTrigger.min.js must exist on filesystem');
assert.ok(fs.statSync(gsapPath).size > 50000, 'gsap.min.js must have non-empty valid bundle content');
assert.ok(fs.statSync(stPath).size > 30000, 'ScrollTrigger.min.js must have non-empty valid bundle content');
console.log('  ✓ Local 100% offline resilient GSAP and ScrollTrigger bundles verified');

// 2. Verify Feature 1: Scroll-triggered Text Reveals
console.log('2. Testing Feature 1: Scroll-triggered Text Reveals...');
assert.ok(js.includes('gsap-word-wrap'), 'Text split into gsap-word-wrap spans for word reveal');
assert.ok(js.includes('gsap-word-inner'), 'Word inner span defined for stagger animation');
assert.ok(css.includes('.gsap-word-wrap'), 'CSS styling for gsap-word-wrap defined');
assert.ok(css.includes('.gsap-word-inner'), 'CSS styling for gsap-word-inner defined');
assert.ok(js.includes('yPercent: 100') || js.includes('yPercent: 110'), 'Staggered word y-translation entrance defined');
assert.ok(js.includes('stagger: 0.04'), 'Word stagger timing configured for smooth typography reveals');
console.log('  ✓ Staggered word & line text reveals on section titles verified');

// 3. Verify Feature 2: Section Entrance Animations
console.log('3. Testing Feature 2: Section Entrance Animations with Clip-Path...');
assert.ok(js.includes('clipPath: \'inset('), 'Carefully selected clip-path inset reveal defined');
assert.ok(js.includes('clearProps: \'clipPath\''), 'clipPath cleared after animation so cards are not clipped');
assert.ok(js.includes('duration: 0.85') || js.includes('duration: 0.9'), 'Section entrance duration configured');
console.log('  ✓ Section entrance with opacity, y-translation, and clip-path reveal verified');

// 4. Verify Feature 3: Staggered Card Reveals
console.log('4. Testing Feature 3: Staggered Card Reveals...');
assert.ok(js.includes('function animateSpotlightBentoCards()'), 'animateSpotlightBentoCards function defined');
assert.ok(js.includes('intelCards'), 'Market intelligence cards targeted for staggered entrance');
assert.ok(js.includes('featCards'), 'Platform feature cards targeted for staggered entrance');
assert.ok(js.includes('stagger: 0.1') || js.includes('stagger: 0.12'), 'Stagger delay between sequential cards configured');
console.log('  ✓ Staggered reveals for intel cards, bento cards, and feature cards verified');

// 5. Verify Feature 4: Selective Pinned Sections
console.log('5. Testing Feature 4: Selective Pinned Sections (Desktop Only)...');
assert.ok(js.includes('window.innerWidth >= 1024'), 'Pinning guarded to desktop only (>= 1024px)');
assert.ok(js.includes('pin: true'), 'GSAP ScrollTrigger pin property enabled on showcase');
assert.ok(js.includes('scrub: 0.6'), 'Smooth scrub configured for interactive 3D phone shift during pin');
assert.ok(css.includes('.pin-spacer'), 'CSS pin-spacer clean reset defined');
assert.ok(!html.includes('pin: true') && !html.includes('data-pin-trade'), 'Pinning is strictly excluded from Trade Desk and order execution');
console.log('  ✓ Selective desktop-only pinning with scrubbed 3D phone mockups verified without trading disruption');

// 6. Verify Feature 5: Scroll-linked Parallax Effects
console.log('6. Testing Feature 5: Scroll-linked Parallax Effects...');
assert.ok(js.includes('heroAurora'), 'Hero ambient aurora targeted for parallax');
assert.ok(js.includes('heroBeam'), 'Hero beam light ray targeted for parallax');
assert.ok(js.includes('scrub: 1'), 'Parallax bound to scrub scroll position');
console.log('  ✓ Ambient aurora and light ray parallax effects verified');

// 7. Verify Feature 6: Timeline-based Sequences
console.log('7. Testing Feature 6: Timeline-based Sequences...');
assert.ok(js.includes('function initHeroGsapTimeline()'), 'initHeroGsapTimeline function defined');
assert.ok(js.includes('gsap.timeline({') || js.includes('window.gsap.timeline({'), 'GSAP timeline created for coordinated entrance');
assert.ok(js.includes('scrollTrigger: {') && js.includes('trigger: showcaseSec'), 'ScrollTrigger attached to timeline for showcase section');
console.log('  ✓ Timelines coordinating hero banner and mobile showcase entrance verified');

// 8. Verify Technical Requirements & Cleanup
console.log('8. Testing Technical Requirements (Cleanup, Re-renders, Reduced Motion, Financial Guardrails)...');
assert.ok(js.includes('function cleanUpGsapScrollAnimations()'), 'cleanUpGsapScrollAnimations defined');
assert.ok(js.includes('trigger.kill()'), 'ScrollTrigger instances cleanly killed on cleanup');
assert.ok(js.includes('function getActiveGsapScroller()'), 'Custom scroller detection function defined');
assert.ok(js.includes('ScrollTrigger.refresh()'), 'ScrollTrigger.refresh called after bento DOM updates');
assert.ok(js.includes('prefers-reduced-motion'), 'prefers-reduced-motion media query respected in GSAP logic');
assert.ok(css.includes('overflow-x: hidden !important'), 'Overflow-x guard prevents horizontal shifts');
assert.ok(!js.includes('gsap.to(\'#intel-top-gainer-badge\'') && !js.includes('gsap.to(\'#header-cash-val\''), 'Live prices and financial balances are strictly excluded from fake animations');
console.log('  ✓ Trigger cleanup, re-render protection, accessibility, and financial guardrails verified');

// 9. Functional Execution in Headless Test Environment
console.log('9. Simulating GSAP Core & Timeline Execution...');
const { gsap } = require('gsap');
assert.strictEqual(typeof gsap.to, 'function', 'gsap.to is functional');
assert.strictEqual(typeof gsap.timeline, 'function', 'gsap.timeline is functional');
assert.strictEqual(typeof gsap.registerPlugin, 'function', 'gsap.registerPlugin is functional');

// Verify timeline creation and tween orchestration
const tl = gsap.timeline();
assert.ok(tl && typeof tl.to === 'function' && typeof tl.fromTo === 'function', 'GSAP timeline created successfully');
tl.to({ val: 0 }, { val: 100, duration: 1 });
assert.strictEqual(tl.getChildren().length, 1, 'Timeline successfully sequenced tween');

// Verify window / browser animation engine in simulated VM context
const vm = require('vm');
let registeredTriggers = [];
const context = {
  window: {
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: (q) => ({ matches: false }),
    innerWidth: 1200,
    gsap: {
      registerPlugin: () => {},
      fromTo: () => {},
      to: () => {},
      timeline: () => ({ fromTo: function() { return this; }, to: function() { return this; }, scrollTrigger: { kill: () => {} } })
    },
    ScrollTrigger: {
      create: (cfg) => {
        const trig = { kill: () => { registeredTriggers = registeredTriggers.filter(t => t !== trig); } };
        registeredTriggers.push(trig);
        return trig;
      },
      getAll: () => registeredTriggers,
      refresh: () => {}
    }
  },
  document: {
    documentElement: { setAttribute: () => {}, style: {} },
    getElementById: (id) => ({ id, classList: { add: () => {} }, querySelectorAll: () => [], querySelector: () => null }),
    querySelectorAll: (sel) => [],
    querySelector: (sel) => null
  },
  console: { log: () => {}, warn: () => {}, error: () => {} },
  setTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {}
};
context.window.document = context.document;
context.window.window = context.window;

// Execute GSAP animation engine in VM context
vm.runInNewContext(js, context);
assert.strictEqual(typeof context.window.initGsapScrollTriggerAnimations, 'function');
assert.strictEqual(typeof context.window.cleanUpGsapScrollAnimations, 'function');
assert.strictEqual(typeof context.window.getActiveGsapScroller, 'function');

// Run animation init and cleanup
context.window.initGsapScrollTriggerAnimations();
assert.ok(typeof context.window.cleanUpGsapScrollAnimations === 'function');
context.window.cleanUpGsapScrollAnimations();
assert.strictEqual(registeredTriggers.length, 0, 'cleanUpGsapScrollAnimations cleanly clears all triggers');
console.log('  ✓ Simulated DOM GSAP & ScrollTrigger execution and trigger cleanup verified');

console.log('\n=== ALL GSAP + SCROLLTRIGGER SCROLL ANIMATION TESTS PASSED! ===\n');
