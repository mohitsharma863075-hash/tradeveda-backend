import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { db } from '../db/database';

export class AdminController {
  public static getLeaderboard(_req: Request, res: Response) {
    try {
      const leaders = db.getLeaderboard();
      return res.json({ success: true, count: leaders.length, data: leaders });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch leaderboard.' });
    }
  }

  public static async getSystemStats(req: AuthRequest, res: Response) {
    try {
      const users = db.getAllUsers();
      const allOrders = db.getAllOrders();
      const totalVirtualVolume = allOrders.reduce((acc, o) => acc + (o.totalValue || 0), 0);
      const chargesConfig = db.getChargesConfig();

      return res.json({
        success: true,
        data: {
          totalUsers: users.length,
          totalVirtualOrders: allOrders.length,
          totalVirtualVolume: Math.round(totalVirtualVolume),
          chargesConfig,
          systemStatus: 'Operational',
          engineType: 'Virtual Simulation (Paper Only)',
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch system stats.' });
    }
  }

  public static getChargesConfig(_req: Request, res: Response) {
    try {
      const config = db.getChargesConfig();
      return res.json({ success: true, data: config });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch charges configuration.' });
    }
  }

  public static updateChargesConfig(req: AuthRequest, res: Response) {
    try {
      const updated = db.updateChargesConfig(req.body);
      return res.json({
        success: true,
        message: 'Simulated charges updated successfully.',
        data: updated,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to update charges.' });
    }
  }
}
