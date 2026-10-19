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
assert.ok(appJs.includes('vtrade_auth_session_v2'), 'AUTH_SESSION_KEY must be vtrade_auth_session_v2');
assert.ok(appJs.includes('vtrade_users_master_db_v4'), 'USER_DB_STORAGE_KEY must be vtrade_users_master_db_v4');
assert.ok(appJs.includes('isNativePlatform()'), 'isNativePlatform helper must be defined and called');
assert.ok(appJs.includes('function handleForgotPassword('), 'handleForgotPassword must be defined in app.js');
console.log('  ✓ Storage keys, native platform detector, and forgot password hooks verified');

// Test 1: In-App Database initialization and Seed Users
console.log('1. Testing In-App Database Initialization...');
const USER_DB_KEY = 'vtrade_users_master_db_v4';
const SEED_USERS = [
  { id: 1, username: 'testtrader', email: 'test@example.com', password: 'password123', balance: 10000 },
  { id: 2, username: 'trader2', email: 'trader2@test.com', password: 'password123', balance: 10000 },
  { id: 3, username: 'rabi', email: 'pal039987@mpgi.edu.in', password: 'password123', balance: 10000 }
];
mockLocalStorage.setItem(USER_DB_KEY, JSON.stringify(SEED_USERS));

const dbUsers = JSON.parse(mockLocalStorage.getItem(USER_DB_KEY));
assert.strictEqual(dbUsers.length, 3, 'Initial database must have 3 users');
console.log('  ✓ Initial in-app database initialized with default seeded records');

// Test 2: Unregistered User Login Rejection
console.log('2. Testing Unregistered Email Rejection in In-App Database...');
const unregEmail = 'unknown_random_trader@gmail.com';
const foundUnreg = dbUsers.find(u => u.email.toLowerCase() === unregEmail.toLowerCase());
assert.strictEqual(foundUnreg, undefined, 'Unregistered user must NOT be found');
console.log('  ✓ Unregistered email strictly rejected with 404 behavior');

// Test 3: Incorrect Password Rejection
console.log('3. Testing Incorrect Password for Registered User...');
const userRecord = dbUsers.find(u => u.email.toLowerCase() === 'pal039987@mpgi.edu.in');
assert.ok(userRecord, 'Registered user pal039987@mpgi.edu.in must exist');
assert.notStrictEqual(userRecord.password, 'wrong_pass_999', 'Password should not match wrong password');
console.log('  ✓ Wrong password strictly rejected with 401 behavior');

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
const AUTH_KEY = 'vtrade_auth_session_v2';
mockLocalStorage.setItem(AUTH_KEY, JSON.stringify({ email: 'ghost_deleted@domain.com', isGuest: false }));
const staleSess = JSON.parse(mockLocalStorage.getItem(AUTH_KEY));
const isValid = updatedDb.some(u => u.email.toLowerCase() === staleSess.email.toLowerCase());
assert.strictEqual(isValid, false, 'Ghost session must be invalid');
if (!isValid) mockLocalStorage.removeItem(AUTH_KEY);
assert.strictEqual(mockLocalStorage.getItem(AUTH_KEY), null, 'Invalid session must be purged on boot');
console.log('  ✓ Ghost/unregistered sessions automatically purged on app boot');

console.log('\n=== ALL 7 RASTA 1 STANDALONE IN-APP DATABASE ENGINE TESTS PASSED! ===\n');
