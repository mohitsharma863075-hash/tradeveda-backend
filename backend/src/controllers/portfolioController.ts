import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { paperTradingEngine } from '../services/tradingEngine/paperTradingEngine';
import { db } from '../db/database';
import { ChallengeStats } from '../types';

export class PortfolioController {
  public static async getPortfolio(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const portfolio = await paperTradingEngine.calculatePortfolio(userId);
      return res.json({
        success: true,
        data: {
          account: portfolio.account,
          holdings: portfolio.enrichedHoldings,
          totalInvested: portfolio.totalInvested,
          currentHoldingsValue: portfolio.currentHoldingsValue,
          unrealizedPnL: portfolio.unrealizedPnL,
          todayPnL: portfolio.todayPnL,
        },
      });
    } catch (err: any) {
      console.error('Portfolio calculation error:', err);
      return res.status(500).json({ success: false, message: 'Failed to calculate portfolio.' });
    }
  }

  public static async resetAccount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const resetAccount = db.resetAccount(userId);
      return res.json({
        success: true,
        message: 'Your virtual paper trading account has been reset to starting ₹10,00,000 balance.',
        account: resetAccount,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to reset account.' });
    }
  }

  public static async getChallengeStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const portfolio = await paperTradingEngine.calculatePortfolio(userId);
      const acc = portfolio.account;

      // 30 days challenge calculation
      const startDate = acc.challengeStartedAt ? new Date(acc.challengeStartedAt) : new Date(acc.lastResetAt);
      const elapsedDays = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, 30 - elapsedDays);

      const trades = acc.tradesCount || 0;
      const profitTrades = acc.profitableTradesCount || 0;
      const lossTrades = acc.lossTradesCount || 0;
      const winRate = trades > 0 ? Number(((profitTrades / trades) * 100).toFixed(1)) : 0;

      const stats: ChallengeStats = {
        startingCapital: acc.startingBalance,
        currentValue: acc.portfolioValue,
        returnPercent: acc.totalReturnPercent,
        tradesCount: trades,
        profitTrades,
        lossTrades,
        winRate,
        daysRemaining,
      };

      return res.json({ success: true, data: stats });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch challenge stats.' });
    }
  }
}
