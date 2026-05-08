import { describe, expect, it } from "vitest";
import { parsePostsFromHtml } from "@/lib/crawlers/html-parser";

describe("parsePostsFromHtml", () => {
  it("extracts keyword-matching links from community HTML", () => {
    const posts = parsePostsFromHtml(
      `
      <html>
        <body>
          <a href="/post/1">콜라보 카페 예약 시작 안내</a>
          <a href="/post/2">그냥 잡담</a>
        </body>
      </html>
      `,
      "naver_lounge",
      { url: "https://example.com/board", keywords: ["콜라보", "예약"] },
    );

    expect(posts).toHaveLength(1);
    expect(posts[0].originalUrl).toBe("https://example.com/post/1");
  });
});
