export type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y';

export interface StockBasic {
  symbol: string;
  companyName: string;
  exchange: 'NSE' | 'BSE';
  sector: string;
}

export interface QuoteCacheEntry {
  quote: any;
  cachedAt: number;
}

export interface HistoricalCacheEntry {
  candles: any[];
  cachedAt: number;
}
