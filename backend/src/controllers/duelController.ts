import { Request, Response } from 'express';
import { duelService } from '../services/tradingEngine/duelService';
import { AuthRequest } from '../middleware/authMiddleware';

export class DuelController {
  public static async listRooms(req: Request, res: Response) {
    try {
      const rooms = duelService.listRooms();
      return res.json({ success: true, data: rooms });
    } catch (err: any) {
      console.error('Error listing duels:', err);
      return res.status(500).json({ success: false, message: 'Failed to list duels.' });
    }
  }

  public static async createRoom(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId || `usr_${Date.now()}`;
      const userEmail = req.body.email || req.user?.email;
      const userName = req.body.userName || (req.user?.email ? req.user.email.split('@')[0] : 'Trader');
      const { title, startingBalance, durationMinutes } = req.body;

      const room = await duelService.createRoom(
        userId,
        userName,
        title,
        Number(startingBalance) || 500000,
        Number(durationMinutes) || 1440,
        userEmail
      );

      return res.status(201).json({
        success: true,
        message: 'Trading Duel room created successfully!',
        data: room,
      });
    } catch (err: any) {
      console.error('Error creating duel room:', err);
      return res.status(500).json({ success: false, message: err.message || 'Failed to create duel.' });
    }
  }

  public static async joinRoom(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId || `usr_${Date.now()}`;
      const userEmail = req.body.email || req.user?.email;
      const userName = req.body.userName || (req.user?.email ? req.user.email.split('@')[0] : 'Trader');
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ success: false, message: 'Room code or ID is required.' });
      }

      const room = await duelService.joinRoom(code, userId, userName, userEmail);
      return res.json({
        success: true,
        message: `Successfully joined ${room.title}!`,
        data: room,
      });
    } catch (err: any) {
      console.error('Error joining duel room:', err);
      return res.status(400).json({ success: false, message: err.message || 'Failed to join duel.' });
    }
  }

  public static async getRoom(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const room = await duelService.getRoom(id);
      if (!room) {
        return res.status(404).json({ success: false, message: 'Duel room not found.' });
      }
      return res.json({ success: true, data: room });
    } catch (err: any) {
      console.error('Error fetching duel room:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve duel room.' });
    }
  }

  public static async executeTrade(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required to trade.' });
      }

      const { id } = req.params;
      const { symbol, type, quantity } = req.body;

      if (!symbol || !type || !quantity) {
        return res.status(400).json({ success: false, message: 'Symbol, type (BUY/SELL), and quantity are required.' });
      }

      const result = await duelService.executeTrade(
        id,
        userId,
        symbol.toUpperCase(),
        type.toUpperCase() as 'BUY' | 'SELL',
        Number(quantity)
      );

      return res.json({
        success: true,
        message: `Order filled: ${type} ${quantity} ${symbol} @ ₹${result.order.price}`,
        data: result,
      });
    } catch (err: any) {
      console.error('Error executing duel trade:', err);
      return res.status(400).json({ success: false, message: err.message || 'Failed to execute trade.' });
    }
  }

  public static async startRoom(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      const { id } = req.params;
      const room = await duelService.startRoom(id, userId);
      return res.json({
        success: true,
        message: 'Trading battle started!',
        data: room,
      });
    } catch (err: any) {
      console.error('Error starting duel room:', err);
      return res.status(400).json({ success: false, message: err.message || 'Failed to start duel.' });
    }
  }
}
