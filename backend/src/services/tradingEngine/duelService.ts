import { marketDataProvider } from '../marketData/marketDataProvider';
import { ChargesCalculator } from './chargesCalculator';
import { WebSocket } from 'ws';

export interface DuelParticipantHolding {
  symbol: string;
  companyName: string;
  quantity: number;
  averageBuyPrice: number;
  totalInvested: number;
  currentPrice?: number;
  currentValue?: number;
  unrealizedPnL?: number;
  pnlPercent?: number;
}

export interface DuelOrder {
  id: string;
  userId: string;
  userName: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  charges: number;
  netAmount: number;
  createdAt: string;
}

export interface DuelActivity {
  id: string;
  userId: string;
  userName: string;
  type: 'JOIN' | 'START' | 'TRADE' | 'CHAT';
  message: string;
  timestamp: string;
}

export interface DuelParticipant {
  userId: string;
  userName: string;
  email?: string;
  isHost: boolean;
  joinedAt: string;
  startingBalance: number;
  availableCash: number;
  investedValue: number;
  portfolioValue: number;
  pnl: number;
  pnlPercent: number;
  tradesCount: number;
  winCount: number;
  lossCount: number;
  holdings: DuelParticipantHolding[];
  orders: DuelOrder[];
}

export interface DuelRoom {
  id: string;
  code: string;
  title: string;
  creatorId: string;
  creatorName: string;
  creatorEmail?: string;
  startingBalance: number;
  durationMinutes: number;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED';
  createdAt: string;
  startedAt?: string;
  expiresAt?: string;
  participants: DuelParticipant[];
  activities: DuelActivity[];
}

// Global active WebSocket client subscriptions by roomId
const roomSubscriptions = new Map<string, Set<WebSocket>>();

export class DuelService {
  private rooms: Map<string, DuelRoom> = new Map();

  constructor() {
    // Strictly real rooms only - no fake demo rooms or fake users
  }

  public generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public async createRoom(
    creatorId: string,
    creatorName: string,
    title: string,
    startingBalance: number = 500000,
    durationMinutes: number = 1440,
    creatorEmail?: string
  ): Promise<DuelRoom> {
    const id = `duel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let code = this.generateCode();
    while (Array.from(this.rooms.values()).some(r => r.code === code)) {
      code = this.generateCode();
    }

    const hostParticipant: DuelParticipant = {
      userId: creatorId,
      userName: creatorName || 'Host Trader',
      email: creatorEmail,
      isHost: true,
      joinedAt: new Date().toISOString(),
      startingBalance,
      availableCash: startingBalance,
      investedValue: 0,
      portfolioValue: startingBalance,
      pnl: 0,
      pnlPercent: 0,
      tradesCount: 0,
      winCount: 0,
      lossCount: 0,
      holdings: [],
      orders: [],
    };

    const room: DuelRoom = {
      id,
      code,
      title: title || `${creatorName}'s Paper Trading Duel`,
      creatorId,
      creatorName: creatorName || 'Host Trader',
      creatorEmail,
      startingBalance,
      durationMinutes,
      status: 'WAITING',
      createdAt: new Date().toISOString(),
      participants: [hostParticipant],
      activities: [
        {
          id: `act_${Date.now()}`,
          userId: creatorId,
          userName: creatorName,
          type: 'JOIN',
          message: `${creatorName} (${creatorEmail || 'Gmail'}) created the duel room with ₹${startingBalance.toLocaleString('en-IN')} virtual cash.`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    this.rooms.set(id, room);
    return room;
  }

  public async joinRoom(
    codeOrId: string,
    userId: string,
    userName: string,
    userEmail?: string
  ): Promise<DuelRoom> {
    const normalized = codeOrId.trim().toUpperCase();
    const room =
      this.rooms.get(codeOrId) ||
      Array.from(this.rooms.values()).find(
        r => r.code.toUpperCase() === normalized || r.id === codeOrId
      );

    if (!room) {
      throw new Error(`Duel room with code "${codeOrId}" not found. Please check the code and try again.`);
    }

    // Check if user already joined
    const existing = room.participants.find(p => p.userId === userId || (userEmail && p.email === userEmail));
    if (existing) {
      if (userEmail && !existing.email) existing.email = userEmail;
      if (userName && existing.userName !== userName) existing.userName = userName;
      return this.refreshRoomPortfolios(room.id);
    }

    // Add as participant
    const participant: DuelParticipant = {
      userId,
      userName: userName || `Trader ${room.participants.length + 1}`,
      email: userEmail,
      isHost: false,
      joinedAt: new Date().toISOString(),
      startingBalance: room.startingBalance,
      availableCash: room.startingBalance,
      investedValue: 0,
      portfolioValue: room.startingBalance,
      pnl: 0,
      pnlPercent: 0,
      tradesCount: 0,
      winCount: 0,
      lossCount: 0,
      holdings: [],
      orders: [],
    };

    room.participants.push(participant);

    // If 2 or more participants, automatically transition to ACTIVE
    if (room.status === 'WAITING' && room.participants.length >= 2) {
      room.status = 'ACTIVE';
      room.startedAt = new Date().toISOString();
      room.expiresAt = new Date(Date.now() + room.durationMinutes * 60 * 1000).toISOString();
    }

    room.activities.push({
      id: `act_${Date.now()}`,
      userId,
      userName: participant.userName,
      type: 'JOIN',
      message: `${participant.userName} (${userEmail || 'Gmail'}) joined the trading duel!`,
      timestamp: new Date().toISOString(),
    });

    this.broadcastUpdate(room.id);
    return this.refreshRoomPortfolios(room.id);
  }

  public async startRoom(roomId: string, userId: string): Promise<DuelRoom> {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found.');
    if (room.creatorId !== userId) {
      throw new Error('Only the room creator can manually start the battle.');
    }

    room.status = 'ACTIVE';
    room.startedAt = new Date().toISOString();
    room.expiresAt = new Date(Date.now() + room.durationMinutes * 60 * 1000).toISOString();

    room.activities.push({
      id: `act_${Date.now()}`,
      userId,
      userName: room.creatorName,
      type: 'START',
      message: `The trading battle has officially started! Good luck traders.`,
      timestamp: new Date().toISOString(),
    });

    this.broadcastUpdate(room.id);
    return room;
  }

  public async executeTrade(
    roomId: string,
    userId: string,
    symbol: string,
    type: 'BUY' | 'SELL',
    quantity: number
  ): Promise<{ room: DuelRoom; order: DuelOrder }> {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found.');
    if (room.status !== 'ACTIVE' && room.status !== 'WAITING') {
      throw new Error('This trading duel has ended.');
    }

    const participant = room.participants.find(p => p.userId === userId);
    if (!participant) {
      throw new Error('You are not a registered participant in this duel.');
    }

    if (quantity <= 0 || !Number.isInteger(quantity)) {
      throw new Error('Quantity must be a positive whole number.');
    }

    // Get live/delayed market quote
    const quote = await marketDataProvider.getQuote(symbol);
    const executionPrice = quote.currentPrice;
    const grossValue = Number((executionPrice * quantity).toFixed(2));
    const charges = ChargesCalculator.calculate(type, grossValue);

    if (type === 'BUY') {
      const totalCost = Number((grossValue + charges.total).toFixed(2));
      if (participant.availableCash < totalCost) {
        throw new Error(
          `Insufficient duel cash. Required: ₹${totalCost.toLocaleString('en-IN')}, Available: ₹${participant.availableCash.toLocaleString('en-IN')}`
        );
      }

      participant.availableCash = Number((participant.availableCash - totalCost).toFixed(2));

      // Update holdings
      const existingHolding = participant.holdings.find(
        h => h.symbol.toUpperCase() === symbol.toUpperCase()
      );

      if (existingHolding) {
        const newQty = existingHolding.quantity + quantity;
        const newInvested = Number((existingHolding.totalInvested + grossValue).toFixed(2));
        existingHolding.quantity = newQty;
        existingHolding.totalInvested = newInvested;
        existingHolding.averageBuyPrice = Number((newInvested / newQty).toFixed(2));
      } else {
        participant.holdings.push({
          symbol: quote.symbol,
          companyName: quote.companyName,
          quantity,
          averageBuyPrice: executionPrice,
          totalInvested: grossValue,
        });
      }
    } else {
      // SELL
      const existingHolding = participant.holdings.find(
        h => h.symbol.toUpperCase() === symbol.toUpperCase()
      );

      if (!existingHolding || existingHolding.quantity < quantity) {
        throw new Error(
          `Insufficient shares to sell. You have ${existingHolding ? existingHolding.quantity : 0} shares in this duel.`
        );
      }

      const netCredit = Number((grossValue - charges.total).toFixed(2));
      participant.availableCash = Number((participant.availableCash + netCredit).toFixed(2));

      // Calculate realized P&L on this trade
      const costBasis = existingHolding.averageBuyPrice * quantity;
      const realizedTradePnL = Number((grossValue - costBasis - charges.total).toFixed(2));
      if (realizedTradePnL >= 0) {
        participant.winCount++;
      } else {
        participant.lossCount++;
      }

      if (existingHolding.quantity === quantity) {
        participant.holdings = participant.holdings.filter(
          h => h.symbol.toUpperCase() !== symbol.toUpperCase()
        );
      } else {
        existingHolding.quantity -= quantity;
        existingHolding.totalInvested = Number(
          (existingHolding.quantity * existingHolding.averageBuyPrice).toFixed(2)
        );
      }
    }

    participant.tradesCount++;

    const order: DuelOrder = {
      id: `dord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      userName: participant.userName,
      symbol: quote.symbol,
      type,
      quantity,
      price: executionPrice,
      charges: charges.total,
      netAmount: type === 'BUY' ? grossValue + charges.total : grossValue - charges.total,
      createdAt: new Date().toISOString(),
    };

    participant.orders.unshift(order);

    room.activities.unshift({
      id: `act_${Date.now()}`,
      userId,
      userName: participant.userName,
      type: 'TRADE',
      message: `${participant.userName} ${type === 'BUY' ? 'bought' : 'sold'} ${quantity} shares of ${quote.symbol} @ ₹${executionPrice.toFixed(2)}`,
      timestamp: new Date().toISOString(),
    });

    if (room.activities.length > 50) {
      room.activities = room.activities.slice(0, 50);
    }

    const updatedRoom = await this.refreshRoomPortfolios(room.id);
    this.broadcastUpdate(room.id);
    return { room: updatedRoom, order };
  }

  public async refreshRoomPortfolios(roomId: string): Promise<DuelRoom> {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found.');

    // Fetch current prices for all holdings across participants
    const uniqueSymbols = new Set<string>();
    for (const p of room.participants) {
      for (const h of p.holdings) {
        uniqueSymbols.add(h.symbol);
      }
    }

    const priceMap = new Map<string, number>();
    await Promise.all(
      Array.from(uniqueSymbols).map(async sym => {
        try {
          const q = await marketDataProvider.getQuote(sym);
          priceMap.set(sym.toUpperCase(), q.currentPrice);
        } catch {
          // fallback
        }
      })
    );

    for (const p of room.participants) {
      let currentInvestedTotal = 0;
      let currentHoldingsValue = 0;

      for (const h of p.holdings) {
        const livePrice = priceMap.get(h.symbol.toUpperCase()) || h.averageBuyPrice;
        h.currentPrice = livePrice;
        h.currentValue = Number((livePrice * h.quantity).toFixed(2));
        h.unrealizedPnL = Number((h.currentValue - h.totalInvested).toFixed(2));
        h.pnlPercent = h.totalInvested > 0 ? Number(((h.unrealizedPnL / h.totalInvested) * 100).toFixed(2)) : 0;

        currentInvestedTotal += h.totalInvested;
        currentHoldingsValue += h.currentValue;
      }

      p.investedValue = Number(currentInvestedTotal.toFixed(2));
      p.portfolioValue = Number((p.availableCash + currentHoldingsValue).toFixed(2));
      p.pnl = Number((p.portfolioValue - p.startingBalance).toFixed(2));
      p.pnlPercent = Number(((p.pnl / p.startingBalance) * 100).toFixed(2));
    }

    // Sort participants by highest return (Leaderboard ranking)
    room.participants.sort((a, b) => b.pnlPercent - a.pnlPercent);

    return room;
  }

  public async getRoom(roomIdOrCode: string): Promise<DuelRoom | null> {
    const normalized = roomIdOrCode.trim().toUpperCase();
    const room =
      this.rooms.get(roomIdOrCode) ||
      Array.from(this.rooms.values()).find(
        r => r.code.toUpperCase() === normalized || r.id === roomIdOrCode
      );

    if (!room) return null;
    return this.refreshRoomPortfolios(room.id);
  }

  public listRooms(userId?: string): DuelRoom[] {
    const all = Array.from(this.rooms.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return all.map(r => ({
      ...r,
      // Lightweight representation for listing
      participants: r.participants.map(p => ({
        ...p,
        holdings: [],
        orders: [],
      })),
    }));
  }

  // Real-time WebSocket Client Subscriptions
  public registerClient(roomId: string, ws: WebSocket) {
    if (!roomSubscriptions.has(roomId)) {
      roomSubscriptions.set(roomId, new Set());
    }
    roomSubscriptions.get(roomId)!.add(ws);

    ws.on('close', () => {
      const set = roomSubscriptions.get(roomId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) roomSubscriptions.delete(roomId);
      }
    });
  }

  public broadcastUpdate(roomId: string) {
    const clients = roomSubscriptions.get(roomId);
    if (!clients || clients.size === 0) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const payload = JSON.stringify({
      type: 'ROOM_UPDATE',
      roomId,
      data: room,
    });

    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch {
          // ignore
        }
      }
    }
  }
}

export const duelService = new DuelService();
