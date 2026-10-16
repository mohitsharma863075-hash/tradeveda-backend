import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StockQuote, Order, EnrichedHolding } from '../types';
import { formatINR, formatPercent, formatVolume } from '../utils/formatters';
import { StockLogo } from '../components/StockLogo';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Bookmark,
  Swords,
} from 'lucide-react';

interface DashboardPageProps {
  onSelectStock: (symbol: string) => void;
  setActiveTab: (tab: string) => void;
  onOpenOrderModal: (stock: StockQuote, type: 'BUY' | 'SELL') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectStock,
  setActiveTab,
  onOpenOrderModal,
}) => {
  const { account, refreshAccount } = useAuth();
  const [popularStocks, setPopularStocks] = useState<StockQuote[]>([]);
  const [gainers, setGainers] = useState<StockQuote[]>([]);
  const [losers, setLosers] = useState<StockQuote[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [holdings, setHoldings] = useState<EnrichedHolding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [stocksRes, moversRes, ordersRes, portfolioRes] = await Promise.all([
          api.getStocks(),
          api.getMovers(),
          api.getOrders().catch(() => ({ data: [] })),
          api.getPortfolio().catch(() => ({ data: null })),
        ]);

        if (stocksRes.success) setPopularStocks(stocksRes.data.slice(0, 8));
        if (moversRes.success) {
          setGainers(moversRes.data.gainers.slice(0, 4));
          setLosers(moversRes.data.losers.slice(0, 4));
        }
        if (ordersRes.data) setRecentOrders(ordersRes.data.slice(0, 5));
        if (portfolioRes.data) setHoldings(portfolioRes.data.holdings);
      } catch (err) {
        console.error('Dashboard data load error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [refreshAccount]);

  const availableCash = account?.availableCash ?? 1000000;
  const investedAmount = account?.investedValue ?? 0;
  const portfolioValue = account?.portfolioValue ?? 1000000;
  const todayPnL = account?.todayPnL ?? 0;
  const overallPnL = account?.totalPnL ?? 0;
  const returnPercent = account?.totalReturnPercent ?? 0;
  const holdingsCount = holdings.length;

  return (
    <div className="space-y-6 pb-12 font-mono-num">
      {/* Top Welcome & Virtual Status Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/40 border border-slate-800 p-5 sm:p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
                Virtual Trading Active
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Delayed Market Data (NSE 15m)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Indian Stock Market Paper Terminal
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl font-sans">
              Practice trading NSE & BSE stocks with your ₹10,00,000 virtual balance. Zero financial risk, real candlestick charts, and instant order simulation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('duel')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs transition-all shadow-md shadow-emerald-950 cursor-pointer"
            >
              <Swords className="w-4 h-4 text-emerald-200" />
              <span>Trade With Friends (1v1)</span>
            </button>
            <button
              onClick={() => setActiveTab('markets')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-900/30 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Explore Markets</span>
            </button>
            <button
              onClick={() => setActiveTab('watchlist')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors border border-slate-700 cursor-pointer"
            >
              <Bookmark className="w-4 h-4 text-slate-400" />
              <span>Watchlist</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Key Portfolio Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Portfolio Value */}
        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] text-slate-400 block mb-1">Total Portfolio</span>
          <div className="text-base sm:text-lg font-bold text-slate-100">{formatINR(portfolioValue)}</div>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400 font-sans">
            <span>Virtual Worth</span>
          </div>
        </div>

        {/* Available Cash */}
        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] text-slate-400 block mb-1">Available Cash</span>
          <div className="text-base sm:text-lg font-bold text-emerald-400">{formatINR(availableCash)}</div>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-500/90 font-sans">
            <Wallet className="w-3 h-3" />
            <span>Ready to trade</span>
          </div>
        </div>

        {/* Invested Amount */}
        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] text-slate-400 block mb-1">Invested Amount</span>
          <div className="text-base sm:text-lg font-bold text-slate-200">{formatINR(investedAmount)}</div>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400 font-sans">
            <PieChart className="w-3 h-3" />
            <span>Holdings Capital</span>
          </div>
        </div>

        {/* Today's P&L */}
        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] text-slate-400 block mb-1">Today's P&L</span>
          <div className={`text-base sm:text-lg font-bold ${todayPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {todayPnL >= 0 ? '+' : ''}{formatINR(todayPnL)}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
            {todayPnL >= 0 ? (
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-rose-400" />
            )}
            <span>Intraday move</span>
          </div>
        </div>

        {/* Overall P&L */}
        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] text-slate-400 block mb-1">Overall P&L</span>
          <div className={`text-base sm:text-lg font-bold ${overallPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {overallPnL >= 0 ? '+' : ''}{formatINR(overallPnL)}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px]">
            <span className={`font-semibold ${returnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatPercent(returnPercent)}
            </span>
          </div>
        </div>

        {/* Holdings Count */}
        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Active Holdings</span>
            <div className="text-base sm:text-lg font-bold text-slate-100">{holdingsCount} Stocks</div>
          </div>
          <button
            onClick={() => setActiveTab('portfolio')}
            className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1 font-semibold"
          >
            <span>View Details</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Market Movers: Top Gainers & Top Losers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Gainers */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-200">Top NSE Gainers</h2>
            </div>
            <span className="text-[11px] text-slate-500">Today</span>
          </div>

          <div className="space-y-2">
            {gainers.map(stock => (
              <div
                key={stock.symbol}
                onClick={() => onSelectStock(stock.symbol)}
                className="p-2.5 rounded-xl bg-[#0b0f19] hover:bg-slate-800/60 border border-slate-800/60 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <StockLogo symbol={stock.symbol} size="sm" />
                  <div>
                    <span className="font-bold text-slate-100 text-xs block">{stock.symbol}</span>
                    <span className="text-[11px] text-slate-400 truncate block max-w-[130px]">
                      {stock.companyName}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-200">{formatINR(stock.currentPrice)}</div>
                  <div className="text-[11px] font-semibold text-emerald-400">
                    +{stock.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-rose-500/20 text-rose-400">
                <ArrowDownRight className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-200">Top NSE Losers</h2>
            </div>
            <span className="text-[11px] text-slate-500">Today</span>
          </div>

          <div className="space-y-2">
            {losers.map(stock => (
              <div
                key={stock.symbol}
                onClick={() => onSelectStock(stock.symbol)}
                className="p-2.5 rounded-xl bg-[#0b0f19] hover:bg-slate-800/60 border border-slate-800/60 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <StockLogo symbol={stock.symbol} size="sm" />
                  <div>
                    <span className="font-bold text-slate-100 text-xs block">{stock.symbol}</span>
                    <span className="text-[11px] text-slate-400 truncate block max-w-[130px]">
                      {stock.companyName}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-200">{formatINR(stock.currentPrice)}</div>
                  <div className="text-[11px] font-semibold text-rose-400">
                    {stock.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Indian Stocks Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 bg-[#0b0f19] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-slate-100">Popular Indian Equities (NSE/BSE)</h2>
          </div>
          <button
            onClick={() => setActiveTab('markets')}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
          >
            <span>View All Stocks</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1322] border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">SECURITY</th>
                <th className="py-3 px-4">CURRENT PRICE</th>
                <th className="py-3 px-4">DAY CHANGE</th>
                <th className="py-3 px-4 hidden md:table-cell">DAY RANGE</th>
                <th className="py-3 px-4 hidden sm:table-cell">VOLUME</th>
                <th className="py-3 px-4 text-right">QUICK TRADE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {popularStocks.map(stock => {
                const isPos = stock.change >= 0;
                return (
                  <tr key={stock.symbol} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onSelectStock(stock.symbol)}
                        className="text-left group flex items-center gap-3 cursor-pointer"
                      >
                        <StockLogo symbol={stock.symbol} size="md" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                              {stock.symbol}
                            </span>
                            <span className="text-[10px] px-1 py-0.2 bg-slate-800 text-slate-400 rounded">
                              {stock.exchange}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 truncate max-w-xs block font-sans">
                            {stock.companyName}
                          </span>
                        </div>
                      </button>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-200">
                      {formatINR(stock.currentPrice)}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold inline-flex items-center gap-0.5 ${
                          isPos ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPos ? '+' : ''}{stock.change.toFixed(2)} ({formatPercent(stock.changePercent)})
                      </span>
                    </td>

                    <td className="py-3 px-4 hidden md:table-cell text-slate-400 text-[11px]">
                      {formatINR(stock.low, 1)} — {formatINR(stock.high, 1)}
                    </td>

                    <td className="py-3 px-4 hidden sm:table-cell text-slate-400">
                      {formatVolume(stock.volume)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenOrderModal(stock, 'BUY')}
                          className="px-2.5 py-1 rounded-md bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white font-bold text-xs transition-colors"
                        >
                          BUY
                        </button>
                        <button
                          onClick={() => onOpenOrderModal(stock, 'SELL')}
                          className="px-2.5 py-1 rounded-md bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white font-bold text-xs transition-colors"
                        >
                          SELL
                        </button>
                        <button
                          onClick={() => onSelectStock(stock.symbol)}
                          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                        >
                          Chart
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders Preview */}
      {recentOrders.length > 0 && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-200">Recent Paper Orders</h2>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              All Orders
            </button>
          </div>

          <div className="space-y-2">
            {recentOrders.map(order => (
              <div
                key={order.id}
                className="p-3 rounded-xl bg-[#0b0f19] border border-slate-800 flex items-center justify-between text-xs font-mono-num"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      order.type === 'BUY'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {order.type}
                  </span>
                  <div>
                    <span className="font-bold text-slate-200 mr-2">{order.symbol}</span>
                    <span className="text-slate-400">{order.quantity} Shares @ {formatINR(order.price)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold text-slate-300">{formatINR(order.netAmount)}</div>
                  <div className="text-[10px] text-emerald-400 font-medium">COMPLETED</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
