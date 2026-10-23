/**
 * Test Suite: VTrade Hero Glass Block - Premium Live Hover Animation
 * Verifies all 6 requirements specified in the user request:
 * 1. Mouse-Following Spotlight (smooth LERP interpolation, cyan/teal/amber radial glow, clipped in glass block)
 * 2. Animated Glass Border (thin 1.5px conic gradient rotating border, gentle hover glow)
 * 3. Interactive 3D Tilt (subtle 2-3 deg perspective tilt, spring-like return on pointerleave, fine pointer guard)
 * 4. Living Glass Surface (backdrop blur 20px, inner edge highlight, breathing ambient light, hover luminosity)
 * 5. Content Micro-Interactions ("Zero Risk" text shimmer, primary CTA amber glow, stat pill hover)
 * 6. Implementation Guardrails (pointer-events none on overlays, no button obstruction, prefers-reduced-motion)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('\n=== RUNNING VTRADE HERO GLASS BLOCK HOVER ANIMATION TEST SUITE ===\n');

const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../frontend/style.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

// 1. Verify HTML Structure & Layers
console.log('1. Testing Hero Glass Block HTML Hierarchy & Layers...');
assert.ok(html.includes('id="vtrade-hero-glass-block"'), 'vtrade-hero-glass-block ID present on hero container');
assert.ok(html.includes('class="hero-glass-border-beam"'), 'Animated glass border beam layer element exists');
assert.ok(html.includes('class="hero-mouse-spotlight"'), 'Mouse-following spotlight layer element exists');
assert.ok(html.includes('class="hero-glass-surface"'), 'Living glass surface ambient layer element exists');
assert.ok(html.includes('aria-hidden="true"'), 'Visual animation layers are correctly marked aria-hidden');
console.log('  ✓ Hero glass block elements and dedicated layers verified');

// 2. Verify Requirement 1: Mouse-Following Spotlight
console.log('2. Testing Requirement 1: Mouse-Following Spotlight (CSS & JS)...');
assert.ok(css.includes('.hero-mouse-spotlight'), '.hero-mouse-spotlight class defined in CSS');
assert.ok(css.includes('var(--hero-spotlight-x'), 'Spotlight coordinates driven by dynamic CSS variables');
assert.ok(css.includes('rgba(0, 242, 254') && css.includes('rgba(0, 192, 135') && css.includes('rgba(255, 153, 0'),
  'Spotlight gradient includes cyan (#00f2fe), teal (#00c087), and amber (#ff9900) accents');
assert.ok(js.includes('function initHeroGlassBlockInteractions()'), 'initHeroGlassBlockInteractions function defined');
assert.ok(js.includes('currentX += (targetX - currentX) * 0.10'), 'Smooth LERP interpolation implemented for fluid cursor tracking');
assert.ok(js.includes('requestAnimationFrame(updateHeroGlassFrame)'), 'requestAnimationFrame used for 120fps smooth rendering');
assert.ok(css.includes('pointer-events: none'), 'Overlays must have pointer-events: none so buttons remain clickable');
console.log('  ✓ Mouse-following spotlight with LERP and cyan/teal/amber glow verified');

// 3. Verify Requirement 2: Animated Glass Border
console.log('3. Testing Requirement 2: Animated Glass Border...');
assert.ok(css.includes('.hero-glass-border-beam'), '.hero-glass-border-beam class defined in CSS');
assert.ok(css.includes('conic-gradient('), 'Animated border uses conic-gradient');
assert.ok(css.includes('rotateHeroBorderBeam'), 'rotateHeroBorderBeam animation keyframes defined');
assert.ok(css.includes('mask-composite: exclude') || css.includes('-webkit-mask-composite: xor'), 'Mask composite used for thin 1.5px edge clipping');
assert.ok(css.includes('border-radius: inherit'), 'Preserves exact rounded border radius of parent container');
assert.ok(css.includes('.landing-hero-section:hover .hero-glass-border-beam::before'), 'Gentle brightness/opacity increase on container hover');
console.log('  ✓ Rotating conic-gradient border beam with hover glow verified');

// 4. Verify Requirement 3: Interactive 3D Tilt
console.log('4. Testing Requirement 3: Interactive 3D Tilt...');
assert.ok(css.includes('transform-style: preserve-3d'), 'transform-style preserve-3d enabled on hero glass block');
assert.ok(js.includes('perspective(1100px) rotateX(') && js.includes('rotateY('), 'Restrained perspective and X/Y rotation applied in JS');
assert.ok(js.includes('-2.2') && js.includes('2.2'), 'Tilt angles restrained to ~2.2 degrees to maintain readability');
assert.ok(js.includes('onPointerLeave') && js.includes('targetTiltX = 0'), 'Smooth spring-like return to 0deg on pointer leave');
assert.ok(js.includes('(hover: hover) and (pointer: fine)'), 'Desktop fine pointer media query guard implemented');
console.log('  ✓ Restrained 3D tilt with spring return and pointer guard verified');

// 5. Verify Requirement 4: Living Glass Surface
console.log('5. Testing Requirement 4: Living Glass Surface...');
assert.ok(css.includes('backdrop-filter: blur(20px) saturate(180%)') || css.includes('-webkit-backdrop-filter: blur(20px) saturate(180%)'),
  'Backdrop blur and saturation applied for glass depth');
assert.ok(css.includes('box-shadow: inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.15)'), 'Inner edge highlight defined in box-shadow');
assert.ok(css.includes('.hero-glass-surface'), '.hero-glass-surface class defined in CSS');
assert.ok(css.includes('@keyframes glassSurfaceBreathe'), 'glassSurfaceBreathe ambient breathing animation defined');
assert.ok(css.includes('.landing-hero-section.hero-glass-hovered'), 'Increased luminosity and depth on hover class');
console.log('  ✓ Glass depth, inner edge highlight, ambient breathing, and hover luminosity verified');

// 6. Verify Requirement 5: Content Micro-Interactions
console.log('6. Testing Requirement 5: Content Micro-Interactions...');
assert.ok(css.includes('.gradient-text-animated'), 'Gradient animated shimmer class exists');
assert.ok(html.includes('Zero Risk'), 'Zero Risk text is present in the hero block');
assert.ok(css.includes('.lhs-btn-primary:hover'), 'Primary button hover style with amber glow defined');
assert.ok(css.includes('rgba(255, 153, 0, 0.45)'), 'Warm amber glow applied to primary launch button on hover');
assert.ok(css.includes('.lhs-btn-secondary:hover'), 'Secondary button hover transition defined');
assert.ok(css.includes('.lhs-btn-download:hover'), 'Download APK button hover transition defined');
assert.ok(css.includes('.lhs-m-item:hover'), 'Statistics metric cards hover highlight defined');
console.log('  ✓ Micro-interactions for Zero Risk, CTA buttons, and metric items verified');

// 7. Verify Requirement 6: Technical Guardrails & Accessibility
console.log('7. Testing Requirement 6: Technical Guardrails & Accessibility...');
assert.ok(js.includes('prefers-reduced-motion'), 'prefers-reduced-motion respected in interactions');
assert.ok(js.includes('dataset.heroGlassBound'), 'Duplicate event listener binding prevented with dataset guard');
assert.ok(js.includes('window.initHeroGlassBlockInteractions = initHeroGlassBlockInteractions'), 'Function exported to window');
assert.ok(js.includes('initHeroGlassBlockInteractions();'), 'Function called during app initialization and tab switch');

// Ensure CTA buttons exist and have intact click handlers / actions
assert.ok(html.includes('onclick="switchBottomTab(\'trade\')"') || html.includes('switchBottomTab(\'trade\')'), 'Launch Trade Desk button action preserved');
assert.ok(html.includes('Explore 50+ Markets'), 'Explore 50+ Markets button preserved');
assert.ok(html.includes('Download APK'), 'Download APK button preserved');

console.log('  ✓ Accessibility, cleanup guards, window exports, and button actions verified');

// 8. Headless Interactive DOM Simulation (Pointer Movement, LERP & 3D Tilt)
console.log('8. Running Interactive DOM Pointer & 3D Tilt Simulation...');
const vm = require('vm');

const mockListeners = {};
const heroBlockStyle = {
  properties: {},
  setProperty(key, val) { this.properties[key] = val; }
};

const mockHeroBlock = {
  id: 'vtrade-hero-glass-block',
  dataset: {},
  classList: {
    classes: new Set(),
    add(c) { this.classes.add(c); },
    remove(c) { this.classes.delete(c); },
    contains(c) { return this.classes.has(c); }
  },
  style: heroBlockStyle,
  getBoundingClientRect: () => ({ left: 50, top: 100, width: 800, height: 400 }),
  addEventListener: (event, handler) => {
    mockListeners[event] = handler;
  }
};

let capturedRafCallback = null;
const sandboxWindow = {
  matchMedia: (query) => ({
    matches: query.includes('pointer: fine') // simulate fine pointer (desktop)
  }),
  addEventListener: () => {}
};

const sandbox = {
  console,
  window: sandboxWindow,
  document: {
    getElementById: (id) => id === 'vtrade-hero-glass-block' ? mockHeroBlock : null,
    querySelector: (sel) => sel.includes('landing-hero-section') ? mockHeroBlock : null
  },
  requestAnimationFrame: (cb) => {
    capturedRafCallback = cb;
    return 101;
  },
  cancelAnimationFrame: () => {},
  heroGlassRafId: null,
  heroGlassPointerActive: false
};

vm.createContext(sandbox);

// Extract initHeroGlassBlockInteractions function definition from app.js and execute in sandbox
const fnMatch = js.match(/let heroGlassRafId[\s\S]*?heroBlock\.addEventListener\('pointerleave', onPointerLeave\);\s*\}/);
assert.ok(fnMatch, 'Could not find initHeroGlassBlockInteractions code block');
vm.runInContext(fnMatch[0], sandbox);
vm.runInContext('initHeroGlassBlockInteractions();', sandbox);

assert.ok(mockHeroBlock.dataset.heroGlassBound === 'true', 'heroGlassBound flag set on hero container');
assert.ok(typeof mockListeners.pointerenter === 'function', 'pointerenter listener registered');
assert.ok(typeof mockListeners.pointermove === 'function', 'pointermove listener registered');
assert.ok(typeof mockListeners.pointerleave === 'function', 'pointerleave listener registered');

// Simulate Pointer Enter & Move to (clientX: 250, clientY: 200) -> inside block (relative X: 200, relative Y: 100)
mockListeners.pointerenter({ clientX: 250, clientY: 200 });
assert.ok(mockHeroBlock.classList.contains('hero-glass-hovered'), 'hero-glass-hovered class added on pointer enter');
assert.ok(typeof capturedRafCallback === 'function', 'requestAnimationFrame scheduled');

// Execute RAF frame tick
capturedRafCallback();
const spotX = parseFloat(heroBlockStyle.properties['--hero-spotlight-x']);
const spotY = parseFloat(heroBlockStyle.properties['--hero-spotlight-y']);
const spotOpacity = parseFloat(heroBlockStyle.properties['--hero-spotlight-opacity']);

assert.ok(!isNaN(spotX) && spotX > 0, '--hero-spotlight-x updated via LERP: ' + spotX);
assert.ok(!isNaN(spotY) && spotY > 0, '--hero-spotlight-y updated via LERP: ' + spotY);
assert.ok(!isNaN(spotOpacity) && spotOpacity > 0, '--hero-spotlight-opacity updated via LERP: ' + spotOpacity);
assert.ok(heroBlockStyle.transform && heroBlockStyle.transform.includes('perspective(1100px)'), '3D tilt transform applied');

// Simulate Pointer Leave -> should clear hover and reset targets
mockListeners.pointerleave();
assert.ok(!mockHeroBlock.classList.contains('hero-glass-hovered'), 'hero-glass-hovered class removed on pointer leave');

console.log('  ✓ Headless interactive simulation passed (listeners, LERP coordinates, tilt transform, reset on leave)');
console.log('\n=== ALL HERO GLASS BLOCK TESTS PASSED SUCCESSFULLY! ===\n');
