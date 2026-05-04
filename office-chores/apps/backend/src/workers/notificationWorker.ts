import { Worker, Job } from 'bullmq';
import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { sendAssignedEmail, sendReminderEmail, sendInviteEmail } from '../services/email.service';
import { sendAssignedSlackMessage, sendReminderSlackMessage } from '../services/slack.service';
import { config } from '../config';
import type { NotifyAssignedJob, SendInviteJob } from './queue';

export function startNotificationWorker() {
  const worker = new Worker(
    'notifications',
    async (job: Job) => {
      if (job.name === 'notify-assigned' || job.name === 'notify-reminder') {
        const { assignmentId, type } = job.data as NotifyAssignedJob;

        const assignment = await prisma.choreAssignment.findUnique({
          where: { id: assignmentId },
          include: {
            chore: true,
            user: true,
          },
        });

        if (!assignment) return;

        const dueDateStr = assignment.dueDate.toISOString().split('T')[0];

        if (type === 'ASSIGNED') {
          await Promise.allSettled([
            sendAssignedEmail({
              to: assignment.user.email,
              name: assignment.user.name,
              choreTitle: assignment.chore.title,
              dueDate: dueDateStr,
              priority: assignment.chore.priority,
              description: assignment.chore.description,
            }),
            sendAssignedSlackMessage({
              userName: assignment.user.name,
              choreTitle: assignment.chore.title,
              dueDate: dueDateStr,
              priority: assignment.chore.priority,
            }),
          ]);
        } else {
          await Promise.allSettled([
            sendReminderEmail({
              to: assignment.user.email,
              name: assignment.user.name,
              choreTitle: assignment.chore.title,
              dueDate: dueDateStr,
            }),
            sendReminderSlackMessage({
              userName: assignment.user.name,
              choreTitle: assignment.chore.title,
              dueDate: dueDateStr,
            }),
          ]);
        }

        // Record notification
        await prisma.notification.create({
          data: {
            userId: assignment.userId,
            assignmentId,
            channel: 'EMAIL',
            status: 'SENT',
            scheduledFor: new Date(),
            sentAt: new Date(),
          },
        });
      }

      if (job.name === 'send-invite') {
        const { email, name, tempPassword } = job.data as SendInviteJob;
        await sendInviteEmail({
          to: email,
          name,
          tempPassword,
          loginUrl: `${config.FRONTEND_URL}/login`,
        });
      }
    },
    { connection: redis, concurrency: 5 }
  );

  worker.on('failed', (job, err) => {
    console.error(`[NotificationWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
