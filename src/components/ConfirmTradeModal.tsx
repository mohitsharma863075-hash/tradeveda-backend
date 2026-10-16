import React from 'react';
import { formatINR } from '../utils/formatters';
import { AlertCircle, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';

interface ConfirmTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  tradeDetails: {
    type: 'BUY' | 'SELL';
    symbol: string;
    companyName: string;
    quantity: number;
    price: number;
    totalValue: number;
    chargesTotal: number;
    netAmount: number;
    cashBeforeTrade: number;
    cashAfterTrade: number;
    estimatedPnL?: number;
  };
}

export const ConfirmTradeModal: React.FC<ConfirmTradeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  tradeDetails,
}) => {
  if (!isOpen) return null;

  const isBuy = tradeDetails.type === 'BUY';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#0f172a] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`p-4 border-b ${isBuy ? 'border-emerald-500/20 bg-emerald-950/20' : 'border-rose-500/20 bg-rose-950/20'}`}>
          <div className="flex items-center gap-2">
            {isBuy ? (
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                <ArrowDownRight className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                Confirm Paper Trade
              </h3>
              <p className="text-xs text-slate-400">
                {isBuy ? 'Place virtual market buy order' : 'Place virtual market sell order'}
              </p>
            </div>
          </div>
        </div>

        {/* Trade Details Summary */}
        <div className="p-5 space-y-4 text-sm font-mono-num">
          <div className="bg-[#0b0f19] p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Security</span>
              <span className="font-bold text-slate-200">{tradeDetails.symbol} (NSE)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Action</span>
              <span className={`font-bold ${isBuy ? 'text-emerald-400' : 'text-rose-400'}`}>
                {tradeDetails.type} {tradeDetails.quantity} Shares
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Execution Price</span>
              <span className="font-semibold text-slate-200">{formatINR(tradeDetails.price)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Gross Value</span>
              <span className="font-semibold text-slate-200">{formatINR(tradeDetails.totalValue)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Simulated Charges</span>
              <span className="text-slate-300">+{formatINR(tradeDetails.chargesTotal)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-base">
              <span className="font-semibold text-slate-200">
                {isBuy ? 'Net Amount Deducted' : 'Net Proceeds Credited'}
              </span>
              <span className={`font-bold ${isBuy ? 'text-emerald-400' : 'text-blue-400'}`}>
                {formatINR(tradeDetails.netAmount)}
              </span>
            </div>
            {!isBuy && tradeDetails.estimatedPnL !== undefined && (
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Estimated Realized P&L</span>
                <span className={`font-bold ${tradeDetails.estimatedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {tradeDetails.estimatedPnL >= 0 ? '+' : ''}{formatINR(tradeDetails.estimatedPnL)}
                </span>
              </div>
            )}
          </div>

          {/* Cash Balance Impact */}
          <div className="bg-[#131b2e] p-3 rounded-lg border border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Available Cash Before Trade:</span>
              <span className="text-slate-300">{formatINR(tradeDetails.cashBeforeTrade)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-slate-300">Virtual Cash After Trade:</span>
              <span className="text-emerald-400">{formatINR(tradeDetails.cashAfterTrade)}</span>
            </div>
          </div>

          {/* Educational Disclaimer Note */}
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/20 text-blue-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Simulated Order:</strong> This order executes virtually. No real money or real securities are transacted.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-[#0b0f19] border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all shadow-md ${
              isBuy
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/30'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Executing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isBuy ? 'Confirm Buy' : 'Confirm Sell'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
