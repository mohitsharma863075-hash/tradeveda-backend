import { db } from '../../db/database';
import { marketDataProvider } from '../marketData/marketDataProvider';
import { ChargesCalculator } from './chargesCalculator';
import { Holding, Order, VirtualAccount, EnrichedHolding } from '../../types';

export class PaperTradingEngine {
  /**
   * Executes a virtual BUY order
   */
  public async executeBuy(
    userId: string,
    symbol: string,
    quantity: number
  ): Promise<{ order: Order; account: VirtualAccount; holding: Holding }> {
    // 1. Validation
    if (!userId) {
      throw new Error('User authentication required.');
    }
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!cleanSymbol) {
      throw new Error('Stock symbol is required.');
    }
    const parsedQty = Math.floor(Number(quantity));
    if (isNaN(parsedQty) || parsedQty <= 0) {
      throw new Error('Quantity must be a positive integer greater than zero.');
    }

    // 2. Market price lookup
    const quote = await marketDataProvider.getQuote(cleanSymbol);
    if (!quote || !quote.currentPrice || quote.currentPrice <= 0) {
      throw new Error('Market price is currently unavailable for this stock.');
    }

    const price = quote.currentPrice;
    const totalValue = Number((price * parsedQty).toFixed(2));

    // 3. Simulated charges calculation
    const charges = ChargesCalculator.calculate('BUY', totalValue);
    const netAmount = Number((totalValue + charges.total).toFixed(2));

    // 4. Account balance check
    const account = db.getVirtualAccount(userId);
    if (account.availableCash < netAmount) {
      const formattedNeeded = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(netAmount);
      const formattedAvailable = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(account.availableCash);
      throw new Error(`Insufficient virtual balance. Required: ${formattedNeeded}, Available: ${formattedAvailable}`);
    }

    // 5. Update cash
    const newAvailableCash = Number((account.availableCash - netAmount).toFixed(2));

    // 6. Update or create Holding with correct server-side average price
    const existingHolding = db.getHolding(userId, cleanSymbol);
    let updatedHolding: Holding;

    if (existingHolding) {
      const oldQty = existingHolding.quantity;
      const oldAvg = existingHolding.averageBuyPrice;
      const newTotalQty = oldQty + parsedQty;
      // Weighted average calculation: ((oldQty * oldAvg) + (newQty * price)) / newTotalQty
      const newAvgBuyPrice = Number((((oldQty * oldAvg) + (parsedQty * price)) / newTotalQty).toFixed(2));
      const totalInvested = Number((newTotalQty * newAvgBuyPrice).toFixed(2));

      updatedHolding = {
        ...existingHolding,
        quantity: newTotalQty,
        averageBuyPrice: newAvgBuyPrice,
        totalInvested,
        updatedAt: new Date().toISOString(),
      };
    } else {
      updatedHolding = {
        id: `hld_${userId}_${cleanSymbol}`,
        userId,
        symbol: cleanSymbol,
        companyName: quote.companyName,
        exchange: quote.exchange,
        quantity: parsedQty,
        averageBuyPrice: price,
        totalInvested: totalValue,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    db.saveHolding(updatedHolding);

    // 7. Save Order record
    const order: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId,
      symbol: cleanSymbol,
      companyName: quote.companyName,
      exchange: quote.exchange,
      type: 'BUY',
      orderType: 'MARKET',
      quantity: parsedQty,
      price,
      totalValue,
      charges,
      netAmount,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };

    db.addOrder(order);

    // 8. Update Virtual Account & Portfolio metrics
    const updatedAccount = db.updateVirtualAccount(userId, {
      availableCash: newAvailableCash,
      tradesCount: (account.tradesCount || 0) + 1,
    });

    // Recalculate portfolio totals
    await this.calculatePortfolio(userId);
    const finalAccount = db.getVirtualAccount(userId);

    return {
      order,
      account: finalAccount,
      holding: updatedHolding,
    };
  }

  /**
   * Executes a virtual SELL order
   */
  public async executeSell(
    userId: string,
    symbol: string,
    quantity: number
  ): Promise<{ order: Order; account: VirtualAccount; realizedPnL: number }> {
    // 1. Validation
    if (!userId) {
      throw new Error('User authentication required.');
    }
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!cleanSymbol) {
      throw new Error('Stock symbol is required.');
    }
    const parsedQty = Math.floor(Number(quantity));
    if (isNaN(parsedQty) || parsedQty <= 0) {
      throw new Error('Quantity must be a positive integer greater than zero.');
    }

    // 2. Check holdings
    const holding = db.getHolding(userId, cleanSymbol);
    if (!holding || holding.quantity <= 0) {
      throw new Error(`You do not own any shares of ${cleanSymbol}.`);
    }
    if (holding.quantity < parsedQty) {
      throw new Error(`Insufficient holdings. You own ${holding.quantity} shares, but tried to sell ${parsedQty}.`);
    }

    // 3. Current market price
    const quote = await marketDataProvider.getQuote(cleanSymbol);
    if (!quote || !quote.currentPrice || quote.currentPrice <= 0) {
      throw new Error('Market price is currently unavailable for this stock.');
    }

    const price = quote.currentPrice;
    const totalValue = Number((price * parsedQty).toFixed(2));

    // 4. Simulated charges calculation
    const charges = ChargesCalculator.calculate('SELL', totalValue);
    const netProceeds = Number((totalValue - charges.total).toFixed(2));

    // 5. Server-side Realized P&L calculation: (sellPrice - averageBuyPrice) * qty - totalCharges
    const grossPnL = (price - holding.averageBuyPrice) * parsedQty;
    const realizedPnL = Number((grossPnL - charges.total).toFixed(2));

    // 6. Update Holding
    const remainingQty = holding.quantity - parsedQty;
    if (remainingQty === 0) {
      db.saveHolding({ ...holding, quantity: 0 });
    } else {
      const remainingInvested = Number((remainingQty * holding.averageBuyPrice).toFixed(2));
      db.saveHolding({
        ...holding,
        quantity: remainingQty,
        totalInvested: remainingInvested,
        updatedAt: new Date().toISOString(),
      });
    }

    // 7. Update Virtual Account Cash and P&L
    const account = db.getVirtualAccount(userId);
    const newAvailableCash = Number((account.availableCash + netProceeds).toFixed(2));
    const newRealizedPnL = Number(((account.realizedPnL || 0) + realizedPnL).toFixed(2));

    const tradesCount = (account.tradesCount || 0) + 1;
    let profitableTradesCount = account.profitableTradesCount || 0;
    let lossTradesCount = account.lossTradesCount || 0;

    if (realizedPnL > 0) {
      profitableTradesCount += 1;
    } else if (realizedPnL < 0) {
      lossTradesCount += 1;
    }

    db.updateVirtualAccount(userId, {
      availableCash: newAvailableCash,
      realizedPnL: newRealizedPnL,
      tradesCount,
      profitableTradesCount,
      lossTradesCount,
    });

    // 8. Record Order
    const order: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId,
      symbol: cleanSymbol,
      companyName: quote.companyName,
      exchange: quote.exchange,
      type: 'SELL',
      orderType: 'MARKET',
      quantity: parsedQty,
      price,
      totalValue,
      charges,
      netAmount: netProceeds,
      realizedPnL,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };

    db.addOrder(order);

    // 9. Recalculate portfolio metrics
    await this.calculatePortfolio(userId);
    const finalAccount = db.getVirtualAccount(userId);

    return {
      order,
      account: finalAccount,
      realizedPnL,
    };
  }

  /**
   * Recalculates all portfolio values dynamically using current market prices
   */
  public async calculatePortfolio(userId: string): Promise<{
    account: VirtualAccount;
    enrichedHoldings: EnrichedHolding[];
    totalInvested: number;
    currentHoldingsValue: number;
    unrealizedPnL: number;
    todayPnL: number;
  }> {
    const account = db.getVirtualAccount(userId);
    const rawHoldings = db.getHoldings(userId);

    let totalInvested = 0;
    let currentHoldingsValue = 0;
    let todayPnL = 0;
    const enrichedHoldings: EnrichedHolding[] = [];

    for (const h of rawHoldings) {
      const quote = await marketDataProvider.getQuote(h.symbol);
      const currentPrice = quote.currentPrice;
      const currentValue = Number((h.quantity * currentPrice).toFixed(2));
      const holdingUnrealizedPnL = Number((currentValue - h.totalInvested).toFixed(2));
      const pnlPercent = h.totalInvested > 0
        ? Number(((holdingUnrealizedPnL / h.totalInvested) * 100).toFixed(2))
        : 0;

      const dayChangePerShare = currentPrice - quote.previousClose;
      const holdingTodayPnL = Number((h.quantity * dayChangePerShare).toFixed(2));
      const todayChangePercent = quote.changePercent;

      totalInvested += h.totalInvested;
      currentHoldingsValue += currentValue;
      todayPnL += holdingTodayPnL;

      enrichedHoldings.push({
        ...h,
        currentPrice,
        currentValue,
        unrealizedPnL: holdingUnrealizedPnL,
        pnlPercent,
        todayPnL: holdingTodayPnL,
        todayChangePercent,
        dayHigh: quote.high,
        dayLow: quote.low,
      });
    }

    totalInvested = Number(totalInvested.toFixed(2));
    currentHoldingsValue = Number(currentHoldingsValue.toFixed(2));
    todayPnL = Number(todayPnL.toFixed(2));

    const unrealizedPnL = Number((currentHoldingsValue - totalInvested).toFixed(2));
    const portfolioValue = Number((account.availableCash + currentHoldingsValue).toFixed(2));
    const totalPnL = Number((unrealizedPnL + (account.realizedPnL || 0)).toFixed(2));
    const totalReturnPercent = account.startingBalance > 0
      ? Number((((portfolioValue - account.startingBalance) / account.startingBalance) * 100).toFixed(2))
      : 0;

    const updatedAccount = db.updateVirtualAccount(userId, {
      investedValue: totalInvested,
      portfolioValue,
      unrealizedPnL,
      todayPnL,
      totalPnL,
      totalReturnPercent,
    });

    return {
      account: updatedAccount,
      enrichedHoldings,
      totalInvested,
      currentHoldingsValue,
      unrealizedPnL,
      todayPnL,
    };
  }
}

export const paperTradingEngine = new PaperTradingEngine();
