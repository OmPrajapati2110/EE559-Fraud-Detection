import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import type { CreateChoreRequest, UpdateChoreRequest } from '@office-chores/shared';
import { getNextNOccurrences } from './recurrence.service';

export async function listChores() {
  return prisma.chore.findMany({
    where: { isActive: true },
    include: { recurrenceRule: true },
    orderBy: [{ priority: 'asc' }, { title: 'asc' }],
  });
}

export async function getChore(id: string) {
  const chore = await prisma.chore.findUnique({
    where: { id },
    include: { recurrenceRule: true },
  });
  if (!chore) throw new AppError(404, 'NotFound', 'Chore not found');
  return chore;
}

export async function createChore(data: CreateChoreRequest) {
  return prisma.chore.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      recurrenceRule: data.recurrenceRule
        ? {
            create: {
              intervalWeeks: data.recurrenceRule.intervalWeeks,
              dayOfWeek: data.recurrenceRule.dayOfWeek,
              startDate: new Date(data.recurrenceRule.startDate),
              endDate: data.recurrenceRule.endDate
                ? new Date(data.recurrenceRule.endDate)
                : null,
            },
          }
        : undefined,
    },
    include: { recurrenceRule: true },
  });
}

export async function updateChore(id: string, data: UpdateChoreRequest) {
  await getChore(id);

  return prisma.chore.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      recurrenceRule: data.recurrenceRule
        ? {
            upsert: {
              create: {
                intervalWeeks: data.recurrenceRule.intervalWeeks,
                dayOfWeek: data.recurrenceRule.dayOfWeek,
                startDate: new Date(data.recurrenceRule.startDate),
                endDate: data.recurrenceRule.endDate
                  ? new Date(data.recurrenceRule.endDate)
                  : null,
              },
              update: {
                intervalWeeks: data.recurrenceRule.intervalWeeks,
                dayOfWeek: data.recurrenceRule.dayOfWeek,
                startDate: new Date(data.recurrenceRule.startDate),
                endDate: data.recurrenceRule.endDate
                  ? new Date(data.recurrenceRule.endDate)
                  : null,
              },
            },
          }
        : undefined,
    },
    include: { recurrenceRule: true },
  });
}

export async function deactivateChore(id: string) {
  await getChore(id);
  return prisma.chore.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function previewOccurrences(choreId: string, n = 6) {
  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
    include: { recurrenceRule: true },
  });
  if (!chore?.recurrenceRule) {
    throw new AppError(400, 'BadRequest', 'Chore has no recurrence rule');
  }

  const rule = chore.recurrenceRule;
  const occurrences = getNextNOccurrences(
    {
      intervalWeeks: rule.intervalWeeks,
      dayOfWeek: rule.dayOfWeek,
      startDate: rule.startDate,
      endDate: rule.endDate,
    },
    new Date(),
    n
  );

  return occurrences.map((d) => d.toISOString().split('T')[0]);
}
