import { describe, expect, it } from "vitest";
import { inferDatesFromText } from "@/lib/date-utils";

describe("inferDatesFromText", () => {
  it("extracts Korean month/day dates with current year", () => {
    expect(inferDatesFromText("콜라보 카페는 5월 12일부터 시작", "2026-05-08")).toBe(
      "2026-05-12",
    );
  });

  it("extracts slash dates", () => {
    expect(inferDatesFromText("예약 시작 6/3", "2026-05-08")).toBe("2026-06-03");
  });

  it("returns null when no valid date exists", () => {
    expect(inferDatesFromText("날짜 미정")).toBeNull();
  });
});
