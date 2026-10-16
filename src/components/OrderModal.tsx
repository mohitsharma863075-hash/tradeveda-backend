import React, { useState, useEffect } from 'react';
import { StockQuote, EnrichedHolding } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatINR } from '../utils/formatters';
import { ConfirmTradeModal } from './ConfirmTradeModal';
import { StockLogo } from './StockLogo';
import {
  X,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-react';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockQuote;
  defaultType?: 'BUY' | 'SELL';
  userHolding?: EnrichedHolding;
  onTradeSuccess?: () => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  stock,
  defaultType = 'BUY',
  userHolding,
  onTradeSuccess,
}) => {
  const { account, refreshAccount } = useAuth();
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>(defaultType);
  const [quantity, setQuantity] = useState<number>(1);
  const [chargesData, setChargesData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showChargesDetails, setShowChargesDetails] = useState(false);

  useEffect(() => {
    setOrderType(defaultType);
    setQuantity(1);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [defaultType, stock, isOpen]);

  // Back button and modal state event handling for Android
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('tradeveda:order_modal_state', {
        detail: { isOpen, isSubmitting, isConfirmOpen: showConfirm },
      })
    );
  }, [isOpen, isSubmitting, showConfirm]);

  useEffect(() => {
    if (!isOpen) return;

    const handleBackClose = () => {
      if (isSubmitting) return; // Never exit while order is executing

      if (showConfirm) {
        setShowConfirm(false);
      } else {
        onClose();
      }
    };

    window.addEventListener('tradeveda:close_top_modal', handleBackClose);
    return () => window.removeEventListener('tradeveda:close_top_modal', handleBackClose);
  }, [isOpen, showConfirm, isSubmitting, onClose]);

  // Recalculate estimated charges whenever qty or orderType changes
  useEffect(() => {
    if (!isOpen || quantity <= 0) return;

    let isMounted = true;
    const fetchCharges = async () => {
      setIsEstimating(true);
      try {
        const res = await api.estimateCharges(stock.symbol, quantity, orderType);
        if (isMounted && res.success) {
          setChargesData(res);
        }
      } catch {
        // Fallback calculation locally if network glitch
        const totalVal = stock.currentPrice * quantity;
        const bkg = Math.min(totalVal * 0.0003, 20);
        const stt = totalVal * 0.001;
        const ex = totalVal * 0.0000345;
        const gst = (bkg + ex) * 0.18;
        const sd = orderType === 'BUY' ? totalVal * 0.00015 : 0;
        const totalChg = bkg + stt + ex + gst + sd;
        if (isMounted) {
          setChargesData({
            totalValue: totalVal,
            charges: {
              brokerage: bkg,
              stt,
              exchangeCharges: ex,
              gst,
              stampDuty: sd,
              total: totalChg,
            },
            netAmount: orderType === 'BUY' ? totalVal + totalChg : totalVal - totalChg,
          });
        }
      } finally {
        if (isMounted) setIsEstimating(false);
      }
    };

    fetchCharges();
    return () => {
      isMounted = false;
    };
  }, [isOpen, quantity, orderType, stock.symbol, stock.currentPrice]);

  if (!isOpen) return null;

  const currentPrice = stock.currentPrice;
  const availableCash = account?.availableCash || 0;
  const holdingShares = userHolding ? userHolding.quantity : 0;

  const totalValue = Number((currentPrice * quantity).toFixed(2));
  const totalCharges = chargesData?.charges?.total || 0;
  const netAmount = orderType === 'BUY'
    ? Number((totalValue + totalCharges).toFixed(2))
    : Number((totalValue - totalCharges).toFixed(2));

  const cashAfterTrade = orderType === 'BUY'
    ? availableCash - netAmount
    : availableCash + netAmount;

  // Validation
  const validateOrder = (): boolean => {
    setErrorMsg(null);
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      setErrorMsg('Please enter a valid whole quantity greater than 0.');
      return false;
    }

    if (orderType === 'BUY') {
      if (netAmount > availableCash) {
        setErrorMsg(
          `Insufficient virtual balance! Required: ${formatINR(netAmount)}, Available: ${formatINR(availableCash)}.`
        );
        return false;
      }
    } else {
      if (holdingShares <= 0) {
        setErrorMsg(`You do not own any shares of ${stock.symbol} to sell.`);
        return false;
      }
      if (quantity > holdingShares) {
        setErrorMsg(
          `Insufficient holdings! You own ${holdingShares} shares, but tried to sell ${quantity}.`
        );
        return false;
      }
    }

    return true;
  };

  const handleReviewOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateOrder()) {
      setShowConfirm(true);
    }
  };

  const handleExecuteConfirmedTrade = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (orderType === 'BUY') {
        const res = await api.buyStock(stock.symbol, quantity);
        setSuccessMsg(res.message);
      } else {
        const res = await api.sellStock(stock.symbol, quantity);
        setSuccessMsg(res.message);
      }

      await refreshAccount();
      if (onTradeSuccess) onTradeSuccess();

      setShowConfirm(false);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Trade execution failed.');
      setShowConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedSellPnL = userHolding && orderType === 'SELL'
    ? (stock.currentPrice - userHolding.averageBuyPrice) * quantity - totalCharges
    : undefined;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
        <div className="bg-[#0f172a] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0b0f19]">
            <div className="flex items-center gap-3">
              <StockLogo symbol={stock.symbol} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-lg text-slate-100">{stock.symbol}</h2>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono-num font-medium">
                    {stock.exchange}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/20 font-mono-num">
                    PAPER ORDER
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate max-w-xs">{stock.companyName}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Buy / Sell Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-[#0b0f19] border-b border-slate-800 text-sm font-semibold">
            <button
              type="button"
              onClick={() => {
                setOrderType('BUY');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                orderType === 'BUY'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              BUY (Virtual)
            </button>
            <button
              type="button"
              onClick={() => {
                setOrderType('SELL');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                orderType === 'SELL'
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              SELL (Virtual)
            </button>
          </div>

          <form onSubmit={handleReviewOrder} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
            {/* Market Price & Account Status */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#0b0f19] border border-slate-800/80 text-xs font-mono-num">
              <div>
                <span className="text-slate-500 block mb-0.5">Market Price</span>
                <span className="text-lg font-bold text-slate-100">{formatINR(stock.currentPrice)}</span>
                <span
                  className={`text-xs ml-1.5 font-medium ${
                    stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                </span>
              </div>
              <div>
                {orderType === 'BUY' ? (
                  <>
                    <span className="text-slate-500 block mb-0.5">Available Virtual Cash</span>
                    <span className="text-base font-bold text-emerald-400">{formatINR(availableCash)}</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">Virtual Capital</span>
                  </>
                ) : (
                  <>
                    <span className="text-slate-500 block mb-0.5">Available Quantity</span>
                    <span className="text-base font-bold text-blue-400">{holdingShares} Shares</span>
                    {userHolding && (
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Avg: {formatINR(userHolding.averageBuyPrice)}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Quantity Input */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label className="font-medium text-slate-300">Quantity (Shares)</label>
                <div className="flex items-center gap-1.5">
                  {[1, 5, 10, 25, 50].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setQuantity(val)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-mono-num"
                    >
                      +{val}
                    </button>
                  ))}
                  {orderType === 'SELL' && holdingShares > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuantity(holdingShares)}
                      className="px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 text-[11px] font-bold font-mono-num"
                    >
                      MAX
                    </button>
                  )}
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity || ''}
                  onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                  placeholder="Enter number of shares"
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-mono-num text-base font-semibold focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <span className="absolute right-3.5 top-3 text-xs text-slate-500 uppercase font-mono-num">
                  Shares
                </span>
              </div>
            </div>

            {/* Order Type Chip */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0b0f19] border border-slate-800 text-xs">
              <span className="text-slate-400">Order Execution</span>
              <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-500/20 font-semibold font-mono-num">
                MARKET ORDER (Immediate Virtual Fill)
              </span>
            </div>

            {/* Charges Breakdown Accordion */}
            <div className="bg-[#0b0f19] rounded-xl border border-slate-800 p-3 text-xs font-mono-num space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>Estimated Value</span>
                <span className="text-slate-200 font-semibold">{formatINR(totalValue)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <button
                  type="button"
                  onClick={() => setShowChargesDetails(!showChargesDetails)}
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-left transition-colors"
                >
                  <span>Simulated Charges</span>
                  <HelpCircle className="w-3 h-3 text-slate-500" />
                  <span className="text-[10px] text-blue-400 underline">
                    {showChargesDetails ? 'Hide' : 'Breakdown'}
                  </span>
                </button>
                <span className="text-slate-300">+{formatINR(totalCharges)}</span>
              </div>

              {showChargesDetails && chargesData?.charges && (
                <div className="p-2.5 rounded-lg bg-[#0f172a] border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Simulated Brokerage (0.03% or max ₹20):</span>
                    <span className="text-slate-300">{formatINR(chargesData.charges.brokerage)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Simulated STT (0.1%):</span>
                    <span className="text-slate-300">{formatINR(chargesData.charges.stt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Simulated Exchange Charges (0.00345%):</span>
                    <span className="text-slate-300">{formatINR(chargesData.charges.exchangeCharges)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Simulated GST (18%):</span>
                    <span className="text-slate-300">{formatINR(chargesData.charges.gst)}</span>
                  </div>
                  {orderType === 'BUY' && (
                    <div className="flex justify-between">
                      <span>Simulated Stamp Duty (0.015%):</span>
                      <span className="text-slate-300">{formatINR(chargesData.charges.stampDuty)}</span>
                    </div>
                  )}
                  <p className="text-[10px] text-amber-400/90 pt-1 border-t border-slate-800">
                    * Charges are strictly simulated for realistic paper-trading education.
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-200">
                  {orderType === 'BUY' ? 'Total Virtual Cash Required' : 'Net Virtual Proceeds'}
                </span>
                <span className={`font-bold ${orderType === 'BUY' ? 'text-emerald-400' : 'text-blue-400'}`}>
                  {formatINR(netAmount)}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isEstimating || quantity <= 0}
                className={`w-2/3 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-md ${
                  orderType === 'BUY'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40'
                } ${quantity <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {orderType === 'BUY' ? 'Review Buy Order' : 'Review Sell Order'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Two-step Trade Confirmation Modal */}
      <ConfirmTradeModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleExecuteConfirmedTrade}
        isSubmitting={isSubmitting}
        tradeDetails={{
          type: orderType,
          symbol: stock.symbol,
          companyName: stock.companyName,
          quantity,
          price: stock.currentPrice,
          totalValue,
          chargesTotal: totalCharges,
          netAmount,
          cashBeforeTrade: availableCash,
          cashAfterTrade,
          estimatedPnL: estimatedSellPnL,
        }}
      />
    </>
  );
};
