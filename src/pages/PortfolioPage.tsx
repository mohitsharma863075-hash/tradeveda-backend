import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { EnrichedHolding, StockQuote } from '../types';
import { formatINR, formatPercent } from '../utils/formatters';
import { ResetAccountModal } from '../components/ResetAccountModal';
import { StockLogo } from '../components/StockLogo';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  PieChart,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
} from 'lucide-react';

interface PortfolioPageProps {
  onSelectStock: (symbol: string) => void;
  onOpenOrderModal: (stock: StockQuote, type: 'BUY' | 'SELL', holding?: EnrichedHolding) => void;
}

export const PortfolioPage: React.FC<PortfolioPageProps> = ({
  onSelectStock,
  onOpenOrderModal,
}) => {
  const { account, refreshAccount } = useAuth();
  const [holdings, setHoldings] = useState<EnrichedHolding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);

  const fetchPortfolio = useCallback(async () => {
    try {
      const res = await api.getPortfolio();
      if (res.success && res.data) {
        setHoldings(res.data.holdings);
      }
    } catch (err: any) {
      console.warn('Portfolio fetch notice:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio, refreshAccount, account?.userId]);

  const availableCash = account?.availableCash ?? 1000000;
  const investedAmount = account?.investedValue ?? 0;
  const portfolioValue = account?.portfolioValue ?? 1000000;
  const unrealizedPnL = account?.unrealizedPnL ?? 0;
  const realizedPnL = account?.realizedPnL ?? 0;
  const totalPnL = account?.totalPnL ?? 0;
  const totalReturn = account?.totalReturnPercent ?? 0;
  const todayPnL = account?.todayPnL ?? 0;

  return (
    <div className="space-y-6 pb-12 font-mono-num">
      {/* Header & Reset Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">Virtual Portfolio</h1>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Track your open equity positions, invested capital, and unrealized profit & loss.
          </p>
        </div>

        <button
          onClick={() => setShowResetModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-bold text-xs transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          <span>Reset Paper Account (₹10,00,000)</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] text-slate-400 block mb-1">Total Portfolio Value</span>
          <div className="text-lg sm:text-xl font-bold text-slate-100">{formatINR(portfolioValue)}</div>
          <span className="text-[11px] text-slate-500 font-sans">Cash + Current Holdings</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] text-slate-400 block mb-1">Available Virtual Cash</span>
          <div className="text-lg sm:text-xl font-bold text-emerald-400">{formatINR(availableCash)}</div>
          <span className="text-[11px] text-slate-500 font-sans">Available for buying</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] text-slate-400 block mb-1">Invested Capital</span>
          <div className="text-lg sm:text-xl font-bold text-slate-200">{formatINR(investedAmount)}</div>
          <span className="text-[11px] text-slate-500 font-sans">Original purchase cost</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] text-slate-400 block mb-1">Total P&L (Return)</span>
          <div className={`text-lg sm:text-xl font-bold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalPnL >= 0 ? '+' : ''}{formatINR(totalPnL)}
          </div>
          <span className={`text-[11px] font-semibold ${totalReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatPercent(totalReturn)} overall
          </span>
        </div>
      </div>

      {/* Secondary P&L Breakdown Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#0b0f19] rounded-xl border border-slate-800 text-xs">
        <div>
          <span className="text-slate-500 block mb-0.5">Today's P&L:</span>
          <span className={`font-bold ${todayPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {todayPnL >= 0 ? '+' : ''}{formatINR(todayPnL)}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block mb-0.5">Unrealized P&L:</span>
          <span className={`font-bold ${unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {unrealizedPnL >= 0 ? '+' : ''}{formatINR(unrealizedPnL)}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block mb-0.5">Realized P&L (Closed Trades):</span>
          <span className={`font-bold ${realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {realizedPnL >= 0 ? '+' : ''}{formatINR(realizedPnL)}
          </span>
        </div>
      </div>

      {/* Holdings Table (Requirement #20) */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-[#0b0f19] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-slate-100">
              Holdings ({holdings.length} Securities)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-sans">
            Valued at current NSE market quotes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1322] border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">SECURITY</th>
                <th className="py-3 px-4">QUANTITY</th>
                <th className="py-3 px-4">AVG BUY PRICE</th>
                <th className="py-3 px-4">CURRENT PRICE</th>
                <th className="py-3 px-4 hidden md:table-cell">INVESTED VALUE</th>
                <th className="py-3 px-4">CURRENT VALUE</th>
                <th className="py-3 px-4">UNREALIZED P&L</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Calculating portfolio holdings...
                  </td>
                </tr>
              ) : holdings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-sans space-y-2">
                    <Briefcase className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="font-semibold text-slate-300">No active stock holdings yet</p>
                    <p className="text-xs text-slate-500">
                      Use your ₹10,00,000 virtual balance to buy shares from the Markets page.
                    </p>
                  </td>
                </tr>
              ) : (
                holdings.map(h => {
                  const isPnLPos = h.unrealizedPnL >= 0;
                  return (
                    <tr key={h.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onSelectStock(h.symbol)}
                          className="text-left group flex items-center gap-3 cursor-pointer"
                        >
                          <StockLogo symbol={h.symbol} size="md" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                                {h.symbol}
                              </span>
                              <span className="text-[10px] px-1 bg-slate-800 text-slate-400 rounded">
                                {h.exchange}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 truncate max-w-xs block font-sans">
                              {h.companyName}
                            </span>
                          </div>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-200">
                        {h.quantity}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {formatINR(h.averageBuyPrice)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-100">
                        {formatINR(h.currentPrice)}
                      </td>

                      <td className="py-3.5 px-4 hidden md:table-cell text-slate-300">
                        {formatINR(h.totalInvested)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-100">
                        {formatINR(h.currentValue)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div
                          className={`font-bold inline-flex items-center gap-0.5 ${
                            isPnLPos ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPnLPos ? '+' : ''}{formatINR(h.unrealizedPnL)} ({formatPercent(h.pnlPercent)})
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              onOpenOrderModal(
                                {
                                  symbol: h.symbol,
                                  companyName: h.companyName,
                                  exchange: h.exchange,
                                  currentPrice: h.currentPrice,
                                  change: 0,
                                  changePercent: 0,
                                  open: h.currentPrice,
                                  high: h.dayHigh,
                                  low: h.dayLow,
                                  previousClose: h.currentPrice,
                                  volume: 100000,
                                  week52High: h.currentPrice * 1.2,
                                  week52Low: h.currentPrice * 0.8,
                                  marketStatus: 'MARKET OPEN',
                                  lastUpdated: new Date().toISOString(),
                                  isDelayed: true,
                                  isLive: false,
                                  provider: 'NSE (15m)',
                                },
                                'BUY',
                                h
                              )
                            }
                            className="px-2.5 py-1 rounded-md bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white font-bold text-xs transition-colors"
                          >
                            BUY MORE
                          </button>
                          <button
                            onClick={() =>
                              onOpenOrderModal(
                                {
                                  symbol: h.symbol,
                                  companyName: h.companyName,
                                  exchange: h.exchange,
                                  currentPrice: h.currentPrice,
                                  change: 0,
                                  changePercent: 0,
                                  open: h.currentPrice,
                                  high: h.dayHigh,
                                  low: h.dayLow,
                                  previousClose: h.currentPrice,
                                  volume: 100000,
                                  week52High: h.currentPrice * 1.2,
                                  week52Low: h.currentPrice * 0.8,
                                  marketStatus: 'MARKET OPEN',
                                  lastUpdated: new Date().toISOString(),
                                  isDelayed: true,
                                  isLive: false,
                                  provider: 'NSE (15m)',
                                },
                                'SELL',
                                h
                              )
                            }
                            className="px-2.5 py-1 rounded-md bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white font-bold text-xs transition-colors"
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

      <ResetAccountModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onResetSuccess={() => {
          fetchPortfolio();
          refreshAccount();
        }}
      />
    </div>
  );
};
