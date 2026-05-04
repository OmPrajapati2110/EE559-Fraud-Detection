import { google } from 'googleapis';
import { config } from '../config';
import { encrypt, decrypt } from '../lib/crypto';
import { prisma } from '../lib/prisma';

function createOAuth2Client() {
  return new google.auth.OAuth2(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    `${config.FRONTEND_URL}/integrations/google-calendar/callback`
  );
}

export function getAuthUrl(userId: string): string {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent',
    state: userId,
  });
}

export async function handleOAuthCallback(code: string, userId: string): Promise<void> {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error('No refresh token received — user must revoke and re-authorize');
  }

  const encrypted = encrypt(tokens.refresh_token);
  await prisma.user.update({
    where: { id: userId },
    data: { googleRefreshToken: encrypted },
  });
}

export async function disconnectGoogleCalendar(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { googleRefreshToken: null },
  });
}

async function getCalendarForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleRefreshToken: true },
  });

  if (!user?.googleRefreshToken) return null;

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: decrypt(user.googleRefreshToken) });
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function createCalendarEvent(
  userId: string,
  assignmentId: string,
  title: string,
  description: string,
  dueDate: Date
): Promise<string | null> {
  const calendar = await getCalendarForUser(userId);
  if (!calendar) return null;

  const dateStr = dueDate.toISOString().split('T')[0];

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: `[Office Chore] ${title}`,
      description,
      start: { date: dateStr },
      end: { date: dateStr },
      colorId: '5', // banana
    },
  });

  const eventId = response.data.id ?? null;

  if (eventId) {
    await prisma.choreAssignment.update({
      where: { id: assignmentId },
      data: { googleEventId: eventId },
    });
  }

  return eventId;
}

export async function updateCalendarEvent(
  userId: string,
  googleEventId: string,
  title: string,
  description: string,
  dueDate: Date
): Promise<void> {
  const calendar = await getCalendarForUser(userId);
  if (!calendar) return;

  const dateStr = dueDate.toISOString().split('T')[0];

  await calendar.events.update({
    calendarId: 'primary',
    eventId: googleEventId,
    requestBody: {
      summary: `[Office Chore] ${title}`,
      description,
      start: { date: dateStr },
      end: { date: dateStr },
    },
  });
}

export async function deleteCalendarEvent(userId: string, googleEventId: string): Promise<void> {
  const calendar = await getCalendarForUser(userId);
  if (!calendar) return;

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: googleEventId,
  });
}
