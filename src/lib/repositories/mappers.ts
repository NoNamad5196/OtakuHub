import type { Database, Json } from "@/lib/database.types";
import type {
  CollectionItem,
  CrawlRun,
  CrawlSource,
  EventSuggestion,
  Franchise,
  OtakuEvent,
  Priority,
  Reminder,
} from "@/lib/types";

type Tables = Database["public"]["Tables"];

export type FranchiseRow = Tables["franchises"]["Row"];
export type UserFranchiseRow = Tables["user_franchises"]["Row"];
export type EventRow = Tables["events"]["Row"];
export type UserEventRow = Tables["user_events"]["Row"];
export type CollectionRow = Tables["collections"]["Row"];
export type CrawlSourceRow = Tables["crawl_sources"]["Row"];
export type CrawledPostRow = Tables["crawled_posts"]["Row"];
export type EventSuggestionRow = Tables["event_suggestions"]["Row"];
export type ReminderRow = Tables["reminders"]["Row"];
export type CrawlRunRow = Tables["crawl_runs"]["Row"];

function asPriority(value: number | undefined): Priority | undefined {
  return value === 1 || value === 2 || value === 3 ? value : undefined;
}

export function slugifyName(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-|-$/g, "") || crypto.randomUUID()
  );
}

export function mapFranchiseRow(row: FranchiseRow, userFranchise?: UserFranchiseRow): Franchise {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    colorCode: row.color_code,
    iconUrl: row.icon_url,
    priority: asPriority(userFranchise?.priority),
  };
}

export function mapEventRow(row: EventRow, userEvent?: UserEventRow): OtakuEvent {
  return {
    id: row.id,
    franchiseId: row.franchise_id,
    type: row.type,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date,
    location: row.location,
    sourceUrl: row.source_url,
    isVerified: row.is_verified,
    createdAt: row.created_at,
    saved: Boolean(userEvent),
    memo: userEvent?.memo ?? null,
    remindDays: userEvent?.remind_days,
  };
}

export function mapCollectionRow(row: CollectionRow): CollectionItem {
  return {
    id: row.id,
    userId: row.user_id,
    eventId: row.event_id,
    franchiseId: row.franchise_id,
    itemName: row.item_name,
    price: row.price,
    isWishlist: row.is_wishlist,
    boughtAt: row.bought_at,
    memo: row.memo,
  };
}

export function mapCrawlSourceRow(row: CrawlSourceRow): CrawlSource {
  return {
    id: row.id,
    franchiseId: row.franchise_id,
    sourceType: row.source_type,
    name: row.name,
    url: row.url,
    keywords: row.keywords,
    isActive: row.is_active,
    lastCrawledAt: row.last_crawled_at,
    lastError: row.last_error,
  };
}

export function mapSuggestionRow(row: EventSuggestionRow): EventSuggestion {
  return {
    id: row.id,
    crawledPostId: row.crawled_post_id,
    franchiseId: row.franchise_id,
    title: row.title,
    eventType: row.event_type,
    startDate: row.start_date,
    endDate: row.end_date,
    location: row.location,
    sourceUrl: row.source_url,
    confidence: Number(row.confidence),
    warnings: row.warnings,
    status: row.status,
    rawAi: row.raw_ai,
    createdAt: row.created_at,
  };
}

export function mapReminderRow(row: ReminderRow): Reminder {
  return {
    id: row.id,
    eventId: row.event_id,
    remindAt: row.remind_at,
    status: row.status,
  };
}

export function mapCrawlRunRow(row: CrawlRunRow): CrawlRun {
  return {
    id: row.id,
    sourceId: row.source_id,
    status: row.status,
    postsFound: row.posts_found,
    suggestionsCreated: row.suggestions_created,
    error: row.error,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

export function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
