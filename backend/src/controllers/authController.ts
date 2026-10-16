import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database';
import { AuthRequest } from '../middleware/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'tradeveda-super-secret-jwt-key-2026';

export class AuthController {
  public static async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Please provide a valid name (at least 2 characters).' });
      }

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      }

      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      }

      const existing = db.findUserByEmail(email);
      if (existing) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);
      const user = db.createUser(name.trim(), email.trim(), passwordHash);

      const token = jwt.sign(
        { userId: user.id, email: user.email, isAdmin: !!user.isAdmin },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const account = db.getVirtualAccount(user.id);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully! ₹10,00,000 virtual balance credited.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
        },
        account,
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      return res.status(500).json({ success: false, message: 'Failed to create account. Please try again.' });
    }
  }

  public static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
      }

      const user = db.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const isMatch = bcrypt.compareSync(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, isAdmin: !!user.isAdmin },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const account = db.getVirtualAccount(user.id);

      return res.json({
        success: true,
        message: 'Logged in successfully.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
        },
        account,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
    }
  }

  public static async me(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated.' });
      }

      const user = db.findUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const account = db.getVirtualAccount(user.id);

      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
        },
        account,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
    }
  }

  public static logout(_req: Request, res: Response) {
    return res.json({ success: true, message: 'Logged out successfully.' });
  }

  public static async googleLogin(req: Request, res: Response) {
    try {
      const { credential, email, name, avatar } = req.body;

      let verifiedEmail = email ? String(email).trim().toLowerCase() : '';
      let verifiedName = name ? String(name).trim() : '';

      // If Google credential JWT is provided from Google Identity Services (GIS), decode it
      if (credential && typeof credential === 'string') {
        try {
          const parts = credential.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
            if (payload.email) {
              verifiedEmail = payload.email.toLowerCase();
              verifiedName = payload.name || payload.given_name || verifiedEmail.split('@')[0];
            }
          }
        } catch (e) {
          console.warn('Failed to parse Google JWT payload, fallback to body fields', e);
        }
      }

      if (!verifiedEmail || !verifiedEmail.includes('@')) {
        return res.status(400).json({ success: false, message: 'Please provide a valid Gmail address.' });
      }

      let user = db.findUserByEmail(verifiedEmail);
      if (!user) {
        // Register new user automatically with ₹10,00,000 virtual balance
        const randomPass = Math.random().toString(36).slice(-10) + 'G!9';
        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync(randomPass, salt);
        user = db.createUser(
          verifiedName || verifiedEmail.split('@')[0],
          verifiedEmail,
          passwordHash,
          false
        );
      } else if (verifiedName && user.name !== verifiedName) {
        user.name = verifiedName;
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, isAdmin: !!user.isAdmin },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      const account = db.getVirtualAccount(user.id);

      return res.json({
        success: true,
        message: 'Logged in with Google successfully!',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          avatar: avatar || undefined,
        },
        account,
      });
    } catch (err: any) {
      console.error('Google login error:', err);
      return res.status(500).json({ success: false, message: 'Google login failed. Please try again.' });
    }
  }

  public static async guestSession(_req: Request, res: Response) {
    try {
      let user = db.findUserByEmail('demo@tradeveda.in');
      if (!user) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync('Demo@123', salt);
        user = db.createUser('Demo Trader', 'demo@tradeveda.in', hash, true);
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, isAdmin: !!user.isAdmin },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const account = db.getVirtualAccount(user.id);

      return res.json({
        success: true,
        message: 'Active virtual session initialized.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
        },
        account,
      });
    } catch (err: any) {
      console.error('Guest session error:', err);
      return res.status(500).json({ success: false, message: 'Failed to initialize session.' });
    }
  }
}
