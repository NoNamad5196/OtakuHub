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

  it("documents Firebase setup, OtakuS launcher envs, and GET-based Cron behavior", () => {
    const readme = readFileSync(join(process.cwd(), "README.md"), "utf8");
    const envExample = readFileSync(join(process.cwd(), ".env.example"), "utf8");

    expect(readme).toContain("docs/otakus-firestore-contract.md");
    expect(readme).toContain("scripts/migrate-from-supabase.mjs");
    expect(readme).toContain("`NEXT_PUBLIC_SIPSUNGJANG_URL`");
    expect(readme).toContain("`NEXT_PUBLIC_GACHAGUARD_URL`");
    expect(readme).toContain("`GET /api/crawl/run`");
    expect(readme).not.toMatch(/Vercel Cron[^\n.]*POST/i);
    expect(envExample).toContain("NEXT_PUBLIC_FIREBASE_PROJECT_ID=");
    expect(envExample).toContain("FIREBASE_PRIVATE_KEY=");
    expect(envExample).toContain("NEXT_PUBLIC_SIPSUNGJANG_URL=");
    expect(envExample).toContain("NEXT_PUBLIC_GACHAGUARD_URL=");
  });
});
