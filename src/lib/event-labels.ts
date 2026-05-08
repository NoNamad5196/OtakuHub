import type { EventType, FranchiseCategory } from "@/lib/types";

export const eventTypeLabels: Record<EventType, string> = {
  goods_release: "굿즈 발매",
  preorder: "예약 시작",
  cafe: "콜라보 카페",
  popup: "팝업",
  concert: "공연/참가",
  broadcast: "방송",
  birthday: "생일 카페",
  other: "기타",
};

export const categoryLabels: Record<FranchiseCategory, string> = {
  game: "게임",
  anime: "애니",
  vtuber: "VTuber",
  idol: "아이돌",
  other: "기타",
};

export function normalizeEventType(input: string | null | undefined): EventType {
  const value = (input ?? "").toLowerCase();
  if (value.includes("카페") || value.includes("cafe")) return "cafe";
  if (value.includes("팝업") || value.includes("popup")) return "popup";
  if (value.includes("예약") || value.includes("preorder")) return "preorder";
  if (value.includes("콘서트") || value.includes("공연") || value.includes("concert")) {
    return "concert";
  }
  if (value.includes("방송") || value.includes("stream") || value.includes("broadcast")) {
    return "broadcast";
  }
  if (value.includes("생일") || value.includes("birthday")) return "birthday";
  if (value.includes("굿즈") || value.includes("발매") || value.includes("goods")) {
    return "goods_release";
  }
  return "other";
}
