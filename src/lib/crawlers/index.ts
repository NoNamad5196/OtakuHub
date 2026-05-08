import { extractEventFromPost } from "@/lib/ai/extract-event";
import { dcAdapter } from "@/lib/crawlers/dc";
import { getDemoPostsForSource } from "@/lib/crawlers/demo-posts";
import { naverLoungeAdapter } from "@/lib/crawlers/naver-lounge";
import { officialAdapter } from "@/lib/crawlers/official";
import type { CrawlPost, CrawlSourceAdapter } from "@/lib/crawlers/types";
import { getDemoDashboardData } from "@/lib/mock-store";
import { appendCrawlRun, appendSuggestion } from "@/lib/mock-store";
import {
  appendSupabaseCrawlRun,
  getSupabaseCrawlContext,
  persistSupabaseCrawlSuggestion,
} from "@/lib/repositories/crawler";
import type { CrawlSource, EventSuggestion, Franchise } from "@/lib/types";

const adapters: Record<string, CrawlSourceAdapter> = {
  naver_lounge: naverLoungeAdapter,
  dc: dcAdapter,
  official: officialAdapter,
};

function shouldUseDemoPosts(source: CrawlSource) {
  return source.url.includes("example.com");
}

function postId(post: CrawlPost) {
  return `post-${Buffer.from(post.originalUrl).toString("base64url").slice(0, 24)}`;
}

async function postsForSource(source: CrawlSource) {
  if (shouldUseDemoPosts(source)) return getDemoPostsForSource(source);
  const adapter = adapters[source.sourceType];
  if (!adapter) throw new Error(`No adapter for ${source.sourceType}`);
  return adapter.fetchPosts(source);
}

async function suggestionFromPost(
  post: CrawlPost,
  source: CrawlSource,
  franchise?: Franchise,
  persistToSupabase = false,
): Promise<EventSuggestion> {
  const extracted = await extractEventFromPost({
    title: post.title,
    content: post.content,
    originalUrl: post.originalUrl,
    franchiseName: franchise?.name,
  });

  if (persistToSupabase) {
    return persistSupabaseCrawlSuggestion({ post, source, extracted });
  }

  return appendSuggestion({
    crawledPostId: postId(post),
    franchiseId: source.franchiseId ?? null,
    title: extracted.title,
    eventType: extracted.eventType,
    startDate: extracted.startDate,
    endDate: extracted.endDate ?? null,
    location: extracted.location ?? null,
    sourceUrl: extracted.sourceUrl,
    confidence: extracted.confidence,
    warnings: extracted.warnings,
    rawAi: extracted,
  });
}

export async function runCrawlPipeline() {
  const startedAt = new Date().toISOString();
  const supabaseContext = await getSupabaseCrawlContext();
  const data = supabaseContext ?? getDemoDashboardData();
  const activeSources = data.sources.filter((source) => source.isActive);
  const created: EventSuggestion[] = [];
  const errors: string[] = [];
  let postsFound = 0;

  for (const source of activeSources) {
    const sourceStartedAt = new Date().toISOString();
    try {
      const posts = await postsForSource(source);
      postsFound += posts.length;
      const franchise = data.franchises.find((item) => item.id === source.franchiseId);
      for (const post of posts.slice(0, 3)) {
        created.push(await suggestionFromPost(post, source, franchise, Boolean(supabaseContext)));
      }
      const run = {
        sourceId: source.id,
        status: "success" as const,
        postsFound: posts.length,
        suggestionsCreated: Math.min(posts.length, 3),
        startedAt: sourceStartedAt,
        finishedAt: new Date().toISOString(),
      };
      if (supabaseContext) {
        await appendSupabaseCrawlRun(run);
      } else {
        appendCrawlRun(run);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${source.name}: ${message}`);
      const run = {
        sourceId: source.id,
        status: "failed" as const,
        postsFound: 0,
        suggestionsCreated: 0,
        error: message,
        startedAt: sourceStartedAt,
        finishedAt: new Date().toISOString(),
      };
      if (supabaseContext) {
        await appendSupabaseCrawlRun(run);
      } else {
        appendCrawlRun(run);
      }
    }
  }

  return {
    status: errors.length === 0 ? "success" : created.length > 0 ? "partial" : "failed",
    postsFound,
    suggestionsCreated: created.length,
    suggestions: created,
    errors,
    startedAt,
    finishedAt: new Date().toISOString(),
  };
}
