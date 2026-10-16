export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  isAdmin?: boolean;
  createdAt: string;
}

export interface VirtualAccount {
  userId: string;
  startingBalance: number; // 1,000,000
  availableCash: number;
  investedValue: number;
  portfolioValue: number;
  totalPnL: number;
  totalReturnPercent: number;
  todayPnL: number;
  realizedPnL: number;
  unrealizedPnL: number;
  tradesCount: number;
  profitableTradesCount: number;
  lossTradesCount: number;
  lastResetAt: string;
  challengeActive?: boolean;
  challengeStartedAt?: string;
}

export interface Holding {
  id: string;
  userId: string;
  symbol: string;
  companyName: string;
  exchange: 'NSE' | 'BSE';
  quantity: number;
  averageBuyPrice: number;
  totalInvested: number;
  createdAt: string;
  updatedAt: string;
}

export interface EnrichedHolding extends Holding {
  currentPrice: number;
  currentValue: number;
  unrealizedPnL: number;
  pnlPercent: number;
  todayPnL: number;
  todayChangePercent: number;
  dayHigh: number;
  dayLow: number;
}

export interface Order {
  id: string;
  userId: string;
  symbol: string;
  companyName: string;
  exchange: 'NSE' | 'BSE';
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
  quantity: number;
  price: number;
  totalValue: number;
  charges: {
    brokerage: number;
    stt: number;
    exchangeCharges: number;
    gst: number;
    stampDuty: number;
    total: number;
  };
  netAmount: number;
  realizedPnL?: number;
  status: 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  symbol: string;
  companyName: string;
  exchange: 'NSE' | 'BSE';
  addedAt: string;
}

export interface StockQuote {
  symbol: string;
  companyName: string;
  exchange: 'NSE' | 'BSE';
  currentPrice: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  week52High: number;
  week52Low: number;
  marketStatus: 'MARKET OPEN' | 'MARKET CLOSED' | 'PRE-MARKET' | 'POST-MARKET';
  lastUpdated: string;
  isDelayed: boolean;
  isLive: boolean;
  provider: string;
  logoUrl?: string;
  domain?: string;
}

export interface Candle {
  time: string; // YYYY-MM-DD or Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SimulatedChargesConfig {
  brokerageRate: number;      // e.g. 0.0003 (0.03%)
  brokerageMaxPerOrder: number;// ₹20
  sttDeliveryRate: number;    // 0.001 (0.1%)
  exchangeTurnoverRate: number;// 0.0000345 (0.00345%)
  gstRate: number;             // 0.18 (18% on brokerage + turnover)
  stampDutyRate: number;       // 0.00015 (0.015% on BUY only)
}

export interface MarketStatusInfo {
  status: 'MARKET OPEN' | 'MARKET CLOSED' | 'PRE-MARKET' | 'POST-MARKET';
  exchange: 'NSE' | 'BSE';
  currentTimeIST: string;
  isOpen: boolean;
  message: string;
  nextEvent: string;
  tradingHours: string;
}

export interface ChallengeStats {
  startingCapital: number;
  currentValue: number;
  returnPercent: number;
  tradesCount: number;
  profitTrades: number;
  lossTrades: number;
  winRate: number;
  daysRemaining: number;
}
