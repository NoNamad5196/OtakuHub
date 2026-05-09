import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("deployment readiness", () => {
  it("configures a daily Vercel Cron GET route for the crawl pipeline", () => {
    const vercelConfig = JSON.parse(
      readFileSync(join(process.cwd(), "vercel.json"), "utf8"),
    ) as { crons?: Array<{ path: string; schedule: string }> };

    expect(vercelConfig.crons).toEqual([
      {
        path: "/api/crawl/run",
        schedule: "0 18 * * *",
      },
    ]);
  });

  it("documents Supabase setup, Vercel envs, and GET-based Cron behavior", () => {
    const readme = readFileSync(join(process.cwd(), "README.md"), "utf8");

    expect(readme).toContain("Apply `supabase/migrations/202605080001_initial_schema.sql`");
    expect(readme).toContain("Apply `supabase/seed.sql`");
    expect(readme).toContain("`NEXT_PUBLIC_SUPABASE_URL`");
    expect(readme).toContain("`SUPABASE_SERVICE_ROLE_KEY`");
    expect(readme).toContain("daily Vercel Cron job for `GET /api/crawl/run`");
    expect(readme).not.toMatch(/Vercel Cron[^\n.]*POST/i);
  });
});
