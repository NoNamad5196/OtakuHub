# OtakuHub

OtakuHub is a portfolio-plus-beta MVP for managing fandom schedules: crawl public community posts, extract event candidates with Gemini, let the user approve them, then track calendar items, reminders, and merch collections.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS with shadcn-style local primitives
- Supabase Auth/Postgres/RLS
- FullCalendar, dayjs
- Axios/Cheerio crawlers plus a Playwright official-site adapter
- Gemini Developer API for structured event extraction

## Run Locally

```bash
npm install
npm run dev
```

The app runs in demo mode without Supabase or Gemini keys. Add `.env.local` from `.env.example` to enable real Supabase/Gemini integrations.

## Supabase

Apply `supabase/migrations/202605080001_initial_schema.sql` in the Supabase SQL editor or through the Supabase CLI after linking a project. The migration creates RLS-enabled tables for profiles, franchises, events, user saves, collections, crawl sources, crawled posts, suggestions, reminders, and crawl run logs.

## Cron

Configure Vercel Cron to POST `/api/crawl/run` with:

```http
Authorization: Bearer $CRON_SECRET
```

Without configured crawl sources or credentials, the endpoint uses representative demo posts so the `crawl -> AI -> suggestion` flow is visible during portfolio demos.
