import type {
  CollectionItem,
  CrawlRun,
  CrawlSource,
  EventSuggestion,
  EventType,
  Franchise,
  FranchiseCategory,
  OtakuEvent,
  Priority,
  Reminder,
  SuggestionStatus,
} from "@/lib/types";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type FranchiseRow = {
  id: string;
  name: string;
  slug: string;
  category: FranchiseCategory;
  color_code: string;
  icon_url?: string | null;
  is_public?: boolean;
  created_by?: string | null;
  created_at?: unknown;
  updated_at?: unknown;
};

export type UserFranchiseRow = {
  id?: string;
  user_id?: string;
  franchise_id: string;
  priority?: number;
  nickname?: string | null;
  created_at?: unknown;
  updated_at?: unknown;
};

export type EventRow = {
  id: string;
  franchise_id: string;
  game_id?: string | null;
  type: EventType;
  title: string;
  start_date: string;
  end_date?: string | null;
  timezone?: string;
  location?: string | null;
  source_url?: string | null;
  status?: string;
  is_verified: boolean;
  reviewed_by?: string | null;
  reviewed_at?: unknown;
  moderation_reason?: string | null;
  suggestion_id?: string | null;
  crawled_post_id?: string | null;
  created_by?: string | null;
  created_at?: unknown;
  updated_at?: unknown;
};

export type UserEventRow = {
  id?: string;
  user_id?: string;
  event_id: string;
  remind_days?: number[];
  is_attending?: boolean;
  memo?: string | null;
  created_at?: unknown;
  updated_at?: unknown;
};

export type CollectionRow = {
  id: string;
  user_id?: string;
  event_id?: string | null;
  franchise_id?: string | null;
  game_id?: string | null;
  item_name: string;
  price: number;
  currency?: string;
  is_wishlist: boolean;
  bought_at?: unknown;
  image_url?: string | null;
  memo?: string | null;
  created_at?: unknown;
  updated_at?: unknown;
};

export type CrawlSourceRow = {
  id: string;
  franchise_id?: string | null;
  game_id?: string | null;
  source_type: "naver_lounge" | "dc" | "official";
  name: string;
  url: string;
  keywords: string[];
  is_active: boolean;
  last_crawled_at?: unknown;
  last_error?: string | null;
  created_by?: string | null;
  created_at?: unknown;
  updated_at?: unknown;
};

export type CrawledPostRow = {
  id: string;
  franchise_id?: string | null;
  crawl_source_id?: string | null;
  source: "naver_lounge" | "dc" | "official";
  title: string;
  content: string;
  original_url: string;
  content_hash: string;
  event_id?: string | null;
  crawled_at?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};

export type EventSuggestionRow = {
  id: string;
  crawled_post_id?: string | null;
  content_hash?: string | null;
  franchise_id?: string | null;
  game_id?: string | null;
  title: string;
  event_type: EventType;
  start_date: string;
  end_date?: string | null;
  location?: string | null;
  source_url: string;
  confidence: number;
  warnings: string[];
  status: SuggestionStatus;
  raw_ai?: unknown;
  reviewed_by?: string | null;
  reviewed_at?: unknown;
  moderation_reason?: string | null;
  event_id?: string | null;
  created_at?: unknown;
  updated_at?: unknown;
};

export type ReminderRow = {
  id: string;
  user_id?: string;
  event_id: string;
  remind_at: unknown;
  status: "pending" | "sent" | "dismissed";
  created_at?: unknown;
  updated_at?: unknown;
};

export type CrawlRunRow = {
  id: string;
  source_id?: string | null;
  status: "success" | "partial" | "failed";
  posts_found: number;
  suggestions_created: number;
  error?: string | null;
  started_at: unknown;
  finished_at: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};

function asPriority(value: number | undefined): Priority | undefined {
  return value === 1 || value === 2 || value === 3 ? value : undefined;
}

export function toIsoDateString(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function toNullableIsoDateString(value: unknown): string | null {
  if (!value) return null;
  return toIsoDateString(value);
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
    createdAt: toIsoDateString(row.created_at),
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
    boughtAt: toNullableIsoDateString(row.bought_at),
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
    lastCrawledAt: toNullableIsoDateString(row.last_crawled_at),
    lastError: row.last_error,
  };
}

export function mapSuggestionRow(row: EventSuggestionRow): EventSuggestion {
  return {
    id: row.id,
    crawledPostId: row.crawled_post_id ?? "",
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
    createdAt: toIsoDateString(row.created_at),
  };
}

export function mapReminderRow(row: ReminderRow): Reminder {
  return {
    id: row.id,
    eventId: row.event_id,
    remindAt: toIsoDateString(row.remind_at),
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
    startedAt: toIsoDateString(row.started_at),
    finishedAt: toIsoDateString(row.finished_at),
  };
}

export function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
