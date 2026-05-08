import axios from "axios";
import { parsePostsFromHtml } from "@/lib/crawlers/html-parser";
import type { CrawlSourceAdapter } from "@/lib/crawlers/types";

export const officialAdapter: CrawlSourceAdapter = {
  type: "official",
  async fetchPosts(source) {
    try {
      const { chromium } = await import("playwright");
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(source.url, { waitUntil: "networkidle", timeout: 20000 });
      const html = await page.content();
      await browser.close();
      return parsePostsFromHtml(html, "official", source);
    } catch {
      const response = await axios.get<string>(source.url, {
        timeout: 12000,
        headers: {
          "user-agent": "OtakuHubBot/0.1 portfolio crawler",
        },
      });
      return parsePostsFromHtml(response.data, "official", source);
    }
  },
};
