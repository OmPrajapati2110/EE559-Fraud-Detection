# Office Chores — Setup Guide

## Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- PostgreSQL 15+
- Redis 7+

## Local Development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example apps/backend/.env
```

Edit `apps/backend/.env` and fill in:
- `DATABASE_URL` — your local PostgreSQL connection string
- `REDIS_URL` — your local Redis URL (default: `redis://localhost:6379`)
- JWT keys (generate with commands below)
- Optional: SendGrid, Google OAuth, Slack

**Generate RS256 key pair:**
```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
# Copy contents into .env (replace newlines with \n)
```

**Generate secrets:**
```bash
openssl rand -hex 64   # → REFRESH_TOKEN_SECRET
openssl rand -hex 32   # → GOOGLE_TOKEN_ENCRYPTION_KEY
```

### 3. Set up the database

```bash
cd apps/backend
pnpm db:migrate     # run Prisma migrations
pnpm db:generate    # generate Prisma client
pnpm db:seed        # seed with sample data
```

Default accounts after seeding:
- Admin: `admin@office.com` / `Admin@1234`
- Member: `alice@office.com` / `Member@1234`

### 4. Run dev servers

```bash
# Terminal 1 — backend (port 3000)
pnpm dev:backend

# Terminal 2 — frontend (port 5173)
pnpm dev:frontend
```

Open http://localhost:5173

## Running Tests

```bash
pnpm --filter backend test
```

## Cloud Deployment

### Railway (backend + database + Redis)

1. Create a Railway project at https://railway.app
2. Add services: **PostgreSQL**, **Redis**, **Web Service** (from GitHub)
3. In the Web Service, set root directory and build from `Dockerfile` at `apps/backend/Dockerfile`
4. Railway auto-injects `DATABASE_URL` and `REDIS_URL`
5. Add remaining env vars in Railway dashboard

### Vercel (frontend)

1. Import GitHub repo at https://vercel.com
2. Set **Root Directory** to `apps/frontend`
3. Set env var: `VITE_API_BASE_URL=https://your-railway-api-url.railway.app/api/v1`
4. Deploy

## Third-party Setup

### SendGrid
1. Sign up at https://sendgrid.com
2. Create an API key with "Mail Send" permission
3. Create two Dynamic Templates: "Chore Assigned" and "Chore Reminder"
4. Copy template IDs into env vars

### Slack Incoming Webhook
1. Go to https://api.slack.com/apps → Create App
2. Enable **Incoming Webhooks** → Add to Workspace
3. Copy webhook URL
4. Paste into the app's Settings page (no env var needed — stored in DB)

### Google Calendar OAuth
1. Go to https://console.cloud.google.com
2. Create a project → Enable **Google Calendar API**
3. Create OAuth 2.0 credentials (Web application)
4. Add authorized redirect URI: `https://your-frontend.vercel.app/integrations/google-calendar/callback`
5. Copy Client ID and Client Secret into env vars

## Architecture

```
office-chores/
├── apps/
│   ├── frontend/       React + Vite + FullCalendar
│   └── backend/        Express + Prisma + BullMQ
└── packages/
    └── shared/         Shared TypeScript types + Zod schemas
```

## Manual QA Checklist

- [ ] Admin login works; member login works
- [ ] Create a chore with every-2-weeks recurrence → assignments appear in calendar
- [ ] Calendar shows month/week/day views
- [ ] Click event → detail drawer shows chore info
- [ ] Admin marks assignment complete → green badge on calendar, appears in History table
- [ ] Email received on assignment creation (if SendGrid configured)
- [ ] Slack message posted (if webhook configured)
- [ ] Google Calendar event created (if OAuth connected)
- [ ] Invite new team member → invite email sent → can log in
- [ ] Remove team member → no longer assigned to future chores
- [ ] Non-admin cannot access Chores, Team, or Settings pages
- [ ] History table filters by date range work
- [ ] Chore priority colors show correctly on calendar (green/yellow/orange/red)
