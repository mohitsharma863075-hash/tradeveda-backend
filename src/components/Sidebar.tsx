import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Bookmark,
  Briefcase,
  History,
  Award,
  Swords,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'markets', label: 'Markets', icon: TrendingUp },
    { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'orders', label: 'Order History', icon: History },
    { id: 'duel', label: 'Trade with Friends (1v1)', icon: Swords },
    { id: 'challenge', label: '30-Day Challenge', icon: Award },
  ];

  return (
    <aside className="w-64 bg-[#0b0f19] border-r border-slate-800 p-4 hidden lg:flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2 block font-mono-num">
            Trading Terminal
          </span>
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Virtual Simulation Badge */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 text-[11px] space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Virtual Environment</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-normal">
          100% Risk-Free paper trading on NSE & BSE securities. Virtual capital of ₹10,00,000.
        </p>
      </div>
    </aside>
  );
};
