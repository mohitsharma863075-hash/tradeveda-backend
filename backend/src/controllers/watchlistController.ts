import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { db } from '../db/database';
import { marketDataProvider } from '../services/marketData/marketDataProvider';

export class WatchlistController {
  public static async getWatchlist(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const items = db.getWatchlist(userId);
      const enrichedItems = await Promise.all(
        items.map(async item => {
          const quote = await marketDataProvider.getQuote(item.symbol);
          return {
            ...item,
            currentPrice: quote.currentPrice,
            change: quote.change,
            changePercent: quote.changePercent,
            dayHigh: quote.high,
            dayLow: quote.low,
            volume: quote.volume,
            marketStatus: quote.marketStatus,
            lastUpdated: quote.lastUpdated,
          };
        })
      );

      return res.json({ success: true, count: enrichedItems.length, data: enrichedItems });
    } catch (err: any) {
      console.error('Watchlist error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch watchlist.' });
    }
  }

  public static async addToWatchlist(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { symbol, exchange } = req.body;
      if (!symbol) {
        return res.status(400).json({ success: false, message: 'Symbol is required.' });
      }

      const quote = await marketDataProvider.getQuote(symbol);
      const item = db.addToWatchlist(userId, quote.symbol, quote.companyName, (exchange as any) || 'NSE');

      return res.status(201).json({
        success: true,
        message: `${quote.symbol} added to watchlist.`,
        data: item,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to add to watchlist.' });
    }
  }

  public static async removeFromWatchlist(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { symbol } = req.params;
      if (!symbol) {
        return res.status(400).json({ success: false, message: 'Symbol is required.' });
      }

      const removed = db.removeFromWatchlist(userId, symbol);
      if (!removed) {
        return res.status(404).json({ success: false, message: 'Stock not found in watchlist.' });
      }

      return res.json({ success: true, message: `${symbol.toUpperCase()} removed from watchlist.` });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to remove from watchlist.' });
    }
  }
}
