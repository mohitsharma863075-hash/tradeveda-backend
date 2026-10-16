import {
  StockQuote,
  Candle,
  MarketStatusInfo,
  Order,
  EnrichedHolding,
  VirtualAccount,
  WatchlistItem,
  ChallengeStats,
  DuelRoom,
  DuelOrder,
} from '../types';

import { resolveApiUrl } from './environment';

export function getAuthToken(): string | null {
  return localStorage.getItem('tradeveda_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('tradeveda_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('tradeveda_token');
}

let refreshingPromise: Promise<string | null> | null = null;

export async function getOrRenewSessionToken(): Promise<string | null> {
  const token = getAuthToken();
  return token || null;
}

async function request<T>(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  let token = getAuthToken();

  const isAuthRequired =
    !endpoint.startsWith('/market') &&
    endpoint !== '/health' &&
    endpoint !== '/auth/login' &&
    endpoint !== '/auth/register' &&
    endpoint !== '/auth/guest-session' &&
    endpoint !== '/leaderboard' &&
    endpoint !== '/admin/charges';

  if (isAuthRequired && !token) {
    token = await getOrRenewSessionToken();
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fullUrl = resolveApiUrl(endpoint);

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    // If session expired or invalid, auto-renew token and retry ONCE seamlessly
    if (response.status === 401 && !isRetry && isAuthRequired) {
      clearAuthToken();
      const freshToken = await getOrRenewSessionToken();
      if (freshToken) {
        return request<T>(endpoint, options, true);
      }
    }
    throw new Error(data.message || 'An unexpected error occurred.');
  }

  return data;
}

export const api = {
  // System Health
  getHealth: () =>
    request<{ status: string; service: string; timestamp: string }>('/health'),

  // Auth
  register: (name: string, email: string, password: string) =>
    request<{ success: boolean; token: string; user: any; account: VirtualAccount }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ success: boolean; token: string; user: any; account: VirtualAccount }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () =>
    request<{ success: boolean; user: any; account: VirtualAccount }>('/auth/me'),

  // Market Data
  getStocks: () =>
    request<{ success: boolean; data: StockQuote[] }>('/market/stocks'),

  getStock: (symbol: string) =>
    request<{ success: boolean; data: StockQuote }>(`/market/stock/${symbol}`),

  getHistory: (symbol: string, timeframe: string = '1M') =>
    request<{ success: boolean; data: Candle[]; symbol: string; timeframe: string }>(
      `/market/history/${symbol}?timeframe=${timeframe}`
    ),

  searchStocks: (query: string) =>
    request<{ success: boolean; data: StockQuote[] }>(`/market/search?q=${encodeURIComponent(query)}`),

  getMovers: () =>
    request<{
      success: boolean;
      data: { gainers: StockQuote[]; losers: StockQuote[]; popular: StockQuote[] };
    }>('/market/movers'),

  getMarketStatus: () =>
    request<{ success: boolean; data: MarketStatusInfo }>('/market/status'),

  // Trading & Orders
  buyStock: (symbol: string, quantity: number) =>
    request<{ success: boolean; message: string; order: Order; account: VirtualAccount; holding: any }>(
      '/orders/buy',
      {
        method: 'POST',
        body: JSON.stringify({ symbol, quantity }),
      }
    ),

  sellStock: (symbol: string, quantity: number) =>
    request<{ success: boolean; message: string; order: Order; account: VirtualAccount; realizedPnL: number }>(
      '/orders/sell',
      {
        method: 'POST',
        body: JSON.stringify({ symbol, quantity }),
      }
    ),

  estimateCharges: (symbol: string, quantity: number, type: 'BUY' | 'SELL') =>
    request<{
      success: boolean;
      symbol: string;
      price: number;
      quantity: number;
      totalValue: number;
      charges: any;
      netAmount: number;
    }>('/orders/estimate', {
      method: 'POST',
      body: JSON.stringify({ symbol, quantity, type }),
    }),

  getOrders: () =>
    request<{ success: boolean; count: number; data: Order[] }>('/orders'),

  getHoldings: () =>
    request<{ success: boolean; count: number; data: EnrichedHolding[] }>('/holdings'),

  // Portfolio
  getPortfolio: () =>
    request<{
      success: boolean;
      data: {
        account: VirtualAccount;
        holdings: EnrichedHolding[];
        totalInvested: number;
        currentHoldingsValue: number;
        unrealizedPnL: number;
        todayPnL: number;
      };
    }>('/portfolio'),

  resetAccount: () =>
    request<{ success: boolean; message: string; account: VirtualAccount }>('/account/reset', {
      method: 'POST',
    }),

  getChallengeStats: () =>
    request<{ success: boolean; data: ChallengeStats }>('/account/challenge'),

  // Watchlist
  getWatchlist: () =>
    request<{ success: boolean; count: number; data: WatchlistItem[] }>('/watchlist'),

  addToWatchlist: (symbol: string, exchange: string = 'NSE') =>
    request<{ success: boolean; message: string; data: any }>('/watchlist', {
      method: 'POST',
      body: JSON.stringify({ symbol, exchange }),
    }),

  removeFromWatchlist: (symbol: string) =>
    request<{ success: boolean; message: string }>(`/watchlist/${symbol}`, {
      method: 'DELETE',
    }),

  // Admin & Leaderboard
  getLeaderboard: () =>
    request<{ success: boolean; count: number; data: any[] }>('/leaderboard'),

  getAdminStats: () =>
    request<{ success: boolean; data: any }>('/admin/stats'),

  getChargesConfig: () =>
    request<{ success: boolean; data: any }>('/admin/charges'),

  updateChargesConfig: (config: any) =>
    request<{ success: boolean; message: string; data: any }>('/admin/charges', {
      method: 'PUT',
      body: JSON.stringify(config),
    }),

  // Google / Gmail Login
  googleLogin: (params: { credential?: string; email?: string; name?: string; avatar?: string }) =>
    request<{ success: boolean; message: string; token: string; user: any; account: VirtualAccount }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  // 1v1 Friend Paper Trading Duels
  listDuels: () =>
    request<{ success: boolean; data: DuelRoom[] }>('/duels'),

  createDuel: (params: { title?: string; startingBalance?: number; durationMinutes?: number; userName?: string; email?: string }) =>
    request<{ success: boolean; message: string; data: DuelRoom }>('/duels/create', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  joinDuel: (code: string, userName?: string, email?: string) =>
    request<{ success: boolean; message: string; data: DuelRoom }>('/duels/join', {
      method: 'POST',
      body: JSON.stringify({ code, userName, email }),
    }),

  getDuel: (idOrCode: string) =>
    request<{ success: boolean; data: DuelRoom }>(`/duels/${idOrCode}`),

  executeDuelTrade: (roomId: string, symbol: string, type: 'BUY' | 'SELL', quantity: number) =>
    request<{ success: boolean; message: string; data: { room: DuelRoom; order: DuelOrder } }>(`/duels/${roomId}/order`, {
      method: 'POST',
      body: JSON.stringify({ symbol, type, quantity }),
    }),

  startDuel: (roomId: string) =>
    request<{ success: boolean; message: string; data: DuelRoom }>(`/duels/${roomId}/start`, {
      method: 'POST',
    }),
};
