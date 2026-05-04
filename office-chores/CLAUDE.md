# Office Chores — Claude Guide

## Project Overview

A full-stack office chore management app. Admins create recurring chores, assign them to team members, and track completion. Members view their assignments via an Outlook-style calendar. Integrates with Slack, Google Calendar, and SendGrid email.

## Monorepo Structure

```
office-chores/
├── packages/shared/          TypeScript types + Zod schemas (used by both apps)
├── apps/backend/             Express API + Prisma + BullMQ workers
└── apps/frontend/            React + Vite + FullCalendar
```

**Package manager:** pnpm (workspace v10+)

## Common Commands

```bash
# Install all dependencies
pnpm install

# Build shared package first (required before typecheck/build)
pnpm --filter shared build

# Development servers
pnpm dev:backend              # Express API on :3000
pnpm dev:frontend             # Vite on :5173

# Database
pnpm --filter backend db:generate   # regenerate Prisma client after schema changes
pnpm --filter backend db:migrate    # run migrations (needs DATABASE_URL)
pnpm --filter backend db:seed       # seed sample data

# Type checking
pnpm --filter backend typecheck
pnpm --filter frontend typecheck

# Tests
pnpm --filter backend test          # Jest unit tests

# Build for production
pnpm build
```

## Environment

Backend `.env` file lives at `apps/backend/.env`. Copy from `.env.example` in the root.

Required vars: `DATABASE_URL`, `REDIS_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `REFRESH_TOKEN_SECRET`

Optional (integrations): `SENDGRID_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_TOKEN_ENCRYPTION_KEY`, `SLACK_WEBHOOK_URL`

## Architecture Notes

### Auth
- JWT RS256 access tokens (15 min) stored in memory (Zustand)
- Refresh tokens stored in DB, sent as httpOnly cookie (7 day)
- Refresh token rotation on every refresh — reuse detection invalidates all tokens for user
- Two roles: `ADMIN` and `MEMBER`. Admins manage everything; members view only.

### Recurrence
- Chores have a `RecurrenceRule` (every N weeks, specific day-of-week, anchor start date)
- A BullMQ cron job runs weekly (Sundays 00:00 UTC) generating `ChoreAssignment` rows for the next 4 weeks
- Round-robin assignee selection: queries last assigned user per chore, picks next in list sorted by `createdAt`
- The pure calculation logic lives in `apps/backend/src/services/recurrence.service.ts` — no DB access, fully unit-tested

### Database models (Prisma)
- `User` — team members with role, optional Slack ID + encrypted Google refresh token
- `Chore` — the chore definition with priority and optional recurrence rule
- `RecurrenceRule` — one-to-one with Chore; stores interval/dayOfWeek/startDate
- `ChoreAssignment` — one specific occurrence on one date for one user; has unique constraint on `(choreId, dueDate)`
- `ChoreHistory` — immutable audit log written when an assignment is marked complete; never deleted
- `Notification` — tracks email/Slack notification status per assignment
- `Config` — key-value store for admin-configurable settings (e.g. Slack webhook URL)

### Prisma schema location
Schema is at `apps/backend/src/prisma/schema.prisma` (non-default). The `package.json` has `"prisma": { "schema": "src/prisma/schema.prisma" }` to point Prisma CLI to it.

### BullMQ Queues
Defined in `apps/backend/src/workers/queue.ts`:
- `notifications` — email + Slack jobs, processed by `notificationWorker`
- `google-calendar` — calendar sync/delete jobs, processed by `googleCalendarWorker`
- `assignments` — (future use)

Workers are started in `apps/backend/src/index.ts` alongside cron jobs.

### Frontend data flow
- `apps/frontend/src/lib/api.ts` — axios instance with automatic token refresh on 401
- TanStack Query for server state; Zustand for auth state (access token in memory only)
- `apps/frontend/src/store/authStore.ts` — `setAuth()`, `setAccessToken()`, `logout()`

## Key Files

| File | Purpose |
|---|---|
| `apps/backend/src/prisma/schema.prisma` | All DB models — edit here for schema changes |
| `apps/backend/src/services/recurrence.service.ts` | Pure occurrence calculation — unit test any changes |
| `apps/backend/src/workers/queue.ts` | BullMQ queue definitions + job type interfaces |
| `packages/shared/src/types/api.ts` | Request/response contracts shared by FE and BE |
| `apps/frontend/src/lib/api.ts` | Axios instance with auth interceptors |
| `apps/frontend/src/store/authStore.ts` | Zustand auth store |

## Testing

Unit tests cover `recurrence.service.ts`:
```bash
pnpm --filter backend test
```

Test file: `apps/backend/src/__tests__/recurrence.service.test.ts`

When adding new recurrence logic, always add tests before touching the workers.

## Deployment

- **Frontend** → Vercel (auto-deploy from `main`, root dir = `apps/frontend`)
- **Backend** → Railway Web Service (Dockerfile at `apps/backend/Dockerfile`)
- **Database** → Railway Postgres plugin
- **Redis** → Railway Redis plugin

Railway auto-injects `DATABASE_URL` and `REDIS_URL`. All other secrets go in Railway dashboard.

## Gotchas

- Always run `pnpm --filter shared build` before typechecking — the frontend and backend import from `@office-chores/shared` which must be compiled first
- After any change to `schema.prisma`, run `pnpm --filter backend db:generate` to update the Prisma client
- The Slack webhook URL is stored in the `Config` DB table (set via Settings UI), not in `.env`
- Google OAuth refresh tokens are stored AES-256 encrypted in `User.googleRefreshToken`
- `ChoreAssignment` has a unique constraint on `(choreId, dueDate)` — the recurrence worker uses this to safely skip already-generated occurrences
