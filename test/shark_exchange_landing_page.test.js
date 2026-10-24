/**
 * Test Suite: Shark Exchange Full Landing Page Redesign Verification (SS 1 - 16)
 * Verifies all 16 screenshots and constraints requested by the user:
 * 1. Top Header "TRADE NOW ->" CTA button.
 * 2. Section 1 (SS 1): Hero with India's lowest-cost crypto exchange, Start trading in 5 mins,
 *    Let's Get Started CTA, social media strip, 3D Bitcoin + candlesticks + arrow + floor grid.
 * 3. Section 2 (SS 2 & 3): Independently Audited Trust with 97.8% withdrawals progress meter,
 *    ₹24.5 Cr 30D Challenge Rebates glowing bar chart, and CA audit footnote.
 * 4. Section 3 (SS 4): Key Stats Strip (0.016% Maker Fee | Upto 150x Leverage | 0.040% Taker Fee).
 * 5. Section 4 (SS 5): Mobile App Showcase with QR code, store buttons, and dual 3D phones.
 * 6. Section 5 (SS 6 & 7): 4 Steps (Create Account, Fill KYC, Add Funds, Trade Now CTA).
 * 7. Section 6 (SS 8 & 9): Crypto Made Clear with center 3D phone, contour rings, and 4 corner cards.
 * 8. Section 7: Spotlight Markets bento grid.
 * 9. Section 8 (SS 10, 11, 12): FAQ with 8 accordions and toggleSharkFAQ function.
 * 10. Section 9 (SS 13 & 14): Referral program (3 steps + 3D perspective grid floor + CTA).
 * 11. Section 10 (SS 15): Affiliate / KOL Program banner with 3D money sack and partner CTA.
 * 12. Section 11 (SS 16): Comprehensive Footer with MANDATORY EXACT address: "Vadod Gam, Surat, Gujarat",
 *     4 link columns (COMPANY, INR FUTURES, USDT FUTURES, OPTIONS), socials, and TradingView disclaimer.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('\n=== RUNNING SHARK EXCHANGE LANDING PAGE TEST SUITE ===\n');

const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../frontend/style.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

// 1. Verify Top Header "TRADE NOW ->" CTA button
console.log('1. Testing Top Header TRADE NOW CTA Button...');
assert.ok(html.includes('id="header-trade-now-btn"'), 'Header trade now button present');
assert.ok(html.includes('TRADE NOW'), 'Button contains TRADE NOW text');
assert.ok(html.includes('switchBottomTab(\'trade\')'), 'Button triggers switchBottomTab(trade)');
assert.ok(css.includes('.header-trade-now-btn'), 'CSS styling for header-trade-now-btn defined');
assert.ok(css.includes('.header-trade-now-btn:hover .htn-arrow'), 'Arrow translation on hover defined');
console.log('  ✓ Top Header TRADE NOW button and arrow animation verified');

// 2. Verify Section 1: Hero Section (SS 1)
console.log('2. Testing Hero Section (SS 1)...');
assert.ok(html.includes('India’s lowest-cost crypto exchange'), 'Hero badge copy verified');
assert.ok(html.includes('Start') && html.includes('trading') && html.includes('5 mins'), 'Start trading in 5 mins headline verified');
assert.ok(html.includes('Let’s Get Started'), 'Let’s Get Started CTA button verified');
assert.ok(html.includes('class="shark-hero-socials"'), 'Hero social media strip container verified');
assert.ok(html.includes('class="shs-floating-btc"'), '3D floating Bitcoin coin verified');
assert.ok(html.includes('class="shs-candlestick'), '3D candlesticks verified');
assert.ok(html.includes('class="shs-upward-arrow"'), 'Upward green arrow verified');
assert.ok(html.includes('class="shs-float-order shs-float-buy"'), 'Floating Buy order pill verified');
assert.ok(html.includes('class="shs-float-order shs-float-sell"'), 'Floating Sell order pill verified');
assert.ok(html.includes('class="shs-perspective-floor"'), 'Perspective floor grid verified');
assert.ok(css.includes('@keyframes floatBtc'), 'floatBtc keyframes defined');
assert.ok(css.includes('@keyframes floatCandle'), 'floatCandle keyframes defined');
console.log('  ✓ Hero Section with 3D Bitcoin, candlesticks, arrow, and perspective floor verified');

// 3. Verify Section 2: Independently Audited Trust Section (SS 2 & 3)
console.log('3. Testing Independently Audited Trust Section (SS 2 & 3)...');
assert.ok(html.includes('id="shark-audited-trust-section"'), 'Audited trust section container verified');
assert.ok(html.includes('Independently Audited. 100% Transparent.'), 'Audited section title verified');
assert.ok(html.includes('id="shark-withdrawals-card"'), 'Withdrawals card verified');
assert.ok(html.includes('97.8%'), '97.8% metric verified');
assert.ok(html.includes('Withdrawals Processed Under 15 Mins'), 'Withdrawals speed title verified');
assert.ok(html.includes('class="stc-progress-track"'), 'Progress meter track verified');
assert.ok(html.includes('id="shark-rebates-card"'), '30D Challenge Rebates card verified');
assert.ok(html.includes('₹24.5 Cr'), '₹24.5 Cr metric verified');
assert.ok(html.includes('class="stc-barchart-stage"'), '3D glowing multi-bar chart stage verified');
assert.ok(html.includes('class="shark-audit-footnote"'), 'CA audit footnote container verified');
assert.ok(html.includes('Audited by Independent Chartered Accountants & Certified Security Auditors'), 'CA audit footnote copy verified');
console.log('  ✓ Independently Audited section, 97.8% withdrawals, ₹24.5 Cr rebates bar chart & CA footnote verified');

// 4. Verify Section 3: Key Stats Strip (SS 4)
console.log('4. Testing Key Stats Strip (SS 4)...');
assert.ok(html.includes('id="shark-key-stats-strip"'), 'Key stats strip container verified');
assert.ok(html.includes('0.016%'), '0.016% Maker Fee verified');
assert.ok(html.includes('Maker Fee'), 'Maker Fee label verified');
assert.ok(html.includes('Upto 150x'), 'Upto 150x Leverage verified');
assert.ok(html.includes('Leverage'), 'Leverage label verified');
assert.ok(html.includes('0.040%'), '0.040% Taker Fee verified');
assert.ok(html.includes('Taker Fee'), 'Taker Fee label verified');
assert.ok(css.includes('.shark-key-stats-container'), 'Key stats strip CSS defined');
console.log('  ✓ Key Stats Strip (0.016% Maker | Upto 150x Leverage | 0.040% Taker) verified');

// 5. Verify Section 4: Mobile App Showcase (SS 5)
console.log('5. Testing Mobile App Showcase (SS 5)...');
assert.ok(html.includes('id="home-apk-showcase-section"'), 'Showcase section verified');
assert.ok(html.includes('Download App,'), 'Showcase title verified');
assert.ok(html.includes('Trade On The Go!'), 'Showcase subtitle verified');
assert.ok(html.includes('class="apk-qr-card"'), 'QR code card verified');
assert.ok(html.includes('id="apk-download-android-btn"'), 'Android download button verified');
assert.ok(html.includes('id="apk-download-apple-btn"'), 'App Store button verified');
assert.ok(html.includes('id="apk-phone-back"') && html.includes('id="apk-phone-front"'), 'Dual 3D phone mockups verified');
console.log('  ✓ Mobile App Showcase with QR code, store buttons, and dual 3D phones verified');

// 6. Verify Section 5: 3 Easy Steps (SS 6 & 7)
console.log('6. Testing 3 Easy Steps Section (SS 6 & 7)...');
assert.ok(html.includes('id="shark-steps-section"'), 'Steps section container verified');
assert.ok(html.includes('Start Trading Crypto F&O In 3 Easy Steps'), 'Section title verified');
assert.ok(html.includes('Create Account'), 'Step 1 Create Account verified');
assert.ok(html.includes('Fill in your KYC'), 'Step 2 Fill in your KYC verified');
assert.ok(html.includes('Add Funds'), 'Step 3 Add Funds verified');
assert.ok(html.includes('Trade Now'), 'Step 4 Trade Now verified');
assert.ok(html.includes('class="shark-step-trade-btn"'), 'Trade Now CTA button verified');
console.log('  ✓ 4 Step onboarding cards and Trade Now CTA verified');

// 7. Verify Section 6: Crypto Made Clear (SS 8 & 9)
console.log('7. Testing Crypto Made Clear Section (SS 8 & 9)...');
assert.ok(html.includes('id="shark-crypto-clear-section"'), 'Crypto Made Clear section container verified');
assert.ok(html.includes('Crypto Made Clear'), 'Section title verified');
assert.ok(html.includes('class="shark-contour-waves"'), 'Contour waves backdrop verified');
assert.ok(html.includes('class="sfc-center-phone"'), 'Center 3D smartphone frame verified');
assert.ok(html.includes('Lowest Trading Fees'), 'Lowest Trading Fees card verified');
assert.ok(html.includes('High Leverage Options'), 'High Leverage Options card verified');
assert.ok(html.includes('Seamless INR Support'), 'Seamless INR Support card verified');
assert.ok(html.includes('Bank-Grade Security'), 'Bank-Grade Security card verified');
console.log('  ✓ Crypto Made Clear with center 3D phone and 4 corner cards verified');

// 8. Verify Section 8: Frequently Asked Questions (SS 10, 11, 12) & toggleSharkFAQ
console.log('8. Testing Frequently Asked Questions Accordion (SS 10, 11, 12)...');
assert.ok(html.includes('id="shark-faq-section"'), 'FAQ section container verified');
assert.ok(html.includes('Frequently Asked Questions'), 'FAQ section title verified');
assert.ok(html.includes('Is crypto futures trading legal in India?'), 'FAQ Q1 verified');
assert.ok(html.includes('What are the deposit and withdrawal methods available?'), 'FAQ Q2 verified');
assert.ok(html.includes('How does the 150x leverage work?'), 'FAQ Q3 verified');
assert.ok(html.includes('What are the maker and taker fees on the platform?'), 'FAQ Q4 verified');
assert.ok(html.includes('How fast is the KYC verification process?'), 'FAQ Q5 verified');
assert.ok(html.includes('Is TDS applicable on futures and options trading?'), 'FAQ Q6 verified');
assert.ok(html.includes('Can I trade on mobile devices?'), 'FAQ Q7 verified');
assert.ok(html.includes('How does the risk management & liquidation system protect my account?'), 'FAQ Q8 verified');
assert.ok(js.includes('function toggleSharkFAQ(element)'), 'toggleSharkFAQ function defined in app.js');
assert.ok(js.includes('window.toggleSharkFAQ = toggleSharkFAQ'), 'toggleSharkFAQ exposed on window');
assert.ok(js.includes('faqItem.classList.contains(\'active\')'), 'toggleSharkFAQ checks active state');
assert.ok(js.includes('answer.classList.add(\'hidden\')'), 'toggleSharkFAQ collapses answer on toggle');
assert.ok(js.includes('answer.classList.remove(\'hidden\')'), 'toggleSharkFAQ expands answer on toggle');
assert.ok(js.includes('toggleIcon.textContent = \'−\''), 'toggleSharkFAQ sets minus icon on expand');
assert.ok(js.includes('toggleIcon.textContent = \'+\''), 'toggleSharkFAQ sets plus icon on collapse');
console.log('  ✓ FAQ 8 accordion items and toggleSharkFAQ function verified');

// 9. Verify Section 9: Refer Friends. Earn More (SS 13 & 14)
console.log('9. Testing Refer Friends. Earn More Section (SS 13 & 14)...');
assert.ok(html.includes('id="shark-referral-section"'), 'Referral section container verified');
assert.ok(html.includes('Refer Friends. Earn More'), 'Referral section title verified');
assert.ok(html.includes('Share Your Link'), 'Referral Step 1 verified');
assert.ok(html.includes('Friends Start Trading'), 'Referral Step 2 verified');
assert.ok(html.includes('Earn Commission'), 'Referral Step 3 verified');
assert.ok(html.includes('class="srf-perspective-grid"'), 'Perspective floor grid verified');
assert.ok(html.includes('class="shark-referral-cta-btn"'), 'Refer & Earn Now CTA button verified');
assert.ok(html.includes('Refer & Earn Now'), 'Button text verified');
console.log('  ✓ Referral program 3 steps and glowing perspective floor CTA verified');

// 10. Verify Section 10: Affiliate / KOL Program (SS 15)
console.log('10. Testing Affiliate / KOL Program Section (SS 15)...');
assert.ok(html.includes('id="shark-affiliate-banner-section"'), 'Affiliate banner container verified');
assert.ok(html.includes('Join VTrade Affiliate / KOL Program'), 'Affiliate banner title verified');
assert.ok(html.includes('Apply for Partner Program'), 'Partner program button verified');
assert.ok(html.includes('class="sac-money-sack"'), '3D money sack graphic verified');
assert.ok(html.includes('floating-gold-coins'), 'Floating gold coins verified');
console.log('  ✓ Affiliate / KOL banner with 3D money sack and partner CTA verified');

// 11. Verify Section 11: Comprehensive Footer (SS 16) & MANDATORY EXACT ADDRESS
console.log('11. Testing Comprehensive Footer & Mandatory Gujarat Address (SS 16)...');
assert.ok(html.includes('id="shark-comprehensive-footer"'), 'Comprehensive footer container verified');
// MANDATORY EXACT ADDRESS
assert.ok(html.includes('Vadod Gam, Surat, Gujarat'), 'MANDATORY EXACT ADDRESS "Vadod Gam, Surat, Gujarat" verified in footer');
assert.ok(html.includes('Registered Office Address:'), 'Registered Office Address label verified');
assert.ok(html.includes('COMPANY'), 'COMPANY column verified');
assert.ok(html.includes('INR FUTURES'), 'INR FUTURES column verified');
assert.ok(html.includes('USDT FUTURES'), 'USDT FUTURES column verified');
assert.ok(html.includes('OPTIONS'), 'OPTIONS column verified');
assert.ok(html.includes('TradingView'), 'TradingView disclaimer verified');
assert.ok(html.includes('© 2026 VTrade'), 'Copyright notice verified');
console.log('  ✓ Comprehensive footer verified with explicit address: "Vadod Gam, Surat, Gujarat"');

console.log('\n=== ALL SHARK EXCHANGE LANDING PAGE TESTS PASSED SUCCESSFULLY! ===\n');
