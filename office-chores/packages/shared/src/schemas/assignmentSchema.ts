import { z } from 'zod';

export const createAssignmentSchema = z.object({
  choreId: z.string().cuid(),
  userId: z.string().cuid(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const updateAssignmentSchema = z.object({
  userId: z.string().cuid().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const completeAssignmentSchema = z.object({
  notes: z.string().max(1000).optional(),
});
