import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { MarketController } from '../controllers/marketController';
import { TradingController } from '../controllers/tradingController';
import { PortfolioController } from '../controllers/portfolioController';
import { WatchlistController } from '../controllers/watchlistController';
import { AdminController } from '../controllers/adminController';
import { DuelController } from '../controllers/duelController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// --- Health Check ---
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'tradeveda-api', timestamp: new Date().toISOString() });
});

// --- Auth Routes ---
router.post('/auth/google', AuthController.googleLogin);
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/guest-session', AuthController.guestSession);
router.get('/auth/me', authMiddleware, AuthController.me);
router.post('/auth/logout', AuthController.logout);

// --- Market Routes ---
router.get('/market/stocks', MarketController.getStocks);
router.get('/market/stock/:symbol', MarketController.getStockBySymbol);
router.get('/market/history/:symbol', MarketController.getHistoricalData);
router.get('/market/search', MarketController.search);
router.get('/market/movers', MarketController.getMovers);
router.get('/market/status', MarketController.getStatus);

// --- Trading & Holdings Routes ---
router.post('/orders/buy', authMiddleware, TradingController.buy);
router.post('/orders/sell', authMiddleware, TradingController.sell);
router.post('/orders/estimate', authMiddleware, TradingController.estimateCharges);
router.get('/orders', authMiddleware, TradingController.getOrders);
router.get('/holdings', authMiddleware, TradingController.getHoldings);

// --- Portfolio & Account Routes ---
router.get('/portfolio', authMiddleware, PortfolioController.getPortfolio);
router.post('/account/reset', authMiddleware, PortfolioController.resetAccount);
router.get('/account/challenge', authMiddleware, PortfolioController.getChallengeStats);

// --- Watchlist Routes ---
router.get('/watchlist', authMiddleware, WatchlistController.getWatchlist);
router.post('/watchlist', authMiddleware, WatchlistController.addToWatchlist);
router.delete('/watchlist/:symbol', authMiddleware, WatchlistController.removeFromWatchlist);

// --- Leaderboard & Admin Routes ---
router.get('/leaderboard', AdminController.getLeaderboard);
router.get('/admin/stats', authMiddleware, AdminController.getSystemStats);
router.get('/admin/charges', AdminController.getChargesConfig);
router.put('/admin/charges', authMiddleware, AdminController.updateChargesConfig);

// --- Friend 1v1 Paper Trading Duel Routes ---
router.get('/duels', DuelController.listRooms);
router.post('/duels/create', optionalAuthMiddleware, DuelController.createRoom);
router.post('/duels/join', optionalAuthMiddleware, DuelController.joinRoom);
router.get('/duels/:id', DuelController.getRoom);
router.post('/duels/:id/order', optionalAuthMiddleware, DuelController.executeTrade);
router.post('/duels/:id/start', optionalAuthMiddleware, DuelController.startRoom);

export default router;
