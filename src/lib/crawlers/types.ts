import type { CrawlSource, CrawlSourceType } from "@/lib/types";

export type CrawlPost = {
  source: CrawlSourceType;
  title: string;
  content: string;
  originalUrl: string;
  crawledAt: string;
};

export type CrawlSourceAdapter = {
  type: CrawlSourceType;
  fetchPosts(source: CrawlSource): Promise<CrawlPost[]>;
};
