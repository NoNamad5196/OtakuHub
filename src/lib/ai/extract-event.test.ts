import { describe, expect, it } from "vitest";
import { heuristicExtractEvent } from "@/lib/ai/extract-event";

describe("heuristicExtractEvent", () => {
  it("creates a conservative event candidate without an API key", () => {
    const event = heuristicExtractEvent({
      title: "블루 아카이브 콜라보 카페 예약 5월 12일",
      content: "홍대에서 예약이 열립니다.",
      originalUrl: "https://example.com/post",
      franchiseName: "블루 아카이브",
    });

    expect(event.eventType).toBe("cafe");
    expect(event.startDate).toMatch(/^\d{4}-05-12$/);
    expect(event.location).toBe("홍대");
    expect(event.warnings.length).toBeGreaterThan(0);
  });
});
