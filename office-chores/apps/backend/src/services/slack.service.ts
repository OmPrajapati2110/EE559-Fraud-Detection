import { IncomingWebhook } from '@slack/webhook';
import { prisma } from '../lib/prisma';

const PRIORITY_EMOJI: Record<string, string> = {
  LOW: ':white_circle:',
  MEDIUM: ':large_yellow_circle:',
  HIGH: ':large_orange_circle:',
  CRITICAL: ':red_circle:',
};

async function getWebhookUrl(): Promise<string | null> {
  const config = await prisma.config.findUnique({ where: { key: 'SLACK_WEBHOOK_URL' } });
  return config?.value ?? null;
}

export async function sendAssignedSlackMessage(data: {
  userName: string;
  choreTitle: string;
  dueDate: string;
  priority: string;
}): Promise<void> {
  const webhookUrl = await getWebhookUrl();
  if (!webhookUrl) {
    console.warn('[Slack] Webhook URL not configured, skipping');
    return;
  }

  const webhook = new IncomingWebhook(webhookUrl);
  const emoji = PRIORITY_EMOJI[data.priority] ?? ':white_circle:';

  await webhook.send({
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*New Chore Assigned* :clipboard:\n*${data.choreTitle}* is due on *${data.dueDate}*\nAssigned to: *${data.userName}*`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `${emoji} Priority: *${data.priority}*`,
          },
        ],
      },
    ],
  });
}

export async function sendReminderSlackMessage(data: {
  userName: string;
  choreTitle: string;
  dueDate: string;
}): Promise<void> {
  const webhookUrl = await getWebhookUrl();
  if (!webhookUrl) return;

  const webhook = new IncomingWebhook(webhookUrl);
  await webhook.send({
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:bell: *Reminder:* *${data.choreTitle}* is due tomorrow (*${data.dueDate}*)\nAssigned to: *${data.userName}*`,
        },
      },
    ],
  });
}

export async function testSlackWebhook(webhookUrl: string): Promise<void> {
  const webhook = new IncomingWebhook(webhookUrl);
  await webhook.send({ text: '✅ Office Chores Slack integration is working!' });
}
