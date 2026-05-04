import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export function generateAccessToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, config.JWT_PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export async function createRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
  return token;
}

export async function loginWithPassword(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw new AppError(401, 'Unauthorized', 'Invalid credentials');
  }
  if (!user.passwordHash) {
    throw new AppError(401, 'Unauthorized', 'Please sign in with Google');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'Unauthorized', 'Invalid credentials');
  }

  return user;
}

export async function rotateRefreshToken(oldToken: string) {
  const existing = await prisma.refreshToken.findUnique({ where: { token: oldToken } });

  if (!existing || existing.expiresAt < new Date()) {
    // Reuse detected or expired — delete all tokens for user if found
    if (existing) {
      await prisma.refreshToken.deleteMany({ where: { userId: existing.userId } });
    }
    throw new AppError(401, 'Unauthorized', 'Invalid refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: existing.userId } });
  if (!user || !user.isActive) {
    throw new AppError(401, 'Unauthorized', 'User not found or inactive');
  }

  // Delete old token and issue new one (rotation)
  await prisma.refreshToken.delete({ where: { token: oldToken } });
  const newRefreshToken = await createRefreshToken(user.id);
  const accessToken = generateAccessToken(user.id, user.role);

  return { user, accessToken, newRefreshToken };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
