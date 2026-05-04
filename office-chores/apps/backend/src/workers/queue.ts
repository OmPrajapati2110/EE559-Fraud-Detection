import { Queue } from 'bullmq';
import { redis } from '../lib/redis';

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 200,
};

// ── Queue definitions ─────────────────────────────────────────────────────────

export const notificationQueue = new Queue('notifications', {
  connection: redis,
  defaultJobOptions,
});

export const googleCalendarQueue = new Queue('google-calendar', {
  connection: redis,
  defaultJobOptions,
});

export const assignmentQueue = new Queue('assignments', {
  connection: redis,
  defaultJobOptions,
});

// ── Job type definitions ──────────────────────────────────────────────────────

export interface NotifyAssignedJob {
  assignmentId: string;
  type: 'ASSIGNED' | 'REMINDER';
}

export interface SendInviteJob {
  userId: string;
  email: string;
  name: string;
  tempPassword: string;
}

export interface GoogleCalendarSyncJob {
  assignmentId: string;
}

export interface GoogleCalendarDeleteJob {
  assignmentId: string;
  googleEventId: string;
  userId: string;
}

export interface GenerateAssignmentsJob {
  choreId: string;
}
