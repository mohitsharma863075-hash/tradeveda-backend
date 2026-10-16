import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  History,
  Swords,
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'markets', label: 'Markets', icon: TrendingUp },
    { id: 'duel', label: '1v1 Duel', icon: Swords },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'orders', label: 'Orders', icon: History },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0b0f19]/95 backdrop-blur-md border-t border-slate-800 px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around font-mono-num">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-all ${
              isActive
                ? 'text-blue-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
