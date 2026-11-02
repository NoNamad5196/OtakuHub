import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase/session", () => ({
  getSessionUser: vi.fn(async () => null),
}));

import { AuthenticationRequiredError, createSupabaseEvent } from "@/lib/repositories/mutations";

describe("Firestore mutations", () => {
  it("requires authentication for protected mutations", async () => {
    await expect(
      createSupabaseEvent({
        franchiseId: "fr-1",
        type: "cafe",
        title: "콜라보 카페",
        startDate: "2026-05-12",
      }),
    ).rejects.toBeInstanceOf(AuthenticationRequiredError);
  });
});
