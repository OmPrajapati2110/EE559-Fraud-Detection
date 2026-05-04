import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { hashPassword } from './auth.service';
import { notificationQueue } from '../workers/queue';
import crypto from 'crypto';

export async function listUsers() {
  return prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      slackUserId: true,
      isActive: true,
      googleRefreshToken: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      slackUserId: true,
      isActive: true,
      googleRefreshToken: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) throw new AppError(404, 'NotFound', 'User not found');
  return user;
}

export async function inviteUser(email: string, name: string, role: 'ADMIN' | 'MEMBER') {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, 'Conflict', 'Email already registered');

  // Generate a temporary password
  const tempPassword = crypto.randomBytes(8).toString('hex');
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: { email, name, passwordHash, role },
  });

  // Send invite email via notification queue
  await notificationQueue.add('send-invite', {
    userId: user.id,
    email,
    name,
    tempPassword,
  });

  return user;
}

export async function updateUser(id: string, data: { name?: string; slackUserId?: string }) {
  await getUser(id);
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true, email: true, name: true, role: true,
      slackUserId: true, isActive: true, createdAt: true, updatedAt: true,
      googleRefreshToken: true,
    },
  });
}

export async function updateUserRole(id: string, role: 'ADMIN' | 'MEMBER') {
  await getUser(id);
  return prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true, email: true, name: true, role: true,
      slackUserId: true, isActive: true, createdAt: true, updatedAt: true,
      googleRefreshToken: true,
    },
  });
}

export async function deactivateUser(id: string) {
  await getUser(id);
  return prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: { id: true, email: true, name: true, isActive: true },
  });
}
