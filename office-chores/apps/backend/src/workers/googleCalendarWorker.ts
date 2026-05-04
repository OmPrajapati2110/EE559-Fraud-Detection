import { Worker, Job } from 'bullmq';
import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../services/googleCalendar.service';
import type { GoogleCalendarSyncJob, GoogleCalendarDeleteJob } from './queue';

export function startGoogleCalendarWorker() {
  const worker = new Worker(
    'google-calendar',
    async (job: Job) => {
      if (job.name === 'sync-calendar') {
        const { assignmentId } = job.data as GoogleCalendarSyncJob;

        const assignment = await prisma.choreAssignment.findUnique({
          where: { id: assignmentId },
          include: { chore: true, user: true },
        });

        if (!assignment || !assignment.user.googleRefreshToken) return;

        const description = [
          assignment.chore.description ?? '',
          `Priority: ${assignment.chore.priority}`,
          `Assigned to: ${assignment.user.name}`,
        ]
          .filter(Boolean)
          .join('\n');

        if (assignment.googleEventId) {
          await updateCalendarEvent(
            assignment.userId,
            assignment.googleEventId,
            assignment.chore.title,
            description,
            assignment.dueDate
          );
        } else {
          await createCalendarEvent(
            assignment.userId,
            assignmentId,
            assignment.chore.title,
            description,
            assignment.dueDate
          );
        }
      }

      if (job.name === 'delete-calendar') {
        const { userId, googleEventId } = job.data as GoogleCalendarDeleteJob;
        await deleteCalendarEvent(userId, googleEventId);
      }
    },
    { connection: redis, concurrency: 3 }
  );

  worker.on('failed', (job, err) => {
    console.error(`[GoogleCalendarWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
