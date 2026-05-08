import { addDaysIso, todayIso } from "@/lib/date-utils";
import type {
  CollectionItem,
  CrawlRun,
  CrawlSource,
  EventSuggestion,
  Franchise,
  OtakuEvent,
  Reminder,
} from "@/lib/types";

const today = todayIso();

export const demoFranchises: Franchise[] = [
  {
    id: "fr-blue-archive",
    name: "블루 아카이브",
    slug: "blue-archive",
    category: "game",
    colorCode: "#38bdf8",
    priority: 1,
  },
  {
    id: "fr-project-sekai",
    name: "프로젝트 세카이",
    slug: "project-sekai",
    category: "game",
    colorCode: "#f472b6",
    priority: 2,
  },
  {
    id: "fr-hololive",
    name: "홀로라이브",
    slug: "hololive",
    category: "vtuber",
    colorCode: "#34d399",
    priority: 1,
  },
];

export const demoEvents: OtakuEvent[] = [
  {
    id: "ev-cafe-1",
    franchiseId: "fr-blue-archive",
    type: "cafe",
    title: "블루 아카이브 콜라보 카페 2차 예약 오픈",
    startDate: addDaysIso(today, 1),
    endDate: addDaysIso(today, 21),
    location: "서울 홍대",
    sourceUrl: "https://example.com/blue-archive-cafe",
    isVerified: true,
    createdAt: new Date().toISOString(),
    saved: true,
    remindDays: [3, 7],
  },
  {
    id: "ev-goods-1",
    franchiseId: "fr-project-sekai",
    type: "preorder",
    title: "프로젝트 세카이 신상 아크릴 스탠드 예약 시작",
    startDate: addDaysIso(today, 3),
    location: "온라인",
    sourceUrl: "https://example.com/project-sekai-goods",
    isVerified: true,
    createdAt: new Date().toISOString(),
    saved: true,
    remindDays: [1, 3],
  },
  {
    id: "ev-stream-1",
    franchiseId: "fr-hololive",
    type: "broadcast",
    title: "홀로라이브 한국어 공식 방송",
    startDate: addDaysIso(today, 6),
    sourceUrl: "https://example.com/hololive-stream",
    isVerified: true,
    createdAt: new Date().toISOString(),
    saved: false,
  },
];

export const demoCollections: CollectionItem[] = [
  {
    id: "col-1",
    eventId: "ev-goods-1",
    franchiseId: "fr-project-sekai",
    itemName: "아크릴 스탠드 세트",
    price: 38000,
    isWishlist: true,
    memo: "예약 시작일에 바로 확인",
  },
  {
    id: "col-2",
    eventId: "ev-cafe-1",
    franchiseId: "fr-blue-archive",
    itemName: "한정 코스터 3종",
    price: 22000,
    isWishlist: false,
    boughtAt: today,
    memo: "카페 방문 시 구매 완료",
  },
];

export const demoSources: CrawlSource[] = [
  {
    id: "source-naver",
    franchiseId: "fr-blue-archive",
    sourceType: "naver_lounge",
    name: "네이버 라운지 공지",
    url: "https://example.com/naver-lounge",
    keywords: ["콜라보", "카페", "예약", "굿즈"],
    isActive: true,
    lastCrawledAt: new Date().toISOString(),
  },
  {
    id: "source-dc",
    franchiseId: "fr-project-sekai",
    sourceType: "dc",
    name: "DC 프로젝트 세카이 갤러리",
    url: "https://example.com/dc-gallery",
    keywords: ["발매", "예약", "팝업"],
    isActive: true,
    lastCrawledAt: new Date().toISOString(),
  },
  {
    id: "source-official",
    franchiseId: "fr-hololive",
    sourceType: "official",
    name: "공식 소식 페이지",
    url: "https://example.com/official-news",
    keywords: ["방송", "이벤트", "콘서트"],
    isActive: true,
    lastCrawledAt: null,
  },
];

export const demoSuggestions: EventSuggestion[] = [
  {
    id: "sg-1",
    crawledPostId: "post-1",
    franchiseId: "fr-blue-archive",
    title: "블루 아카이브 팝업 스토어 오픈",
    eventType: "popup",
    startDate: addDaysIso(today, 10),
    endDate: addDaysIso(today, 17),
    location: "더현대 서울",
    sourceUrl: "https://example.com/post/1",
    confidence: 0.86,
    warnings: ["운영 종료일은 본문에서 추정됨"],
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sg-2",
    crawledPostId: "post-2",
    franchiseId: "fr-project-sekai",
    title: "프로젝트 세카이 생일 카페 후보 일정",
    eventType: "birthday",
    startDate: addDaysIso(today, 18),
    location: "서울 합정",
    sourceUrl: "https://example.com/post/2",
    confidence: 0.62,
    warnings: ["공식 공지가 아닌 커뮤니티 추정 글"],
    status: "pending",
    createdAt: new Date().toISOString(),
  },
];

export const demoReminders: Reminder[] = [
  {
    id: "rem-1",
    eventId: "ev-cafe-1",
    remindAt: `${today}T09:00:00.000Z`,
    status: "pending",
  },
];

export const demoCrawlRuns: CrawlRun[] = [
  {
    id: "run-1",
    sourceId: "source-naver",
    status: "success",
    postsFound: 8,
    suggestionsCreated: 1,
    startedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    finishedAt: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
  },
];
