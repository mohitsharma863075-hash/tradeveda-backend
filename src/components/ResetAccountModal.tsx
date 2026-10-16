import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RotateCcw, AlertTriangle, X } from 'lucide-react';

interface ResetAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetSuccess?: () => void;
}

export const ResetAccountModal: React.FC<ResetAccountModalProps> = ({
  isOpen,
  onClose,
  onResetSuccess,
}) => {
  const { setAccount } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = async () => {
    setIsResetting(true);
    setError(null);
    try {
      const res = await api.resetAccount();
      if (res.success) {
        setAccount(res.account);
        if (onResetSuccess) onResetSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset account.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#0f172a] border border-rose-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 bg-rose-950/40 border-b border-rose-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-400">
            <div className="p-1.5 rounded-lg bg-rose-500/20">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-base">Reset Paper Trading Account</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-300 text-xs leading-relaxed">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <p>
              <strong>Caution:</strong> This will delete your virtual holdings, reset your realized & unrealized P&L, clear all paper-trading order history, and restore your virtual balance to <strong>₹10,00,000</strong>.
            </p>
          </div>

          <div className="bg-[#0b0f19] p-3 rounded-lg border border-slate-800 text-xs space-y-1 font-mono-num">
            <div className="flex justify-between text-slate-400">
              <span>New Virtual Balance:</span>
              <span className="font-bold text-emerald-400">₹10,00,000.00</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Virtual Holdings:</span>
              <span className="text-slate-200">0</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total P&L:</span>
              <span className="text-slate-200">₹0.00</span>
            </div>
          </div>

          {error && <p className="text-xs text-rose-400 font-mono-num">{error}</p>}
        </div>

        <div className="p-4 bg-[#0b0f19] border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-all shadow-md shadow-rose-950/40"
          >
            {isResetting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Resetting...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Virtual Account</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
