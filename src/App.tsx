import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NetworkProvider } from './context/NetworkContext';
import { NetworkStatusBar } from './components/NetworkStatusBar';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { OrderModal } from './components/OrderModal';
import { LoginGate } from './components/LoginGate';
import { StockQuote, EnrichedHolding } from './types';
import { App as CapApp } from '@capacitor/app';
import {
  initMobileNativeUI,
  exitNativeApp,
  determineBackAction,
} from './services/mobileBridge';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { MarketsPage } from './pages/MarketsPage';
import { StockDetailPage } from './pages/StockDetailPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { OrdersPage } from './pages/OrdersPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { ChallengePage } from './pages/ChallengePage';
import { FriendDuelPage } from './pages/FriendDuelPage';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('RELIANCE');
  const [duelInitialCode, setDuelInitialCode] = useState<string | null>(null);

  const [orderModal, setOrderModal] = useState<{
    isOpen: boolean;
    stock: StockQuote | null;
    type: 'BUY' | 'SELL';
    userHolding?: EnrichedHolding;
  }>({
    isOpen: false,
    stock: null,
    type: 'BUY',
    userHolding: undefined,
  });

  const [orderModalDetail, setOrderModalDetail] = useState<{
    isSubmitting: boolean;
    isConfirmOpen: boolean;
  }>({ isSubmitting: false, isConfirmOpen: false });

  const [isInsideDuelRoom, setIsInsideDuelRoom] = useState<boolean>(false);
  const [lastBackPressTime, setLastBackPressTime] = useState<number>(0);
  const [showExitToast, setShowExitToast] = useState<boolean>(false);

  // Initialize mobile native settings (Status Bar, Keyboard, Splash Screen)
  useEffect(() => {
    initMobileNativeUI();
  }, []);

  // Listen to modal state details from OrderModal
  useEffect(() => {
    const handleModalState = (e: any) => {
      if (e.detail) {
        setOrderModalDetail({
          isSubmitting: !!e.detail.isSubmitting,
          isConfirmOpen: !!e.detail.isConfirmOpen,
        });
      }
    };
    const handleDuelRoomState = (e: any) => {
      if (e.detail) {
        setIsInsideDuelRoom(!!e.detail.inRoom);
      }
    };

    window.addEventListener('tradeveda:order_modal_state', handleModalState);
    window.addEventListener('tradeveda:duel_room_state', handleDuelRoomState);
    return () => {
      window.removeEventListener('tradeveda:order_modal_state', handleModalState);
      window.removeEventListener('tradeveda:duel_room_state', handleDuelRoomState);
    };
  }, []);

  // Wire up Android Hardware & Gesture Back Button using official @capacitor/app
  useEffect(() => {
    let listenerHandle: any = null;

    const setupListener = async () => {
      listenerHandle = await CapApp.addListener('backButton', () => {
        const result = determineBackAction({
          isSubmittingTrade: orderModalDetail.isSubmitting,
          isConfirmModalOpen: orderModalDetail.isConfirmOpen,
          isOrderModalOpen: orderModal.isOpen,
          activeTab,
          isInsideDuelRoom,
          lastBackPressTime,
        });

        setLastBackPressTime(result.updatedPressTime);

        switch (result.action) {
          case 'BLOCKED_SUBMITTING':
            // Order execution in flight: ignore back to avoid corrupted state
            break;
          case 'CLOSE_CONFIRM_MODAL':
            window.dispatchEvent(new CustomEvent('tradeveda:close_top_modal'));
            break;
          case 'CLOSE_ORDER_MODAL':
            handleCloseOrderModal();
            break;
          case 'EXIT_DUEL_ROOM':
            window.dispatchEvent(new CustomEvent('tradeveda:request_exit_duel'));
            break;
          case 'NAVIGATE_BACK_STOCK':
            setActiveTab('markets');
            break;
          case 'NAVIGATE_TO_DASHBOARD':
            setActiveTab('dashboard');
            break;
          case 'PROMPT_DOUBLE_BACK':
            setShowExitToast(true);
            setTimeout(() => setShowExitToast(false), 2000);
            break;
          case 'EXIT_APP':
            exitNativeApp();
            break;
        }
      });
    };

    setupListener();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [orderModal.isOpen, orderModalDetail, activeTab, isInsideDuelRoom, lastBackPressTime]);

  // Check URL query parameters for ?duel=CODE
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const duelCode = urlParams.get('duel');
      if (duelCode) {
        setDuelInitialCode(duelCode.toUpperCase());
        setActiveTab('duel');
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSelectStock = (symbol: string) => {
    setSelectedStockSymbol(symbol.toUpperCase());
    setActiveTab('stock');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenOrderModal = (
    stock: StockQuote,
    type: 'BUY' | 'SELL',
    userHolding?: EnrichedHolding
  ) => {
    setOrderModal({
      isOpen: true,
      stock,
      type,
      userHolding,
    });
  };

  const handleCloseOrderModal = () => {
    setOrderModal(prev => ({ ...prev, isOpen: false, stock: null }));
  };

  // 1. Loading state while checking token
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium">TradeVeda loading...</span>
      </div>
    );
  }

  // 2. Mandatory Login Gate: Without Gmail / Account Login, no entry into the app!
  if (!isAuthenticated) {
    return <LoginGate duelCode={duelInitialCode} />;
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-400">
      {/* Top Paper Trading & Market Freshness Banner */}
      <DisclaimerBanner />

      {/* Main App Navigation Bar */}
      <Navbar
        onSelectStock={handleSelectStock}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Main View */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto max-w-full pb-24 lg:pb-6">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onSelectStock={handleSelectStock}
              setActiveTab={setActiveTab}
              onOpenOrderModal={handleOpenOrderModal}
            />
          )}

          {activeTab === 'markets' && (
            <MarketsPage
              onSelectStock={handleSelectStock}
              onOpenOrderModal={handleOpenOrderModal}
            />
          )}

          {activeTab === 'stock' && (
            <StockDetailPage
              symbol={selectedStockSymbol}
              onBack={() => setActiveTab('markets')}
              onOpenOrderModal={handleOpenOrderModal}
            />
          )}

          {activeTab === 'portfolio' && (
            <PortfolioPage
              onSelectStock={handleSelectStock}
              onOpenOrderModal={handleOpenOrderModal}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersPage onSelectStock={handleSelectStock} />
          )}

          {activeTab === 'watchlist' && (
            <WatchlistPage
              onSelectStock={handleSelectStock}
              onOpenOrderModal={handleOpenOrderModal}
            />
          )}

          {activeTab === 'challenge' && <ChallengePage />}

          {activeTab === 'duel' && (
            <FriendDuelPage
              onSelectStock={handleSelectStock}
              initialRoomCode={duelInitialCode}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Android Double-Back Floating Toast */}
      {showExitToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-slate-700 text-slate-200 text-xs font-medium px-4 py-2 rounded-full shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-none">
          Press back again to exit TradeVeda
        </div>
      )}

      {/* Global Order Modal */}
      {orderModal.isOpen && orderModal.stock && (
        <OrderModal
          isOpen={orderModal.isOpen}
          onClose={handleCloseOrderModal}
          stock={orderModal.stock}
          defaultType={orderModal.type}
          userHolding={orderModal.userHolding}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <NetworkProvider>
      <AuthProvider>
        <NetworkStatusBar />
        <AppContent />
      </AuthProvider>
    </NetworkProvider>
  );
}
