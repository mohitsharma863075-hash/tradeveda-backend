import { Request, Response } from 'express';
import { marketDataProvider } from '../services/marketData/marketDataProvider';
import { MarketStatusService } from '../services/marketData/marketStatusService';

export class MarketController {
  public static async getStocks(_req: Request, res: Response) {
    try {
      const stocks = await marketDataProvider.getPopularQuotes(20);
      return res.json({ success: true, data: stocks });
    } catch (err: any) {
      console.error('Error fetching stocks:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch market stocks.' });
    }
  }

  public static async getStockBySymbol(req: Request, res: Response) {
    try {
      const { symbol } = req.params;
      if (!symbol) {
        return res.status(400).json({ success: false, message: 'Stock symbol required.' });
      }

      const quote = await marketDataProvider.getQuote(symbol);
      return res.json({ success: true, data: quote });
    } catch (err: any) {
      console.error(`Error fetching quote for ${req.params.symbol}:`, err);
      return res.status(500).json({ success: false, message: 'Failed to fetch quote.' });
    }
  }

  public static async getHistoricalData(req: Request, res: Response) {
    try {
      const { symbol } = req.params;
      const timeframe = (req.query.timeframe as string) || '1M';

      if (!symbol) {
        return res.status(400).json({ success: false, message: 'Stock symbol required.' });
      }

      const candles = await marketDataProvider.getHistoricalData(symbol, timeframe);
      return res.json({
        success: true,
        symbol: symbol.toUpperCase(),
        timeframe: timeframe.toUpperCase(),
        count: candles.length,
        data: candles,
      });
    } catch (err: any) {
      console.error(`Error fetching history for ${req.params.symbol}:`, err);
      return res.status(500).json({ success: false, message: 'Failed to fetch historical candlestick data.' });
    }
  }

  public static async search(req: Request, res: Response) {
    try {
      const query = (req.query.q as string) || '';
      const results = await marketDataProvider.searchStocks(query);
      return res.json({ success: true, data: results });
    } catch (err: any) {
      console.error('Search error:', err);
      return res.status(500).json({ success: false, message: 'Search failed.' });
    }
  }

  public static async getMovers(_req: Request, res: Response) {
    try {
      const movers = await marketDataProvider.getMarketMovers();
      return res.json({ success: true, data: movers });
    } catch (err: any) {
      console.error('Error fetching movers:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch market movers.' });
    }
  }

  public static getStatus(_req: Request, res: Response) {
    try {
      const status = MarketStatusService.getMarketStatus();
      return res.json({ success: true, data: status });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch market status.' });
    }
  }
}
