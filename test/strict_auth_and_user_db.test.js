const assert = require('assert');

const API_BASE = process.env.TEST_API_URL || ('http://localhost:' + (process.env.TEST_PORT || process.env.PORT || 3005) + '/api');

async function runStrictAuthTests() {
  console.log('\n=== RUNNING STRICT DATABASE AUTHENTICATION & AUTHORIZATION TESTS ===\n');

  // Test 1: Reject unregistered email on backend
  console.log('1. Testing Unregistered User Login Rejection...');
  const unregRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ghost_unregistered_9999@domain.com', password: 'secretpassword123' })
  });
  const unregData = await unregRes.json();
  assert.strictEqual(unregRes.status, 404, 'Status should be 404 Not Found');
  assert.strictEqual(unregData.error, 'Account is not registered. Please create an account first.');
  console.log('  ✓ Unregistered email strictly rejected with 404 & prompt to create account');

  // Test 2: Reject wrong password for registered user
  console.log('2. Testing Incorrect Password Rejection for Registered User...');
  const wrongPwdRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'WRONG_PASSWORD_123' })
  });
  const wrongPwdData = await wrongPwdRes.json();
  assert.strictEqual(wrongPwdRes.status, 401, 'Status should be 401 Unauthorized');
  assert.strictEqual(wrongPwdData.error, 'Incorrect password. Please try again.');
  console.log('  ✓ Incorrect password strictly rejected with 401 & prompt to try again');

  // Test 3: Succeeded login for registered user with case-insensitive email
  console.log('3. Testing Successful Login for Registered User (Case-Insensitive)...');
  const validRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'TeSt@ExAmPlE.cOm ', password: 'password123' })
  });
  const validData = await validRes.json();
  assert.strictEqual(validRes.status, 200, 'Status should be 200 OK');
  assert.ok(validData.token, 'Token must be present');
  assert.strictEqual(validData.username, 'testtrader');
  assert.strictEqual(validData.email, 'test@example.com');
  console.log('  ✓ Registered database user logged in successfully with valid session token');

  // Test 4: Register duplicate email rejection
  console.log('4. Testing Duplicate Email Registration Rejection...');
  const dupRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'anothername', email: 'test@example.com', password: 'password123' })
  });
  const dupData = await dupRes.json();
  assert.strictEqual(dupRes.status, 400, 'Status should be 400 Bad Request');
  assert.strictEqual(dupData.error, 'Account already exists! Please Sign In.');
  console.log('  ✓ Duplicate registration rejected with "Account already exists! Please Sign In."');

  // Test 5: Register brand new account
  console.log('5. Testing New User Registration & Immediate Login...');
  const uniqueId = Date.now();
  const uniqueUsername = `FreshTrader_${uniqueId}`;
  const uniqueEmail = `trader_${uniqueId}@vtrade.org`;
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: uniqueUsername, email: uniqueEmail, password: 'securePass123' })
  });
  const regData = await regRes.json();
  assert.strictEqual(regRes.status, 200, 'Status should be 200 OK');
  assert.ok(regData.token, 'New account should receive valid token');
  assert.strictEqual(regData.username, uniqueUsername);
  assert.strictEqual(regData.email, uniqueEmail.toLowerCase());
  console.log('  ✓ Brand new account registered in database with $10,000 starting balance');

  // Test 6: Sign in with the newly registered account
  console.log('6. Testing Subsequent Login of New Account...');
  const newLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: uniqueEmail, password: 'securePass123' })
  });
  const newLoginData = await newLoginRes.json();
  assert.strictEqual(newLoginRes.status, 200, 'Status should be 200 OK');
  assert.strictEqual(newLoginData.username, uniqueUsername);
  console.log('  ✓ Newly registered user can subsequently sign in reliably');

  console.log('\n=== ALL 6 STRICT DATABASE AUTH & AUTHORIZATION TESTS PASSED! ===\n');
}

runStrictAuthTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
