# OtakuHub

OtakuHub is a portfolio-plus-beta MVP for managing fandom schedules: crawl public community posts, extract event candidates with Gemini, let the user approve them, then track calendar items, reminders, and merch collections.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS with shadcn-style local primitives
- Supabase Auth/Postgres/RLS
- FullCalendar, dayjs
- Axios/Cheerio crawlers plus a Playwright official-site adapter
- Gemini Developer API for structured event extraction
- Agent-ready server API endpoints for future OtakuS Agent integration

## Run Locally

```bash
npm install
npm run dev
```

The app runs in demo mode without Supabase or Gemini keys. Add `.env.local` from `.env.example` to enable real Supabase/Gemini integrations.

## Deployment Readiness

Before the first production deployment:

1. Create a new Supabase project for the OtakuHub beta.
2. Apply `supabase/migrations/202605080001_initial_schema.sql`.
3. Apply `supabase/seed.sql` for portfolio demo data.
4. Configure Google OAuth in Supabase Auth.
5. Add the required Vercel environment variables.
6. Deploy `main` to Vercel and run a production smoke test.

Required Vercel environment variables:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_FALLBACK_MODEL`
- `CRON_SECRET`

## Supabase

Apply `supabase/migrations/202605080001_initial_schema.sql` in the Supabase SQL editor or through the Supabase CLI after linking a project. The migration creates RLS-enabled tables for profiles, franchises, events, user saves, collections, crawl sources, crawled posts, suggestions, reminders, and crawl run logs.

Google OAuth setup:

- Add the Google OAuth redirect URI from Supabase: `https://<project-ref>.supabase.co/auth/v1/callback`.
- Add Supabase Auth redirect URLs for local and production callbacks:
  - `http://localhost:3000/auth/callback`
  - `https://<vercel-production-domain>/auth/callback`

## Cron

`vercel.json` configures a daily Vercel Cron job for `GET /api/crawl/run` at `0 18 * * *` UTC. Vercel invokes Cron routes only on production deployments and sends the protected request with:

```http
Authorization: Bearer $CRON_SECRET
```

The Discover screen keeps using `POST /api/crawl/run` for manual demo runs. Without configured crawl sources or credentials, the endpoint uses representative demo posts so the `crawl -> AI -> suggestion` flow is visible during portfolio demos.

## OtakuS Agent Integration Prep

OtakuHub stays usable as a standalone web app. Future OtakuS Agent support is prepared through server APIs instead of shared databases:

- `GET /api/integrations/agent/config` returns capability and endpoint metadata.
- `GET /api/integrations/agent/events` returns approved upcoming OtakuHub events.
- `POST /api/integrations/agent/activity` accepts user-approved game activity signals from SipSungJang.
- `POST /api/integrations/agent/spending-alert` accepts GachaGuard budget or impulse-spend warnings.

Set `OTAKUS_AGENT_API_TOKEN` in production to require a bearer token. Demo mode leaves the endpoints open locally. These endpoints do not accept full process lists, window titles, keystrokes, or screenshots.
