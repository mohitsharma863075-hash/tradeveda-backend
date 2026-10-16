import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-950/70 border-b border-amber-500/30 text-amber-200 px-3 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1 rounded bg-amber-500/20 text-amber-400 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <strong className="font-semibold text-amber-300 mr-2 tracking-wide uppercase">
              Paper Trading — Virtual Money Only:
            </strong>
            <span className="text-amber-200/90 hidden sm:inline">
              No real orders are placed. No real securities are purchased. All ₹10,00,000 capital and trades are 100% simulated for educational practice.
            </span>
            <span className="text-amber-200/90 sm:hidden">
              Virtual simulation only. No real money or trades involved.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-900/60 border border-amber-600/40 text-amber-300">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Delayed Market Data (NSE ~15m)
          </span>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
            className="text-amber-400 hover:text-amber-200 p-0.5 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
