/**
 * VTrade Core Test Suite
 * Validates:
 * 1. Coin & Pair Mapping (BTC/USDT, ETH/USDT, SOL/USDT) and Gold/XAU rejection
 * 2. Truthful CoinGecko Provider Data Parsing & USDT Tether Conversion
 * 3. Data Freshness Status Rules (Live, Delayed, Stale, Rate-Limited)
 * 4. Stale Data Order Protection (> 3m rejects orders)
 * 5. Spot Paper Trading (Buys, Partial Sells, Oversell rejection, Non-negative cash balance)
 * 6. Futures Paper Trading (1-100x Leverage, Margin, Taker Fee, Liquidation math, Partial Close, Opposing Position Netting)
 * 7. Wallet Reset ("RESET" confirmation resets to $10,000, cancels orders, closes positions)
 */

const assert = require('assert');

// ─── 1. Supported Pairs Specification ──────────────────────
const SUPPORTED_COINS = [
  { id: 'bitcoin', symbol: 'BTC', pair: 'BTC/USDT' },
  { id: 'ethereum', symbol: 'ETH', pair: 'ETH/USDT' },
  { id: 'solana', symbol: 'SOL', pair: 'SOL/USDT' }
];

function isValidPair(coinId) {
  if (!coinId) return false;
  const lower = coinId.toLowerCase().replace('/usdt', '').replace('usdt', '');
  return SUPPORTED_COINS.some(c => c.id === lower || c.symbol.toLowerCase() === lower);
}

function getCoinDefinition(coinId) {
  if (!coinId) return null;
  const lower = coinId.toLowerCase().replace('/usdt', '').replace('usdt', '');
  return SUPPORTED_COINS.find(c => c.id === lower || c.symbol.toLowerCase() === lower) || null;
}

// ─── 2. Provider Data Parsing & Tether USDT Conversion ─────
function parseCoinGeckoPrices(cgPayload) {
  if (!cgPayload || typeof cgPayload !== 'object') throw new Error('Invalid payload');
  const tetherUsd = (cgPayload.tether && typeof cgPayload.tether.usd === 'number' && cgPayload.tether.usd > 0)
    ? cgPayload.tether.usd
    : 1.0;

  const result = {};
  SUPPORTED_COINS.forEach(c => {
    const raw = cgPayload[c.id];
    if (raw && typeof raw.usd === 'number' && raw.usd > 0) {
      const usdtPrice = (typeof raw.usdt === 'number' && raw.usdt > 0)
        ? raw.usdt
        : (raw.usd / tetherUsd);
      result[c.id] = {
        price: parseFloat(usdtPrice.toFixed(2)),
        change24h: raw.usd_24h_change || 0,
        volume24h: raw.usd_24h_vol || 0,
        marketCap: raw.usd_market_cap || 0,
        quote: 'USDT'
      };
    }
  });
  return result;
}

// ─── 3. Freshness Status Calculator ─────────────────────────
function calculateDataFreshness(lastUpdatedTimestamp, isRateLimited) {
  if (isRateLimited) return 'Rate-Limited';
  const ageMs = Date.now() - lastUpdatedTimestamp;
  if (ageMs > 180000) return 'Stale';
  if (ageMs > 60000) return 'Delayed';
  return 'Live';
}

// ─── 4. Paper Trading Engine Model ──────────────────────────
class VTradeWallet {
  constructor(initialCash = 10000.00) {
    this.cashBalance = initialCash;
    this.holdings = { bitcoin: 0, ethereum: 0, solana: 0 };
    this.positions = [];
    this.orders = [];
    this.history = [];
    this.realizedPnl = 0;
  }

  // Spot Buy
  spotBuy(coinId, sizeCoins, price, lastPriceTimestamp, isRateLimited = false) {
    // Stale price check
    if (calculateDataFreshness(lastPriceTimestamp, isRateLimited) === 'Stale') {
      throw new Error('ORDER_REJECTED_STALE_DATA');
    }
    if (!isValidPair(coinId)) throw new Error('UNSUPPORTED_COIN');
    if (sizeCoins <= 0 || price <= 0) throw new Error('INVALID_SIZE_OR_PRICE');

    const value = sizeCoins * price;
    const fee = value * 0.0005; // 0.05% fee
    const totalCost = value + fee;

    if (this.cashBalance < totalCost) throw new Error('INSUFFICIENT_CASH');

    this.cashBalance = parseFloat((this.cashBalance - totalCost).toFixed(2));
    this.holdings[coinId] = parseFloat(((this.holdings[coinId] || 0) + sizeCoins).toFixed(8));
    this.history.unshift({ type: 'SPOT_BUY', coinId, sizeCoins, price, fee });
    return true;
  }

  // Spot Sell
  spotSell(coinId, sizeCoins, price, lastPriceTimestamp, isRateLimited = false) {
    if (calculateDataFreshness(lastPriceTimestamp, isRateLimited) === 'Stale') {
      throw new Error('ORDER_REJECTED_STALE_DATA');
    }
    if (!isValidPair(coinId)) throw new Error('UNSUPPORTED_COIN');
    if (sizeCoins <= 0 || price <= 0) throw new Error('INVALID_SIZE_OR_PRICE');

    const curHolding = this.holdings[coinId] || 0;
    if (sizeCoins > curHolding + 0.00000001) throw new Error('OVERSELL_REJECTED');

    const value = sizeCoins * price;
    const fee = value * 0.0005;
    const netProceeds = value - fee;

    this.holdings[coinId] = parseFloat((curHolding - sizeCoins).toFixed(8));
    this.cashBalance = parseFloat((this.cashBalance + netProceeds).toFixed(2));
    this.history.unshift({ type: 'SPOT_SELL', coinId, sizeCoins, price, fee });
    return true;
  }

  // Futures Open / Opposing Netting
  openFuturesPosition(coinId, direction, sizeCoins, leverage, price, lastPriceTimestamp, isRateLimited = false) {
    if (calculateDataFreshness(lastPriceTimestamp, isRateLimited) === 'Stale') {
      throw new Error('ORDER_REJECTED_STALE_DATA');
    }
    if (!isValidPair(coinId)) throw new Error('UNSUPPORTED_COIN');
    if (leverage < 1 || leverage > 100) throw new Error('INVALID_LEVERAGE');
    if (sizeCoins <= 0 || price <= 0) throw new Error('INVALID_SIZE_OR_PRICE');

    const targetDir = direction.toLowerCase();

    // Check for opposing position netting
    const oppIdx = this.positions.findIndex(p => p.coinId === coinId && p.direction !== targetDir);
    if (oppIdx !== -1) {
      const opp = this.positions[oppIdx];
      if (sizeCoins <= opp.size) {
        // Partial or full close opposing position
        this.closeFuturesPositionPartial(opp.id, sizeCoins, price);
        return { netted: true, remainingSize: 0 };
      } else {
        const remainingSize = sizeCoins - opp.size;
        this.closeFuturesPosition(opp.id, price);
        sizeCoins = remainingSize;
      }
    }

    const orderValue = sizeCoins * price;
    const marginRequired = orderValue / leverage;
    const fee = orderValue * 0.0005;
    const totalDeduction = marginRequired + fee;

    if (this.cashBalance < totalDeduction) throw new Error('INSUFFICIENT_MARGIN_CASH');

    this.cashBalance -= totalDeduction;

    const liqPrice = targetDir === 'long'
      ? price * (1 - (0.9 / leverage))
      : price * (1 + (0.9 / leverage));

    const pos = {
      id: Date.now() + Math.random(),
      coinId,
      direction: targetDir,
      size: sizeCoins,
      entryPrice: price,
      leverage,
      margin: marginRequired,
      liquidationPrice: Math.max(0.01, liqPrice)
    };

    this.positions.push(pos);
    return { pos, netted: false };
  }

  // Futures Partial Close
  closeFuturesPositionPartial(posId, closeSize, exitPrice) {
    const idx = this.positions.findIndex(p => p.id === posId);
    if (idx === -1) throw new Error('POSITION_NOT_FOUND');
    const pos = this.positions[idx];

    const actualClose = Math.min(pos.size, closeSize);
    const fraction = actualClose / pos.size;
    const marginToClose = pos.margin * fraction;

    const priceDiff = pos.direction === 'long'
      ? (exitPrice - pos.entryPrice)
      : (pos.entryPrice - exitPrice);

    const grossPnl = priceDiff * actualClose;
    const fee = actualClose * exitPrice * 0.0005;
    const netPnl = grossPnl - fee;

    const cashReturn = Math.max(0, marginToClose + netPnl);
    this.cashBalance += cashReturn;
    this.realizedPnl += netPnl;

    if (actualClose >= pos.size - 0.000001) {
      this.positions.splice(idx, 1);
    } else {
      pos.size -= actualClose;
      pos.margin -= marginToClose;
    }

    return { realizedPnl: netPnl, cashReturn };
  }

  // Futures Full Close
  closeFuturesPosition(posId, exitPrice) {
    const pos = this.positions.find(p => p.id === posId);
    if (!pos) throw new Error('POSITION_NOT_FOUND');
    return this.closeFuturesPositionPartial(posId, pos.size, exitPrice);
  }

  // Safe Wallet Reset
  reset(confirmKeyword) {
    if (confirmKeyword !== 'RESET') throw new Error('INVALID_RESET_TOKEN');
    this.cashBalance = 10000.00;
    this.holdings = { bitcoin: 0, ethereum: 0, solana: 0 };
    this.positions = [];
    this.orders = [];
    this.history = [];
    this.realizedPnl = 0;
  }
}

// ─── RUN ALL TESTS ──────────────────────────────────────────
async function runAllTests() {
  const tests = [];
  function it(name, fn) {
    try {
      fn();
      tests.push({ name, passed: true });
      console.log(`  ✓ ${name}`);
    } catch (err) {
      tests.push({ name, passed: false, error: err.message });
      console.error(`  ✗ ${name}: ${err.message}`);
    }
  }

  console.log('\n=== RUNNING VTRADE TEST SUITE ===');

  // Test 1: Supported Coins & Pair Mapping
  it('strictly maps BTC/USDT, ETH/USDT, SOL/USDT to CoinGecko IDs', () => {
    assert.strictEqual(getCoinDefinition('BTC')?.id, 'bitcoin');
    assert.strictEqual(getCoinDefinition('ETH')?.id, 'ethereum');
    assert.strictEqual(getCoinDefinition('SOL')?.id, 'solana');
    assert.strictEqual(getCoinDefinition('BTC/USDT')?.id, 'bitcoin');
    assert.strictEqual(getCoinDefinition('ETH/USDT')?.id, 'ethereum');
    assert.strictEqual(getCoinDefinition('SOL/USDT')?.id, 'solana');
  });

  // Test 2: Non-supported pairs and Gold/XAU rejection
  it('eradicates and strictly rejects GOLD, XAU, and non-supported pairs', () => {
    assert.strictEqual(isValidPair('gold'), false);
    assert.strictEqual(isValidPair('XAU'), false);
    assert.strictEqual(isValidPair('XAU/USDT'), false);
    assert.strictEqual(isValidPair('dogecoin'), false);
    assert.strictEqual(isValidPair('XRP'), false);
  });

  // Test 3: Truthful CoinGecko Provider Parsing & USDT conversion
  it('correctly parses CoinGecko provider data with genuine USDT Tether rate', () => {
    const mockCg = {
      bitcoin: { usd: 84000, usd_24h_change: 2.5, usd_24h_vol: 30000000000, usd_market_cap: 1650000000000 },
      ethereum: { usd: 2500, usd_24h_change: -1.2, usd_24h_vol: 15000000000, usd_market_cap: 300000000000 },
      solana: { usd: 100, usd_24h_change: 4.1, usd_24h_vol: 4000000000, usd_market_cap: 60000000000 },
      tether: { usd: 1.0005 } // 1 USDT = $1.0005 USD
    };
    const parsed = parseCoinGeckoPrices(mockCg);
    assert.strictEqual(parsed.bitcoin.quote, 'USDT');
    // 84000 / 1.0005 ≈ 83958.02
    assert.strictEqual(Math.round(parsed.bitcoin.price), 83958);
    // 2500 / 1.0005 ≈ 2498.75
    assert.strictEqual(Math.round(parsed.ethereum.price), 2499);
  });

  // Test 4: Data Freshness Statuses
  it('calculates freshness accurately (Live, Delayed, Stale, Rate-Limited)', () => {
    const now = Date.now();
    assert.strictEqual(calculateDataFreshness(now - 10000, false), 'Live');
    assert.strictEqual(calculateDataFreshness(now - 70000, false), 'Delayed');
    assert.strictEqual(calculateDataFreshness(now - 190000, false), 'Stale');
    assert.strictEqual(calculateDataFreshness(now - 5000, true), 'Rate-Limited');
  });

  // Test 5: Stale Market Data Rejection
  it('rejects order execution when provider price is stale (> 3m old)', () => {
    const wallet = new VTradeWallet(10000);
    const staleTime = Date.now() - 200000; // > 3 minutes
    assert.throws(() => {
      wallet.spotBuy('bitcoin', 0.05, 84000, staleTime);
    }, /ORDER_REJECTED_STALE_DATA/);
  });

  // Test 6: Spot Trading Rules (Buys, Sells, Oversell rejection, Non-negative cash)
  it('handles spot buys, partial sells, rejects oversells, and maintains positive balance', () => {
    const wallet = new VTradeWallet(10000);
    const liveTime = Date.now();

    // Buy 0.1 BTC at 50,000 USDT -> cost 5000 + 2.5 fee = 5002.50
    wallet.spotBuy('bitcoin', 0.1, 50000, liveTime);
    assert.strictEqual(wallet.holdings.bitcoin, 0.1);
    assert.strictEqual(wallet.cashBalance, 4997.5);

    // Partial Sell 0.04 BTC at 60,000 USDT -> proceeds 2400 - 1.2 fee = 2398.80
    wallet.spotSell('bitcoin', 0.04, 60000, liveTime);
    assert.strictEqual(wallet.holdings.bitcoin, 0.06);
    assert.strictEqual(wallet.cashBalance, 4997.5 + 2398.8);

    // Oversell attempt (sell 0.1 BTC when only 0.06 held) -> must reject
    assert.throws(() => {
      wallet.spotSell('bitcoin', 0.1, 60000, liveTime);
    }, /OVERSELL_REJECTED/);

    // Overspend buy attempt -> must reject
    assert.throws(() => {
      wallet.spotBuy('bitcoin', 1.0, 50000, liveTime);
    }, /INSUFFICIENT_CASH/);
  });

  // Test 7: Futures Margin, Leverage, Taker Fees, and Liquidation Price Math
  it('calculates futures leverage, margin, taker fee, and liquidation prices correctly', () => {
    const wallet = new VTradeWallet(10000);
    const liveTime = Date.now();

    // Long 1 BTC at 50,000 with 10x leverage
    // Value = 50,000, Margin = 5,000, Fee = 25
    const { pos } = wallet.openFuturesPosition('bitcoin', 'long', 1.0, 10, 50000, liveTime);
    assert.strictEqual(pos.margin, 5000);
    assert.strictEqual(wallet.cashBalance, 10000 - 5025);

    // Liq price Long: 50,000 * (1 - 0.9/10) = 50,000 * 0.91 = 45,500
    assert.strictEqual(pos.liquidationPrice, 45500);

    // Liq price Short with 20x: 50,000 * (1 + 0.9/20) = 50,000 * 1.045 = 52,250
    const wallet2 = new VTradeWallet(10000);
    const { pos: posShort } = wallet2.openFuturesPosition('bitcoin', 'short', 1.0, 20, 50000, liveTime);
    assert.strictEqual(posShort.liquidationPrice, 52250);
  });

  // Test 8: Partial Futures Position Close and Proportional Margin Return
  it('correctly returns proportional margin and realized PnL on partial close', () => {
    const wallet = new VTradeWallet(10000);
    const liveTime = Date.now();

    // Open Long 1.0 BTC at 50,000 with 10x (Margin = 5000)
    const { pos } = wallet.openFuturesPosition('bitcoin', 'long', 1.0, 10, 50000, liveTime);
    const cashAfterOpen = wallet.cashBalance; // 4975

    // Partial close 50% (0.5 BTC) at 55,000 USDT (+10% price increase)
    // 50% margin returned = 2500
    // Gross PnL = (55000 - 50000) * 0.5 = 2500
    // Fee = 0.5 * 55000 * 0.0005 = 13.75
    // Net PnL = 2486.25
    // Cash returned = 2500 + 2486.25 = 4986.25
    const res = wallet.closeFuturesPositionPartial(pos.id, 0.5, 55000);
    assert.strictEqual(res.realizedPnl, 2486.25);
    assert.strictEqual(wallet.cashBalance, cashAfterOpen + 4986.25);
    assert.strictEqual(pos.size, 0.5);
    assert.strictEqual(pos.margin, 2500);
  });

  // Test 9: Opposing Position Netting (No Unintended Reversal)
  it('nets opposing futures orders without opening accidental reverse exposure', () => {
    const wallet = new VTradeWallet(10000);
    const liveTime = Date.now();

    // Open Long 1.0 BTC at 50,000 with 10x
    const { pos } = wallet.openFuturesPosition('bitcoin', 'long', 1.0, 10, 50000, liveTime);
    assert.strictEqual(wallet.positions.length, 1);
    assert.strictEqual(wallet.positions[0].direction, 'long');

    // Place opposing Short order of 0.4 BTC at 52,000 -> must reduce existing Long by 0.4 BTC
    const res = wallet.openFuturesPosition('bitcoin', 'short', 0.4, 10, 52000, liveTime);
    assert.strictEqual(res.netted, true);
    assert.strictEqual(wallet.positions.length, 1);
    assert.strictEqual(wallet.positions[0].size, 0.6); // 1.0 - 0.4 = 0.6 Long
    assert.strictEqual(wallet.positions[0].direction, 'long');
  });

  // Test 10: Safe Wallet Reset
  it('resets wallet to initial $10,000, clears open orders/positions only with exact RESET token', () => {
    const wallet = new VTradeWallet(10000);
    wallet.openFuturesPosition('bitcoin', 'long', 0.2, 5, 50000, Date.now());
    assert.notStrictEqual(wallet.cashBalance, 10000);
    assert.strictEqual(wallet.positions.length, 1);

    // Wrong token fails
    assert.throws(() => wallet.reset('reset'), /INVALID_RESET_TOKEN/);
    assert.throws(() => wallet.reset('CONFIRM'), /INVALID_RESET_TOKEN/);

    // Exact token succeeds
    wallet.reset('RESET');
    assert.strictEqual(wallet.cashBalance, 10000);
    assert.strictEqual(wallet.positions.length, 0);
    assert.strictEqual(wallet.orders.length, 0);
    assert.strictEqual(wallet.history.length, 0);
  });

  const total = tests.length;
  const passed = tests.filter(t => t.passed).length;
  console.log(`\n=== TEST RESULTS: ${passed}/${total} PASSED ===\n`);
  return { total, passed, allPassed: passed === total };
}

if (require.main === module) {
  runAllTests().then(res => {
    process.exit(res.allPassed ? 0 : 1);
  });
}

module.exports = { runAllTests };
