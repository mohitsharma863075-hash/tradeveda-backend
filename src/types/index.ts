export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
}

export interface VirtualAccount {
  userId: string;
  startingBalance: number;
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

export interface EnrichedHolding {
  id: string;
  userId: string;
  symbol: string;
  companyName: string;
  exchange: 'NSE' | 'BSE';
  quantity: number;
  averageBuyPrice: number;
  totalInvested: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnL: number;
  pnlPercent: number;
  todayPnL: number;
  todayChangePercent: number;
  dayHigh: number;
  dayLow: number;
  createdAt: string;
  updatedAt: string;
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
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
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

export interface WatchlistItem {
  id: string;
  symbol: string;
  companyName: string;
  exchange: 'NSE' | 'BSE';
  currentPrice?: number;
  change?: number;
  changePercent?: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
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

export interface DuelParticipantHolding {
  symbol: string;
  companyName: string;
  quantity: number;
  averageBuyPrice: number;
  totalInvested: number;
  currentPrice?: number;
  currentValue?: number;
  unrealizedPnL?: number;
  pnlPercent?: number;
}

export interface DuelOrder {
  id: string;
  userId: string;
  userName: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  charges: number;
  netAmount: number;
  createdAt: string;
}

export interface DuelActivity {
  id: string;
  userId: string;
  userName: string;
  type: 'JOIN' | 'START' | 'TRADE' | 'CHAT';
  message: string;
  timestamp: string;
}

export interface DuelParticipant {
  userId: string;
  userName: string;
  email?: string;
  isHost: boolean;
  joinedAt: string;
  startingBalance: number;
  availableCash: number;
  investedValue: number;
  portfolioValue: number;
  pnl: number;
  pnlPercent: number;
  tradesCount: number;
  winCount: number;
  lossCount: number;
  holdings: DuelParticipantHolding[];
  orders: DuelOrder[];
}

export interface DuelRoom {
  id: string;
  code: string;
  title: string;
  creatorId: string;
  creatorName: string;
  creatorEmail?: string;
  startingBalance: number;
  durationMinutes: number;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED';
  createdAt: string;
  startedAt?: string;
  expiresAt?: string;
  participants: DuelParticipant[];
  activities: DuelActivity[];
}

