import React, { useEffect, useState } from 'react';
import { MarketStatusInfo } from '../types';
import { api } from '../services/api';
import { Clock } from 'lucide-react';

export const MarketStatusBadge: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [status, setStatus] = useState<MarketStatusInfo | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.getMarketStatus();
        if (res.success) {
          setStatus(res.data);
        }
      } catch {
        // fallback
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (!status) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-400">
        <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse"></span>
        <span>NSE/BSE</span>
      </div>
    );
  }

  const isLive = status.status === 'MARKET OPEN';
  const isPre = status.status === 'PRE-MARKET';
  const isPost = status.status === 'POST-MARKET';

  const dotColor = isLive
    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
    : isPre
    ? 'bg-amber-400'
    : isPost
    ? 'bg-blue-400'
    : 'bg-rose-500';

  const badgeBg = isLive
    ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
    : isPre
    ? 'bg-amber-950/60 border-amber-500/30 text-amber-300'
    : isPost
    ? 'bg-blue-950/60 border-blue-500/30 text-blue-300'
    : 'bg-slate-900 border-slate-800 text-slate-300';

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono-num ${badgeBg}`}>
        <span className={`w-2 h-2 rounded-full ${dotColor} ${isLive ? 'animate-pulse' : ''}`} />
        <span className="font-semibold">{status.status}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono-num ${badgeBg}`}>
      <span className={`w-2 h-2 rounded-full ${dotColor} ${isLive ? 'animate-pulse' : ''}`} />
      <span className="font-semibold tracking-wide">{status.status}</span>
      <span className="text-slate-500 hidden sm:inline">|</span>
      <span className="text-slate-400 hidden sm:inline-flex items-center gap-1">
        <Clock className="w-3 h-3 text-slate-500" />
        {status.currentTimeIST}
      </span>
    </div>
  );
};
