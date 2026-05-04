import { prisma } from '../lib/prisma';
import { getOccurrencesInWindow } from '../services/recurrence.service';
import { notificationQueue, googleCalendarQueue } from './queue';

/**
 * Generates ChoreAssignment rows for the next 4 weeks for all active chores.
 * Uses round-robin to pick assignees.
 * Safe to run multiple times — the unique constraint on (choreId, dueDate) prevents duplicates.
 */
export async function generateUpcomingAssignments(): Promise<void> {
  console.log('[RecurrenceWorker] Generating upcoming assignments...');

  const windowStart = new Date();
  windowStart.setUTCHours(0, 0, 0, 0);

  const windowEnd = new Date(windowStart);
  windowEnd.setDate(windowEnd.getDate() + 28); // 4 weeks

  const chores = await prisma.chore.findMany({
    where: { isActive: true },
    include: { recurrenceRule: true },
  });

  // Load all active users for round-robin, sorted by createdAt for stable ordering
  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (users.length === 0) {
    console.warn('[RecurrenceWorker] No active users found, skipping generation');
    return;
  }

  for (const chore of chores) {
    if (!chore.recurrenceRule) continue;

    const rule = chore.recurrenceRule;
    const occurrences = getOccurrencesInWindow(
      {
        intervalWeeks: rule.intervalWeeks,
        dayOfWeek: rule.dayOfWeek,
        startDate: rule.startDate,
        endDate: rule.endDate,
      },
      windowStart,
      windowEnd
    );

    for (const dueDate of occurrences) {
      // Check if assignment already exists
      const existing = await prisma.choreAssignment.findUnique({
        where: { choreId_dueDate: { choreId: chore.id, dueDate } },
      });

      if (existing) continue;

      // Round-robin: find last assigned user for this chore
      const lastAssignment = await prisma.choreAssignment.findFirst({
        where: { choreId: chore.id },
        orderBy: { dueDate: 'desc' },
        select: { userId: true },
      });

      let nextUserIndex = 0;
      if (lastAssignment) {
        const lastIndex = users.findIndex((u: { id: string }) => u.id === lastAssignment.userId);
        nextUserIndex = (lastIndex + 1) % users.length;
      }

      const assignedUserId = users[nextUserIndex].id;

      const assignment = await prisma.choreAssignment.create({
        data: { choreId: chore.id, userId: assignedUserId, dueDate },
      });

      // Enqueue notifications and calendar sync
      await notificationQueue.add('notify-assigned', {
        assignmentId: assignment.id,
        type: 'ASSIGNED',
      });
      await googleCalendarQueue.add('sync-calendar', { assignmentId: assignment.id });

      console.log(
        `[RecurrenceWorker] Created assignment for "${chore.title}" on ${dueDate.toISOString().split('T')[0]} → user ${assignedUserId}`
      );
    }
  }

  console.log('[RecurrenceWorker] Done.');
}

/**
 * Enqueues reminder notifications for assignments due tomorrow.
 */
export async function sendDailyReminders(): Promise<void> {
  console.log('[RecurrenceWorker] Sending daily reminders...');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setUTCHours(23, 59, 59, 999);

  const dueAssignments = await prisma.choreAssignment.findMany({
    where: {
      dueDate: { gte: tomorrow, lte: tomorrowEnd },
      isCompleted: false,
    },
    select: { id: true },
  });

  for (const assignment of dueAssignments) {
    await notificationQueue.add('notify-reminder', {
      assignmentId: assignment.id,
      type: 'REMINDER',
    });
  }

  console.log(`[RecurrenceWorker] Queued ${dueAssignments.length} reminders.`);
}
