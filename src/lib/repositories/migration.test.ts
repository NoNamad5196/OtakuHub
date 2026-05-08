import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202605080001_initial_schema.sql"),
  "utf8",
).toLowerCase();

describe("Supabase migration security shape", () => {
  it("enables RLS on exposed public tables", () => {
    for (const table of [
      "profiles",
      "franchises",
      "user_franchises",
      "events",
      "user_events",
      "collections",
      "crawl_sources",
      "crawled_posts",
      "event_suggestions",
      "reminders",
      "crawl_runs",
    ]) {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("declares grants and authenticated uid checks", () => {
    expect(migration).toContain("grant usage on schema public to anon, authenticated, service_role");
    expect(migration).toContain("grant select on public.franchises, public.events to anon, authenticated");
    expect(migration).toContain("(select auth.uid()) is not null");
  });

  it("pins suggestion review updates to the reviewer", () => {
    expect(migration).toContain("with check (reviewed_by = (select auth.uid()))");
    expect(migration).toContain("status text not null default 'pending' check (status in ('pending', 'accepted', 'ignored'))");
  });
});
