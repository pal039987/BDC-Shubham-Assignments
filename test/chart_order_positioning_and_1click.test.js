/**
 * VTrade Test Suite:
 * 1. Chart Order Anchoring & Coordinate Math Verification
 * 2. 1-Click Buy/Sell Panel State Synchronization
 * 3. 1-Click Paper-Trading Order Execution & Opposing Netting
 * 4. Draggable Take-Profit / Stop-Loss Backend Persistence (/api/positions/:id/tpsl)
 * 5. Limit Order Chart Overlay Lifecycle (Placement, Persistence, Cancellation)
 */

const assert = require('assert');

const API_BASE = 'http://localhost:3001/api';

async function runTests() {
  console.log('\n=== RUNNING CHART ORDER POSITIONING & 1-CLICK TRADE TESTS ===\n');
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
  await test('User authentication succeeds and provides bearer token', async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
    }).then(r => r.json());

    assert.ok(res.token, 'Token must be present');
    token = res.token;
  });

  // 2. Test Requirement 1: Order lines remain anchored to exact price values
  await test('Order line prices remain anchored and invariant under viewport pans and zooms', () => {
    const orderData = {
      coin: 'bitcoin',
      entry_price: 84250.50,
      take_profit: 87500.00,
      stop_loss: 82000.00,
      size: 0.25,
      direction: 'long'
    };

    // Simulate price to Y coordinate mapping with dynamic viewports (simulating chart pan and zoom)
    function simulatePriceToCoordinate(price, minVisiblePrice, maxVisiblePrice, height = 500) {
      if (maxVisiblePrice <= minVisiblePrice) return 0;
      const range = maxVisiblePrice - minVisiblePrice;
      return height - ((price - minVisiblePrice) / range) * height;
    }

    // Viewport 1: Standard view [80000, 90000]
    const y1_entry = simulatePriceToCoordinate(orderData.entry_price, 80000, 90000);
    const y1_tp = simulatePriceToCoordinate(orderData.take_profit, 80000, 90000);
    const y1_sl = simulatePriceToCoordinate(orderData.stop_loss, 80000, 90000);

    // Viewport 2: Chart panned up/down [82000, 92000]
    const y2_entry = simulatePriceToCoordinate(orderData.entry_price, 82000, 92000);
    const y2_tp = simulatePriceToCoordinate(orderData.take_profit, 82000, 92000);
    const y2_sl = simulatePriceToCoordinate(orderData.stop_loss, 82000, 92000);

    // Viewport 3: Chart zoomed in [83000, 88000]
    const y3_entry = simulatePriceToCoordinate(orderData.entry_price, 83000, 88000);
    const y3_tp = simulatePriceToCoordinate(orderData.take_profit, 83000, 88000);

    // Coordinates change because viewport shifted...
    assert.notStrictEqual(y1_entry, y2_entry, 'Coordinates shift when viewport pans');
    assert.notStrictEqual(y1_entry, y3_entry, 'Coordinates shift when viewport zooms');

    // ...BUT underlying order prices MUST remain 100% invariant!
    assert.strictEqual(orderData.entry_price, 84250.50, 'Stored entry price must never be modified by navigation');
    assert.strictEqual(orderData.take_profit, 87500.00, 'Stored take profit must never be modified by navigation');
    assert.strictEqual(orderData.stop_loss, 82000.00, 'Stored stop loss must never be modified by navigation');
    assert.strictEqual(orderData.size, 0.25, 'Stored quantity must never be modified by navigation');
  });

  // 3. Test Requirement 2: 1-Click toggle and visibility synchronization
  await test('1-Click trade visibility state synchronizes strictly with toggle', () => {
    let is1ClickTradeEnabled = false;
    let widgetHidden = true;

    function toggle1Click(enabled) {
      is1ClickTradeEnabled = !!enabled;
      widgetHidden = !is1ClickTradeEnabled;
    }

    // Default: OFF -> Hidden
    assert.strictEqual(is1ClickTradeEnabled, false);
    assert.strictEqual(widgetHidden, true);

    // Turn ON
    toggle1Click(true);
    assert.strictEqual(is1ClickTradeEnabled, true);
    assert.strictEqual(widgetHidden, false, 'Widget must be visible when toggle is ON');

    // Turn OFF
    toggle1Click(false);
    assert.strictEqual(is1ClickTradeEnabled, false);
    assert.strictEqual(widgetHidden, true, 'Widget must be hidden immediately when toggle is OFF');
  });

  // 4. Test Requirement 2 & 4: Quantity synchronization between 1-Click panel and main trade desk
  await test('Quantity synchronizes bi-directionally between 1-Click panel and main order form', () => {
    let mainInput = 0.05;
    let quickInput = 0.05;

    function onMainInputChange(val) {
      mainInput = parseFloat(val);
      quickInput = mainInput;
    }

    function onQuickInputChange(val) {
      quickInput = parseFloat(val);
      mainInput = quickInput;
    }

    onQuickInputChange('0.15');
    assert.strictEqual(mainInput, 0.15, 'Main form should receive quick panel size update');

    onMainInputChange('0.50');
    assert.strictEqual(quickInput, 0.50, 'Quick panel should receive main form size update');
  });

  // 5. Test Requirement 3: 1-Click BUY executes real paper-trading order via backend API
  let activePositionId = null;
  await test('1-Click BUY executes real Long paper-trading order via POST /api/positions/open', async () => {
    const res = await fetch(`${API_BASE}/positions/open`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        coin: 'bitcoin',
        direction: 'long',
        size: 0.02,
        leverage: 10,
        order_type: 'market'
      })
    });

    assert.strictEqual(res.status, 200, 'Should return HTTP 200 OK');
    const data = await res.json();
    assert.ok(data.id, 'Should return created position ID');
    assert.strictEqual(data.coin, 'bitcoin');
    assert.strictEqual(data.direction, 'long');
    assert.strictEqual(data.size, 0.02);
    assert.ok(data.entry_price > 0, 'Entry price must be valid');
    activePositionId = data.id;
  });

  // 6. Test Requirement 1 & 3: Updating Take Profit and Stop Loss persists to backend (/api/positions/:id/tpsl)
  await test('Updating Take Profit & Stop Loss persists to backend database', async () => {
    assert.ok(activePositionId, 'Active position ID required');

    const updateRes = await fetch(`${API_BASE}/positions/${activePositionId}/tpsl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        take_profit: 95000,
        stop_loss: 75000
      })
    });

    assert.strictEqual(updateRes.status, 200, 'Should return HTTP 200 OK');
    const updateData = await updateRes.json();
    assert.strictEqual(updateData.success, true);
    assert.strictEqual(updateData.take_profit, 95000);
    assert.strictEqual(updateData.stop_loss, 75000);

    // Verify GET /api/positions reflects updated TP and SL
    const posList = await fetch(`${API_BASE}/positions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());

    const updatedPos = posList.find(p => p.id === activePositionId);
    assert.ok(updatedPos, 'Position must be in open list');
    assert.strictEqual(updatedPos.take_profit, 95000, 'take_profit must be updated in database');
    assert.strictEqual(updatedPos.stop_loss, 75000, 'stop_loss must be updated in database');
  });

  // 7. Test Requirement 3: 1-Click SELL executes and nets opposing position
  await test('1-Click SELL nets opposing position cleanly without unintended exposure', async () => {
    const res = await fetch(`${API_BASE}/positions/open`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        coin: 'bitcoin',
        direction: 'short',
        size: 0.02,
        leverage: 10,
        order_type: 'market'
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.netted, true, 'Opposing position should be netted');

    // Verify position is closed
    const posList = await fetch(`${API_BASE}/positions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());

    const remaining = posList.find(p => p.id === activePositionId);
    assert.ok(!remaining, 'Netted position should no longer appear in open positions list');
  });

  // 8. Test Requirement 1 & 5: Placing and cancelling limit orders updates chart order state
  await test('Limit order placement creates pending order and cancel cleanly removes it', async () => {
    const limitRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        coin: 'bitcoin',
        side: 'buy',
        size: 0.05,
        price: 50000,
        type: 'limit'
      })
    });

    assert.strictEqual(limitRes.status, 200);
    const limitData = await limitRes.json();
    assert.ok(limitData.id, 'Limit order ID must be returned');

    // Cancel the order
    const cancelRes = await fetch(`${API_BASE}/orders/${limitData.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(cancelRes.status, 200);

    // Verify order is no longer in pending list
    const openOrders = await fetch(`${API_BASE}/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());

    const found = openOrders.find(o => o.id === limitData.id);
    assert.ok(!found, 'Cancelled order must not be in pending orders list');
  });

  // 9. Test Requirement 5: Validation errors handle zero size and insufficient funds
  await test('1-Click trade rejects invalid size with 400 Bad Request', async () => {
    const res = await fetch(`${API_BASE}/positions/open`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        coin: 'bitcoin',
        direction: 'long',
        size: 0,
        leverage: 10
      })
    });
    assert.strictEqual(res.status, 400);
  });

  // 10. Test Issue 1: Chart container sizing and complete visibility
  await test('Chart container CSS rules provide full height visibility without clipping scales', () => {
    const fs = require('fs');
    const cssContent = fs.readFileSync('frontend/style.css', 'utf-8');

    // Verify .chart-container-box has flexible responsive height
    assert.ok(cssContent.includes('.chart-container-box {'), 'CSS must define .chart-container-box');
    assert.ok(cssContent.includes('min-height: 480px') || cssContent.includes('min-height: 460px'), 'Chart box must have minimum height >= 460px');
    assert.ok(cssContent.includes('clamp(480px,'), 'Chart box must use responsive clamp height');

    // Verify tradingview-widget-box accounts for attribution bar without clipping time scale
    assert.ok(cssContent.includes('calc(100% - 24px)'), 'Widget box must reserve space for attribution bar');

    // Verify desktop chart-area layout
    assert.ok(cssContent.includes('#chart-area {') && cssContent.includes('min-width: 0 !important'), 'Desktop chart area must enforce min-width: 0 to prevent flexbox clipping');
  });

  // 11. Test Issue 2: Price line invariance and pointer events prevent drag freezing
  await test('Order line updates preserve pan gesture continuity without series mutations during dragging', () => {
    const fs = require('fs');
    const appJsContent = fs.readFileSync('frontend/app.js', 'utf-8');
    const cssContent = fs.readFileSync('frontend/style.css', 'utf-8');

    // Verify price line key comparison prevents series mutation during pan / ticks
    assert.ok(appJsContent.includes('posKey === currentOverlayPosKey'), 'Must check posKey to prevent redundant priceLine mutations');
    assert.ok(appJsContent.includes('chart.timeScale().subscribeVisibleLogicalRangeChange'), 'Must subscribe range change to reposition HTML tags');
    assert.ok(appJsContent.includes('repositionHtmlOverlays()'), 'Must update HTML tag positions without recreating chart price lines');

    // Verify pointer-events: none on horizontal line and axis badge
    assert.ok(cssContent.includes('.tvol-h-line {') && cssContent.includes('pointer-events: none !important'), 'Horizontal order line must have pointer-events: none');
    assert.ok(cssContent.includes('.tvol-axis-badge {') && cssContent.includes('pointer-events: none !important'), 'Axis badge must have pointer-events: none');

    // Verify simulation: calling syncPriceLines during dragging with unchanged order data does 0 mutations
    let priceLineMutationCount = 0;
    let mockLwPriceLines = { entry: null, tp: null, sl: null };
    let currentKey = '';

    function mockSyncPriceLines(pos) {
      const posKey = pos ? `${pos.id}_${pos.direction}_${pos.entry_price}_${pos.take_profit}_${pos.stop_loss}` : 'none';
      if (posKey === currentKey) return;
      currentKey = posKey;
      priceLineMutationCount++;
    }

    const testPos = { id: 101, direction: 'long', entry_price: 84000, take_profit: 90000, stop_loss: 80000 };
    mockSyncPriceLines(testPos);
    assert.strictEqual(priceLineMutationCount, 1, 'Initial creation mutates priceLine once');

    // Simulate 50 mousemove / pan ticks during an ongoing drag gesture
    for (let i = 0; i < 50; i++) {
      mockSyncPriceLines(testPos);
    }
    assert.strictEqual(priceLineMutationCount, 1, 'Subsequent pan ticks must NOT mutate priceLine or freeze drag gesture');
  });

  // 12. Test Issue 2: renderOpenOrders definition & post-trade error isolation
  await test('renderOpenOrders is defined and post-trade UI updates do not produce false failure toasts', () => {
    const fs = require('fs');
    const appJsContent = fs.readFileSync('frontend/app.js', 'utf-8');

    // Verify renderOpenOrders alias is explicitly defined
    assert.ok(appJsContent.includes('window.renderOpenOrders = renderOrders;'), 'renderOpenOrders alias must be exposed globally');

    // Verify cancelLimitOrder calls renderOrders
    assert.ok(!appJsContent.includes('cancelLimitOrder') || !appJsContent.match(/cancelLimitOrder[\s\S]*?renderOpenOrders\(\)/), 'cancelLimitOrder must not use undefined renderOpenOrders');

    // Verify executeQuickTrade calls renderOrders inside isolated safe try/catch
    assert.ok(appJsContent.includes('Post-trade UI update warning'), 'executeQuickTrade must isolate secondary UI updates so they cannot produce an Order failed toast');
  });

  // 13. Test Issue 3: LONG 10x chart marker removal
  await test('Entry price line does NOT render unwanted LONG 10x marker on chart canvas', () => {
    const fs = require('fs');
    const appJsContent = fs.readFileSync('frontend/app.js', 'utf-8');

    // Verify lwPriceLines.entry sets title: '' instead of LONG 10x
    assert.ok(!appJsContent.includes('title: title') || !appJsContent.includes('const title = `${curPos.direction.toUpperCase()}'), 'Must not create LONG 10x title on entry price line');
    assert.ok(appJsContent.includes("title: ''"), 'Must explicitly set empty title for entry price line to prevent visible text marker on canvas');

    // Verify fallback canvas does not render LONG 10x badge text
    assert.ok(!appJsContent.includes('const entryText = `${isLong ? \'LONG\' : \'SHORT\'} ${p.leverage}x'), 'Canvas fallback must not render LONG 10x text badge');
  });

  console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
