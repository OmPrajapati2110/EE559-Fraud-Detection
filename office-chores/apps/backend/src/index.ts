import './config'; // validate env vars first
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';

import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import choresRoutes from './routes/chores.routes';
import assignmentsRoutes from './routes/assignments.routes';
import historyRoutes from './routes/history.routes';
import integrationsRoutes from './routes/integrations.routes';
import { startNotificationWorker } from './workers/notificationWorker';
import { startGoogleCalendarWorker } from './workers/googleCalendarWorker';
import { generateUpcomingAssignments, sendDailyReminders } from './workers/recurrenceWorker';

const app = express();

// ── Security & parsing ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: config.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/chores', choresRoutes);
app.use('/api/v1/assignments', assignmentsRoutes);
app.use('/api/v1/history', historyRoutes);
app.use('/api/v1/integrations', integrationsRoutes);

// ── Error handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

// ── Start workers ─────────────────────────────────────────────────────────────
startNotificationWorker();
startGoogleCalendarWorker();

// ── Cron jobs ─────────────────────────────────────────────────────────────────
// Every Sunday at 00:00 UTC — generate assignments for next 4 weeks
cron.schedule('0 0 * * 0', () => generateUpcomingAssignments(), { timezone: 'UTC' });

// Every day at 08:00 UTC — send day-before reminders
cron.schedule('0 8 * * *', () => sendDailyReminders(), { timezone: 'UTC' });

// On startup, also generate upcoming assignments
generateUpcomingAssignments().catch(console.error);

// ── Listen ────────────────────────────────────────────────────────────────────
const PORT = parseInt(config.PORT);
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
