# TradeVeda — Indian Stock Market Paper Trading Platform

> **100% VIRTUAL PAPER-TRADING PLATFORM FOR INDIAN STOCK MARKETS (NSE & BSE)**  
> **DISCLAIMER:** All funds, portfolios, and trades shown in this application are strictly virtual for educational purposes only. No real orders are placed on exchange. No real securities are purchased or sold. No real money is ever involved.

---

## 📌 Project Overview

**TradeVeda** is a free-first, production-quality Indian Stock Market Paper Trading platform designed to help students, beginners, and active traders practice equity trading without financial risk.

Every new account receives **₹10,00,000 in virtual starting capital**. The platform provides genuine Indian stock market data (NSE & BSE), professional Japanese candlestick charts powered by TradingView Lightweight Charts, a server-side paper-trading engine with simulated Indian brokerage and regulatory taxes (STT, GST, Stamp Duty), portfolio analytics, watchlists, order history, bilingual (English & Hindi) educational modules, and a 30-Day Paper Trading Challenge.

---

## 🚀 Key Features

- **Virtual Capital**: ₹10,00,000 virtual balance credited to every new trader.
- **Indian Market Focus**: Full coverage of top Indian equities (RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK, SBIN, ITC, BHARTIARTL, LT, etc.).
- **Real & Delayed Market Data**: Accurate delayed market feed (NSE 15-min delayed) with clear data freshness disclosures and timestamps.
- **Professional Candlestick Chart**:
  - Green bullish candles & red bearish candles with fine wicks.
  - Dark trading terminal theme.
  - Interactive crosshair with real-time OHLC HUD.
  - Multi-timeframe support: **1D, 1W, 1M, 3M, 6M, 1Y, 5Y**.
  - Integrated Volume histogram aligned with candles.
  - Zoom, pan, and touch gestures.
- **Paper Trading Engine**:
  - Server-side order execution with strict balance & holding validation.
  - Weighted average buy price calculation.
  - Realized and unrealized P&L accounting.
  - Simulated Indian charges: Brokerage (0.03% or ₹20 cap), STT (0.1%), Exchange charges, GST (18%), and Stamp duty (0.015%).
- **Two-Step Trade Confirmation**: Clear trade confirmation dialog displaying execution price, charges, and impact on virtual cash balance.
- **Reset Paper Account**: One-click account reset back to ₹10,00,000 virtual balance.
- **Saved Watchlist**: Account-synced watchlists with quick buy/sell triggers.
- **Indian Market Timings & IST Clock**:
  - Pre-Market: 09:00 - 09:15 IST
  - Regular Market Open: 09:15 - 15:30 IST
  - Post-Market: 15:30 - 16:00 IST
  - Market Closed (Weekends / Evenings)
- **Learn Section (Bilingual EN / हिंदी)**:
  - 11+ comprehensive modules on stocks, NSE/BSE, candlesticks, OHLC, volume, market vs limit orders, stop-loss, and diversification.
- **30-Day Challenge & Leaderboard**:
  - Track win rate, trades count, and percentage return against peers.
- **Admin Panel**:
  - System status, total virtual volume, active traders, and configurable simulated charges.
- **PWA & Mobile Ready**:
  - Responsive dark-mode interface with desktop sidebar and mobile bottom navigation.
  - PWA Web Manifest included.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React Icons.
- **Charting**: TradingView Lightweight Charts (`lightweight-charts` v5).
- **Backend**: Node.js, Express, TypeScript (`tsx`).
- **Database**: Zero-dependency ACID-style persistent storage engine (`data/tradeveda.json`).
- **Authentication**: JSON Web Tokens (JWT) + BCrypt password hashing.
- **Market Data**: Free-first market data abstraction with Yahoo Finance NSE quote/chart API and server-side rate-limit caching.

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory (refer to `.env.example`):

```env
PORT=3000
JWT_SECRET="tradeveda-super-secret-jwt-key-2026"
MARKET_DATA_PROVIDER="yahoo-finance"
MARKET_DATA_CACHE_TIME=60000
SIMULATED_BROKERAGE=0.0003
SIMULATED_STT=0.001
SIMULATED_GST=0.18
```

---

## 📦 Setup & Development Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Test Suite
```bash
npx tsx tests/runTests.ts
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
```

### 5. Start Production Server
```bash
npm start
```

---

## 🔒 Free-Tier Limitations & Transparency

1. **Delayed Market Data**: Free public feeds for Indian equities (NSE & BSE) provide ~15-minute delayed market quotes during trading hours. The app explicitly marks this as **"Delayed Market Data (NSE 15m)"**.
2. **Virtual Money**: All transactions, balances, and profits are strictly educational. There is zero connection to demat accounts, real brokers, or banking rails.
3. **No Financial Advice**: Content in the Learn section is educational only and does not constitute investment advice.
