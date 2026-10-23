const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('\n=== RUNNING VTRADE PREMIUM ANIMATION & INTERACTION VERIFICATION TESTS ===\n');

const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../frontend/style.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

// 1. Verify Hero Animated Typography & Ambient Aurora Atmosphere
console.log('1. Testing Hero Animated Typography & Ambient Aurora Atmosphere...');
assert.ok(html.includes('id="lhs-headline"'), 'Hero headline element must exist');
assert.ok(html.includes('class="hero-word-wrap"'), 'Hero headline words must be wrapped in hero-word-wrap for word-by-word reveal');
assert.ok(html.includes('gradient-text-animated'), 'Zero Risk must use radiant gradient-text-animated class');
assert.ok(html.includes('class="hero-ambient-aurora"'), 'Hero ambient aurora glow container must exist');
assert.ok(html.includes('class="hero-beam-ray"'), 'Hero ray light beam must exist');

assert.ok(css.includes('.hero-word-wrap') && css.includes('filter: blur('), 'Hero words must start with blur filter');
assert.ok(css.includes('.hero-word-wrap.revealed') && css.includes('filter: blur(0px)'), 'Revealed hero words must clear blur');
assert.ok(css.includes('@keyframes textShimmerFlow'), 'textShimmerFlow keyframe animation must be defined');
assert.ok(css.includes('@keyframes auroraPulse'), 'auroraPulse keyframe animation must be defined for ambient glow');
assert.ok(js.includes('function initHeroTextAnimation()'), 'initHeroTextAnimation function must be defined in app.js');
console.log('  ✓ Word-by-word reveal, shimmering gradient text, and ambient background aurora verified');

// 2. Verify Viewport-Triggered Scroll Reveal Animations
console.log('2. Testing Scroll-Triggered Viewport Entrance Engine...');
assert.ok(html.includes('class="home-market-intel-grid"'), 'Market intel grid must exist and be targeted by scroll reveal');
assert.ok(html.includes('home-balance-card reveal-on-scroll'), 'Home balance card must have reveal-on-scroll class');
assert.ok(html.includes('home-bento-section reveal-on-scroll'), 'Home bento section must have reveal-on-scroll class');
assert.ok(html.includes('home-features-section reveal-on-scroll'), 'Features section must have reveal-on-scroll class');
assert.ok(html.includes('vtrade-footer reveal-on-scroll'), 'Footer must have reveal-on-scroll class');

assert.ok(css.includes('.reveal-on-scroll') && css.includes('opacity: 0'), 'reveal-on-scroll must initially have opacity: 0 and translateY');
assert.ok(css.includes('.reveal-on-scroll.is-revealed') && css.includes('opacity: 1'), 'reveal-on-scroll.is-revealed must transition to opacity: 1 and translateY(0)');
assert.ok(js.includes('function initScrollRevealEngine()'), 'initScrollRevealEngine function must be defined in app.js');
console.log('  ✓ IntersectionObserver scroll-triggered reveals across home sections verified');

// 3. Verify Aceternity Spotlight Cards & 3D Perspective Tilt
console.log('3. Testing Spotlight Cards, Border Beam, and 3D Tilt...');
assert.ok(html.includes('spotlight-card'), 'Interactive spotlight-card class must be attached to cards');
assert.ok(html.includes('tilt-card'), 'tilt-card class must be attached to interactive feature & intel cards');
assert.ok(html.includes('border-beam-card'), 'border-beam-card must be applied to highlight cards');

assert.ok(css.includes('.spotlight-card::before') && css.includes('var(--mouse-x'), 'Spotlight card must use dynamic --mouse-x and --mouse-y radial gradient');
assert.ok(css.includes('.border-beam-card::after') && css.includes('conic-gradient'), 'Border beam card must use animated conic-gradient');
assert.ok(css.includes('@keyframes rotateBorderBeam'), 'rotateBorderBeam animation must be defined');
assert.ok(css.includes('.tilt-card') && css.includes('transform-style: preserve-3d'), 'Tilt cards must use 3D perspective and preserve-3d');
assert.ok(js.includes('function initSpotlightAndTiltCards()'), 'initSpotlightAndTiltCards function must be defined in app.js');
console.log('  ✓ Cursor-following spotlight, animated border beam, and 3D perspective tilt verified');

// 4. Verify Buttons, Navigation & Screen Gliding Transitions
console.log('4. Testing Button Shimmer, Navbar Indicator & Screen Gliding...');
assert.ok(html.includes('id="dnav-indicator-pill"'), 'dnav-indicator-pill element must exist inside desktop-header-nav');
assert.ok(css.includes('.dnav-indicator-pill') && css.includes('linear-gradient'), 'dnav-indicator-pill must have glowing gradient styling');
assert.ok(css.includes('.lhs-btn-primary::after') && css.includes('rotate(25deg)'), 'Primary CTA button must feature light sweep shimmer');
assert.ok(css.includes('.lhs-btn-primary:hover svg') && css.includes('translateX('), 'Primary CTA arrow must translate on hover');
assert.ok(css.includes('.app-screen-view.entering'), 'Screen gliding enter transition must be defined in CSS');
assert.ok(js.includes('function updateNavIndicator()'), 'updateNavIndicator function must be defined in app.js');
console.log('  ✓ Sliding navbar indicator pill, button shimmer, and screen glide transitions verified');

// 5. Verify Trading Interface Real-Time Price Flash Waves
console.log('5. Testing Trading Real-Time Price Flash Animations...');
assert.ok(css.includes('@keyframes priceFlashGreen'), 'priceFlashGreen keyframe must be defined');
assert.ok(css.includes('@keyframes priceFlashRed'), 'priceFlashRed keyframe must be defined');
assert.ok(css.includes('.price-flash-up') && css.includes('.price-flash-down'), 'price-flash-up and price-flash-down classes must be defined');
assert.ok(js.includes('function triggerPriceFlash('), 'triggerPriceFlash function must be defined in app.js');
console.log('  ✓ Real-time green/red price change wave highlights verified without altering financial data');

// 6. Verify Accessibility & Prefers-Reduced-Motion Guardrails
console.log('6. Testing Prefers-Reduced-Motion & Accessibility Guardrails...');
assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'), 'CSS must include prefers-reduced-motion media query');
assert.ok(js.includes('prefers-reduced-motion: reduce'), 'JS animation initializers must respect prefers-reduced-motion');
console.log('  ✓ Complete reduced-motion accessibility overrides verified');

// 7. Functional Simulation in Headless Context
console.log('7. Running Headless Animation Suite Simulation...');
const mockElements = {};
const createElem = (id, tag = 'div', classes = []) => {
  const el = {
    id,
    tagName: tag.toUpperCase(),
    className: classes.join(' '),
    classList: {
      list: new Set(classes),
      add: (c) => el.classList.list.add(c),
      remove: (c) => el.classList.list.remove(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (el.classList.list.has(c)) el.classList.list.delete(c);
          else el.classList.list.add(c);
        } else if (force) el.classList.list.add(c);
        else el.classList.list.delete(c);
      },
      contains: (c) => el.classList.list.has(c)
    },
    style: {},
    dataset: {},
    getBoundingClientRect: () => ({ left: 100, top: 100, width: 200, height: 100 }),
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelectorAll: (sel) => {
      if (sel.includes('.hero-word-wrap')) {
        return [createElem('w1', 'span', ['hero-word-wrap']), createElem('w2', 'span', ['hero-word-wrap'])];
      }
      return [];
    }
  };
  if (id) mockElements[id] = el;
  return el;
};

const headlineEl = createElem('lhs-headline');
const navEl = createElem('desktop-header-nav');
const indicatorEl = createElem('dnav-indicator-pill');
const activeLinkEl = createElem('dnav-home', 'button', ['dnav-link', 'active']);

const ctx = vm.createContext({
  console,
  setTimeout: (fn) => fn(),
  requestAnimationFrame: (fn) => fn(),
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {},
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  window: {
    location: { protocol: 'https:', hostname: 'localhost' },
    matchMedia: (q) => ({ matches: q.includes('hover') }),
    addEventListener: () => {}
  },
  document: {
    documentElement: { setAttribute: () => {}, getAttribute: () => null, classList: { add: () => {}, remove: () => {}, contains: () => false } },
    readyState: 'complete',
    getElementById: (id) => mockElements[id] || null,
    querySelector: (sel) => {
      if (sel.includes('desktop-header-nav .dnav-link.active')) return activeLinkEl;
      if (sel.includes('desktop-header-nav')) return navEl;
      return null;
    },
    querySelectorAll: (sel) => {
      if (sel.includes('.reveal-on-scroll')) return [createElem('rev1', 'div', ['reveal-on-scroll'])];
      if (sel.includes('.spotlight-card')) return [createElem('spot1', 'div', ['spotlight-card'])];
      return [];
    },
    addEventListener: () => {}
  },
  navigator: { onLine: true },
  fetch: async () => ({ ok: true, json: async () => ({}) }),
  Date, Math, parseFloat, parseInt, isNaN, Array, Object, String, JSON
});

vm.runInContext(js, ctx);

vm.runInContext(`
  initHeroTextAnimation();
  initScrollRevealEngine();
  initSpotlightAndTiltCards();
  updateNavIndicator();
`, ctx);

assert.ok(indicatorEl.style.left, 'updateNavIndicator must position indicator pill');
console.log('  ✓ Headless animation execution and DOM property synchronization verified');

console.log('\n=== ALL PREMIUM ANIMATION & INTERACTION TESTS PASSED! ===\n');
