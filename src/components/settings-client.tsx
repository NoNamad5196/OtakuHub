"use client";

import {
  ArrowRight,
  Cable,
  CalendarDays,
  Download,
  Edit3,
  Gamepad2,
  KeyRound,
  Loader2,
  LogOut,
  Palette as PaletteIcon,
  Plus,
  Search,
  Server,
  ShieldCheck,
  Terminal,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PageTop } from "@/components/dashboard-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categoryLabels } from "@/lib/event-labels";
import type { DashboardData, Franchise, FranchiseCategory } from "@/lib/types";
import { franchiseCategories } from "@/lib/types";

type ThemeChoice = "light" | "dark" | "system";

const colorChoices = ["#0EA5E9", "#2563EB", "#F59E0B", "#EC4899", "#8B5CF6", "#34D399"];

type PaletteSuggestion = {
  name: string;
  category: FranchiseCategory;
  colorCode: string;
  palette: string[];
  confidence: number;
  source: {
    type: "curated" | "generated";
    label: string;
    url?: string;
  };
};

export function SettingsClient({
  data,
  supabaseReady,
  serviceReady,
  geminiConfigured,
  cronHardened,
  agentTokenConfigured,
}: {
  data: DashboardData;
  supabaseReady: boolean;
  serviceReady: boolean;
  geminiConfigured: boolean;
  cronHardened: boolean;
  agentTokenConfigured: boolean;
}) {
  const [notifications, setNotifications] = useState({
    event: true,
    gacha: true,
    maintenance: false,
    weekly: true,
  });
  const [leadTime, setLeadTime] = useState("1일 전");
  const [theme, setThemeState] = useState<ThemeChoice>(() => getStoredTheme());
  const [gcalLinked, setGcalLinked] = useState(true);
  const [franchises, setFranchises] = useState(data.franchises);
  const [addingGame, setAddingGame] = useState(false);
  const [gameName, setGameName] = useState("");
  const [gameCategory, setGameCategory] = useState<FranchiseCategory>("game");
  const [selectedColor, setSelectedColor] = useState(colorChoices[0]);
  const [paletteSuggestion, setPaletteSuggestion] = useState<PaletteSuggestion | null>(null);
  const [palettePending, setPalettePending] = useState(false);
  const [paletteError, setPaletteError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme]);

  useEffect(() => {
    if (!addingGame) return;
    const query = gameName.trim();
    if (query.length < 2) {
      setPaletteSuggestion(null);
      setPaletteError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void lookupPalette(query, controller.signal);
    }, 550);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [addingGame, gameName]);

  function setTheme(next: ThemeChoice) {
    setThemeState(next);
    localStorage.setItem("otakuhub-theme", next);
    applyTheme(next);
  }

  async function lookupPalette(query = gameName.trim(), signal?: AbortSignal) {
    if (query.length < 2) {
      setPaletteError("검색할 이름을 조금 더 입력해주세요.");
      return;
    }

    setPalettePending(true);
    setPaletteError(null);
    try {
      const response = await fetch(`/api/franchises/palette?query=${encodeURIComponent(query)}`, { signal });
      if (!response.ok) throw new Error("palette lookup failed");
      const payload = (await response.json()) as { data: PaletteSuggestion };
      setPaletteSuggestion(payload.data);
      setGameCategory(payload.data.category);
      setSelectedColor(payload.data.colorCode);
    } catch (lookupError) {
      if (lookupError instanceof Error && lookupError.name === "AbortError") return;
      setPaletteError("팔레트를 찾지 못했습니다. 직접 색상을 선택해주세요.");
    } finally {
      if (!signal?.aborted) setPalettePending(false);
    }
  }

  async function addGame(formData: FormData) {
    setPending(true);
    setError(null);
    const response = await fetch("/api/franchises", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: gameName.trim() || String(formData.get("name")),
        category: gameCategory,
        colorCode: selectedColor,
      }),
    });
    if (response.ok) {
      const payload = (await response.json()) as { data: Franchise };
      setFranchises((current) => [payload.data, ...current]);
      setAddingGame(false);
      setGameName("");
      setGameCategory("game");
      setSelectedColor(colorChoices[0]);
      setPaletteSuggestion(null);
      setPaletteError(null);
    } else {
      setError("게임을 추가하지 못했습니다.");
    }
    setPending(false);
  }

  return (
    <div className="min-h-full bg-background">
      <PageTop title="설정" description="프로필 · 알림 · 캘린더 연동 · 내 게임 · 계정" />

      <div className="w-full max-w-5xl px-4 pb-8 sm:px-7">
        <SettingSection title="프로필">
          <div className="flex flex-wrap items-center gap-4 border-b p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
              N
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold">NoNamad5196</p>
              <p className="text-sm text-[var(--text-3)]">nonamad@example.com · 베타 사용자</p>
            </div>
            <Button variant="outline" size="sm">
              <Edit3 className="h-4 w-4" />
              편집
            </Button>
          </div>
          <SettingRow label="표시 언어" control={<PillGroup values={["한국어", "English", "日本語"]} active="한국어" />} />
        </SettingSection>

        <SettingSection title="알림" subtitle="이벤트 시작·종료 시점에 받을 알림을 설정합니다.">
          <SettingRow
            label="이벤트 D-day 알림"
            hint="가챠·콜라보·이벤트 시작/종료 알림"
            control={<Toggle on={notifications.event} onChange={(value) => setNotifications((current) => ({ ...current, event: value }))} />}
          />
          <SettingRow
            label="가챠 픽업 시작 알림"
            hint="픽업 가챠가 시작될 때 알림을 받습니다"
            control={<Toggle on={notifications.gacha} onChange={(value) => setNotifications((current) => ({ ...current, gacha: value }))} />}
          />
          <SettingRow
            label="정기 점검 알림"
            hint="버전 업데이트 점검 시작/종료 알림"
            control={
              <Toggle
                on={notifications.maintenance}
                onChange={(value) => setNotifications((current) => ({ ...current, maintenance: value }))}
              />
            }
          />
          <SettingRow
            label="주간 요약 메일"
            hint="매주 월요일 오전 9시 이번 주 일정 요약"
            control={<Toggle on={notifications.weekly} onChange={(value) => setNotifications((current) => ({ ...current, weekly: value }))} />}
          />
          <SettingRow
            label="알림 시점"
            hint="이벤트 시작 전 미리 알림 받을 시간"
            control={
              <div className="flex flex-wrap gap-2">
                {["1시간 전", "1일 전", "3일 전"].map((item) => (
                  <Pill key={item} active={leadTime === item} onClick={() => setLeadTime(item)}>
                    {item}
                  </Pill>
                ))}
              </div>
            }
          />
        </SettingSection>

        <SettingSection title="외부 캘린더 연동" subtitle="승인된 일정을 다른 캘린더로 자동 동기화합니다.">
          <div className="flex flex-wrap items-center gap-4 border-b p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-white text-[#4285F4]">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">Google Calendar</p>
                {gcalLinked && <Badge variant="success">연결됨</Badge>}
              </div>
              <p className="text-sm text-[var(--text-3)]">
                {gcalLinked ? "나의 OtakuHub 캘린더 · 마지막 동기화 12분 전" : "연결되지 않음"}
              </p>
            </div>
            <Button variant={gcalLinked ? "outline" : "default"} onClick={() => setGcalLinked((value) => !value)}>
              {gcalLinked ? "연결 해제" : "구글 계정으로 연결"}
              {!gcalLinked && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-start gap-4 p-4 opacity-70">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted">
              <CalendarDays className="h-5 w-5 text-[var(--text-3)]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">Apple 캘린더 / Outlook</p>
                <Badge variant="outline">곧 제공</Badge>
              </div>
              <p className="text-sm text-[var(--text-3)]">iCal URL 구독 방식으로 추가될 예정입니다</p>
            </div>
          </div>
        </SettingSection>

        <SettingSection title="외부 연동 / Agent" subtitle="OtakuS Agent가 사용할 OtakuHub 서버 API 준비 상태입니다.">
          <div className="grid gap-3 p-4 md:grid-cols-3">
            <AgentAppCard
              icon={Server}
              title="OtakuHub"
              state="단독 실행"
              detail="웹앱 자체 일정·굿즈 관리"
            />
            <AgentAppCard
              icon={Gamepad2}
              title="SipSungJang"
              state="API 준비"
              detail="게임 실행 신호와 마지막 실행 시각"
            />
            <AgentAppCard
              icon={Wallet}
              title="GachaGuard"
              state="API 준비"
              detail="예산 초과·충동 과금 경고"
            />
          </div>
          <div className="grid gap-2 border-t p-4">
            <EndpointRow icon={Cable} label="Agent 설정" path="/api/integrations/agent/config" />
            <EndpointRow icon={CalendarDays} label="일정 피드" path="/api/integrations/agent/events" />
            <EndpointRow icon={Gamepad2} label="실행 신호" path="/api/integrations/agent/activity" />
            <EndpointRow icon={Wallet} label="과금 알림" path="/api/integrations/agent/spending-alert" />
          </div>
          <SettingRow
            label="연동 보호"
            hint="운영 환경에서는 OTAKUS_AGENT_API_TOKEN으로 보호합니다."
            control={<Badge variant={agentTokenConfigured ? "success" : "warning"}>{agentTokenConfigured ? "토큰 보호" : "데모 허용"}</Badge>}
          />
          <SettingRow
            label="개인정보 범위"
            hint="게임 ID, 일정 ID, 사용자가 허용한 실행 신호만 받습니다."
            control={<Badge variant="outline">프로세스 목록 미수집</Badge>}
          />
        </SettingSection>

        <SettingSection id="games" title="내 게임" subtitle="AI가 일정을 수집할 대상 게임입니다. 사이드바와 캘린더 필터에 표시됩니다.">
          <div className="flex flex-wrap gap-2 p-4">
            {franchises.map((franchise) => (
              <div
                key={franchise.id}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
                style={{
                  borderColor: colorMix(franchise.colorCode, 0.3),
                  backgroundColor: colorMix(franchise.colorCode, 0.1),
                }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: franchise.colorCode }} />
                <span className="text-sm font-semibold">{franchise.name}</span>
                <button type="button" aria-label={`${franchise.name} 제거`} className="text-[var(--text-3)]">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setAddingGame((value) => !value)}>
              <Plus className="h-4 w-4" />
              게임 추가
            </Button>
          </div>
          {addingGame && (
            <form action={addGame} className="grid gap-4 border-t bg-muted p-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px_auto]">
                <Input
                  name="name"
                  required
                  value={gameName}
                  onChange={(event) => setGameName(event.target.value)}
                  placeholder="게임 또는 프랜차이즈명"
                />
                <select
                  name="category"
                  value={gameCategory}
                  onChange={(event) => setGameCategory(event.target.value as FranchiseCategory)}
                  className="h-10 rounded-md border bg-input px-3 text-sm outline-none"
                >
                  {franchiseCategories.map((category) => (
                    <option key={category} value={category}>
                      {categoryLabels[category]}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => lookupPalette()}
                  disabled={palettePending || gameName.trim().length < 2}
                >
                  {palettePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  팔레트 찾기
                </Button>
              </div>
              <input type="hidden" name="colorCode" value={selectedColor} />
              <PalettePicker
                suggestion={paletteSuggestion}
                selectedColor={selectedColor}
                onSelect={setSelectedColor}
              />
              {paletteError && <p className="text-sm text-[var(--danger-text)]">{paletteError}</p>}
              <div className="flex justify-end">
                <Button disabled={pending}>
                  {pending ? "추가 중..." : "추가"}
                </Button>
              </div>
            </form>
          )}
          {error && <p className="border-t px-4 py-3 text-sm text-[var(--danger-text)]">{error}</p>}
        </SettingSection>

        <SettingSection title="모양">
          <SettingRow
            label="테마"
            control={
              <div className="flex flex-wrap gap-2">
                <Pill active={theme === "light"} onClick={() => setTheme("light")}>
                  라이트
                </Pill>
                <Pill active={theme === "dark"} onClick={() => setTheme("dark")}>
                  다크
                </Pill>
                <Pill active={theme === "system"} onClick={() => setTheme("system")}>
                  시스템
                </Pill>
              </div>
            }
          />
        </SettingSection>

        <SettingSection title="계정">
          <SettingRow
            label="데이터 내보내기"
            hint="내 일정·굿즈·위시리스트를 JSON으로 다운로드"
            control={
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                내보내기
              </Button>
            }
          />
          <SettingRow
            label="로그아웃"
            control={
              <Button variant="outline" size="sm">
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            }
          />
          <SettingRow
            label="계정 삭제"
            hint="모든 일정·굿즈 데이터가 영구 삭제됩니다."
            control={
              <Button variant="destructive" size="sm">
                계정 삭제
              </Button>
            }
          />
        </SettingSection>

        <SettingSection title="시스템 상태" subtitle="배포 전 점검용 보조 정보입니다.">
          <div className="grid gap-3 p-4 md:grid-cols-3">
            <StatusCard icon={ShieldCheck} title="Supabase" ok={supabaseReady} detail={serviceReady ? "서비스 키 준비됨" : "데모 모드"} />
            <StatusCard icon={KeyRound} title="Gemini" ok={geminiConfigured} detail={geminiConfigured ? "AI 추출 준비됨" : "로컬 추정 사용"} />
            <StatusCard icon={Terminal} title="Cron" ok={cronHardened} detail={cronHardened ? "보호됨" : "시크릿 필요"} />
          </div>
        </SettingSection>

        <p className="mt-4 text-center text-xs text-[var(--text-3)]">OtakuHub Beta · v0.1.0</p>
      </div>
    </div>
  );
}

function SettingSection({
  id,
  title,
  subtitle,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="panel mb-4 overflow-hidden scroll-mt-4">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-bold">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-[var(--text-3)]">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function SettingRow({
  label,
  hint,
  control,
}: {
  label: string;
  hint?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b p-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{label}</div>
        {hint && <div className="mt-1 text-xs leading-5 text-[var(--text-3)]">{hint}</div>}
      </div>
      <div className="w-full sm:w-auto sm:shrink-0">{control}</div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={`flex h-6 w-11 items-center rounded-full p-0.5 transition ${on ? "bg-primary" : "bg-[var(--border-strong)]"}`}
    >
      <span className={`h-5 w-5 rounded-full bg-white shadow transition ${on ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
        active
          ? "border-[var(--accent)] bg-secondary text-[var(--accent-text)]"
          : "border-[var(--border-strong)] bg-card text-[var(--text-2)] hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function PillGroup({ values, active }: { values: string[]; active: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <Pill key={value} active={value === active} onClick={() => undefined}>
          {value}
        </Pill>
      ))}
    </div>
  );
}

function PalettePicker({
  suggestion,
  selectedColor,
  onSelect,
}: {
  suggestion: PaletteSuggestion | null;
  selectedColor: string;
  onSelect: (color: string) => void;
}) {
  const swatches = uniqueColors([...(suggestion?.palette ?? []), ...colorChoices]).slice(0, 10);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-2)]">
          <PaletteIcon className="h-4 w-4 text-[var(--accent-text)]" />
          대표 팔레트
        </div>
        {suggestion && (
          <>
            <Badge variant={suggestion.source.type === "curated" ? "success" : "secondary"}>
              {suggestion.source.type === "curated" ? "검색됨" : "자동 생성"}
            </Badge>
            <span className="text-xs text-[var(--text-3)]">
              {suggestion.name} · {Math.round(suggestion.confidence * 100)}%
            </span>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {swatches.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`${color} 선택`}
            onClick={() => onSelect(color)}
            className={`h-10 w-10 rounded-lg border-2 transition ${
              selectedColor === color ? "border-foreground shadow-[0_0_0_3px_var(--accent-bg)]" : "border-transparent"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-[var(--text-3)]">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: selectedColor }} />
        <code>{selectedColor}</code>
        {suggestion?.source.url && (
          <a href={suggestion.source.url} target="_blank" rel="noreferrer" className="font-semibold text-[var(--accent-text)]">
            출처
          </a>
        )}
      </div>
    </div>
  );
}

function AgentAppCard({
  icon: Icon,
  title,
  state,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  state: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border bg-muted p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--accent-text)]" />
        <span className="min-w-0 flex-1 truncate text-sm font-bold">{title}</span>
        <Badge variant="secondary">{state}</Badge>
      </div>
      <p className="mt-2 text-xs leading-5 text-[var(--text-3)]">{detail}</p>
    </div>
  );
}

function EndpointRow({
  icon: Icon,
  label,
  path,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}) {
  return (
    <div className="grid gap-2 rounded-lg border bg-muted px-3 py-2 sm:grid-cols-[130px_minmax(0,1fr)] sm:items-center">
      <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-2)]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <code className="min-w-0 break-all rounded-md bg-card px-2 py-1 text-xs text-[var(--text-2)]">{path}</code>
    </div>
  );
}

function StatusCard({
  icon: Icon,
  title,
  ok,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="rounded-lg border bg-muted p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--accent-text)]" />
        <span className="text-sm font-bold">{title}</span>
        <Badge variant={ok ? "success" : "warning"} className="ml-auto">
          {ok ? "정상" : "확인"}
        </Badge>
      </div>
      <p className="mt-2 text-xs text-[var(--text-3)]">{detail}</p>
    </div>
  );
}

function applyTheme(choice: ThemeChoice) {
  const resolved =
    choice === "system" && typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : choice;
  document.documentElement.dataset.theme = resolved;
}

function getStoredTheme(): ThemeChoice {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("otakuhub-theme");
  return saved === "dark" || saved === "system" ? saved : "light";
}

function uniqueColors(colors: string[]) {
  return Array.from(new Set(colors.map((color) => color.toUpperCase())));
}

function colorMix(color: string, opacity = 0.12) {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`;
}
