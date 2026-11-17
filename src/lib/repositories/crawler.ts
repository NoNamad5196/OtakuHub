import { createHash } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { hasFirebaseAdminEnv, hasFirebaseEnv } from "@/lib/firebase/env";
import type { CrawlPost } from "@/lib/crawlers/types";
import {
  mapCrawlRunRow,
  mapCrawlSourceRow,
  mapFranchiseRow,
  mapSuggestionRow,
  toJson,
  type CrawlRunRow,
  type CrawlSourceRow,
  type EventSuggestionRow,
  type FranchiseRow,
} from "@/lib/repositories/mappers";
import type { ExtractedEvent } from "@/lib/ai/extract-event";
import type { CrawlRun, CrawlSource, EventSuggestion, Franchise } from "@/lib/types";

export type FirestoreCrawlContext = {
  sources: CrawlSource[];
  franchises: Franchise[];
};

export type SupabaseCrawlContext = FirestoreCrawlContext;

export function hashPostContent(post: Pick<CrawlPost, "title" | "content">) {
  return createHash("sha256").update(`${post.title}\n${post.content}`).digest("hex");
}

export function getCrawledPostId(originalUrl: string): string {
  return createHash("sha256").update(originalUrl.trim()).digest("hex");
}

export function getSuggestionId(postId: string, contentHash: string): string {
  return createHash("sha256").update(JSON.stringify([postId, contentHash])).digest("hex");
}

export async function getFirestoreCrawlContext(): Promise<FirestoreCrawlContext | null> {
  if (!hasFirebaseEnv() && !hasFirebaseAdminEnv()) return null;
  const db = getAdminDb();

  const [sourcesSnap, franchisesSnap] = await Promise.all([
    db.collection("modules/hub/crawlSources").get(),
    db.collection("franchises").get(),
  ]);

  const sources = sourcesSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as CrawlSourceRow)
    .filter((s) => s.is_active !== false)
    .map(mapCrawlSourceRow);

  const franchises = franchisesSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as FranchiseRow)
    .map((row) => mapFranchiseRow(row));

  return { sources, franchises };
}

export const getSupabaseCrawlContext = getFirestoreCrawlContext;

export async function persistFirestoreCrawlSuggestion({
  post,
  source,
  extracted,
}: {
  post: CrawlPost;
  source: CrawlSource;
  extracted: ExtractedEvent;
}): Promise<EventSuggestion> {
  if (!hasFirebaseEnv() && !hasFirebaseAdminEnv()) {
    throw new Error("Firebase Admin credentials are not configured");
  }
  const db = getAdminDb();
  const postId = getCrawledPostId(post.originalUrl);
  const contentHash = hashPostContent(post);
  const suggestionId = getSuggestionId(postId, contentHash);
  const now = Timestamp.now();

  const postRef = db.doc(`modules/hub/crawledPosts/${postId}`);
  await postRef.set(
    {
      franchise_id: source.franchiseId ?? null,
      crawl_source_id: source.id,
      source: post.source,
      title: post.title,
      content: post.content,
      original_url: post.originalUrl,
      content_hash: contentHash,
      crawled_at: Timestamp.fromDate(new Date(post.crawledAt)),
      schema_version: 1,
      updated_at: now,
    },
    { merge: true },
  );

  const suggestionRef = db.doc(`modules/hub/eventSuggestions/${suggestionId}`);
  const existingSuggestion = await suggestionRef.get();
  if (existingSuggestion.exists) {
    return mapSuggestionRow({
      id: existingSuggestion.id,
      ...existingSuggestion.data(),
    } as EventSuggestionRow);
  }

  const suggestionData: EventSuggestionRow = {
    id: suggestionId,
    crawled_post_id: postId,
    content_hash: contentHash,
    franchise_id: source.franchiseId ?? null,
    game_id: null,
    title: extracted.title,
    event_type: extracted.eventType,
    start_date: extracted.startDate,
    end_date: extracted.endDate ?? null,
    location: extracted.location ?? null,
    source_url: extracted.sourceUrl,
    confidence: extracted.confidence,
    warnings: extracted.warnings,
    status: "pending",
    raw_ai: toJson(extracted),
    created_at: now,
    updated_at: now,
  };
  await suggestionRef.set(suggestionData);
  return mapSuggestionRow(suggestionData);
}

export const persistSupabaseCrawlSuggestion = persistFirestoreCrawlSuggestion;

export async function appendFirestoreCrawlRun(input: Omit<CrawlRun, "id">): Promise<CrawlRun> {
  if (!hasFirebaseEnv() && !hasFirebaseAdminEnv()) {
    throw new Error("Firebase Admin credentials are not configured");
  }
  const db = getAdminDb();
  const runId = crypto.randomUUID();
  const now = Timestamp.now();

  const runData: CrawlRunRow = {
    id: runId,
    source_id: input.sourceId ?? null,
    status: input.status,
    posts_found: input.postsFound,
    suggestions_created: input.suggestionsCreated,
    error: input.error ?? null,
    started_at: Timestamp.fromDate(new Date(input.startedAt)),
    finished_at: Timestamp.fromDate(new Date(input.finishedAt)),
    created_at: now,
    updated_at: now,
  };
  await db.doc(`modules/hub/crawlRuns/${runId}`).set(runData);
  return mapCrawlRunRow(runData);
}

export const appendSupabaseCrawlRun = appendFirestoreCrawlRun;
