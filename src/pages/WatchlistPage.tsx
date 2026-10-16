import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { WatchlistItem, StockQuote } from '../types';
import { formatINR, formatPercent, formatVolume } from '../utils/formatters';
import { Bookmark, Search, Trash2, TrendingUp, TrendingDown, Plus, ExternalLink } from 'lucide-react';

interface WatchlistPageProps {
  onSelectStock: (symbol: string) => void;
  onOpenOrderModal: (stock: StockQuote, type: 'BUY' | 'SELL') => void;
}

export const WatchlistPage: React.FC<WatchlistPageProps> = ({
  onSelectStock,
  onOpenOrderModal,
}) => {
  const { account } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await api.getWatchlist();
      if (res.success) {
        setWatchlist(res.data);
      }
    } catch (err: any) {
      console.warn('Watchlist fetch notice:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist, account?.userId]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await api.searchStocks(q);
      if (res.success) {
        setSearchResults(res.data.slice(0, 5));
      }
    } catch {
      // ignore
    }
  };

  const handleAddStock = async (stock: StockQuote) => {
    setIsAdding(true);
    try {
      await api.addToWatchlist(stock.symbol, stock.exchange);
      setSearchQuery('');
      setSearchResults([]);
      await fetchWatchlist();
    } catch (err) {
      console.error('Error adding stock:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveStock = async (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.removeFromWatchlist(symbol);
      setWatchlist(prev => prev.filter(item => item.symbol.toUpperCase() !== symbol.toUpperCase()));
    } catch (err) {
      console.error('Error removing from watchlist:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-mono-num">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">Saved Watchlist</h1>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Monitor your favorite Indian stocks with live/delayed quotes and quick order execution.
          </p>
        </div>

        {/* Add Stock Search */}
        <div className="relative w-full sm:w-80">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Add stock to watchlist..."
              className="w-full bg-[#0f172a] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Quick Add Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#0f172a] border border-slate-700 rounded-xl shadow-xl overflow-hidden z-20">
              {searchResults.map(stock => {
                const alreadyAdded = watchlist.some(
                  w => w.symbol.toUpperCase() === stock.symbol.toUpperCase()
                );
                return (
                  <div
                    key={stock.symbol}
                    className="p-2.5 hover:bg-slate-800/80 border-b border-slate-800/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-200 block">{stock.symbol}</span>
                      <span className="text-[11px] text-slate-400 truncate block max-w-[160px] font-sans">
                        {stock.companyName}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddStock(stock)}
                      disabled={alreadyAdded || isAdding}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold ${
                        alreadyAdded
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{alreadyAdded ? 'Added' : 'Add'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Watchlist Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-[#0b0f19] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-slate-100">
              Watchlist Items ({watchlist.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-sans">
            Saved to your user account
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1322] border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">SECURITY</th>
                <th className="py-3 px-4">CURRENT PRICE</th>
                <th className="py-3 px-4">DAY CHANGE</th>
                <th className="py-3 px-4 hidden sm:table-cell">DAY HIGH / LOW</th>
                <th className="py-3 px-4 hidden md:table-cell">VOLUME</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading watchlist...
                  </td>
                </tr>
              ) : watchlist.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans space-y-2">
                    <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="font-semibold text-slate-300">Your watchlist is empty</p>
                    <p className="text-xs text-slate-500">
                      Search above to add Indian stocks like RELIANCE, TCS, INFY to your watchlist.
                    </p>
                  </td>
                </tr>
              ) : (
                watchlist.map(item => {
                  const currentPrice = item.currentPrice || 0;
                  const change = item.change || 0;
                  const changePct = item.changePercent || 0;
                  const isPos = change >= 0;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectStock(item.symbol)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                            {item.symbol}
                          </span>
                          <span className="text-[10px] px-1 bg-slate-800 text-slate-400 rounded">
                            {item.exchange}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 truncate max-w-xs block font-sans">
                          {item.companyName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-100">
                        {formatINR(currentPrice)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold inline-flex items-center gap-0.5 ${
                            isPos ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPos ? '+' : ''}{change.toFixed(2)} ({formatPercent(changePct)})
                        </span>
                      </td>

                      <td className="py-3.5 px-4 hidden sm:table-cell text-slate-400 text-[11px]">
                        <div>H: {formatINR(item.dayHigh || currentPrice * 1.01, 1)}</div>
                        <div>L: {formatINR(item.dayLow || currentPrice * 0.99, 1)}</div>
                      </td>

                      <td className="py-3.5 px-4 hidden md:table-cell text-slate-400">
                        {formatVolume(item.volume)}
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              onOpenOrderModal(
                                {
                                  symbol: item.symbol,
                                  companyName: item.companyName,
                                  exchange: item.exchange,
                                  currentPrice,
                                  change,
                                  changePercent: changePct,
                                  open: currentPrice,
                                  high: item.dayHigh || currentPrice,
                                  low: item.dayLow || currentPrice,
                                  previousClose: currentPrice - change,
                                  volume: item.volume || 100000,
                                  week52High: currentPrice * 1.2,
                                  week52Low: currentPrice * 0.8,
                                  marketStatus: 'MARKET OPEN',
                                  lastUpdated: new Date().toISOString(),
                                  isDelayed: true,
                                  isLive: false,
                                  provider: 'NSE (15m)',
                                },
                                'BUY'
                              )
                            }
                            className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white font-bold text-xs transition-colors"
                          >
                            BUY
                          </button>

                          <button
                            onClick={e => handleRemoveStock(item.symbol, e)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Remove from watchlist"
                          >
                            <Trash2 className="w-4 h-4" />
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
