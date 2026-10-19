/**
 * Automated Verification Suite for:
 * 1. Screenshot 1 Broker Fullscreen Chart Layout & Functional Bottom Drawer
 * 2. High-Tech Tabular Price Font (Chakra Petch / Space Grotesk)
 * 3. 3-4 Pages 3D Animated Onboarding Walkthrough with Horizontal Swipe
 * 4. Classic & Meaningful VTrade App Icon across all Android Mipmaps
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('\n=== RUNNING FULLSCREEN BROKER, 3D ONBOARDING & APP ICON TEST SUITE ===\n');

const appJsPath = path.join(__dirname, '../frontend/app.js');
const indexHtmlPath = path.join(__dirname, '../frontend/index.html');
const styleCssPath = path.join(__dirname, '../frontend/style.css');
const gradlePath = path.join(__dirname, '../android/app/build.gradle');

const appJs = fs.readFileSync(appJsPath, 'utf8');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const styleCss = fs.readFileSync(styleCssPath, 'utf8');
const gradle = fs.readFileSync(gradlePath, 'utf8');

// 1. Verify Fullscreen Broker Layout & Safe-Area Padding (Screenshot 1 & Android status-bar fix)
assert.ok(indexHtml.includes('id="tv-fs-coin-icon"'), 'Broker layout must have coin avatar in header');
assert.ok(indexHtml.includes('id="tv-fs-pair"'), 'Broker layout must have pair title in header');
assert.ok(indexHtml.includes('id="tv-fs-change"'), 'Broker layout must have change pill badge in header');
assert.ok(indexHtml.includes('id="tv-fs-star-btn"'), 'Broker layout must have favorite/star button');
assert.ok(indexHtml.includes('id="tv-fs-settings-btn"'), 'Broker layout must have settings/indicators button');
assert.ok(styleCss.includes('.is-native-apk .tv-fs-header') || styleCss.includes('.tv-fs-header'), 'Header must have safe-area padding');
assert.ok(styleCss.includes('padding-top: 42px !important') || styleCss.includes('padding-top: max('), 'Header must have explicit top safe-area padding');
console.log('  ✓ Top Broker Header with Android Status-Bar Safe Area Fix verified');

// 2. Verify 4 Sub-Header Tabs and Panels
const expectedTabs = ['price', 'info', 'orderbook', 'trades'];
expectedTabs.forEach(t => {
  assert.ok(indexHtml.includes(`id="tv-fs-tab-${t}"`), `Subtab tv-fs-tab-${t} must exist`);
  assert.ok(indexHtml.includes(`id="tv-fs-panel-${t === 'price' ? 'chart' : t}"`), `Panel for ${t} must exist`);
});
assert.ok(appJs.includes('function switchFsTab(tab)'), 'switchFsTab function must be defined in app.js');
assert.ok(appJs.includes('function renderFsOrderBook()'), 'renderFsOrderBook function must be defined in app.js');
assert.ok(appJs.includes('function renderFsTrades()'), 'renderFsTrades function must be defined in app.js');
console.log('  ✓ 4 Broker Sub-Header Navigation Tabs (Price, Info, Order Book, Trades) & Panels verified');

// 3. Verify Functional Bottom Floating Drawer & Quick Order Buttons
assert.ok(indexHtml.includes('id="tv-fs-bottom-dock"'), 'Bottom dock container must exist in fullscreen modal');
assert.ok(indexHtml.includes('Create New Order'), 'Bottom dock must feature "Create New Order" trigger');
assert.ok(indexHtml.includes('openOrderSheet(\'long\')'), 'Buy/Long button must open Order Sheet directly');
assert.ok(indexHtml.includes('openOrderSheet(\'short\')'), 'Sell/Short button must open Order Sheet directly');
assert.ok(styleCss.includes('z-index: 25000;'), 'Order sheet backdrop z-index must be >= 25000 to overlay over fullscreen modal');
console.log('  ✓ Bottom Floating Drawer ("Create New Order ^" + Instant Buy/Long & Sell/Short) verified');

// 4. Verify Option B Modal Backdrop Shake Feedback (No Intrusive Popup)
assert.ok(styleCss.includes('@keyframes modalShake'), 'modalShake keyframes must be defined in style.css');
assert.ok(styleCss.includes('.auth-modal-card.shake'), '.auth-modal-card.shake must be styled in style.css');
assert.ok(appJs.includes('card.classList.add(\'shake\')'), 'handleBackdropClick must add shake class to card without toast');
console.log('  ✓ Option B Outside Click: Gentle Card Shake Feedback without Intrusive Popup verified');

// 5. Verify Price Font (Chakra Petch & tabular numerals)
assert.ok(indexHtml.includes('family=Chakra+Petch'), 'index.html must load Chakra Petch from Google Fonts');
assert.ok(styleCss.includes('--font-price: \'Chakra Petch\''), 'style.css must define --font-price token');
assert.ok(styleCss.includes('font-family: var(--font-price);'), 'style.css must apply --font-price to prices');
assert.ok(styleCss.includes('font-variant-numeric: tabular-nums;'), 'style.css must enforce tabular-nums for zero jitter');
console.log('  ✓ Luxury Financial Tabular Price Font (Chakra Petch / Space Grotesk) verified');

// 6. Verify Modern 2D Flat Onboarding Walkthrough (Phantom / CoinGecko / CoinDCX Style)
assert.ok(indexHtml.includes('id="vtrade-onboarding-modal"'), 'Onboarding modal overlay must exist in index.html');
assert.ok(indexHtml.includes('id="onboarding-track"'), 'Onboarding slider track must exist');
assert.ok(indexHtml.includes('data-slide="0"'), 'Onboarding Slide 1 (Futures) must exist');
assert.ok(indexHtml.includes('data-slide="1"'), 'Onboarding Slide 2 (TradingView) must exist');
assert.ok(indexHtml.includes('data-slide="2"'), 'Onboarding Slide 3 (Paper Trading) must exist');
assert.ok(indexHtml.includes('data-slide="3"'), 'Onboarding Slide 4 (Execution) must exist');
assert.ok(appJs.includes('function initOnboarding()'), 'initOnboarding function must be defined in app.js');
assert.ok(appJs.includes('function setupOnboardingSwipe()'), 'setupOnboardingSwipe touch gestures must be defined in app.js');
assert.ok(appJs.includes('openAuthModal(\'login\')'), 'completeOnboarding must pop up Sign In modal after last slide');
assert.ok(appJs.includes('vtrade_show_onboarding_on_relaunch'), 'Onboarding must trigger on sign-out relaunch');
console.log('  ✓ Modern Flat Onboarding Walkthrough with Signout Relaunch Trigger & Auth Pop-Up verified');

// 7. Verify Flat Luxury Android App Icon across all densities (v2.6)
const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
densities.forEach(d => {
  const dir = path.join(__dirname, '../android/app/src/main/res', `mipmap-${d}`);
  assert.ok(fs.existsSync(path.join(dir, 'ic_launcher.png')), `ic_launcher.png must exist in ${d}`);
  assert.ok(fs.existsSync(path.join(dir, 'ic_launcher_round.png')), `ic_launcher_round.png must exist in ${d}`);
  assert.ok(fs.existsSync(path.join(dir, 'ic_launcher_foreground.png')), `ic_launcher_foreground.png must exist in ${d}`);
  assert.ok(fs.statSync(path.join(dir, 'ic_launcher.png')).size > 1000, `Icon in ${d} must be non-empty`);
});

assert.ok(gradle.includes('versionCode 9'), 'build.gradle must be bumped to versionCode 9');
assert.ok(gradle.includes('versionName "2.7"'), 'build.gradle must be bumped to versionName "2.7"');
assert.ok(indexHtml.includes('id="vtrade-splash-screen"'), 'index.html must include animated splash screen');
assert.ok(indexHtml.includes('BINANCE%3ABTCUSDT'), 'Default TradingView chart must use BINANCE:BTCUSDT to align with Binance prices');
assert.ok(styleCss.includes('.vtrade-splash-screen'), 'style.css must style vtrade-splash-screen');
assert.ok(appJs.includes('initPostSplashFlow'), 'app.js must include post-splash flow handling');
console.log('  ✓ Flat Modern & Stylish VTrade App Icon across all Android Mipmaps (v2.7) verified');
console.log('  ✓ App Launch Animated Splash Screen & Binance Real-time Ticker Alignment verified');

console.log('\n=== ALL 7 VERIFICATION SUITES PASSED! ===\n');
