import { Request, Response, NextFunction } from 'express';
import {
  loginWithPassword,
  generateAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from '../services/auth.service';
import { prisma } from '../lib/prisma';

const COOKIE_NAME = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const user = await loginWithPassword(email, password);
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = await createRefreshToken(user.id);

    res.cookie(COOKIE_NAME, refreshToken, COOKIE_OPTIONS);
    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        slackUserId: user.slackUserId,
        isActive: user.isActive,
        googleCalendarConnected: !!user.googleRefreshToken,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const oldToken = req.cookies[COOKIE_NAME];
    if (!oldToken) {
      res.status(401).json({ error: 'Unauthorized', message: 'Missing refresh token' });
      return;
    }

    const { user, accessToken, newRefreshToken } = await rotateRefreshToken(oldToken);

    res.cookie(COOKIE_NAME, newRefreshToken, COOKIE_OPTIONS);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (token) await revokeRefreshToken(token);

    res.clearCookie(COOKIE_NAME);
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: {
        id: true, email: true, name: true, role: true,
        slackUserId: true, isActive: true, googleRefreshToken: true,
        createdAt: true, updatedAt: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: 'NotFound', message: 'User not found' });
      return;
    }
    res.json({
      ...user,
      googleCalendarConnected: !!user.googleRefreshToken,
      googleRefreshToken: undefined,
    });
  } catch (err) {
    next(err);
  }
}
