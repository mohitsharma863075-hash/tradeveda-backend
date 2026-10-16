import { StockQuote, Candle, MarketStatusInfo } from '../../types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class PriceCacheService {
  private quoteCache: Map<string, CacheEntry<StockQuote>> = new Map();
  private historyCache: Map<string, CacheEntry<Candle[]>> = new Map();
  private marketStatusCache: CacheEntry<MarketStatusInfo> | null = null;

  // Quotes cached for 30 seconds to respect free endpoints and avoid spam
  private quoteTTL = 30 * 1000;
  // Historical data cached for 5 minutes
  private historyTTL = 5 * 60 * 1000;
  // Market status cached for 15 seconds
  private statusTTL = 15 * 1000;

  public getQuote(symbol: string): StockQuote | null {
    const key = symbol.toUpperCase();
    const entry = this.quoteCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.quoteTTL) {
      return null; // expired
    }
    return entry.data;
  }

  public setQuote(symbol: string, quote: StockQuote): void {
    const key = symbol.toUpperCase();
    this.quoteCache.set(key, {
      data: quote,
      timestamp: Date.now(),
    });
  }

  public getHistory(symbol: string, timeframe: string): Candle[] | null {
    const key = `${symbol.toUpperCase()}_${timeframe}`;
    const entry = this.historyCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.historyTTL) {
      return null;
    }
    return entry.data;
  }

  public setHistory(symbol: string, timeframe: string, candles: Candle[]): void {
    const key = `${symbol.toUpperCase()}_${timeframe}`;
    this.historyCache.set(key, {
      data: candles,
      timestamp: Date.now(),
    });
  }

  public getMarketStatus(): MarketStatusInfo | null {
    if (!this.marketStatusCache) return null;
    if (Date.now() - this.marketStatusCache.timestamp > this.statusTTL) {
      return null;
    }
    return this.marketStatusCache.data;
  }

  public setMarketStatus(status: MarketStatusInfo): void {
    this.marketStatusCache = {
      data: status,
      timestamp: Date.now(),
    };
  }

  public clear(): void {
    this.quoteCache.clear();
    this.historyCache.clear();
    this.marketStatusCache = null;
  }
}

export const priceCache = new PriceCacheService();
