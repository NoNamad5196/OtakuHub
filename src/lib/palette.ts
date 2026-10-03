import type { FranchiseCategory } from "@/lib/types";

export type PaletteSourceType = "curated" | "generated";

export type FranchisePaletteSuggestion = {
  query: string;
  name: string;
  category: FranchiseCategory;
  colorCode: string;
  palette: string[];
  confidence: number;
  source: {
    type: PaletteSourceType;
    label: string;
    url?: string;
  };
};

type PaletteRecord = Omit<FranchisePaletteSuggestion, "query" | "confidence" | "source"> & {
  aliases: string[];
  sourceUrl?: string;
};

const paletteDirectory: PaletteRecord[] = [
  {
    name: "블루 아카이브",
    aliases: ["blue archive", "bluearchive", "ブルーアーカイブ", "블아"],
    category: "game",
    colorCode: "#2563EB",
    palette: ["#2563EB", "#60A5FA", "#F59E0B", "#FDF2F8"],
    sourceUrl: "https://bluearchive.nexon.com/",
  },
  {
    name: "원신",
    aliases: ["genshin", "genshin impact", "原神"],
    category: "game",
    colorCode: "#0EA5E9",
    palette: ["#0EA5E9", "#22D3EE", "#F59E0B", "#F8FAFC"],
    sourceUrl: "https://genshin.hoyoverse.com/",
  },
  {
    name: "명일방주",
    aliases: ["arknights", "명방", "明日方舟"],
    category: "game",
    colorCode: "#F59E0B",
    palette: ["#F59E0B", "#111827", "#F8FAFC", "#6B7280"],
    sourceUrl: "https://arknights.global/",
  },
  {
    name: "프로젝트 세카이",
    aliases: ["project sekai", "プロセカ", "pjsekai", "프세카"],
    category: "game",
    colorCode: "#EC4899",
    palette: ["#EC4899", "#22D3EE", "#FDE047", "#8B5CF6"],
    sourceUrl: "https://pjsekai.sega.jp/",
  },
  {
    name: "홀로라이브",
    aliases: ["hololive", "ホロライブ", "홀로"],
    category: "vtuber",
    colorCode: "#1EA7E1",
    palette: ["#1EA7E1", "#FFFFFF", "#0F172A", "#60A5FA"],
    sourceUrl: "https://hololive.hololivepro.com/",
  },
  {
    name: "승리의 여신: 니케",
    aliases: ["nikke", "goddess of victory nikke", "니케"],
    category: "game",
    colorCode: "#E11D48",
    palette: ["#E11D48", "#111827", "#FBBF24", "#F8FAFC"],
    sourceUrl: "https://nikke-en.com/",
  },
  {
    name: "붕괴: 스타레일",
    aliases: ["honkai star rail", "star rail", "hsr", "스타레일"],
    category: "game",
    colorCode: "#6366F1",
    palette: ["#6366F1", "#F59E0B", "#111827", "#E0E7FF"],
    sourceUrl: "https://hsr.hoyoverse.com/",
  },
  {
    name: "젠레스 존 제로",
    aliases: ["zenless zone zero", "zzz", "젠레스", "젠존제"],
    category: "game",
    colorCode: "#FACC15",
    palette: ["#FACC15", "#111827", "#F8FAFC", "#EF4444"],
    sourceUrl: "https://zenless.hoyoverse.com/",
  },
  {
    name: "우마무스메 프리티 더비",
    aliases: ["umamusume", "우마무스메", "말딸"],
    category: "game",
    colorCode: "#22C55E",
    palette: ["#22C55E", "#F97316", "#F9A8D4", "#FFFFFF"],
    sourceUrl: "https://umamusume.jp/",
  },
  {
    name: "Fate/Grand Order",
    aliases: ["fgo", "페그오", "fate grand order"],
    category: "game",
    colorCode: "#1D4ED8",
    palette: ["#1D4ED8", "#B91C1C", "#F8FAFC", "#111827"],
    sourceUrl: "https://www.fate-go.jp/",
  },
  {
    name: "러브라이브!",
    aliases: ["lovelive", "love live", "ラブライブ", "럽라"],
    category: "idol",
    colorCode: "#F97316",
    palette: ["#F97316", "#EC4899", "#22D3EE", "#FDE047"],
    sourceUrl: "https://www.lovelive-anime.jp/",
  },
  {
    name: "앙상블 스타즈!!",
    aliases: ["ensemble stars", "enstars", "앙스타"],
    category: "idol",
    colorCode: "#F59E0B",
    palette: ["#F59E0B", "#38BDF8", "#EC4899", "#8B5CF6"],
    sourceUrl: "https://ensemble-stars.jp/",
  },
];

export function lookupFranchisePalette(query: string): FranchisePaletteSuggestion {
  const trimmed = query.trim();
  const match = bestPaletteRecord(trimmed);
  if (match) {
    return {
      query: trimmed,
      name: match.record.name,
      category: match.record.category,
      colorCode: match.record.colorCode,
      palette: match.record.palette,
      confidence: match.score,
      source: {
        type: "curated",
        label: "내장 브랜드 팔레트",
        url: match.record.sourceUrl,
      },
    };
  }

  const generated = generatedPalette(trimmed);
  return {
    query: trimmed,
    name: trimmed || "새 프랜차이즈",
    category: guessCategory(trimmed),
    colorCode: generated[0],
    palette: generated,
    confidence: 0.42,
    source: {
      type: "generated",
      label: "이름 기반 자동 팔레트",
    },
  };
}

function bestPaletteRecord(query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return null;

  const scored = paletteDirectory
    .map((record) => {
      const candidates = [record.name, ...record.aliases].map(normalize);
      const exact = candidates.some((candidate) => candidate === normalizedQuery);
      const partial = candidates.some(
        (candidate) => candidate.includes(normalizedQuery) || normalizedQuery.includes(candidate),
      );
      const score = exact ? 0.98 : partial ? 0.82 : 0;
      return { record, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0] ?? null;
}

function generatedPalette(query: string) {
  const hue = hashToHue(query || "otakuhub");
  return [
    hslToHex(hue, 78, 48),
    hslToHex((hue + 38) % 360, 76, 56),
    hslToHex((hue + 190) % 360, 62, 52),
    hslToHex(hue, 42, 92),
  ];
}

function guessCategory(query: string): FranchiseCategory {
  const normalized = normalize(query);
  if (/홀로|vtuber|버튜버|nijisanji|니지산지/.test(normalized)) return "vtuber";
  if (/아이돌|idol|스타즈|라이브|live/.test(normalized)) return "idol";
  if (/애니|anime|만화/.test(normalized)) return "anime";
  return "game";
}

function normalize(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s:!/_-]+/g, "")
    .replace(/[™®]/g, "");
}

function hashToHue(value: string) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) % 360;
  }
  return Math.abs(hash);
}

function hslToHex(h: number, s: number, l: number) {
  const saturation = s / 100;
  const lightness = l / 100;
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lightness - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];

  return `#${[r, g, b]
    .map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}
