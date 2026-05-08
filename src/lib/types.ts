export const franchiseCategories = ["game", "anime", "vtuber", "idol", "other"] as const;
export type FranchiseCategory = (typeof franchiseCategories)[number];

export const eventTypes = [
  "goods_release",
  "preorder",
  "cafe",
  "popup",
  "concert",
  "broadcast",
  "birthday",
  "other",
] as const;
export type EventType = (typeof eventTypes)[number];

export const crawlSourceTypes = ["naver_lounge", "dc", "official"] as const;
export type CrawlSourceType = (typeof crawlSourceTypes)[number];

export const suggestionStatuses = ["pending", "accepted", "ignored"] as const;
export type SuggestionStatus = (typeof suggestionStatuses)[number];

export type Priority = 1 | 2 | 3;

export type Franchise = {
  id: string;
  name: string;
  slug: string;
  category: FranchiseCategory;
  colorCode: string;
  iconUrl?: string | null;
  priority?: Priority;
};

export type OtakuEvent = {
  id: string;
  franchiseId: string;
  type: EventType;
  title: string;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  sourceUrl?: string | null;
  isVerified: boolean;
  createdAt: string;
  saved?: boolean;
  memo?: string | null;
  remindDays?: number[];
};

export type CollectionItem = {
  id: string;
  userId?: string;
  eventId?: string | null;
  franchiseId?: string | null;
  itemName: string;
  price: number;
  isWishlist: boolean;
  boughtAt?: string | null;
  memo?: string | null;
};

export type CrawlSource = {
  id: string;
  franchiseId?: string | null;
  sourceType: CrawlSourceType;
  name: string;
  url: string;
  keywords: string[];
  isActive: boolean;
  lastCrawledAt?: string | null;
  lastError?: string | null;
};

export type CrawledPost = {
  id: string;
  franchiseId?: string | null;
  crawlSourceId?: string | null;
  source: CrawlSourceType;
  title: string;
  content: string;
  originalUrl: string;
  crawledAt: string;
};

export type EventSuggestion = {
  id: string;
  crawledPostId: string;
  franchiseId?: string | null;
  title: string;
  eventType: EventType;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  sourceUrl: string;
  confidence: number;
  warnings: string[];
  status: SuggestionStatus;
  rawAi?: unknown;
  createdAt: string;
};

export type Reminder = {
  id: string;
  eventId: string;
  remindAt: string;
  status: "pending" | "sent" | "dismissed";
};

export type CrawlRun = {
  id: string;
  sourceId?: string | null;
  status: "success" | "partial" | "failed";
  postsFound: number;
  suggestionsCreated: number;
  error?: string | null;
  startedAt: string;
  finishedAt: string;
};

export type DashboardData = {
  franchises: Franchise[];
  events: OtakuEvent[];
  collections: CollectionItem[];
  sources: CrawlSource[];
  suggestions: EventSuggestion[];
  reminders: Reminder[];
  crawlRuns: CrawlRun[];
};
