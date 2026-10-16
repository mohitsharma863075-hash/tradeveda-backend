import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { paperTradingEngine } from '../services/tradingEngine/paperTradingEngine';
import { ChargesCalculator } from '../services/tradingEngine/chargesCalculator';
import { marketDataProvider } from '../services/marketData/marketDataProvider';
import { db } from '../db/database';

export class TradingController {
  public static async buy(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { symbol, quantity } = req.body;
      if (!symbol || !quantity) {
        return res.status(400).json({ success: false, message: 'Symbol and quantity are required.' });
      }

      const result = await paperTradingEngine.executeBuy(userId, symbol, quantity);
      return res.status(201).json({
        success: true,
        message: `Successfully bought ${quantity} virtual shares of ${symbol.toUpperCase()}.`,
        order: result.order,
        account: result.account,
        holding: result.holding,
      });
    } catch (err: any) {
      console.error('Buy order error:', err.message);
      return res.status(400).json({ success: false, message: err.message || 'Failed to execute virtual buy order.' });
    }
  }

  public static async sell(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { symbol, quantity } = req.body;
      if (!symbol || !quantity) {
        return res.status(400).json({ success: false, message: 'Symbol and quantity are required.' });
      }

      const result = await paperTradingEngine.executeSell(userId, symbol, quantity);
      return res.json({
        success: true,
        message: `Successfully sold ${quantity} virtual shares of ${symbol.toUpperCase()}. Realized P&L: ₹${result.realizedPnL}`,
        order: result.order,
        account: result.account,
        realizedPnL: result.realizedPnL,
      });
    } catch (err: any) {
      console.error('Sell order error:', err.message);
      return res.status(400).json({ success: false, message: err.message || 'Failed to execute virtual sell order.' });
    }
  }

  public static async estimateCharges(req: AuthRequest, res: Response) {
    try {
      const { symbol, quantity, type } = req.body;
      if (!symbol || !quantity || !type) {
        return res.status(400).json({ success: false, message: 'Symbol, quantity, and type (BUY/SELL) required.' });
      }

      const quote = await marketDataProvider.getQuote(symbol);
      const price = quote.currentPrice;
      const totalValue = Number((price * Number(quantity)).toFixed(2));
      const charges = ChargesCalculator.calculate(type.toUpperCase() as 'BUY' | 'SELL', totalValue);

      const netAmount = type.toUpperCase() === 'BUY'
        ? Number((totalValue + charges.total).toFixed(2))
        : Number((totalValue - charges.total).toFixed(2));

      return res.json({
        success: true,
        symbol: symbol.toUpperCase(),
        price,
        quantity: Number(quantity),
        totalValue,
        charges,
        netAmount,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to estimate charges.' });
    }
  }

  public static async getOrders(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const orders = db.getOrders(userId);
      return res.json({ success: true, count: orders.length, data: orders });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
    }
  }

  public static async getHoldings(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const portfolio = await paperTradingEngine.calculatePortfolio(userId);
      return res.json({
        success: true,
        count: portfolio.enrichedHoldings.length,
        data: portfolio.enrichedHoldings,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch holdings.' });
    }
  }
}
