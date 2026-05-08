import { describe, expect, it } from "vitest";
import { hashPostContent } from "@/lib/repositories/crawler";

describe("crawler repository helpers", () => {
  it("hashes duplicate crawled posts by title and content", () => {
    const post = {
      title: "예약 시작",
      content: "5월 12일 온라인 예약",
    };

    expect(hashPostContent(post)).toBe(hashPostContent({ ...post }));
    expect(hashPostContent(post)).not.toBe(hashPostContent({ ...post, content: "다른 본문" }));
  });
});
