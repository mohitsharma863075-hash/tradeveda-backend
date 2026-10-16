import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tradeveda-super-secret-jwt-key-2026';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    isAdmin?: boolean;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; isAdmin?: boolean };
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Session expired or invalid. Please log in again.' });
  }
}

export function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; isAdmin?: boolean };
      req.user = decoded;
      return next();
    } catch {
      // fallback to generated guest session
    }
  }
  const guestId = `usr_guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  req.user = { userId: guestId, email: `${guestId}@tradeveda.in` };
  next();
}
