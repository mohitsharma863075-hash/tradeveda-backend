import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';
import { formatINR, formatDateTime } from '../utils/formatters';
import { History, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck } from 'lucide-react';

interface OrdersPageProps {
  onSelectStock: (symbol: string) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ onSelectStock }) => {
  const { account } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.getOrders();
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err: any) {
      console.warn('Orders fetch notice:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, account?.userId]);

  return (
    <div className="space-y-6 pb-12 font-mono-num">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white">Paper Order History</h1>
        <p className="text-xs text-slate-400 mt-1 font-sans">
          Log of all simulated orders executed in your paper trading account.
        </p>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-[#0b0f19] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-slate-100">
              Executed Orders ({orders.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-sans">
            Server-verified virtual orders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1322] border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">ORDER ID & DATE</th>
                <th className="py-3 px-4">SECURITY</th>
                <th className="py-3 px-4">TYPE</th>
                <th className="py-3 px-4">QUANTITY</th>
                <th className="py-3 px-4">EXECUTION PRICE</th>
                <th className="py-3 px-4 hidden md:table-cell">SIMULATED CHARGES</th>
                <th className="py-3 px-4">NET AMOUNT</th>
                <th className="py-3 px-4 hidden sm:table-cell">REALIZED P&L</th>
                <th className="py-3 px-4 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-sans space-y-2">
                    <History className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="font-semibold text-slate-300">No orders executed yet</p>
                    <p className="text-xs text-slate-500">
                      When you place virtual BUY or SELL orders, they will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map(o => {
                  const isBuy = o.type === 'BUY';
                  return (
                    <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 text-slate-400">
                        <div className="font-bold text-slate-300 text-[11px]">{o.id}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(o.createdAt)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onSelectStock(o.symbol)}
                          className="font-bold text-slate-200 hover:text-blue-400 text-left transition-colors"
                        >
                          {o.symbol}
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            isBuy
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {o.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-200">
                        {o.quantity}
                      </td>

                      <td className="py-3.5 px-4 text-slate-200">
                        {formatINR(o.price)}
                      </td>

                      <td className="py-3.5 px-4 hidden md:table-cell text-slate-400">
                        {formatINR(o.charges?.total || 0)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-100">
                        {formatINR(o.netAmount)}
                      </td>

                      <td className="py-3.5 px-4 hidden sm:table-cell font-bold">
                        {o.realizedPnL !== undefined ? (
                          <span className={o.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {o.realizedPnL >= 0 ? '+' : ''}{formatINR(o.realizedPnL)}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3" />
                          COMPLETED
                        </span>
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
