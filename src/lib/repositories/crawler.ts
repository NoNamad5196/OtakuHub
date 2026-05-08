import { createHash } from "node:crypto";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { CrawlPost } from "@/lib/crawlers/types";
import {
  mapCrawlRunRow,
  mapCrawlSourceRow,
  mapFranchiseRow,
  mapSuggestionRow,
  toJson,
} from "@/lib/repositories/mappers";
import type { ExtractedEvent } from "@/lib/ai/extract-event";
import type { CrawlRun, CrawlSource, EventSuggestion, Franchise } from "@/lib/types";

export type SupabaseCrawlContext = {
  sources: CrawlSource[];
  franchises: Franchise[];
};

export function hashPostContent(post: Pick<CrawlPost, "title" | "content">) {
  return createHash("sha256").update(`${post.title}\n${post.content}`).digest("hex");
}

export async function getSupabaseCrawlContext(): Promise<SupabaseCrawlContext | null> {
  const supabase = createServiceSupabaseClient();
  if (!supabase) return null;

  const [sourcesResult, franchisesResult] = await Promise.all([
    supabase.from("crawl_sources").select("*").eq("is_active", true),
    supabase.from("franchises").select("*"),
  ]);

  if (sourcesResult.error || franchisesResult.error) {
    throw sourcesResult.error ?? franchisesResult.error;
  }

  return {
    sources: (sourcesResult.data ?? []).map(mapCrawlSourceRow),
    franchises: (franchisesResult.data ?? []).map((row) => mapFranchiseRow(row)),
  };
}

export async function persistSupabaseCrawlSuggestion({
  post,
  source,
  extracted,
}: {
  post: CrawlPost;
  source: CrawlSource;
  extracted: ExtractedEvent;
}): Promise<EventSuggestion> {
  const supabase = createServiceSupabaseClient();
  if (!supabase) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");

  const { data: crawledPost, error: crawledPostError } = await supabase
    .from("crawled_posts")
    .upsert(
      {
        franchise_id: source.franchiseId ?? null,
        crawl_source_id: source.id,
        source: post.source,
        title: post.title,
        content: post.content,
        original_url: post.originalUrl,
        content_hash: hashPostContent(post),
        crawled_at: post.crawledAt,
      },
      { onConflict: "original_url" },
    )
    .select("*")
    .single();

  if (crawledPostError) throw crawledPostError;

  const { data: suggestion, error: suggestionError } = await supabase
    .from("event_suggestions")
    .insert({
      crawled_post_id: crawledPost.id,
      franchise_id: source.franchiseId ?? null,
      title: extracted.title,
      event_type: extracted.eventType,
      start_date: extracted.startDate,
      end_date: extracted.endDate ?? null,
      location: extracted.location ?? null,
      source_url: extracted.sourceUrl,
      confidence: extracted.confidence,
      warnings: extracted.warnings,
      raw_ai: toJson(extracted),
      status: "pending",
    })
    .select("*")
    .single();

  if (suggestionError) throw suggestionError;
  return mapSuggestionRow(suggestion);
}

export async function appendSupabaseCrawlRun(input: Omit<CrawlRun, "id">): Promise<CrawlRun> {
  const supabase = createServiceSupabaseClient();
  if (!supabase) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");

  const { data, error } = await supabase
    .from("crawl_runs")
    .insert({
      source_id: input.sourceId ?? null,
      status: input.status,
      posts_found: input.postsFound,
      suggestions_created: input.suggestionsCreated,
      error: input.error ?? null,
      started_at: input.startedAt,
      finished_at: input.finishedAt,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapCrawlRunRow(data);
}
