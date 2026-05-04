import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const inviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['ADMIN', 'MEMBER']),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slackUserId: z.string().optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});
