import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { MarketStatusBadge } from './MarketStatusBadge';
import { AuthModal } from './AuthModal';
import { ResetAccountModal } from './ResetAccountModal';
import { formatINR } from '../utils/formatters';
import { api } from '../services/api';
import { StockQuote } from '../types';
import {
  Search,
  RotateCcw,
  User as UserIcon,
  LogOut,
  TrendingUp,
  Wallet,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  onSelectStock: (symbol: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSelectStock, setActiveTab }) => {
  const { user, account, logout, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockQuote[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.searchStocks(searchQuery);
        if (res.success) {
          setSearchResults(res.data);
          setShowSearchDropdown(true);
        }
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside search listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (symbol: string) => {
    onSelectStock(symbol);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  const availableCash = account?.availableCash ?? 1000000;
  const portfolioVal = account?.portfolioValue ?? 1000000;

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white">
                    Trade<span className="text-emerald-400">Veda</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider font-mono-num">
                    PAPER
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block -mt-0.5 hidden sm:block">
                  NSE & BSE Virtual Trading Simulator
                </span>
              </div>
            </button>
          </div>

          {/* Central Live Search Bar */}
          <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
                placeholder="Search Indian stocks (e.g. RELIANCE, TCS, INFY, HDFC)..."
                className="w-full bg-[#111827] border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden transition-colors font-mono-num"
              />
              {isSearching && (
                <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin absolute right-3 top-3" />
              )}
            </div>

            {/* Search Dropdown Results */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 bg-[#0b0f19] border-b border-slate-800 flex justify-between">
                  <span>INDIAN SECURITIES (NSE)</span>
                  <span>CURRENT PRICE</span>
                </div>
                {searchResults.map(stock => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleSelectResult(stock.symbol)}
                    className="w-full px-3 py-2 text-left hover:bg-slate-800/80 border-b border-slate-800/50 flex items-center justify-between transition-colors font-mono-num text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-100">{stock.symbol}</span>
                        <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400">
                          {stock.exchange}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 truncate block max-w-xs">
                        {stock.companyName}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold text-slate-200">{formatINR(stock.currentPrice)}</div>
                      <div
                        className={`text-[11px] font-medium ${
                          stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Header Controls: Market Status, Virtual Balance Chip, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Market Status */}
            <MarketStatusBadge />

            {/* Virtual Cash Pill */}
            <button
              onClick={() => setActiveTab('portfolio')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111827] border border-slate-800 hover:border-emerald-500/40 text-left transition-all"
            >
              <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <div className="font-mono-num leading-tight">
                <span className="text-[10px] text-slate-400 block font-medium">Virtual Cash</span>
                <span className="text-xs font-bold text-emerald-400">{formatINR(availableCash, 0)}</span>
              </div>
            </button>

            {/* User Profile / Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                    {user?.name?.[0]?.toUpperCase() || 'T'}
                  </div>
                  <span className="hidden sm:inline font-medium truncate max-w-[100px]">{user?.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[#0f172a] border border-slate-700 rounded-xl shadow-xl overflow-hidden py-1 z-50 text-xs font-mono-num animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3.5 py-2.5 border-b border-slate-800">
                      <span className="font-bold text-slate-100 block">{user?.name}</span>
                      <span className="text-slate-400 text-[11px] truncate block">{user?.email}</span>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400">
                        <Sparkles className="w-3 h-3" />
                        <span>Portfolio: {formatINR(portfolioVal, 0)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowResetModal(true);
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-800 text-amber-300 flex items-center gap-2 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Virtual Account (₹10L)</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-800 text-rose-400 flex items-center gap-2 transition-colors border-t border-slate-800"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs transition-colors shadow-sm cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Gmail Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Reset Account Modal */}
      <ResetAccountModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onResetSuccess={() => {
          setActiveTab('dashboard');
        }}
      />
    </>
  );
};
