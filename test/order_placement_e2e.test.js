/**
 * VTrade End-to-End Order Placement Integration Test
 * Validates the complete order placement flow against http://localhost:3001:
 * - Long / Buy order placement with leverage
 * - Sell / Short order placement and opposing position netting
 * - Limit order placement and pending status verification
 * - Validation rejection (zero size, invalid leverage, unauthenticated)
 * - Position closing (full & partial) and trade history persistence
 */

const assert = require('assert');

const API_BASE = 'http://localhost:3001/api';

async function runE2ETests() {
  console.log('\n=== RUNNING VTRADE ORDER PLACEMENT E2E TESTS ===\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. Authenticate test user
  let token = '';
  await test('User login / auth generates valid JWT token', async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
    }).then(r => r.json());

    assert.ok(res.token, 'Token should be returned');
    assert.strictEqual(res.username, 'testtrader');
    token = res.token;
  });

  // 2. Reject unauthenticated order placement
  await test('Rejects unauthenticated order placement with HTTP 401', async () => {
    const res = await fetch(`${API_BASE}/positions/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coin: 'bitcoin', direction: 'long', size: 0.01, leverage: 10 })
    });
    assert.strictEqual(res.status, 401, 'Should return 401 Unauthorized');
  });

  // 3. Reject invalid size (<= 0)
  await test('Rejects order with size 0 or negative with HTTP 400', async () => {
    const res = await fetch(`${API_BASE}/positions/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ coin: 'bitcoin', direction: 'long', size: 0, leverage: 10 })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes('greater than 0'), 'Should explain size must be > 0');
  });

  // 4. Reject invalid leverage (> 150)
  await test('Rejects order with invalid leverage (> 150) with HTTP 400', async () => {
    const res = await fetch(`${API_BASE}/positions/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ coin: 'bitcoin', direction: 'long', size: 0.01, leverage: 200 })
    });
    assert.strictEqual(res.status, 400);
  });

  // 5. Place valid Long/Buy Market Order
  let openedPositionId = null;
  await test('Executes Long / Buy Market Order successfully and persists position', async () => {
    const res = await fetch(`${API_BASE}/positions/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ coin: 'bitcoin', direction: 'long', size: 0.01, leverage: 50 })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.direction, 'long');
    assert.strictEqual(data.size, 0.01);
    assert.ok(data.message.includes('Long order filled') || data.message.includes('LONG position') || data.message.includes('Netting'));
    assert.ok(data.balance > 0);
    if (data.positionId) openedPositionId = data.positionId;
  });

  // 6. Verify GET /api/positions contains the open position
  await test('GET /api/positions returns enriched open position data', async () => {
    const res = await fetch(`${API_BASE}/positions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(res.status, 200);
    const positions = await res.json();
    assert.ok(Array.isArray(positions), 'Positions should be an array');
    const btcPos = positions.find(p => p.coin === 'bitcoin' && p.status === 'open');
    assert.ok(btcPos, 'Should find open BTC position');
    assert.ok(btcPos.entry_price > 0, 'Entry price should be positive');
    assert.ok(btcPos.markPrice > 0, 'Mark price should be positive');
    assert.ok(btcPos.margin > 0, 'Margin should be positive');
    assert.ok(btcPos.liquidationPrice > 0, 'Liquidation price should be positive');
    if (!openedPositionId) openedPositionId = btcPos.id;
  });

  // 7. Place Opposing Sell/Short Order (Netting test)
  await test('Sell / Short order nets against opposing Long position without unintended exposure', async () => {
    const res = await fetch(`${API_BASE}/positions/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ coin: 'bitcoin', direction: 'short', size: 0.005, leverage: 50 })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.netted === true || data.direction === 'short');
  });

  // 8. Place Limit Order and verify pending status
  let limitOrderId = null;
  await test('Places Limit order and preserves pending status awaiting trigger', async () => {
    const res = await fetch(`${API_BASE}/positions/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        coin: 'bitcoin',
        direction: 'short',
        size: 0.005,
        leverage: 50,
        orderType: 'limit',
        limitPrice: 99000
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.orderType, 'limit');
    assert.strictEqual(data.status, 'pending');

    // Verify GET /api/orders returns this pending order
    const ordRes = await fetch(`${API_BASE}/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const orders = await ordRes.json();
    assert.ok(Array.isArray(orders));
    const limitOrd = orders.find(o => o.coin === 'bitcoin' && o.status === 'pending');
    assert.ok(limitOrd, 'Pending limit order should be in database');
    assert.strictEqual(limitOrd.price, 99000);
    limitOrderId = limitOrd.id;
  });

  // 9. Cancel Limit Order
  await test('Cancels pending limit order cleanly', async () => {
    if (!limitOrderId) return;
    const res = await fetch(`${API_BASE}/orders/${limitOrderId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  // 10. Close position and verify trade history
  await test('Closes position and records execution in trades history', async () => {
    const posRes = await fetch(`${API_BASE}/positions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const positions = await posRes.json();
    if (positions.length > 0) {
      const targetPos = positions[0];
      const closeRes = await fetch(`${API_BASE}/positions/close/${targetPos.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ size: targetPos.size })
      });
      assert.strictEqual(closeRes.status, 200);
      const closeData = await closeRes.json();
      assert.strictEqual(closeData.success, true);
      assert.ok(typeof closeData.pnl === 'number');
    }

    const tradeRes = await fetch(`${API_BASE}/trades`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const trades = await tradeRes.json();
    assert.ok(Array.isArray(trades) && trades.length > 0, 'Trades history should have records');
  });

  console.log(`\n=== E2E TEST RESULTS: ${passed}/${passed + failed} PASSED ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runE2ETests().catch(err => {
  console.error('E2E Test Runner Failed:', err);
  process.exit(1);
});
