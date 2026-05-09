import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hasSupabaseServiceEnv: vi.fn(),
  runCrawlPipeline: vi.fn(),
}));

vi.mock("@/lib/crawlers", () => ({
  runCrawlPipeline: mocks.runCrawlPipeline,
}));

vi.mock("@/lib/supabase/env", () => ({
  hasSupabaseServiceEnv: mocks.hasSupabaseServiceEnv,
}));

import { GET, POST } from "@/app/api/crawl/run/route";

const crawlResult = {
  status: "success",
  postsFound: 1,
  suggestionsCreated: 1,
  suggestions: [],
  errors: [],
  startedAt: "2026-05-09T00:00:00.000Z",
  finishedAt: "2026-05-09T00:00:01.000Z",
};

const originalCronSecret = process.env.CRON_SECRET;

function request(headers?: HeadersInit) {
  return new Request("http://localhost/api/crawl/run", { headers });
}

describe("/api/crawl/run route", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron-secret";
    mocks.hasSupabaseServiceEnv.mockReturnValue(true);
    mocks.runCrawlPipeline.mockResolvedValue(crawlResult);
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalCronSecret;
    }
  });

  it("runs the same protected crawl pipeline for Vercel GET cron and manual POST", async () => {
    const headers = { authorization: "Bearer test-cron-secret" };

    const getResponse = await GET(request(headers));
    const postResponse = await POST(request(headers));

    expect(getResponse.status).toBe(200);
    expect(postResponse.status).toBe(200);
    expect(await getResponse.json()).toEqual({ data: crawlResult, warning: null });
    expect(await postResponse.json()).toEqual({ data: crawlResult, warning: null });
    expect(mocks.runCrawlPipeline).toHaveBeenCalledTimes(2);
  });

  it("rejects protected cron requests without the bearer secret", async () => {
    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(mocks.runCrawlPipeline).not.toHaveBeenCalled();
  });

  it("keeps demo mode open when Supabase service env and CRON_SECRET are absent", async () => {
    mocks.hasSupabaseServiceEnv.mockReturnValue(false);
    delete process.env.CRON_SECRET;

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: crawlResult,
      warning: "CRON_SECRET is not hardened; set it before deployment.",
    });
    expect(mocks.runCrawlPipeline).toHaveBeenCalledTimes(1);
  });
});
