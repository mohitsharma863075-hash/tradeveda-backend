import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  VirtualAccount,
  Holding,
  Order,
  WatchlistItem,
  SimulatedChargesConfig,
} from '../types';

interface DatabaseSchema {
  users: User[];
  virtualAccounts: Record<string, VirtualAccount>;
  holdings: Holding[];
  orders: Order[];
  watchlists: WatchlistItem[];
  chargesConfig: SimulatedChargesConfig;
}

const DEFAULT_CHARGES_CONFIG: SimulatedChargesConfig = {
  brokerageRate: 0.0003,      // 0.03%
  brokerageMaxPerOrder: 20,   // ₹20 cap
  sttDeliveryRate: 0.001,     // 0.1%
  exchangeTurnoverRate: 0.0000345, // 0.00345%
  gstRate: 0.18,              // 18%
  stampDutyRate: 0.00015,     // 0.015%
};

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'tradeveda.json');

export class Database {
  private data: DatabaseSchema;
  private isSaving = false;

  constructor() {
    this.data = this.loadData();
    // No fake/demo users - only real users who register or login
    if (this.data.users) {
      this.data.users = this.data.users.filter(u => u.email !== 'demo@tradeveda.in');
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
      }
    } catch (err) {
      console.error('Error loading database file, initializing fresh:', err);
    }

    const initial: DatabaseSchema = {
      users: [],
      virtualAccounts: {},
      holdings: [],
      orders: [],
      watchlists: [],
      chargesConfig: DEFAULT_CHARGES_CONFIG,
    };
    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave?: DatabaseSchema) {
    if (this.isSaving) return;
    this.isSaving = true;
    try {
      const data = dataToSave || this.data;
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Error saving database:', err);
    } finally {
      this.isSaving = false;
    }
  }


  // --- Users ---
  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public createUser(name: string, email: string, passwordHash: string, isAdmin = false): User {
    const id = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newUser: User = {
      id,
      name,
      email: email.toLowerCase(),
      passwordHash,
      isAdmin,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);

    // Create virtual account with initial ₹10,00,000 virtual cash
    this.data.virtualAccounts[id] = {
      userId: id,
      startingBalance: 1000000,
      availableCash: 1000000,
      investedValue: 0,
      portfolioValue: 1000000,
      totalPnL: 0,
      totalReturnPercent: 0,
      todayPnL: 0,
      realizedPnL: 0,
      unrealizedPnL: 0,
      tradesCount: 0,
      profitableTradesCount: 0,
      lossTradesCount: 0,
      lastResetAt: new Date().toISOString(),
      challengeActive: true,
      challengeStartedAt: new Date().toISOString(),
    };

    // Prepopulate popular watchlist for new users
    const defaultSymbols = [
      { symbol: 'RELIANCE', companyName: 'Reliance Industries Ltd.', exchange: 'NSE' as const },
      { symbol: 'TCS', companyName: 'Tata Consultancy Services Ltd.', exchange: 'NSE' as const },
      { symbol: 'HDFCBANK', companyName: 'HDFC Bank Ltd.', exchange: 'NSE' as const },
      { symbol: 'INFY', companyName: 'Infosys Ltd.', exchange: 'NSE' as const },
      { symbol: 'SBIN', companyName: 'State Bank of India', exchange: 'NSE' as const },
    ];
    for (const item of defaultSymbols) {
      this.data.watchlists.push({
        id: `wl_${id}_${item.symbol}`,
        userId: id,
        symbol: item.symbol,
        companyName: item.companyName,
        exchange: item.exchange,
        addedAt: new Date().toISOString(),
      });
    }

    this.saveData();
    return newUser;
  }

  public getAllUsers(): Omit<User, 'passwordHash'>[] {
    return this.data.users.map(({ passwordHash, ...rest }) => rest);
  }

  // --- Virtual Account ---
  public getVirtualAccount(userId: string): VirtualAccount {
    if (!this.data.virtualAccounts[userId]) {
      this.data.virtualAccounts[userId] = {
        userId,
        startingBalance: 1000000,
        availableCash: 1000000,
        investedValue: 0,
        portfolioValue: 1000000,
        totalPnL: 0,
        totalReturnPercent: 0,
        todayPnL: 0,
        realizedPnL: 0,
        unrealizedPnL: 0,
        tradesCount: 0,
        profitableTradesCount: 0,
        lossTradesCount: 0,
        lastResetAt: new Date().toISOString(),
        challengeActive: true,
        challengeStartedAt: new Date().toISOString(),
      };
      this.saveData();
    }
    return this.data.virtualAccounts[userId];
  }

  public updateVirtualAccount(userId: string, partial: Partial<VirtualAccount>): VirtualAccount {
    const acc = this.getVirtualAccount(userId);
    const updated = { ...acc, ...partial };
    this.data.virtualAccounts[userId] = updated;
    this.saveData();
    return updated;
  }

  public resetAccount(userId: string): VirtualAccount {
    const freshAccount: VirtualAccount = {
      userId,
      startingBalance: 1000000,
      availableCash: 1000000,
      investedValue: 0,
      portfolioValue: 1000000,
      totalPnL: 0,
      totalReturnPercent: 0,
      todayPnL: 0,
      realizedPnL: 0,
      unrealizedPnL: 0,
      tradesCount: 0,
      profitableTradesCount: 0,
      lossTradesCount: 0,
      lastResetAt: new Date().toISOString(),
      challengeActive: true,
      challengeStartedAt: new Date().toISOString(),
    };
    this.data.virtualAccounts[userId] = freshAccount;

    // Delete user's holdings
    this.data.holdings = this.data.holdings.filter(h => h.userId !== userId);

    // Delete user's orders
    this.data.orders = this.data.orders.filter(o => o.userId !== userId);

    this.saveData();
    return freshAccount;
  }

  // --- Holdings ---
  public getHoldings(userId: string): Holding[] {
    return this.data.holdings.filter(h => h.userId === userId && h.quantity > 0);
  }

  public getHolding(userId: string, symbol: string): Holding | undefined {
    return this.data.holdings.find(
      h => h.userId === userId && h.symbol.toUpperCase() === symbol.toUpperCase()
    );
  }

  public saveHolding(holding: Holding): void {
    const idx = this.data.holdings.findIndex(
      h => h.userId === holding.userId && h.symbol.toUpperCase() === holding.symbol.toUpperCase()
    );
    if (idx >= 0) {
      if (holding.quantity <= 0) {
        this.data.holdings.splice(idx, 1);
      } else {
        this.data.holdings[idx] = holding;
      }
    } else if (holding.quantity > 0) {
      this.data.holdings.push(holding);
    }
    this.saveData();
  }

  // --- Orders ---
  public getOrders(userId: string): Order[] {
    return this.data.orders
      .filter(o => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addOrder(order: Order): void {
    this.data.orders.unshift(order);
    this.saveData();
  }

  public getAllOrders(): Order[] {
    return this.data.orders;
  }

  // --- Watchlist ---
  public getWatchlist(userId: string): WatchlistItem[] {
    return this.data.watchlists.filter(w => w.userId === userId);
  }

  public addToWatchlist(userId: string, symbol: string, companyName: string, exchange: 'NSE' | 'BSE' = 'NSE'): WatchlistItem {
    const existing = this.data.watchlists.find(
      w => w.userId === userId && w.symbol.toUpperCase() === symbol.toUpperCase()
    );
    if (existing) return existing;

    const item: WatchlistItem = {
      id: `wl_${userId}_${symbol.toUpperCase()}`,
      userId,
      symbol: symbol.toUpperCase(),
      companyName,
      exchange,
      addedAt: new Date().toISOString(),
    };
    this.data.watchlists.push(item);
    this.saveData();
    return item;
  }

  public removeFromWatchlist(userId: string, symbol: string): boolean {
    const initialLen = this.data.watchlists.length;
    this.data.watchlists = this.data.watchlists.filter(
      w => !(w.userId === userId && w.symbol.toUpperCase() === symbol.toUpperCase())
    );
    if (this.data.watchlists.length !== initialLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  // --- Charges Config ---
  public getChargesConfig(): SimulatedChargesConfig {
    return { ...this.data.chargesConfig };
  }

  public updateChargesConfig(config: Partial<SimulatedChargesConfig>): SimulatedChargesConfig {
    this.data.chargesConfig = { ...this.data.chargesConfig, ...config };
    this.saveData();
    return this.data.chargesConfig;
  }

  // --- Leaderboard ---
  public getLeaderboard(): Array<{
    userId: string;
    name: string;
    portfolioValue: number;
    returnPercent: number;
    totalPnL: number;
    tradesCount: number;
    winRate: number;
  }> {
    const list: Array<{
      userId: string;
      name: string;
      portfolioValue: number;
      returnPercent: number;
      totalPnL: number;
      tradesCount: number;
      winRate: number;
    }> = [];

    for (const u of this.data.users) {
      const acc = this.data.virtualAccounts[u.id];
      if (acc) {
        const totalTrades = acc.tradesCount || 0;
        const winRate = totalTrades > 0 ? (acc.profitableTradesCount / totalTrades) * 100 : 0;
        list.push({
          userId: u.id,
          name: u.name,
          portfolioValue: Math.round(acc.portfolioValue),
          returnPercent: Number(acc.totalReturnPercent.toFixed(2)),
          totalPnL: Math.round(acc.totalPnL),
          tradesCount: totalTrades,
          winRate: Number(winRate.toFixed(1)),
        });
      }
    }

    return list.sort((a, b) => b.returnPercent - a.returnPercent);
  }
}

export const db = new Database();
