import { z } from 'zod';

export const recurrenceRuleSchema = z.object({
  intervalWeeks: z.number().int().min(1).max(52),
  dayOfWeek: z.number().int().min(0).max(6),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const createChoreSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  recurrenceRule: recurrenceRuleSchema.optional(),
});

export const updateChoreSchema = createChoreSchema.partial();
