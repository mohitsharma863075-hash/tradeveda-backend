import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DuelRoom, DuelParticipant, StockQuote } from '../types';
import { formatINR, formatPercent, formatDateTime } from '../utils/formatters';
import { StockLogo } from '../components/StockLogo';
import { resolveWebSocketUrl } from '../services/environment';
import {
  Users,
  Swords,
  Copy,
  Check,
  Share2,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Search,
  Wallet,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Mail,
  ArrowLeft,
  MessageCircle,
} from 'lucide-react';

interface FriendDuelPageProps {
  onSelectStock: (symbol: string) => void;
  initialRoomCode?: string | null;
}

export const FriendDuelPage: React.FC<FriendDuelPageProps> = ({
  onSelectStock,
  initialRoomCode,
}) => {
  const { user } = useAuth();
  const [activeRoom, setActiveRoom] = useState<DuelRoom | null>(null);
  const [allRooms, setAllRooms] = useState<DuelRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  // Simple Join & Create state
  const [joinCodeInput, setJoinCodeInput] = useState(initialRoomCode || '');
  const [createBalance, setCreateBalance] = useState(1000000); // ₹10,00,000
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Trading inside duel state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockQuote[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);
  const [tradeQuantity, setTradeQuantity] = useState(10);
  const [isPlacingTrade, setIsPlacingTrade] = useState(false);
  const [tradeMessage, setTradeMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  const currentUserId = user?.id || '';
  const currentUserName = user?.name || (user?.email ? user.email.split('@')[0] : 'Trader');
  const currentUserEmail = user?.email || '';

  // Fetch real rooms created by actual users
  const fetchRooms = useCallback(async () => {
    try {
      const res = await api.listDuels();
      if (res.success) {
        setAllRooms(res.data);
      }
    } catch (err: any) {
      console.warn('Notice fetching duels:', err.message);
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  // Fetch specific room details
  const fetchRoomDetails = useCallback(async (roomIdOrCode: string) => {
    try {
      const res = await api.getDuel(roomIdOrCode);
      if (res.success && res.data) {
        setActiveRoom(res.data);
      }
    } catch (err: any) {
      console.warn('Notice fetching duel details:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    if (initialRoomCode) {
      fetchRoomDetails(initialRoomCode);
    }
  }, [fetchRooms, fetchRoomDetails, initialRoomCode]);

  // Notify global mobile back-button coordinator about duel room presence
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('tradeveda:duel_room_state', {
        detail: { inRoom: !!activeRoom },
      })
    );
  }, [activeRoom]);

  // Back button listener: Safely leave room back to duel list
  useEffect(() => {
    const handleExitRequest = () => {
      if (activeRoom) {
        setActiveRoom(null);
      }
    };
    window.addEventListener('tradeveda:request_exit_duel', handleExitRequest);
    return () => window.removeEventListener('tradeveda:request_exit_duel', handleExitRequest);
  }, [activeRoom]);

  // Connect WebSocket for real-time room sync
  useEffect(() => {
    if (!activeRoom) return;

    // Clean up any existing connection before opening a new one
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }

    try {
      const wsUrl = resolveWebSocketUrl('/ws');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'JOIN_ROOM', roomId: activeRoom.id }));
        }
      };

      ws.onmessage = event => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'ROOM_UPDATE' && payload.data) {
            setActiveRoom(payload.data);
          }
        } catch {
          // ignore
        }
      };

      ws.onerror = () => {
        // Fallback to polling when WebSockets are unavailable or in offline mode
      };
    } catch {
      // If native backend URL is not configured or fails, polling fallback operates smoothly
    }

    // Polling fallback ensures continuous reliability across network transitions
    const interval = setInterval(() => {
      fetchRoomDetails(activeRoom.id);
    }, 3500);

    return () => {
      clearInterval(interval);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
        wsRef.current = null;
      }
    };
  }, [activeRoom?.id, fetchRoomDetails]);

  // Stock search inside duel
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.searchStocks(searchQuery.trim());
        if (res.success) setSearchResults(res.data);
      } catch {
        // ignore
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Create a 1v1 room
  const handleCreateRoom = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const title = `${currentUserName}'s 1v1 Battle`;
      const res = await api.createDuel({
        title,
        startingBalance: createBalance,
        durationMinutes: 1440,
        email: currentUserEmail,
        userName: currentUserName,
      });
      if (res.success && res.data) {
        setActiveRoom(res.data);
        fetchRooms();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create battle room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Join friend's room
  const handleJoinRoom = async () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) {
      setErrorMessage('Please enter your friend\'s 6-letter room code.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const res = await api.joinDuel(code, currentUserName, currentUserEmail);
      if (res.success && res.data) {
        setActiveRoom(res.data);
        fetchRooms();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not join room. Check the code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute trade inside duel
  const handleDuelTrade = async (type: 'BUY' | 'SELL') => {
    if (!activeRoom || !selectedStock) return;
    if (tradeQuantity <= 0) {
      setTradeMessage('Please enter a valid quantity.');
      return;
    }

    setIsPlacingTrade(true);
    setTradeMessage(null);
    try {
      const res = await api.executeDuelTrade(activeRoom.id, selectedStock.symbol, type, tradeQuantity);
      if (res.success && res.data) {
        setActiveRoom(res.data.room);
        setTradeMessage(res.message);
        setSelectedStock(null);
        setSearchQuery('');
      }
    } catch (err: any) {
      setTradeMessage(err.message || 'Trade execution failed.');
    } finally {
      setIsPlacingTrade(false);
    }
  };

  const handleCopyCode = () => {
    if (!activeRoom) return;
    navigator.clipboard.writeText(activeRoom.code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    if (!activeRoom) return;
    const shareUrl = `${window.location.origin}/?duel=${activeRoom.code}`;
    const text = `TradeVeda par mere sath 1v1 Real Indian Stock Market Paper Trading khelo!\n\nRoom Code: *${activeRoom.code}*\nStarting Balance: ₹${formatINR(activeRoom.startingBalance, 0)}\n\nKhelne ke liye is link par click karo:\n${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const myParticipant = activeRoom?.participants.find(p => p.userId === currentUserId);
  const friendParticipant = activeRoom?.participants.find(p => p.userId !== currentUserId);

  return (
    <div className="space-y-6 pb-12 font-mono-num max-w-6xl mx-auto">
      {/* Page Header */}
      {!activeRoom ? (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Swords className="w-3.5 h-3.5" />
                  <span>100% Real Friends • No Bots / No Fake Users</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Trade With Friends (1v1 Live Battle)
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-sans max-w-2xl leading-relaxed">
                  Apne dost ko WhatsApp par invite karein aur live Indian stock market (NSE) me 1v1 trade karein. Dono players real Gmail ID se authenticate hote hain aur real-time scoreboard par compete karte hain.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-sans block">Verified User</span>
                  <span className="text-xs font-bold text-blue-400 flex items-center gap-1 font-sans">
                    <Mail className="w-3 h-3" />
                    {currentUserEmail.split('@')[0]}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Simple 2-Card Action Grid: Create or Join */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Create Room */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white font-sans">1. Create 1v1 Battle Room</h2>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    Room banakar 6-letter code aur WhatsApp invite apne dost ko bhejein.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs text-slate-400 font-sans font-medium block">
                    Starting Virtual Balance (Har Player ke liye)
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setCreateBalance(500000)}
                      className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        createBalance === 500000
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-[#0b0f19] border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      ₹5,00,000
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateBalance(1000000)}
                      className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        createBalance === 1000000
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-[#0b0f19] border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      ₹10,00,000 (Standard)
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <Swords className="w-4 h-4" />
                <span>{isSubmitting ? 'Creating Room...' : 'Create Private Duel Room'}</span>
              </button>
            </div>

            {/* Card 2: Join with Code */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white font-sans">2. Join Friend's Room</h2>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    Apne dost ka 6-letter Room Code enter karke duel me shamil ho jayein.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs text-slate-400 font-sans font-medium block">
                    Enter 6-Letter Room Code
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={joinCodeInput}
                    onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. ARENA1"
                    className="w-full bg-[#0b0f19] border border-slate-700 rounded-2xl px-4 py-3 text-lg font-black text-center text-white placeholder:text-slate-600 tracking-widest focus:outline-hidden focus:border-emerald-500 uppercase"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleJoinRoom}
                disabled={isSubmitting || !joinCodeInput.trim()}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-sm shadow-xl shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <Users className="w-4 h-4" />
                <span>{isSubmitting ? 'Joining...' : 'Enter Battle with Friend'}</span>
              </button>
            </div>
          </div>

          {/* Active Real User Rooms */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="font-extrabold text-white text-sm">Active Real Battle Rooms</h3>
              </div>
              <button
                type="button"
                onClick={fetchRooms}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {isLoadingRooms ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading active rooms...
              </div>
            ) : allRooms.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs space-y-2">
                <p className="font-medium text-slate-300">Abhi koi battle room open nahi hai.</p>
                <p className="text-[11px] text-slate-500">
                  Apne friend ke sath khelne ke liye upar <strong>"Create Private Duel Room"</strong> par click karein aur WhatsApp par code share karein!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {allRooms.map(room => (
                  <div
                    key={room.id}
                    onClick={() => setActiveRoom(room)}
                    className="p-4 rounded-2xl bg-[#0b0f19] hover:bg-[#131b2e] border border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono-num font-black text-sm text-blue-400">
                          {room.code}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                          {room.participants.length}/2 Players
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-xs truncate">{room.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        Host: {room.creatorName} {room.creatorEmail ? `(${room.creatorEmail})` : ''}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-sans">Cash: ₹{formatINR(room.startingBalance, 0)}</span>
                      <span className="text-blue-400 font-bold">Open Duel →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* INSIDE ACTIVE BATTLE ROOM */
        <div className="space-y-6">
          {/* Room Top Bar */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveRoom(null)}
                className="p-2 rounded-xl bg-[#0b0f19] hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                title="Exit to rooms"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white">{activeRoom.title}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {activeRoom.participants.length === 2 ? '🟢 1v1 Battle Live' : '🟡 Waiting for Friend'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-sans">
                  Starting Balance: <strong>₹{formatINR(activeRoom.startingBalance, 0)}</strong> • Real NSE Delayed Market Rates
                </p>
              </div>
            </div>

            {/* Room Code & Invite Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3.5 py-2 rounded-2xl bg-[#0b0f19] border border-slate-700 flex items-center gap-2">
                <span className="text-xs text-slate-400 font-sans font-medium">Room Code:</span>
                <span className="font-mono-num font-black text-lg text-emerald-400 tracking-wider">
                  {activeRoom.code}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
                  title="Copy Code"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share on WhatsApp</span>
              </button>
            </div>
          </div>

          {/* 1v1 PLAYERS SCOREBOARD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Player 1 Card (Host) */}
            {activeRoom.participants[0] && (
              <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-md">
                      {activeRoom.participants[0].userName[0]?.toUpperCase() || 'P'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-white text-sm">
                          {activeRoom.participants[0].userName}
                        </span>
                        {activeRoom.participants[0].userId === currentUserId && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                            YOU
                          </span>
                        )}
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-bold">
                          HOST
                        </span>
                      </div>
                      <span className="text-xs text-blue-400 font-mono-num flex items-center gap-1 font-sans">
                        <Mail className="w-3 h-3 text-blue-400" />
                        {activeRoom.participants[0].email || 'Verified Google Account'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block">Total P&L</span>
                    <span
                      className={`text-base font-black ${
                        activeRoom.participants[0].pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {activeRoom.participants[0].pnl >= 0 ? '+' : ''}{formatINR(activeRoom.participants[0].pnl)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Portfolio Value</span>
                    <span className="font-bold text-white">
                      {formatINR(activeRoom.participants[0].portfolioValue, 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Available Cash</span>
                    <span className="font-bold text-emerald-400">
                      {formatINR(activeRoom.participants[0].availableCash, 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Trades Made</span>
                    <span className="font-bold text-slate-300">
                      {activeRoom.participants[0].tradesCount}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Player 2 Card (Friend or Waiting) */}
            {activeRoom.participants[1] ? (
              <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center font-black text-white text-base shadow-md">
                      {activeRoom.participants[1].userName[0]?.toUpperCase() || 'F'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-white text-sm">
                          {activeRoom.participants[1].userName}
                        </span>
                        {activeRoom.participants[1].userId === currentUserId && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                            YOU
                          </span>
                        )}
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          FRIEND
                        </span>
                      </div>
                      <span className="text-xs text-blue-400 font-mono-num flex items-center gap-1 font-sans">
                        <Mail className="w-3 h-3 text-blue-400" />
                        {activeRoom.participants[1].email || 'Verified Google Account'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block">Total P&L</span>
                    <span
                      className={`text-base font-black ${
                        activeRoom.participants[1].pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {activeRoom.participants[1].pnl >= 0 ? '+' : ''}{formatINR(activeRoom.participants[1].pnl)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Portfolio Value</span>
                    <span className="font-bold text-white">
                      {formatINR(activeRoom.participants[1].portfolioValue, 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Available Cash</span>
                    <span className="font-bold text-emerald-400">
                      {formatINR(activeRoom.participants[1].availableCash, 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Trades Made</span>
                    <span className="font-bold text-slate-300">
                      {activeRoom.participants[1].tradesCount}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Waiting for Friend to Join Slot (NO FAKE USER!) */
              <div className="bg-[#0f172a]/60 border-2 border-dashed border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center animate-pulse">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm font-sans">
                    Waiting for Friend to Join...
                  </h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    Apne friend ko room code <strong className="text-emerald-400 font-mono-num">{activeRoom.code}</strong> share karein.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Send WhatsApp Invite</span>
                </button>
              </div>
            )}
          </div>

          {/* DUEL TRADING SECTION */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-black text-white text-base flex items-center gap-2">
                  <Swords className="w-5 h-5 text-emerald-400" />
                  <span>Trade Stocks in This Duel</span>
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  Real Indian shares with actual NSE prices and official company logos.
                </p>
              </div>
              {myParticipant && (
                <div className="text-xs text-slate-400 font-sans">
                  Available Duel Cash:{' '}
                  <strong className="text-emerald-400 font-mono-num text-sm">
                    {formatINR(myParticipant.availableCash)}
                  </strong>
                </div>
              )}
            </div>

            {tradeMessage && (
              <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs">
                {tradeMessage}
              </div>
            )}

            {/* Search Stock Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search stock to trade (e.g. RELIANCE, TCS, INFY, TATAMOTORS, HDFCBANK)..."
                className="w-full bg-[#0b0f19] border border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 font-sans"
              />

              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-[#0b0f19] border border-slate-700 rounded-2xl shadow-2xl z-30 max-h-64 overflow-y-auto divide-y divide-slate-800">
                  {searchResults.map(stk => (
                    <button
                      key={stk.symbol}
                      type="button"
                      onClick={() => {
                        setSelectedStock(stk);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="w-full p-3 text-left hover:bg-slate-800/80 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <StockLogo symbol={stk.symbol} size="sm" />
                        <div>
                          <span className="font-bold text-white text-xs block">{stk.symbol}</span>
                          <span className="text-[11px] text-slate-400 truncate max-w-xs block font-sans">
                            {stk.companyName}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white text-xs block">
                          {formatINR(stk.currentPrice)}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            stk.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {stk.change >= 0 ? '+' : ''}{formatPercent(stk.changePercent)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Stock Order Execution Box */}
            {selectedStock && (
              <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-700 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StockLogo symbol={selectedStock.symbol} size="md" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-white text-sm">{selectedStock.symbol}</span>
                        <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-300 font-bold">
                          NSE
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-sans block truncate max-w-xs">
                        {selectedStock.companyName}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-white text-base block">
                      {formatINR(selectedStock.currentPrice)}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        selectedStock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)} ({formatPercent(selectedStock.changePercent)})
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-sans">Quantity:</span>
                    <button
                      type="button"
                      onClick={() => setTradeQuantity(Math.max(1, tradeQuantity - 5))}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={tradeQuantity}
                      onChange={e => setTradeQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center text-sm font-bold text-white focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setTradeQuantity(tradeQuantity + 5)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 text-xs font-sans block">Order Total:</span>
                    <span className="font-black text-white text-base">
                      {formatINR(selectedStock.currentPrice * tradeQuantity)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDuelTrade('BUY')}
                      disabled={isPlacingTrade}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      {isPlacingTrade ? 'Trading...' : 'BUY (Virtual)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuelTrade('SELL')}
                      disabled={isPlacingTrade}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      {isPlacingTrade ? 'Trading...' : 'SELL (Virtual)'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* REAL ACTIVITY FEED (Strictly real trades by the 2 players) */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h4 className="font-black text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>Live Duel Activity (Real Trades)</span>
            </h4>

            {activeRoom.activities && activeRoom.activities.length > 0 ? (
              <div className="divide-y divide-slate-800/80">
                {activeRoom.activities.slice(0, 10).map((act, i) => (
                  <div key={act.id || i} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white">{act.userName}:</span>
                      <span className="text-slate-300 font-sans">{act.message}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-sans shrink-0">
                      {formatDateTime(act.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-sans py-2">
                Abhi koi trade nahi hua hai. Upar diye gaye search box se stock chunein aur pehla trade execute karein!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
