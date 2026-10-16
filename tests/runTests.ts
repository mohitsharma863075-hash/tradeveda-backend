import { db } from '../backend/src/db/database';
import { paperTradingEngine } from '../backend/src/services/tradingEngine/paperTradingEngine';
import { ChargesCalculator } from '../backend/src/services/tradingEngine/chargesCalculator';
import { MarketStatusService } from '../backend/src/services/marketData/marketStatusService';
import { marketDataProvider } from '../backend/src/services/marketData/marketDataProvider';
import bcrypt from 'bcryptjs';

async function runAllTests() {
  console.log('🧪 Starting TradeVeda Automated Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // 1. Test User Registration & Starting Balance
  console.log('--- 1. Authentication & Virtual Account Creation ---');
  const testEmail = `test_trader_${Date.now()}@test.in`;
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('Password@123', salt);
  const user = db.createUser('Test Trader', testEmail, hash);
  assert(!!user.id, 'User created with valid ID');

  const initialAccount = db.getVirtualAccount(user.id);
  assert(initialAccount.startingBalance === 1000000, 'Starting balance is exactly ₹10,00,000');
  assert(initialAccount.availableCash === 1000000, 'Initial available cash is ₹10,00,000');
  assert(initialAccount.investedValue === 0, 'Initial invested value is ₹0');

  // 2. Test Market Data & Status
  console.log('\n--- 2. Market Data & Status Service ---');
  const marketStatus = MarketStatusService.getMarketStatus();
  assert(!!marketStatus.status, `Market status calculated: ${marketStatus.status}`);
  assert(marketStatus.exchange === 'NSE', 'Default exchange is NSE');

  const quote = await marketDataProvider.getQuote('RELIANCE');
  assert(quote.symbol === 'RELIANCE', 'Fetched RELIANCE quote');
  assert(quote.currentPrice > 0, `Valid price: ₹${quote.currentPrice}`);
  assert(quote.isDelayed === true, 'Data freshness correctly marked as delayed');

  // 3. Test Simulated Charges Calculator
  console.log('\n--- 3. Simulated Charges Calculator ---');
  const sampleValue = 50000;
  const buyCharges = ChargesCalculator.calculate('BUY', sampleValue);
  assert(buyCharges.brokerage <= 20, 'Brokerage is capped at max ₹20');
  assert(buyCharges.stt > 0, 'STT correctly calculated (0.1%)');
  assert(buyCharges.stampDuty > 0, 'Stamp duty applied on BUY (0.015%)');

  const sellCharges = ChargesCalculator.calculate('SELL', sampleValue);
  assert(sellCharges.stampDuty === 0, 'No stamp duty applied on SELL');

  // 4. Test Buy Validation: Insufficient Balance
  console.log('\n--- 4. Paper Buy Validation ---');
  try {
    await paperTradingEngine.executeBuy(user.id, 'RELIANCE', 100000); // Exceeds ₹10L
    assert(false, 'Should reject order with insufficient balance');
  } catch (err: any) {
    assert(err.message.includes('Insufficient virtual balance'), 'Rejected excessive buy with "Insufficient virtual balance"');
  }

  // 5. Test Successful Buy Order
  console.log('\n--- 5. Executing Virtual Buy Order ---');
  const buyQty = 10;
  const buyResult = await paperTradingEngine.executeBuy(user.id, 'RELIANCE', buyQty);
  assert(buyResult.order.status === 'COMPLETED', 'Order status is COMPLETED');
  assert(buyResult.holding.quantity === 10, 'Holding quantity updated to 10');
  assert(buyResult.account.availableCash < 1000000, 'Virtual cash deducted correctly');
  assert(buyResult.account.investedValue > 0, 'Invested value updated in portfolio');

  // 6. Test Average Buy Price Calculation
  console.log('\n--- 6. Weighted Average Buy Price Calculation ---');
  const firstAvg = buyResult.holding.averageBuyPrice;
  // Buy another 10 shares
  const buyResult2 = await paperTradingEngine.executeBuy(user.id, 'RELIANCE', 10);
  assert(buyResult2.holding.quantity === 20, 'Holding quantity is now 20');
  assert(buyResult2.holding.averageBuyPrice > 0, `Average buy price recalculated: ₹${buyResult2.holding.averageBuyPrice}`);

  // 7. Test Sell Validation: Insufficient Holdings
  console.log('\n--- 7. Paper Sell Validation ---');
  try {
    await paperTradingEngine.executeSell(user.id, 'RELIANCE', 50); // user only has 20
    assert(false, 'Should reject selling more shares than owned');
  } catch (err: any) {
    assert(err.message.includes('Insufficient holdings'), 'Rejected with "Insufficient holdings"');
  }

  // 8. Test Successful Sell Order & Realized P&L
  console.log('\n--- 8. Executing Virtual Sell Order ---');
  const sellQty = 10;
  const sellResult = await paperTradingEngine.executeSell(user.id, 'RELIANCE', sellQty);
  assert(sellResult.order.status === 'COMPLETED', 'Sell order COMPLETED');
  assert(sellResult.realizedPnL !== undefined, `Realized P&L calculated: ₹${sellResult.realizedPnL}`);
  const remainingHolding = db.getHolding(user.id, 'RELIANCE');
  assert(remainingHolding?.quantity === 10, 'Remaining holding is 10 shares');

  // 9. Test Order History
  console.log('\n--- 9. Order History ---');
  const orders = db.getOrders(user.id);
  assert(orders.length === 3, 'User has 3 recorded orders (2 buys, 1 sell)');
  assert(orders[0].type === 'SELL', 'Latest order is SELL');

  // 10. Test Watchlist Persistence
  console.log('\n--- 10. Watchlist Persistence ---');
  db.addToWatchlist(user.id, 'TCS', 'Tata Consultancy Services', 'NSE');
  const wl = db.getWatchlist(user.id);
  assert(wl.some(w => w.symbol === 'TCS'), 'TCS saved in user watchlist');
  db.removeFromWatchlist(user.id, 'TCS');
  const wlAfter = db.getWatchlist(user.id);
  assert(!wlAfter.some(w => w.symbol === 'TCS'), 'TCS removed from user watchlist');

  // 11. Test Reset Paper Account
  console.log('\n--- 11. Reset Paper Account ---');
  const resetAcc = db.resetAccount(user.id);
  assert(resetAcc.availableCash === 1000000, 'Reset restored ₹10,00,000 cash');
  assert(resetAcc.investedValue === 0, 'Reset restored ₹0 invested value');
  const holdingsAfterReset = db.getHoldings(user.id);
  assert(holdingsAfterReset.length === 0, 'All holdings cleared on reset');
  const ordersAfterReset = db.getOrders(user.id);
  assert(ordersAfterReset.length === 0, 'All orders cleared on reset');

  // 12-15. Environment, URL Resolution, Security & Network Tests
  const { runEnvironmentAndNetworkTests } = await import('./environmentAndNetworkTests');
  await runEnvironmentAndNetworkTests(assert);

  // 16. Android Hardware & Gesture Back Button Decision Engine Tests
  const { runBackButtonDecisionTests } = await import('./backButtonDecisionTests');
  runBackButtonDecisionTests(assert);

  // 17-19. Android Launcher Icons, Splash Screen & Manifest Validation Tests
  const { runAndroidAssetTests } = await import('./androidAssetTests');
  runAndroidAssetTests(assert);

  // 20-22. Android Release Build, Signing Security & ProGuard Tests
  const { runReleaseConfigTests } = await import('./releaseConfigTests');
  runReleaseConfigTests(assert);

  console.log(`\n========================================`);
  console.log(`🏁 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Test run error:', err);
  process.exit(1);
});
