import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DashboardData } from "@/lib/types";

const mocks = vi.hoisted(() => ({
  getDashboardData: vi.fn(),
}));

vi.mock("@/lib/data", () => ({
  getDashboardData: mocks.getDashboardData,
}));

import { POST as activityPOST } from "@/app/api/integrations/agent/activity/route";
import { GET as configGET } from "@/app/api/integrations/agent/config/route";
import { GET as eventsGET } from "@/app/api/integrations/agent/events/route";
import { POST as spendingPOST } from "@/app/api/integrations/agent/spending-alert/route";

const originalAgentToken = process.env.OTAKUS_AGENT_API_TOKEN;

const dashboard: DashboardData = {
  franchises: [
    {
      id: "fr-blue-archive",
      name: "블루 아카이브",
      slug: "blue-archive",
      category: "game",
      colorCode: "#2563EB",
    },
  ],
  events: [
    {
      id: "ev-preorder",
      franchiseId: "fr-blue-archive",
      type: "preorder",
      title: "신규 픽업 시작",
      startDate: "2099-05-01",
      endDate: "2099-05-20",
      location: "온라인",
      sourceUrl: "https://example.com/event",
      isVerified: true,
      createdAt: "2026-05-09T00:00:00.000Z",
    },
  ],
  collections: [],
  sources: [],
  suggestions: [],
  reminders: [],
  crawlRuns: [],
};

function request(url: string, init?: RequestInit) {
  return new Request(url, init);
}

describe("OtakuS Agent integration routes", () => {
  beforeEach(() => {
    delete process.env.OTAKUS_AGENT_API_TOKEN;
    mocks.getDashboardData.mockResolvedValue(dashboard);
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (originalAgentToken === undefined) {
      delete process.env.OTAKUS_AGENT_API_TOKEN;
    } else {
      process.env.OTAKUS_AGENT_API_TOKEN = originalAgentToken;
    }
  });

  it("returns demo config without process-list capabilities", async () => {
    const response = await configGET(request("http://localhost/api/integrations/agent/config"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.mode).toBe("demo");
    expect(payload.data.endpoints.events).toContain("/api/integrations/agent/events");
    expect(payload.data.privacy.rejects).toContain("process list");
  });

  it("enforces the optional Agent bearer token", async () => {
    process.env.OTAKUS_AGENT_API_TOKEN = "agent-secret";

    const rejected = await configGET(request("http://localhost/api/integrations/agent/config"));
    const accepted = await configGET(
      request("http://localhost/api/integrations/agent/config", {
        headers: { authorization: "Bearer agent-secret" },
      }),
    );

    expect(rejected.status).toBe(401);
    expect(accepted.status).toBe(200);
  });

  it("exposes approved upcoming events for Agent consumers", async () => {
    const response = await eventsGET(
      request("http://localhost/api/integrations/agent/events?franchiseSlug=blue-archive"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.events).toMatchObject([
      {
        id: "ev-preorder",
        franchiseName: "블루 아카이브",
        type: "preorder",
      },
    ]);
  });

  it("rejects full process-list payloads on activity ingestion", async () => {
    const response = await activityPOST(
      request("http://localhost/api/integrations/agent/activity", {
        method: "POST",
        body: JSON.stringify({
          appId: "sipsungjang",
          signal: "game_started",
          processes: ["game.exe"],
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("전체 프로세스 목록");
  });

  it("accepts GachaGuard spending alerts and returns related OtakuHub events", async () => {
    const response = await spendingPOST(
      request("http://localhost/api/integrations/agent/spending-alert", {
        method: "POST",
        body: JSON.stringify({
          appId: "gachaguard",
          franchiseSlug: "blue-archive",
          trigger: "budget_exceeded",
          budgetLimit: 50000,
          projectedSpend: 79000,
          currency: "KRW",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload.data.accepted).toBe(true);
    expect(payload.data.relatedEvents[0].id).toBe("ev-preorder");
  });
});
