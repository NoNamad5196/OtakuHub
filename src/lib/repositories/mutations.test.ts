import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => null),
}));

import { AuthenticationRequiredError, createSupabaseEvent } from "@/lib/repositories/mutations";

describe("Supabase mutations", () => {
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
