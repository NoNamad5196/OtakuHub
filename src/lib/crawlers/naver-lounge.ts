import axios from "axios";
import { parsePostsFromHtml } from "@/lib/crawlers/html-parser";
import type { CrawlSourceAdapter } from "@/lib/crawlers/types";

export const naverLoungeAdapter: CrawlSourceAdapter = {
  type: "naver_lounge",
  async fetchPosts(source) {
    const response = await axios.get<string>(source.url, {
      timeout: 12000,
      headers: {
        "user-agent": "OtakuHubBot/0.1 portfolio crawler",
      },
    });
    return parsePostsFromHtml(response.data, "naver_lounge", source);
  },
};
