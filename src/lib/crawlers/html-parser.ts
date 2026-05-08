import * as cheerio from "cheerio";
import type { CrawlPost } from "@/lib/crawlers/types";
import type { CrawlSource, CrawlSourceType } from "@/lib/types";

function absoluteUrl(href: string, baseUrl: string) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return baseUrl;
  }
}

function matchesKeywords(text: string, keywords: string[]) {
  if (keywords.length === 0) return true;
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

export function parsePostsFromHtml(
  html: string,
  sourceType: CrawlSourceType,
  source: Pick<CrawlSource, "url" | "keywords">,
): CrawlPost[] {
  const $ = cheerio.load(html);
  const posts: CrawlPost[] = [];
  const seen = new Set<string>();

  $("a").each((_index, element) => {
    const title = $(element).text().replace(/\s+/g, " ").trim();
    const href = $(element).attr("href");
    if (!href || title.length < 5 || !matchesKeywords(title, source.keywords)) return;
    const originalUrl = absoluteUrl(href, source.url);
    if (seen.has(originalUrl)) return;
    seen.add(originalUrl);
    const nearby = $(element).parent().text().replace(/\s+/g, " ").trim();
    posts.push({
      source: sourceType,
      title,
      content: nearby || title,
      originalUrl,
      crawledAt: new Date().toISOString(),
    });
  });

  if (posts.length === 0) {
    const title = $("title").text().replace(/\s+/g, " ").trim();
    const body = $("body").text().replace(/\s+/g, " ").trim().slice(0, 2000);
    if (title && matchesKeywords(`${title} ${body}`, source.keywords)) {
      posts.push({
        source: sourceType,
        title,
        content: body || title,
        originalUrl: source.url,
        crawledAt: new Date().toISOString(),
      });
    }
  }

  return posts.slice(0, 20);
}
