import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { StockQuote, Candle, EnrichedHolding, Order } from '../types';
import { CandlestickChart } from '../components/CandlestickChart';
import { StockLogo } from '../components/StockLogo';
import { formatINR, formatPercent, formatVolume, formatDateTime } from '../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Bookmark,
  BookmarkCheck,
  Clock,
  ShieldCheck,
  PieChart,
  ArrowLeft,
  RefreshCw,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface StockDetailPageProps {
  symbol: string;
  onBack: () => void;
  onOpenOrderModal: (stock: StockQuote, type: 'BUY' | 'SELL', userHolding?: EnrichedHolding) => void;
}

export const StockDetailPage: React.FC<StockDetailPageProps> = ({
  symbol,
  onBack,
  onOpenOrderModal,
}) => {
  const [stock, setStock] = useState<StockQuote | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [timeframe, setTimeframe] = useState<string>('1M');
  const [userHolding, setUserHolding] = useState<EnrichedHolding | undefined>(undefined);
  const [stockOrders, setStockOrders] = useState<Order[]>([]);
  const [isInWatchlist, setIsInWatchlist] = useState<boolean>(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);
  const [isLoadingCandles, setIsLoadingCandles] = useState(true);
  const [candlesError, setCandlesError] = useState<string | null>(null);
  const [isUpdatingWatchlist, setIsUpdatingWatchlist] = useState(false);

  const fetchQuote = useCallback(async () => {
    try {
      const res = await api.getStock(symbol);
      if (res.success) {
        setStock(res.data);
      }
    } catch (err: any) {
      console.error('Error fetching stock quote:', err);
    } finally {
      setIsLoadingQuote(false);
    }
  }, [symbol]);

  const fetchCandles = useCallback(async (tf: string) => {
    setIsLoadingCandles(true);
    setCandlesError(null);
    try {
      const res = await api.getHistory(symbol, tf);
      if (res.success && res.data) {
        setCandles(res.data);
      } else {
        setCandlesError('Market data unavailable for this timeframe.');
      }
    } catch (err: any) {
      console.error('Error fetching candles:', err);
      setCandlesError(err.message || 'Unable to load market data.');
    } finally {
      setIsLoadingCandles(false);
    }
  }, [symbol]);

  const checkUserHoldingAndWatchlist = useCallback(async () => {
    try {
      const [holdingsRes, watchlistRes, ordersRes] = await Promise.all([
        api.getHoldings().catch(() => ({ data: [] })),
        api.getWatchlist().catch(() => ({ data: [] })),
        api.getOrders().catch(() => ({ data: [] })),
      ]);

      if (holdingsRes.data) {
        const found = holdingsRes.data.find(h => h.symbol.toUpperCase() === symbol.toUpperCase());
        setUserHolding(found);
      }

      if (watchlistRes.data) {
        const foundWl = watchlistRes.data.some(w => w.symbol.toUpperCase() === symbol.toUpperCase());
        setIsInWatchlist(foundWl);
      }

      if (ordersRes.data) {
        const matchingOrders = ordersRes.data.filter(
          (o: Order) => o.symbol.toUpperCase() === symbol.toUpperCase()
        );
        setStockOrders(matchingOrders);
      }
    } catch {
      // ignore
    }
  }, [symbol]);

  useEffect(() => {
    setIsLoadingQuote(true);
    fetchQuote();
    fetchCandles(timeframe);
    checkUserHoldingAndWatchlist();
  }, [fetchQuote, fetchCandles, checkUserHoldingAndWatchlist, timeframe]);

  const handleTimeframeChange = (newTf: string) => {
    setTimeframe(newTf);
  };

  const handleToggleWatchlist = async () => {
    if (!stock) return;
    setIsUpdatingWatchlist(true);
    try {
      if (isInWatchlist) {
        await api.removeFromWatchlist(stock.symbol);
        setIsInWatchlist(false);
      } else {
        await api.addToWatchlist(stock.symbol, stock.exchange);
        setIsInWatchlist(true);
      }
    } catch (err) {
      console.error('Error updating watchlist:', err);
    } finally {
      setIsUpdatingWatchlist(false);
    }
  };

  if (isLoadingQuote && !stock) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-3 text-sm text-slate-400 font-mono-num">
          Loading {symbol} real market data...
        </span>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-2xl text-center space-y-4 font-mono-num">
        <h2 className="text-lg font-bold text-slate-200">Stock not found</h2>
        <p className="text-xs text-slate-400">Unable to retrieve market data for {symbol}.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
        >
          Back to Markets
        </button>
      </div>
    );
  }

  const isPositive = stock.change >= 0;

  return (
    <div className="space-y-5 pb-12 font-mono-num">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Markets</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button
            onClick={() => {
              fetchQuote();
              fetchCandles(timeframe);
              checkUserHoldingAndWatchlist();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-xs font-medium"
            title="Refresh Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stock Header & Pricing Card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <StockLogo symbol={stock.symbol} size="xl" className="mt-1" />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-white tracking-tight">{stock.symbol}</h1>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                  {stock.exchange}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-sans font-medium">
                  {stock.provider}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">{stock.companyName}</p>

              <div className="flex items-baseline gap-3 mt-3">
                <span className="text-3xl sm:text-4xl font-black text-slate-100">
                  {formatINR(stock.currentPrice)}
                </span>
                <span
                  className={`text-sm sm:text-base font-extrabold flex items-center gap-1 ${
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {isPositive ? '+' : ''}{formatINR(stock.change)} ({formatPercent(stock.changePercent)})
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onOpenOrderModal(stock, 'BUY', userHolding)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-950/50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>BUY (Virtual)</span>
            </button>
            <button
              onClick={() => onOpenOrderModal(stock, 'SELL', userHolding)}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-950/50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>SELL (Virtual)</span>
            </button>
            <button
              onClick={handleToggleWatchlist}
              disabled={isUpdatingWatchlist}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                isInWatchlist
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {isInWatchlist ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-blue-400" />
                  <span>In Watchlist</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 text-slate-400" />
                  <span>Add to Watchlist</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Existing Holding Position Banner (if user owns shares of this stock) */}
        {userHolding && userHolding.quantity > 0 && (
          <div className="mt-4 p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/25 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-400" />
              <span className="text-slate-300 font-sans">
                Active Position: <strong>{userHolding.quantity} shares</strong> @ avg {formatINR(userHolding.averageBuyPrice)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-400 mr-1.5">Invested:</span>
                <span className="font-semibold text-slate-200">{formatINR(userHolding.totalInvested)}</span>
              </div>
              <div>
                <span className="text-slate-400 mr-1.5">Unrealized P&L:</span>
                <span
                  className={`font-extrabold ${
                    userHolding.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {userHolding.unrealizedPnL >= 0 ? '+' : ''}{formatINR(userHolding.unrealizedPnL)} (
                  {formatPercent(userHolding.pnlPercent)})
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real Interactive Candlestick Chart (Requirements #4, #5, #6, #7, #8, #9, #10, #11, #12, #21) */}
      <CandlestickChart
        candles={candles}
        symbol={stock.symbol}
        timeframe={timeframe}
        onTimeframeChange={handleTimeframeChange}
        isLoading={isLoadingCandles}
        error={candlesError}
        userHolding={userHolding}
        orders={stockOrders}
        currentPrice={stock.currentPrice}
        dataFreshness={{
          isDelayed: stock.isDelayed,
          provider: stock.provider,
        }}
      />

      {/* Prominent Buy / Sell Action Bar below the Chart (Requirement #20) */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <span className="text-xs font-bold text-slate-200 block">
              Paper Order Execution (Virtual Money)
            </span>
            <span className="text-[11px] text-slate-400">
              Immediate simulated fill at prevailing market price ₹{stock.currentPrice.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => onOpenOrderModal(stock, 'BUY', userHolding)}
            className="flex-1 sm:flex-initial px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-950/60 transition-all cursor-pointer text-center"
          >
            [ BUY VIRTUAL ]
          </button>
          <button
            onClick={() => onOpenOrderModal(stock, 'SELL', userHolding)}
            className="flex-1 sm:flex-initial px-8 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm shadow-lg shadow-rose-950/60 transition-all cursor-pointer text-center"
          >
            [ SELL VIRTUAL ]
          </button>
        </div>
      </div>

      {/* Stock Fundamentals & Day Range Metrics */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Market Statistics & Intraday Metrics
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-[#0b0f19] border border-slate-800/80">
            <span className="text-slate-500 block mb-0.5">Open</span>
            <span className="text-sm font-bold text-slate-200">{formatINR(stock.open)}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#0b0f19] border border-slate-800/80">
            <span className="text-slate-500 block mb-0.5">Previous Close</span>
            <span className="text-sm font-bold text-slate-200">{formatINR(stock.previousClose)}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#0b0f19] border border-slate-800/80">
            <span className="text-slate-500 block mb-0.5">Day High</span>
            <span className="text-sm font-bold text-emerald-400">{formatINR(stock.high)}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#0b0f19] border border-slate-800/80">
            <span className="text-slate-500 block mb-0.5">Day Low</span>
            <span className="text-sm font-bold text-rose-400">{formatINR(stock.low)}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#0b0f19] border border-slate-800/80">
            <span className="text-slate-500 block mb-0.5">Volume (NSE)</span>
            <span className="text-sm font-bold text-slate-200">{formatVolume(stock.volume)}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#0b0f19] border border-slate-800/80">
            <span className="text-slate-500 block mb-0.5">52-Week High</span>
            <span className="text-sm font-bold text-emerald-400">{formatINR(stock.week52High)}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#0b0f19] border border-slate-800/80">
            <span className="text-slate-500 block mb-0.5">52-Week Low</span>
            <span className="text-sm font-bold text-rose-400">{formatINR(stock.week52Low)}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#0b0f19] border border-slate-800/80">
            <span className="text-slate-500 block mb-0.5">Last Updated</span>
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              {formatDateTime(stock.lastUpdated)}
            </span>
          </div>
        </div>

        {/* Legal & Educational Notice */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Virtual simulation only. No real orders are placed on exchange.</span>
          </div>
          <span>Provider: {stock.provider}</span>
        </div>
      </div>
    </div>
  );
};
