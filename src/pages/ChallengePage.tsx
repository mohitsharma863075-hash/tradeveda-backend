import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ChallengeStats } from '../types';
import { formatINR, formatPercent } from '../utils/formatters';
import { Award, Trophy, Target, TrendingUp, CheckCircle, Flame, Calendar } from 'lucide-react';

export const ChallengePage: React.FC = () => {
  const { account } = useAuth();
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const res = await api.getChallengeStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Error fetching challenge stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallenge();
  }, [account]);

  const currentCapital = stats?.currentValue ?? (account?.portfolioValue ?? 1000000);
  const startingCapital = stats?.startingCapital ?? 1000000;
  const returnPct = stats?.returnPercent ?? (account?.totalReturnPercent ?? 0);
  const trades = stats?.tradesCount ?? (account?.tradesCount ?? 0);
  const profitTrades = stats?.profitTrades ?? (account?.profitableTradesCount ?? 0);
  const lossTrades = stats?.lossTrades ?? (account?.lossTradesCount ?? 0);
  const winRate = stats?.winRate ?? 0;
  const daysRemaining = stats?.daysRemaining ?? 30;

  return (
    <div className="space-y-6 pb-12 font-mono-num">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-400" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            30-Day Paper Trading Challenge
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1 font-sans">
          Practice discipline and achieve profitable risk-adjusted returns over a simulated 30-day period.
        </p>
      </div>

      {/* Main Challenge Progress Hero Card */}
      <div className="bg-gradient-to-br from-blue-950/70 via-[#0f172a] to-emerald-950/30 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Active Challenge Season
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {daysRemaining} Days Remaining
              </span>
            </div>

            <div className="text-xs text-slate-400 mb-1">Current Challenge Equity</div>
            <div className="text-3xl sm:text-4xl font-black text-white">
              {formatINR(currentCapital)}
            </div>

            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-slate-400">Starting: {formatINR(startingCapital)}</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  returnPct >= 0
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {returnPct >= 0 ? '+' : ''}{formatPercent(returnPct)}
              </span>
            </div>
          </div>

          {/* Win Rate Meter */}
          <div className="bg-[#0b0f19]/80 border border-slate-800 p-4 rounded-xl min-w-[220px] text-center">
            <span className="text-xs text-slate-400 block mb-1">Trader Win Rate</span>
            <div className="text-3xl font-extrabold text-blue-400">{winRate}%</div>
            <div className="text-[11px] text-slate-500 mt-1">
              {profitTrades} Won / {lossTrades} Lost ({trades} Total)
            </div>
          </div>
        </div>

        {/* Progress Bar toward +10% target */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-sans">
            <span>Challenge Target: +10% Virtual Return (₹11,00,000)</span>
            <span className="font-mono-num font-semibold text-slate-200">
              {Math.min(100, Math.max(0, (returnPct / 10) * 100)).toFixed(0)}% Completed
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, (returnPct / 10) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Rules & Milestones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0f172a] border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 w-fit">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-slate-200">Rule 1: Capital Preservation</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Never risk more than 2% of your virtual ₹10,00,000 capital on any single stock trade. Keep adequate cash buffer.
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-slate-200">Rule 2: Realistic Charges</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            All trades calculate simulated brokerage, STT, and exchange taxes so you experience realistic net profit margins.
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 w-fit">
            <Trophy className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-slate-200">Rule 3: Trade Consistency</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Execute at least 5 paper trades during the challenge period to qualify for the virtual trading leaderboard badge.
          </p>
        </div>
      </div>
    </div>
  );
};
