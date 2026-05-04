import { Router } from 'express';
import * as ctrl from '../controllers/integrations.controller';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

// Google Calendar (per-user)
router.get('/google-calendar/connect', requireAuth, ctrl.connectGoogleCalendar);
router.get('/google-calendar/callback', ctrl.googleCalendarCallback); // no auth — Google redirects here
router.delete('/google-calendar/disconnect', requireAuth, ctrl.disconnectGoogle);

// Slack (admin-only config)
router.put('/slack/webhook', requireAuth, requireAdmin, ctrl.updateSlackWebhook);
router.post('/slack/test', requireAuth, requireAdmin, ctrl.testSlack);

// Notifications feed
router.get('/notifications', requireAuth, ctrl.getNotifications);

export default router;
