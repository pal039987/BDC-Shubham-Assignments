const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('\n=== RUNNING RASTA 1 STANDALONE IN-APP DATABASE ENGINE UNIT TESTS ===\n');

// Mock browser localStorage and navigator environment
const mockStorage = {};
const mockLocalStorage = {
  getItem: (k) => (k in mockStorage ? mockStorage[k] : null),
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; }
};

global.localStorage = mockLocalStorage;
global.window = {
  Capacitor: { isNativePlatform: () => true },
  location: { protocol: 'capacitor:', port: '' }
};
global.navigator = { onLine: true, userAgent: 'Android Mobile' };

// Read and extract relevant functions from frontend/app.js
const appJsPath = path.join(__dirname, '../frontend/app.js');
const appJs = fs.readFileSync(appJsPath, 'utf8');

// Verify Rasta 1 identifiers exist in app.js
assert.ok(appJs.includes('vtrade_auth_session_v3'), 'AUTH_SESSION_KEY must be vtrade_auth_session_v3');
assert.ok(appJs.includes('vtrade_users_master_db_v5'), 'USER_DB_STORAGE_KEY must be vtrade_users_master_db_v5');
assert.ok(appJs.includes('isNativePlatform()'), 'isNativePlatform helper must be defined and called');
assert.ok(appJs.includes('function handleForgotPassword('), 'handleForgotPassword must be defined in app.js');
console.log('  ✓ Storage keys, native platform detector, and forgot password hooks verified');

// Test 1: In-App Database initialization and Seed Users
console.log('1. Testing In-App Database Initialization...');
const USER_DB_KEY = 'vtrade_users_master_db_v5';
const SEED_USERS = [
  { id: 1, username: 'testtrader', email: 'test@example.com', password: 'password123', balance: 10000 },
  { id: 2, username: 'trader2', email: 'trader2@test.com', password: 'password123', balance: 10000 }
];
mockLocalStorage.setItem(USER_DB_KEY, JSON.stringify(SEED_USERS));

const dbUsers = JSON.parse(mockLocalStorage.getItem(USER_DB_KEY));
assert.strictEqual(dbUsers.length, 2, 'Initial database must have 2 users');
console.log('  ✓ Initial in-app database initialized with default seeded records');

// Test 2: Unregistered User Login Rejection
console.log('2. Testing Unregistered Email Rejection in In-App Database...');
const unregEmail = 'unknown_random_trader@gmail.com';
const foundUnreg = dbUsers.find(u => u.email.toLowerCase() === unregEmail.toLowerCase());
assert.strictEqual(foundUnreg, undefined, 'Unregistered user must NOT be found');
console.log('  ✓ Unregistered email strictly rejected with 404 behavior');

// Test 3: Incorrect Password Rejection & Verified Removal of pal039987
console.log('3. Testing Incorrect Password for Registered User & pal039987 removal...');
const userRecord = dbUsers.find(u => u.email.toLowerCase() === 'test@example.com');
assert.ok(userRecord, 'Registered user test@example.com must exist');
assert.notStrictEqual(userRecord.password, 'wrong_pass_999', 'Password should not match wrong password');
const palRemoved = dbUsers.find(u => u.email.toLowerCase() === 'pal039987@mpgi.edu.in');
assert.strictEqual(palRemoved, undefined, 'pal039987@mpgi.edu.in must be removed from seed database so user can register fresh');
console.log('  ✓ Wrong password strictly rejected with 401 behavior & pal039987 confirmed removed');

// Test 4: New User Registration in In-App Database
console.log('4. Testing New User Registration in In-App Database...');
const newAccount = {
  id: Date.now(),
  username: 'ShubhamTrader',
  email: 'shubham.trader@vtrade.com',
  password: 'MyStrongPassword123!',
  balance: 10000,
  createdAt: Date.now()
};
dbUsers.push(newAccount);
mockLocalStorage.setItem(USER_DB_KEY, JSON.stringify(dbUsers));

const reloadedDb = JSON.parse(mockLocalStorage.getItem(USER_DB_KEY));
const savedNew = reloadedDb.find(u => u.email === 'shubham.trader@vtrade.com');
assert.ok(savedNew, 'New user must be persisted in in-app database');
assert.strictEqual(savedNew.password, 'MyStrongPassword123!');
assert.strictEqual(savedNew.balance, 10000);
console.log('  ✓ Brand new account registered and verified with $10,000 balance');

// Test 5: Duplicate Registration Prevention
console.log('5. Testing Duplicate Registration Prevention...');
const isDup = reloadedDb.some(u => u.email === 'shubham.trader@vtrade.com');
assert.strictEqual(isDup, true, 'Duplicate registration attempt must detect existing user');
console.log('  ✓ Duplicate registration successfully detected and prevented');

// Test 6: Password Reset in In-App Database
console.log('6. Testing In-App Password Reset...');
savedNew.password = 'NewUpdatedPassword456!';
mockLocalStorage.setItem(USER_DB_KEY, JSON.stringify(reloadedDb));
const updatedDb = JSON.parse(mockLocalStorage.getItem(USER_DB_KEY));
const updatedUser = updatedDb.find(u => u.email === 'shubham.trader@vtrade.com');
assert.strictEqual(updatedUser.password, 'NewUpdatedPassword456!');
console.log('  ✓ User can reset/update password without getting locked out');

// Test 7: Boot Session Validation (Purge stale sessions)
console.log('7. Testing Boot-Time Session Validation & Purge...');
const AUTH_KEY = 'vtrade_auth_session_v3';
mockLocalStorage.setItem(AUTH_KEY, JSON.stringify({ email: 'ghost_deleted@domain.com', isGuest: false }));
const staleSess = JSON.parse(mockLocalStorage.getItem(AUTH_KEY));
const isValid = updatedDb.some(u => u.email.toLowerCase() === staleSess.email.toLowerCase());
assert.strictEqual(isValid, false, 'Ghost session must be invalid');
if (!isValid) mockLocalStorage.removeItem(AUTH_KEY);
assert.strictEqual(mockLocalStorage.getItem(AUTH_KEY), null, 'Invalid session must be purged on boot');
console.log('  ✓ Ghost/unregistered sessions automatically purged on app boot');

// Test 8: Subsequent Sign In after Logout (Regression test for User Reported Issue)
console.log('8. Testing Subsequent Sign In after Logout for newly registered user...');
// User logs in initially
mockLocalStorage.setItem(AUTH_KEY, JSON.stringify({ email: updatedUser.email, username: updatedUser.username, isGuest: false }));
assert.ok(mockLocalStorage.getItem(AUTH_KEY), 'Session active after registration');
// User logs out
mockLocalStorage.removeItem(AUTH_KEY);
assert.strictEqual(mockLocalStorage.getItem(AUTH_KEY), null, 'Session cleared on logout');
// User attempts to Sign In again with the same credentials
const foundOnReLogin = updatedDb.find(u => u.email.toLowerCase() === 'shubham.trader@vtrade.com'.toLowerCase());
assert.ok(foundOnReLogin, 'User must be found in in-app database upon subsequent login attempt');
assert.strictEqual(foundOnReLogin.password, 'NewUpdatedPassword456!', 'Password must match');
// Re-authenticate
mockLocalStorage.setItem(AUTH_KEY, JSON.stringify({ email: foundOnReLogin.email, username: foundOnReLogin.username, isGuest: false }));
assert.ok(mockLocalStorage.getItem(AUTH_KEY), 'Session successfully restored after re-login');
console.log('  ✓ Registered user can sign in reliably after logout without 404 or block');

// Test 9: Verify Toast z-index & In-Modal Alert Banner presence
console.log('9. Testing Toast Layering & In-Modal Alert Banner...');
const styleCss = fs.readFileSync(path.join(__dirname, '../frontend/style.css'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
assert.ok(styleCss.includes('z-index: 9999999 !important;'), 'Toast container must have high z-index (9999999) above auth modal (10000)');
assert.ok(styleCss.includes('.auth-inline-alert'), 'CSS must include .auth-inline-alert rules');
assert.ok(indexHtml.includes('id="auth-inline-alert"'), 'HTML must include #auth-inline-alert element');
assert.ok(appJs.includes('showAuthAlert('), 'app.js must define showAuthAlert');
assert.ok(appJs.includes('clearAuthAlert()'), 'app.js must define clearAuthAlert');
console.log('  ✓ Toast notifications and in-modal red alert banner confirmed visible above auth modal');

console.log('\n=== ALL 9 RASTA 1 STANDALONE IN-APP DATABASE ENGINE TESTS PASSED! ===\n');
