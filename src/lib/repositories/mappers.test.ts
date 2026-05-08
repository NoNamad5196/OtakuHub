import { describe, expect, it } from "vitest";
import {
  mapCollectionRow,
  mapCrawlSourceRow,
  mapEventRow,
  mapFranchiseRow,
  mapSuggestionRow,
  type CollectionRow,
  type CrawlSourceRow,
  type EventRow,
  type EventSuggestionRow,
  type FranchiseRow,
  type UserEventRow,
  type UserFranchiseRow,
} from "@/lib/repositories/mappers";

describe("Supabase row mappers", () => {
  it("maps snake_case franchise rows to app franchises", () => {
    const row: FranchiseRow = {
      id: "fr-1",
      name: "블루 아카이브",
      slug: "blue-archive",
      category: "game",
      color_code: "#38bdf8",
      icon_url: null,
      is_public: true,
      created_by: null,
      created_at: "2026-05-08T00:00:00.000Z",
    };
    const userRow: UserFranchiseRow = {
      id: "uf-1",
      user_id: "user-1",
      franchise_id: "fr-1",
      priority: 1,
      nickname: null,
      created_at: "2026-05-08T00:00:00.000Z",
    };

    expect(mapFranchiseRow(row, userRow)).toMatchObject({
      id: "fr-1",
      colorCode: "#38bdf8",
      priority: 1,
    });
  });

  it("marks events as saved when a user event row exists", () => {
    const event: EventRow = {
      id: "ev-1",
      franchise_id: "fr-1",
      type: "cafe",
      title: "콜라보 카페",
      start_date: "2026-05-12",
      end_date: null,
      location: "홍대",
      source_url: "https://example.com",
      is_verified: true,
      created_by: null,
      created_at: "2026-05-08T00:00:00.000Z",
    };
    const userEvent: UserEventRow = {
      id: "ue-1",
      user_id: "user-1",
      event_id: "ev-1",
      remind_days: [3, 7],
      is_attending: false,
      memo: "첫날 보기",
      created_at: "2026-05-08T00:00:00.000Z",
    };

    expect(mapEventRow(event, userEvent)).toMatchObject({
      franchiseId: "fr-1",
      startDate: "2026-05-12",
      saved: true,
      remindDays: [3, 7],
    });
  });

  it("maps crawler, suggestion, and collection rows", () => {
    const collection: CollectionRow = {
      id: "col-1",
      user_id: "user-1",
      event_id: "ev-1",
      franchise_id: "fr-1",
      item_name: "아크릴",
      price: 12000,
      is_wishlist: true,
      bought_at: null,
      image_url: null,
      memo: null,
      created_at: "2026-05-08T00:00:00.000Z",
    };
    const source: CrawlSourceRow = {
      id: "src-1",
      franchise_id: "fr-1",
      source_type: "dc",
      name: "DC",
      url: "https://example.com",
      keywords: ["예약"],
      is_active: true,
      last_crawled_at: null,
      last_error: null,
      created_by: null,
      created_at: "2026-05-08T00:00:00.000Z",
    };
    const suggestion: EventSuggestionRow = {
      id: "sg-1",
      crawled_post_id: "post-1",
      franchise_id: "fr-1",
      title: "예약 시작",
      event_type: "preorder",
      start_date: "2026-05-12",
      end_date: null,
      location: "온라인",
      source_url: "https://example.com/post",
      confidence: 0.9,
      warnings: [],
      status: "pending",
      raw_ai: null,
      reviewed_by: null,
      reviewed_at: null,
      created_at: "2026-05-08T00:00:00.000Z",
    };

    expect(mapCollectionRow(collection).itemName).toBe("아크릴");
    expect(mapCrawlSourceRow(source).sourceType).toBe("dc");
    expect(mapSuggestionRow(suggestion).eventType).toBe("preorder");
  });
});
