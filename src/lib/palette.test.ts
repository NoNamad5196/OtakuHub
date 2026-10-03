import { describe, expect, it } from "vitest";
import { lookupFranchisePalette } from "@/lib/palette";

describe("franchise palette lookup", () => {
  it("finds curated palettes by Korean and alias names", () => {
    expect(lookupFranchisePalette("블아")).toMatchObject({
      name: "블루 아카이브",
      colorCode: "#2563EB",
      source: { type: "curated" },
    });

    expect(lookupFranchisePalette("Zenless Zone Zero")).toMatchObject({
      name: "젠레스 존 제로",
      colorCode: "#FACC15",
      category: "game",
    });
  });

  it("generates a stable fallback palette for unknown names", () => {
    const first = lookupFranchisePalette("새로운 게임");
    const second = lookupFranchisePalette("새로운 게임");

    expect(first).toMatchObject({
      name: "새로운 게임",
      category: "game",
      source: { type: "generated" },
    });
    expect(first.palette).toHaveLength(4);
    expect(first.colorCode).toMatch(/^#[0-9A-F]{6}$/);
    expect(second.palette).toEqual(first.palette);
  });
});
