import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StockQuote } from '../types';
import { formatINR, formatPercent, formatVolume } from '../utils/formatters';
import { StockLogo } from '../components/StockLogo';
import {
  Search,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Layers,
} from 'lucide-react';

interface MarketsPageProps {
  onSelectStock: (symbol: string) => void;
  onOpenOrderModal: (stock: StockQuote, type: 'BUY' | 'SELL') => void;
}

export const MarketsPage: React.FC<MarketsPageProps> = ({
  onSelectStock,
  onOpenOrderModal,
}) => {
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [gainers, setGainers] = useState<StockQuote[]>([]);
  const [losers, setLosers] = useState<StockQuote[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'GAINERS' | 'LOSERS' | 'POPULAR'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const [stocksRes, moversRes] = await Promise.all([
          api.getStocks(),
          api.getMovers(),
        ]);
        if (stocksRes.success) setStocks(stocksRes.data);
        if (moversRes.success) {
          setGainers(moversRes.data.gainers);
          setLosers(moversRes.data.losers);
        }
      } catch (err) {
        console.error('Error loading market data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  const filteredStocks = stocks.filter(s => {
    const matchesSearch =
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.companyName.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'GAINERS') return s.changePercent > 0;
    if (activeFilter === 'LOSERS') return s.changePercent < 0;
    return true;
  });

  return (
    <div className="space-y-6 pb-12 font-mono-num">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">Indian Equities Market</h1>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            NSE & BSE stock quotes with real-time and delayed market pricing for paper trading.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search stock symbol..."
            className="w-full bg-[#0f172a] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl border transition-all ${
            activeFilter === 'ALL'
              ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
              : 'bg-[#0f172a] border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          All Equities ({stocks.length})
        </button>
        <button
          onClick={() => setActiveFilter('GAINERS')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border transition-all ${
            activeFilter === 'GAINERS'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
              : 'bg-[#0f172a] border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Top Gainers</span>
        </button>
        <button
          onClick={() => setActiveFilter('LOSERS')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border transition-all ${
            activeFilter === 'LOSERS'
              ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
              : 'bg-[#0f172a] border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowDownRight className="w-3.5 h-3.5" />
          <span>Top Losers</span>
        </button>
      </div>

      {/* Stocks Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1322] border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">SECURITY</th>
                <th className="py-3 px-4">CURRENT PRICE</th>
                <th className="py-3 px-4">CHANGE</th>
                <th className="py-3 px-4 hidden sm:table-cell">DAY HIGH / LOW</th>
                <th className="py-3 px-4 hidden md:table-cell">52W HIGH / LOW</th>
                <th className="py-3 px-4 hidden lg:table-cell">VOLUME</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading Indian market quotes...
                  </td>
                </tr>
              ) : filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                    No stocks matching "{search}"
                  </td>
                </tr>
              ) : (
                filteredStocks.map(stock => {
                  const isPos = stock.change >= 0;
                  return (
                    <tr
                      key={stock.symbol}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      onClick={() => onSelectStock(stock.symbol)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <StockLogo symbol={stock.symbol} size="md" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                                {stock.symbol}
                              </span>
                              <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400">
                                {stock.exchange}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 truncate block max-w-xs font-sans">
                              {stock.companyName}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-100">
                        {formatINR(stock.currentPrice)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold inline-flex items-center gap-0.5 ${
                            isPos ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPos ? '+' : ''}{stock.change.toFixed(2)} ({formatPercent(stock.changePercent)})
                        </span>
                      </td>

                      <td className="py-3.5 px-4 hidden sm:table-cell text-slate-400 text-[11px]">
                        <div>H: {formatINR(stock.high, 1)}</div>
                        <div>L: {formatINR(stock.low, 1)}</div>
                      </td>

                      <td className="py-3.5 px-4 hidden md:table-cell text-slate-400 text-[11px]">
                        <div>H: {formatINR(stock.week52High, 1)}</div>
                        <div>L: {formatINR(stock.week52Low, 1)}</div>
                      </td>

                      <td className="py-3.5 px-4 hidden lg:table-cell text-slate-400">
                        {formatVolume(stock.volume)}
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenOrderModal(stock, 'BUY')}
                            className="px-3 py-1 rounded-md bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white font-bold text-xs transition-colors"
                          >
                            BUY
                          </button>
                          <button
                            onClick={() => onOpenOrderModal(stock, 'SELL')}
                            className="px-3 py-1 rounded-md bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white font-bold text-xs transition-colors"
                          >
                            SELL
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
