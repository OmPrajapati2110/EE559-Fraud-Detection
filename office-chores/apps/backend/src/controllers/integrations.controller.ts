import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import {
  getAuthUrl,
  handleOAuthCallback,
  disconnectGoogleCalendar,
} from '../services/googleCalendar.service';
import { testSlackWebhook } from '../services/slack.service';
import { config } from '../config';

export async function connectGoogleCalendar(req: Request, res: Response, next: NextFunction) {
  try {
    const authUrl = getAuthUrl(req.user!.sub);
    res.json({ authUrl });
  } catch (err) { next(err); }
}

export async function googleCalendarCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const { code, state: userId } = req.query as { code: string; state: string };
    await handleOAuthCallback(code, userId);
    res.redirect(`${config.FRONTEND_URL}/settings?google=connected`);
  } catch (err) { next(err); }
}

export async function disconnectGoogle(req: Request, res: Response, next: NextFunction) {
  try {
    await disconnectGoogleCalendar(req.user!.sub);
    res.json({ message: 'Google Calendar disconnected' });
  } catch (err) { next(err); }
}

export async function updateSlackWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const { webhookUrl } = req.body;
    await prisma.config.upsert({
      where: { key: 'SLACK_WEBHOOK_URL' },
      update: { value: webhookUrl },
      create: { key: 'SLACK_WEBHOOK_URL', value: webhookUrl },
    });
    res.json({ message: 'Slack webhook updated' });
  } catch (err) { next(err); }
}

export async function testSlack(req: Request, res: Response, next: NextFunction) {
  try {
    const config = await prisma.config.findUnique({ where: { key: 'SLACK_WEBHOOK_URL' } });
    if (!config?.value) {
      res.status(400).json({ error: 'BadRequest', message: 'No Slack webhook configured' });
      return;
    }
    await testSlackWebhook(config.value);
    res.json({ message: 'Test message sent to Slack' });
  } catch (err) { next(err); }
}

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({ notifications });
  } catch (err) { next(err); }
}
