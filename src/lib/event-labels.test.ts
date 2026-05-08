import { describe, expect, it } from "vitest";
import { normalizeEventType } from "@/lib/event-labels";

describe("normalizeEventType", () => {
  it("maps Korean schedule keywords to event types", () => {
    expect(normalizeEventType("홍대 콜라보 카페 오픈")).toBe("cafe");
    expect(normalizeEventType("신상 굿즈 예약 시작")).toBe("preorder");
    expect(normalizeEventType("공식 방송 일정 공개")).toBe("broadcast");
  });

  it("falls back to other", () => {
    expect(normalizeEventType("잡담 게시글")).toBe("other");
  });
});
