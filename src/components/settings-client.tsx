"use client";

import {
  ArrowRight,
  Cable,
  CalendarDays,
  Compass,
  Download,
  Edit3,
  Gamepad2,
  KeyRound,
  Loader2,
  LogOut,
  Moon,
  Palette as PaletteIcon,
  Plus,
  Radio,
  Search,
  Server,
  ShieldCheck,
  Sun,
  Terminal,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppLauncher } from "@/components/app-launcher";
import { PageTop } from "@/components/dashboard-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categoryLabels } from "@/lib/event-labels";
import type { DashboardData, Franchise, FranchiseCategory } from "@/lib/types";
import { franchiseCategories } from "@/lib/types";

type ThemeChoice = "light" | "dark" | "system";

const colorChoices = ["#dfb96d", "#5ce1ff", "#9d84ff", "#34d399", "#fbbf24", "#f87171"];

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

  const lookupPalette = useCallback(async (query: string, signal?: AbortSignal) => {
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
  }, []);

  useEffect(() => {
    if (!addingGame) return;
    const query = gameName.trim();
    if (query.length < 2) {
      const timer = window.setTimeout(() => {
        setPaletteSuggestion(null);
        setPaletteError(null);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void lookupPalette(query, controller.signal);
    }, 550);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [addingGame, gameName, lookupPalette]);

  function setTheme(next: ThemeChoice) {
    setThemeState(next);
    localStorage.setItem("otakuhub-theme", next);
    applyTheme(next);
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
    <div className="min-h-full bg-background pb-12">
      <PageTop
        title="열차 브릿지 설정"
        description="승객 프로필 · 워프 알림 · 캘린더 오비탈 연동 · 열차 노선 채널 · 에이전트 시스템"
      />

      <div className="w-full max-w-5xl px-4 pb-8 sm:px-7">
        {/* Profile Section */}
        <SettingSection title="승객 프로필" code="PASSENGER IDENTITY">
          <div className="flex flex-wrap items-center gap-4 border-b border-[var(--border)] p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--accent)] bg-[var(--accent-bg)] font-sf text-lg font-bold text-[var(--accent-text)] shadow-[0_0_12px_var(--gold-glow)]">
              N
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-sf text-base font-extrabold text-foreground">NoNamad5196</p>
              <p className="font-mono text-xs text-[var(--text-3)]">
                nonamad@example.com · TRAILBLAZER // BETA
              </p>
            </div>
            <Button variant="outline" size="sm" className="font-sf text-xs">
              <Edit3 className="h-3.5 w-3.5" />
              프로필 편집
            </Button>
          </div>
          <SettingRow
            label="통신 언어"
            hint="UI 및 신호 표기 언어"
            control={<PillGroup values={["한국어", "English", "日本語"]} active="한국어" />}
          />
        </SettingSection>

        {/* Notification Settings */}
        <SettingSection
          title="워프 알림"
          code="WARP TELEMETRY ALERTS"
          subtitle="이벤트 시작·종료, 가챠 픽업, 점검 시점에 전달될 알림을 설정합니다."
        >
          <SettingRow
            label="이벤트 D-day 알림"
            hint="가챠·콜라보·이벤트 시작/종료 임박 알림"
            control={
              <Toggle
                on={notifications.event}
                onChange={(value) => setNotifications((current) => ({ ...current, event: value }))}
              />
            }
          />
          <SettingRow
            label="가챠 픽업 개시 알림"
            hint="픽업 가챠 및 워프가 개시될 때 알림을 받습니다"
            control={
              <Toggle
                on={notifications.gacha}
                onChange={(value) => setNotifications((current) => ({ ...current, gacha: value }))}
              />
            }
          />
          <SettingRow
            label="정기 점검 알림"
            hint="버전 업데이트 및 긴급 점검 시작/종료 알림"
            control={
              <Toggle
                on={notifications.maintenance}
                onChange={(value) => setNotifications((current) => ({ ...current, maintenance: value }))}
              />
            }
          />
          <SettingRow
            label="주간 은하 요약 리포트"
            hint="매주 월요일 09:00 KST 이번 주 탑승 일정 브리핑"
            control={
              <Toggle
                on={notifications.weekly}
                onChange={(value) => setNotifications((current) => ({ ...current, weekly: value }))}
              />
            }
          />
          <SettingRow
            label="사전 알림 시점"
            hint="이벤트 시작 전 미리 알림을 수신할 시간"
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

        {/* External Calendar Sync */}
        <SettingSection
          title="오비탈 캘린더 연동"
          code="EXTERNAL ORBITAL SYNC"
          subtitle="스타차트 승인 일정을 개인 외부 캘린더와 자동 동기화합니다."
        >
          <div className="flex flex-wrap items-center gap-4 border-b border-[var(--border)] p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[#4285F4] shadow-sm">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-sf text-sm font-bold text-foreground">Google Calendar</p>
                {gcalLinked && <Badge variant="success">CONNECTED</Badge>}
              </div>
              <p className="font-mono text-xs text-[var(--text-3)]">
                {gcalLinked ? "나의 OtakuHub 캘린더 · 마지막 동기화 12분 전" : "연결되지 않음"}
              </p>
            </div>
            <Button
              variant={gcalLinked ? "outline" : "default"}
              size="sm"
              onClick={() => setGcalLinked((value) => !value)}
            >
              {gcalLinked ? "연결 해제" : "구글 계정으로 연결"}
              {!gcalLinked && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-start gap-4 p-4 opacity-70">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-muted">
              <CalendarDays className="h-5 w-5 text-[var(--text-3)]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-sf text-sm font-bold text-foreground">Apple 캘린더 / Outlook</p>
                <Badge variant="outline">SOON</Badge>
              </div>
              <p className="text-xs text-[var(--text-3)]">iCal URL 구독 방식으로 연동 준비 중입니다</p>
            </div>
          </div>
        </SettingSection>

        {/* Agent & Integration */}
        <SettingSection
          title="에이전트 릴레이 / 외부 연동"
          code="OTAKUS AGENT BUS"
          subtitle="OtakuS Agent가 사용할 OtakuHub 서버 API 준비 상태입니다."
        >
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
          <div className="grid gap-2 border-t border-[var(--border)] p-4">
            <EndpointRow icon={Cable} label="Agent 설정" path="/api/integrations/agent/config" />
            <EndpointRow icon={CalendarDays} label="일정 피드" path="/api/integrations/agent/events" />
            <EndpointRow icon={Gamepad2} label="실행 신호" path="/api/integrations/agent/activity" />
            <EndpointRow icon={Wallet} label="과금 알림" path="/api/integrations/agent/spending-alert" />
          </div>
          <SettingRow
            label="연동 보호"
            hint="운영 환경에서는 OTAKUS_AGENT_API_TOKEN으로 보호합니다."
            control={
              <Badge variant={agentTokenConfigured ? "success" : "warning"}>
                {agentTokenConfigured ? "토큰 보호" : "데모 허용"}
              </Badge>
            }
          />
          <SettingRow
            label="개인정보 범위"
            hint="게임 ID, 일정 ID, 사용자가 허용한 실행 신호만 받습니다."
            control={<Badge variant="outline">프로세스 목록 미수집</Badge>}
          />
        </SettingSection>

        {/* Inter-Service Relay */}
        <SettingSection
          title="연결된 서비스 런처"
          code="INTER-SERVICE RELAY"
          subtitle="같은 계정과 게임을 중심으로 육성, 이벤트, 소비 기록을 이어가는 OtakuS 연결 서비스입니다."
        >
          <AppLauncher />
        </SettingSection>

        {/* Route Channels / Games */}
        <SettingSection
          id="games"
          title="열차 노선 채널 (내 게임)"
          code="ROUTE CHANNELS"
          subtitle="AI가 일정을 수집할 대상 게임입니다. 사이드바와 캘린더 필터에 반영됩니다."
        >
          <div className="flex flex-wrap gap-2.5 p-4">
            {franchises.map((franchise) => (
              <div
                key={franchise.id}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm transition hover:scale-105"
                style={{
                  borderColor: colorMix(franchise.colorCode, 0.4),
                  backgroundColor: colorMix(franchise.colorCode, 0.12),
                }}
              >
                <span
                  className="h-2 w-2 rounded-full shadow-[0_0_6px_currentColor]"
                  style={{ backgroundColor: franchise.colorCode, color: franchise.colorCode }}
                />
                <span className="font-sf text-xs font-bold text-foreground">{franchise.name}</span>
                <button type="button" aria-label={`${franchise.name} 제거`} className="text-[var(--text-3)] hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddingGame((value) => !value)}
              className="font-sf text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              채널 추가
            </Button>
          </div>

          {addingGame && (
            <form action={addGame} className="grid gap-4 border-t border-[var(--border)] bg-muted/40 p-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px_auto]">
                <Input
                  name="name"
                  required
                  value={gameName}
                  onChange={(event) => setGameName(event.target.value)}
                  placeholder="게임 또는 프랜차이즈명"
                  className="font-semibold"
                />
                <select
                  name="category"
                  value={gameCategory}
                  onChange={(event) => setGameCategory(event.target.value as FranchiseCategory)}
                  className="h-9.5 rounded-md border border-[var(--border)] bg-input px-3 font-sf text-xs text-foreground outline-none transition focus:border-[var(--hologram)]"
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
                  onClick={() => void lookupPalette(gameName.trim())}
                  disabled={palettePending || gameName.trim().length < 2}
                  className="h-9.5"
                >
                  {palettePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  팔레트 탐색
                </Button>
              </div>
              <input type="hidden" name="colorCode" value={selectedColor} />
              <PalettePicker
                suggestion={paletteSuggestion}
                selectedColor={selectedColor}
                onSelect={setSelectedColor}
              />
              {paletteError && <p className="text-xs text-[var(--danger-text)]">{paletteError}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setAddingGame(false)}>
                  취소
                </Button>
                <Button size="sm" disabled={pending} className="shadow-[0_0_12px_var(--gold-glow)]">
                  {pending ? "등록 중..." : "채널 등록"}
                </Button>
              </div>
            </form>
          )}
          {error && <p className="border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--danger-text)]">{error}</p>}
        </SettingSection>

        {/* Appearance / Theme */}
        <SettingSection
          title="비주얼 테마"
          code="AESTHETIC PROTOCOL"
          subtitle="은하 열차의 시그니처 Astral Night(다크) 또는 Astral Daylight(라이트) 모드를 선택합니다."
        >
          <SettingRow
            label="테마 모드"
            hint="Astral Night: 코스믹 옵시디언 & 골드 | Astral Daylight: 알라바스터 & 길디드 브론즈"
            control={
              <div className="flex flex-wrap gap-2.5">
                <Pill active={theme === "dark"} onClick={() => setTheme("dark")}>
                  <Moon className="h-3.5 w-3.5" />
                  Astral Night (다크 기본)
                </Pill>
                <Pill active={theme === "light"} onClick={() => setTheme("light")}>
                  <Sun className="h-3.5 w-3.5" />
                  Astral Daylight (라이트)
                </Pill>
                <Pill active={theme === "system"} onClick={() => setTheme("system")}>
                  <Radio className="h-3.5 w-3.5" />
                  시스템 동기화
                </Pill>
              </div>
            }
          />
        </SettingSection>

        {/* Account Controls */}
        <SettingSection title="승객 계정" code="PASSENGER CREDENTIALS">
          <SettingRow
            label="데이터 매니페스트 내보내기"
            hint="내 일정·카고·위시리스트를 JSON 파일로 다운로드"
            control={
              <Button variant="outline" size="sm" className="font-sf text-xs">
                <Download className="h-3.5 w-3.5" />
                EXPORT JSON
              </Button>
            }
          />
          <SettingRow
            label="열차 세션 로그아웃"
            control={
              <Button variant="outline" size="sm" className="font-sf text-xs">
                <LogOut className="h-3.5 w-3.5" />
                LOGOUT
              </Button>
            }
          />
          <SettingRow
            label="탑승권 삭제"
            hint="모든 일정 및 카고 데이터가 영구 삭제됩니다."
            control={
              <Button variant="destructive" size="sm" className="font-sf text-xs">
                DELETE ACCOUNT
              </Button>
            }
          />
        </SettingSection>

        {/* System Diagnostics */}
        <SettingSection
          title="시스템 진단 상태"
          code="SYSTEM TELEMETRY"
          subtitle="인프라 및 연결 상태 진단 정보입니다."
        >
          <div className="grid gap-3 p-4 md:grid-cols-3">
            <StatusCard
              icon={ShieldCheck}
              title="Firebase"
              ok={supabaseReady}
              detail={serviceReady ? "Admin SDK 정상 연결" : "데모 모드 실행 중"}
            />
            <StatusCard
              icon={KeyRound}
              title="Gemini AI"
              ok={geminiConfigured}
              detail={geminiConfigured ? "AI 추출 파이프라인 가동" : "로컬 휴리스틱 모드"}
            />
            <StatusCard
              icon={Terminal}
              title="Cron Scheduler"
              ok={cronHardened}
              detail={cronHardened ? "보호 스케줄러 활성" : "시크릿 설정 필요"}
            />
          </div>
        </SettingSection>

        <p className="mt-5 text-center font-mono text-[11px] text-[var(--text-3)]">
          OTAKUHUB // ASTRAL EXPRESS V0.1.0-BETA
        </p>
      </div>
    </div>
  );
}

function SettingSection({
  id,
  title,
  code,
  subtitle,
  children,
}: {
  id?: string;
  title: string;
  code?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="panel mb-4 overflow-hidden shadow-sm scroll-mt-4">
      <div className="border-b border-[var(--border)] bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="font-sf text-sm font-bold text-foreground">{title}</h2>
          {code && (
            <span className="font-mono text-[9px] text-[var(--accent-text)]">
              {"//"} {code}
            </span>
          )}
        </div>
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
    <div className="flex flex-wrap items-center gap-4 border-b border-[var(--border)] p-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-foreground">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-[var(--text-3)]">{hint}</div>}
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
      className={`flex h-6 w-11 items-center rounded-full border border-transparent p-0.5 transition-all ${
        on
          ? "border-[var(--accent)] bg-[var(--accent)] shadow-[0_0_8px_var(--gold-glow)]"
          : "bg-muted"
      }`}
    >
      <span
        className={`h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform ${
          on ? "translate-x-5" : "translate-x-0"
        }`}
      />
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sf text-xs font-bold tracking-wide transition-all ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-[#070b18] shadow-[0_0_10px_var(--gold-glow)] font-black"
          : "border-[var(--border)] bg-card text-[var(--text-2)] hover:border-[var(--border-strong)] hover:bg-muted hover:text-foreground"
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
        <div className="flex items-center gap-2 font-sf text-xs font-bold text-[var(--accent-text)]">
          <PaletteIcon className="h-4 w-4" />
          CHOSEN PALETTE
        </div>
        {suggestion && (
          <>
            <Badge variant={suggestion.source.type === "curated" ? "success" : "secondary"}>
              {suggestion.source.type === "curated" ? "검색됨" : "자동 생성"}
            </Badge>
            <span className="font-mono text-xs text-[var(--text-3)]">
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
            className={`h-9 w-9 rounded-md border-2 transition-all ${
              selectedColor === color
                ? "scale-110 border-foreground shadow-[0_0_12px_currentColor]"
                : "border-transparent opacity-80 hover:opacity-100"
            }`}
            style={{ backgroundColor: color, color }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-3)]">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: selectedColor }} />
        <code>{selectedColor}</code>
        {suggestion?.source.url && (
          <a
            href={suggestion.source.url}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[var(--hologram)] hover:underline"
          >
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
    <div className="rounded-lg border border-[var(--border)] bg-muted/40 p-4 transition hover:border-[var(--hologram)]">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--hologram)]" />
        <span className="min-w-0 flex-1 truncate font-sf text-sm font-bold text-foreground">{title}</span>
        <Badge variant="secondary" className="font-sf text-[10px]">{state}</Badge>
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
    <div className="grid gap-2 rounded-lg border border-[var(--border)] bg-muted/30 px-3.5 py-2 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
      <div className="flex items-center gap-2 font-sf text-xs font-bold text-[var(--text-2)]">
        <Icon className="h-3.5 w-3.5 text-[var(--accent)]" />
        {label}
      </div>
      <code className="min-w-0 break-all rounded border border-[var(--border)] bg-card px-2 py-1 font-mono text-xs text-[var(--hologram)]">
        {path}
      </code>
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
    <div className="rounded-lg border border-[var(--border)] bg-muted/40 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--accent)]" />
        <span className="font-sf text-sm font-bold text-foreground">{title}</span>
        <Badge variant={ok ? "success" : "warning"} className="ml-auto font-sf text-[10px]">
          {ok ? "ONLINE" : "CHECK"}
        </Badge>
      </div>
      <p className="mt-2 font-mono text-xs text-[var(--text-3)]">{detail}</p>
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
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem("otakuhub-theme");
  return saved === "light" || saved === "system" ? saved : "dark";
}

function uniqueColors(colors: string[]) {
  return Array.from(new Set(colors.map((color) => color.toUpperCase())));
}

function colorMix(color: string, opacity = 0.14) {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`;
}
