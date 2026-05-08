import { addDaysIso, todayIso } from "@/lib/date-utils";
import type { CrawlPost } from "@/lib/crawlers/types";
import type { CrawlSource } from "@/lib/types";

export function getDemoPostsForSource(source: CrawlSource): CrawlPost[] {
  const today = todayIso();
  const templates: Record<string, CrawlPost[]> = {
    naver_lounge: [
      {
        source: "naver_lounge",
        title: `블루 아카이브 콜라보 카페 추가 예약 안내 ${addDaysIso(today, 5).slice(5)}`,
        content: `홍대 콜라보 카페 추가 예약이 ${addDaysIso(today, 5)}부터 시작됩니다. 특전 코스터 수량은 한정입니다.`,
        originalUrl: `${source.url}/demo-naver-1`,
        crawledAt: new Date().toISOString(),
      },
    ],
    dc: [
      {
        source: "dc",
        title: `프로젝트 세카이 팝업 굿즈 발매 정리 ${addDaysIso(today, 9).slice(5)}`,
        content: `합정 팝업에서 신상 아크릴과 캔뱃지 예약 판매가 ${addDaysIso(today, 9)}에 열린다는 공지 캡처가 올라왔습니다.`,
        originalUrl: `${source.url}/demo-dc-1`,
        crawledAt: new Date().toISOString(),
      },
    ],
    official: [
      {
        source: "official",
        title: `홀로라이브 공식 방송 일정 ${addDaysIso(today, 12).slice(5)}`,
        content: `온라인 공식 방송이 ${addDaysIso(today, 12)} 20시에 진행됩니다. 출연자와 굿즈 안내가 함께 공개됩니다.`,
        originalUrl: `${source.url}/demo-official-1`,
        crawledAt: new Date().toISOString(),
      },
    ],
  };
  return templates[source.sourceType] ?? [];
}
