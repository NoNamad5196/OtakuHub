"use client";

import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Edit3,
  ExternalLink,
  Globe,
  Info,
  Link2,
  Loader2,
  MoreHorizontal,
  Plus,
  Radio,
  RefreshCw,
  Sparkles,
  Ticket,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PageTop } from "@/components/dashboard-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateRange } from "@/lib/date-utils";
import { crawlSourceTypeLabels, eventTypeLabels } from "@/lib/event-labels";
import type { CrawlRun, CrawlSource, EventSuggestion, Franchise } from "@/lib/types";

type TabId = "sources" | "suggestions" | "approved";

type EditDraft = {
  title: string;
  startDate: string;
  endDate: string;
  location: string;
};

type Notice = {
  message: string;
  href?: string;
};

export function SuggestionReview({
  initialSuggestions,
  sources,
  franchises,
  runs,
}: {
  initialSuggestions: EventSuggestion[];
  sources: CrawlSource[];
  franchises: Franchise[];
  runs: CrawlRun[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("suggestions");
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [crawlRuns, setCrawlRuns] = useState(runs);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, EditDraft>>({});
  const [pipeStep, setPipeStep] = useState(0);
  const [pipeCounts, setPipeCounts] = useState({ posts: 0, extracted: 0 });
  const franchiseById = useMemo(() => new Map(franchises.map((franchise) => [franchise.id, franchise])), [franchises]);
  const pendingSuggestions = suggestions.filter((suggestion) => suggestion.status === "pending");
  const approvedSuggestions = suggestions.filter((suggestion) => suggestion.status === "accepted");

  const tabs = [
    { id: "suggestions" as const, label: "AI 검수 대기", code: "UNVERIFIED SIGNALS", count: pendingSuggestions.length },
    { id: "approved" as const, label: "승인 완료", code: "CONFIRMED TICKETS", count: approvedSuggestions.length },
    { id: "sources" as const, label: "수집 비콘", code: "SIGNAL BEACONS", count: sources.filter((source) => source.isActive).length },
  ];

  async function review(id: string, action: "accept" | "ignore") {
    setPendingId(id);
    setError(null);
    setNotice(null);
    const response = await fetch(`/api/suggestions/${id}/${action}`, { method: "POST" });
    if (response.ok) {
      setSuggestions((current) =>
        current.map((suggestion) =>
          suggestion.id === id
            ? { ...suggestion, status: action === "accept" ? "accepted" : "ignored" }
            : suggestion,
        ),
      );
      setPipeStep(action === "accept" ? 5 : pipeStep);
      setNotice(
        action === "accept"
          ? { message: "일정이 승인되어 캘린더 스타차트에 기록되었습니다.", href: "/calendar" }
          : { message: "제안을 제외했습니다. 캘린더에는 반영되지 않습니다." },
      );
      router.refresh();
    } else {
      setError(action === "accept" ? "AI 제안을 승인하지 못했습니다." : "AI 제안을 거절하지 못했습니다.");
    }
    setPendingId(null);
  }

  function startEdit(suggestion: EventSuggestion) {
    setDrafts((current) => ({
      ...current,
      [suggestion.id]: {
        title: suggestion.title,
        startDate: suggestion.startDate,
        endDate: suggestion.endDate ?? "",
        location: suggestion.location ?? "",
      },
    }));
    setEditingId(suggestion.id);
  }

  function updateDraft(id: string, field: keyof EditDraft, value: string) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
  }

  async function approveWithEdit(suggestion: EventSuggestion) {
    const draft = drafts[suggestion.id];
    if (!draft) return;
    setPendingId(suggestion.id);
    setError(null);
    setNotice(null);
    const createResponse = await fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        franchiseId: suggestion.franchiseId ?? franchises[0]?.id,
        type: suggestion.eventType,
        title: draft.title,
        startDate: draft.startDate,
        endDate: draft.endDate || null,
        location: draft.location || null,
        sourceUrl: suggestion.sourceUrl,
        saved: true,
        remindDays: [3, 7],
      }),
    });
    if (!createResponse.ok) {
      setError("수정한 일정 생성에 실패했습니다.");
      setPendingId(null);
      return;
    }
    const patchResponse = await fetch("/api/suggestions", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: suggestion.id, status: "accepted" }),
    });
    if (!patchResponse.ok) {
      setError("제안 상태 업데이트에 실패했습니다.");
      setPendingId(null);
      return;
    }
    setSuggestions((current) =>
      current.map((item) =>
        item.id === suggestion.id
          ? {
              ...item,
              title: draft.title,
              startDate: draft.startDate,
              endDate: draft.endDate || null,
              location: draft.location || null,
              status: "accepted",
            }
          : item,
      ),
    );
    setEditingId(null);
    setPendingId(null);
    setPipeStep(5);
    setNotice({ message: "수정한 일정이 캘린더 스타차트에 등록되었습니다.", href: "/calendar" });
    router.refresh();
  }

  async function runCrawl() {
    if (running) return;
    setRunning(true);
    setError(null);
    setNotice(null);
    setPipeStep(0);
    setPipeCounts({ posts: 0, extracted: 0 });
    window.setTimeout(() => setPipeStep(1), 150);
    window.setTimeout(() => setPipeCounts((current) => ({ ...current, posts: 12 })), 450);
    window.setTimeout(() => setPipeStep(2), 850);
    window.setTimeout(() => setPipeStep(3), 1250);

    const response = await fetch("/api/crawl/run", { method: "POST" });
    if (response.ok) {
      const payload = (await response.json()) as {
        data: {
          status: CrawlRun["status"];
          postsFound: number;
          suggestionsCreated: number;
          suggestions: EventSuggestion[];
          startedAt: string;
          finishedAt: string;
        };
      };
      setPipeCounts({ posts: payload.data.postsFound, extracted: payload.data.suggestionsCreated });
      setPipeStep(4);
      setTab("suggestions");
      setNotice({
        message: `스캔 완료: 게시글 ${payload.data.postsFound}건에서 AI 신호 ${payload.data.suggestionsCreated}건을 도출했습니다.`,
      });
      setSuggestions((current) => [...payload.data.suggestions, ...current]);
      setCrawlRuns((current) => [
        {
          id: `local-${Date.now()}`,
          status: payload.data.status,
          postsFound: payload.data.postsFound,
          suggestionsCreated: payload.data.suggestionsCreated,
          startedAt: payload.data.startedAt,
          finishedAt: payload.data.finishedAt,
        },
        ...current,
      ]);
      router.refresh();
    } else {
      setError("수집 실행에 실패했습니다.");
    }
    setRunning(false);
  }

  return (
    <div className="min-h-full bg-background pb-12">
      <PageTop
        title="워프 신호 스캐너"
        description="은하 비콘 수집 → Gemini 신경망 일정 추출 → 탑승권 검수 및 승인 콘솔"
        action={
          <Button onClick={runCrawl} disabled={running} className="shadow-[0_0_15px_var(--gold-glow)]">
            {running ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            {running ? "신호 동기화 중..." : "지금 크롤링 실행"}
          </Button>
        }
      />

      <div className="px-4 pb-8 sm:px-7">
        {error && (
          <div className="mb-4 rounded-lg border border-[var(--danger)] bg-[var(--danger-bg)] px-4 py-3 text-sm font-medium text-[var(--danger-text)] shadow-sm">
            {error}
          </div>
        )}
        {notice && <NoticePanel notice={notice} />}

        {/* Warp Signal Scanner Radar Pipeline */}
        <PipelinePanel
          running={running}
          pipeStep={pipeStep}
          posts={pipeCounts.posts || latestPosts(crawlRuns)}
          extracted={pipeCounts.extracted || latestSuggestions(crawlRuns)}
          pending={pendingSuggestions.length}
        />

        {/* Console Nav Tabs */}
        <div className="mt-5 flex max-w-full overflow-x-auto rounded-lg border border-[var(--border)] bg-card/80 p-1 backdrop-blur-md sm:w-fit">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex shrink-0 items-center gap-2.5 rounded-md px-3.5 py-2 font-sf text-xs font-bold tracking-wide transition-all ${
                tab === item.id
                  ? "border border-[var(--accent)] bg-[var(--accent)] text-[#070b18] shadow-[0_0_12px_var(--gold-glow)] font-black"
                  : "text-[var(--text-2)] hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] leading-4 ${
                  tab === item.id ? "bg-[#070b18]/25 text-[#070b18] font-black" : "bg-muted text-[var(--text-3)]"
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab View Container */}
        <section className="mt-4">
          {tab === "sources" && (
            <SourcesTab sources={sources} franchiseById={franchiseById} crawlRuns={crawlRuns} />
          )}

          {tab === "suggestions" && (
            <div>
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-[var(--hologram)]/30 bg-[var(--hologram-bg)] px-4 py-3 text-xs text-foreground backdrop-blur-md">
                <Info className="h-4 w-4 shrink-0 text-[var(--hologram)]" />
                <p>
                  아래 항목들은 <strong className="font-bold text-[var(--hologram)]">Gemini AI가 원문 게시글에서 추출</strong>한 후보입니다. 검수 후 승인 버튼을 눌러야 캘린더 스타차트에 등록됩니다.
                </p>
              </div>

              {pendingSuggestions.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="모든 신호가 검수되었습니다"
                  detail="대기 중인 AI 후보가 없습니다. 새 크롤링을 실행하여 최신 신호를 수신하세요."
                />
              ) : (
                <div className="space-y-3.5">
                  {pendingSuggestions.map((suggestion) => (
                    <SuggestionReviewCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      franchise={franchiseById.get(suggestion.franchiseId ?? "")}
                      pending={pendingId === suggestion.id}
                      editing={editingId === suggestion.id}
                      draft={drafts[suggestion.id]}
                      onStartEdit={() => startEdit(suggestion)}
                      onCancelEdit={() => setEditingId(null)}
                      onDraft={(field, value) => updateDraft(suggestion.id, field, value)}
                      onAccept={() => review(suggestion.id, "accept")}
                      onIgnore={() => review(suggestion.id, "ignore")}
                      onApproveEdit={() => approveWithEdit(suggestion)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "approved" && (
            <div className="panel divide-y divide-[var(--border)] overflow-hidden">
              <div className="flex items-center justify-between bg-muted/60 px-4 py-3 font-sf text-xs font-bold text-[var(--text-2)] uppercase">
                <span>VERIFIED ITINERARIES // 승인 완료된 일정 ({approvedSuggestions.length}건)</span>
                <span className="font-mono text-[10px] text-[var(--accent-text)]">STAR CHART SYNCED</span>
              </div>
              {approvedSuggestions.length === 0 ? (
                <EmptyState
                  icon={Ticket}
                  title="아직 승인된 일정이 없습니다"
                  detail="신호 탭에서 제안을 승인하면 탑승권이 이곳에 영구 보관됩니다."
                />
              ) : (
                approvedSuggestions.map((suggestion) => {
                  const franchise = franchiseById.get(suggestion.franchiseId ?? "");
                  return (
                    <div key={suggestion.id} className="flex items-center gap-3.5 p-4 transition hover:bg-muted/30">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full shadow-[0_0_8px_currentColor]"
                        style={{ backgroundColor: franchise?.colorCode ?? "var(--accent)", color: franchise?.colorCode ?? "var(--accent)" }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-bold text-foreground">{suggestion.title}</span>
                          <Badge variant="outline" className="font-sf text-[10px]">
                            {franchise?.name ?? "미분류"}
                          </Badge>
                          <Badge variant="success" className="font-sf text-[10px]">
                            {eventTypeLabels[suggestion.eventType]}
                          </Badge>
                        </div>
                        <p className="mt-1 font-mono text-xs text-[var(--text-3)]">
                          {formatDateRange(suggestion.startDate, suggestion.endDate)} · 승인 반영 완료
                        </p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--success)] drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                    </div>
                  );
                })
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function NoticePanel({ notice }: { notice: Notice }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-lg border border-[var(--success)]/40 bg-[var(--success-bg)] px-4 py-3 text-xs sm:text-sm font-semibold text-[var(--success-text)] shadow-sm backdrop-blur-md">
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1">{notice.message}</span>
      {notice.href && (
        <Button variant="outline" size="sm" asChild className="h-7 text-xs">
          <Link href={notice.href}>
            스타차트 열기
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      )}
    </div>
  );
}

function PipelinePanel({
  running,
  pipeStep,
  posts,
  extracted,
  pending,
}: {
  running: boolean;
  pipeStep: number;
  posts: number;
  extracted: number;
  pending: number;
}) {
  const stages = [
    { icon: Link2, label: "수집 비콘", code: "BEACONS", value: "READY", step: 0, color: "var(--text-2)" },
    { icon: Globe, label: "크롤링 스캔", code: "POSTS INGEST", value: `${posts}건`, step: 1, color: "var(--hologram)" },
    { icon: Sparkles, label: "Gemini AI 추출", code: "NEURAL PARSE", value: `${extracted}건`, step: 3, color: "var(--accent)" },
    { icon: Clock, label: "탑승 검수 대기", code: "SIGNAL QUEUE", value: `${pending}건`, step: 4, color: "var(--warn)" },
    { icon: CheckCircle2, label: "스타차트 등록", code: "CONFIRMED", value: "SYNCED", step: 5, color: "var(--success)" },
  ];

  return (
    <div className="panel relative overflow-hidden border border-[var(--border-strong)] bg-gradient-to-b from-[var(--surface)] to-[var(--surface-raised)] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
      {/* Animated Scan Beam */}
      {running && (
        <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[var(--hologram)] to-transparent opacity-75 shadow-[0_0_12px_var(--hologram)] [animation:scan-beam_2s_ease-in-out_infinite]" />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 lg:flex-nowrap">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const active = running && pipeStep === stage.step;
          const dim = running && pipeStep < stage.step;
          return (
            <div key={stage.label} className="flex min-w-28 flex-1 items-center">
              <div className={`flex min-w-24 flex-col items-center gap-1.5 transition-opacity ${dim ? "opacity-35" : "opacity-100"}`}>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300"
                  style={{
                    backgroundColor: active ? stage.color : colorMix(stage.color, 0.12),
                    borderColor: colorMix(stage.color, 0.35),
                    color: active ? "#070b18" : stage.color,
                    boxShadow: active ? `0 0 16px ${stage.color}` : "none",
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-mono text-xs sm:text-sm font-extrabold tabular-nums text-foreground">{stage.value}</div>
                <div className="flex items-center gap-1 font-sf text-[9px] font-bold tracking-wider text-[var(--text-3)] uppercase">
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-current [animation:pulse-dot_0.8s_ease-in-out_infinite]" />}
                  {stage.label}
                </div>
              </div>
              {index < stages.length - 1 && (
                <ArrowRight className="hidden h-4 w-4 flex-none text-[var(--border-strong)] lg:block" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SourcesTab({
  sources,
  franchiseById,
  crawlRuns,
}: {
  sources: CrawlSource[];
  franchiseById: Map<string, Franchise>;
  crawlRuns: CrawlRun[];
}) {
  return (
    <div className="panel divide-y divide-[var(--border)] overflow-hidden">
      <div className="flex items-center justify-between bg-muted/60 px-4 py-3 font-sf text-xs font-bold text-[var(--text-2)] uppercase">
        <span>ACTIVE BEACONS // 수집 소스 레이더 ({sources.length})</span>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Plus className="h-3.5 w-3.5" />
          소스 추가
        </Button>
      </div>
      {sources.map((source) => {
        const franchise = franchiseById.get(source.franchiseId ?? "");
        const run = crawlRuns.find((item) => item.sourceId === source.id);
        return (
          <div key={source.id} className="flex flex-wrap items-center gap-3.5 p-4 transition hover:bg-muted/30">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_8px_currentColor]"
              style={{
                backgroundColor: source.isActive ? "var(--success)" : "var(--text-3)",
                color: source.isActive ? "var(--success)" : "var(--text-3)",
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-foreground">{source.name}</span>
                <Badge variant="outline" className="font-sf text-[10px]">
                  {crawlSourceTypeLabels[source.sourceType]}
                </Badge>
                <Badge
                  variant="outline"
                  className="font-sf text-[10px]"
                  style={{ color: franchise?.colorCode, borderColor: colorMix(franchise?.colorCode, 0.4) }}
                >
                  {franchise?.name ?? "공통"}
                </Badge>
              </div>
              <p className="mt-1 truncate font-mono text-xs text-[var(--text-3)]">
                {source.url} · 마지막 수집: {source.lastCrawledAt ? relativeTime(source.lastCrawledAt) : "대기 중"}
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm font-bold text-[var(--accent-text)]">
                +{run?.postsFound ?? 0} POSTS
              </div>
              <div className="font-sf text-[9px] text-[var(--text-3)] uppercase">THIS CYCLE</div>
            </div>
            <Button variant="ghost" size="icon" aria-label={`${source.name} 옵션`} className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function SuggestionReviewCard({
  suggestion,
  franchise,
  pending,
  editing,
  draft,
  onStartEdit,
  onCancelEdit,
  onDraft,
  onAccept,
  onIgnore,
  onApproveEdit,
}: {
  suggestion: EventSuggestion;
  franchise?: Franchise;
  pending: boolean;
  editing: boolean;
  draft?: EditDraft;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onDraft: (field: keyof EditDraft, value: string) => void;
  onAccept: () => void;
  onIgnore: () => void;
  onApproveEdit: () => void;
}) {
  const current = draft ?? {
    title: suggestion.title,
    startDate: suggestion.startDate,
    endDate: suggestion.endDate ?? "",
    location: suggestion.location ?? "",
  };
  const percent = Math.round(suggestion.confidence * 100);

  return (
    <article
      className={`panel relative overflow-hidden p-4 sm:p-5 transition-all ${
        editing
          ? "border-[var(--hologram)] shadow-[0_0_20px_var(--cyan-glow)]"
          : "hover:border-[var(--border-strong)]"
      }`}
    >
      {/* Ticket Header Micro-Rail */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="font-sf"
            style={{ color: franchise?.colorCode, borderColor: colorMix(franchise?.colorCode, 0.4) }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: franchise?.colorCode ?? "var(--accent)" }}
            />
            {franchise?.name ?? "미분류"}
          </Badge>
          <Badge variant="secondary" className="font-sf">
            <Sparkles className="h-3 w-3 text-[var(--hologram)]" />
            WARP SIGNAL
          </Badge>
          <Badge variant="outline" className="font-sf">
            {eventTypeLabels[suggestion.eventType]}
          </Badge>
        </div>
        <a
          href={suggestion.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-mono text-xs text-[var(--text-3)] transition hover:text-[var(--hologram)]"
        >
          원문 신호
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Main Signal Content / Edit Form */}
      {editing ? (
        <div className="mt-4 grid gap-3">
          <div className="font-sf text-[10px] font-bold uppercase tracking-wider text-[var(--hologram)]">
            EDITING DESTINATION PARAMETERS // 일정 수정
          </div>
          <Input
            value={current.title}
            onChange={(event) => onDraft("title", event.target.value)}
            placeholder="일정명"
            className="font-semibold"
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              type="date"
              value={current.startDate}
              onChange={(event) => onDraft("startDate", event.target.value)}
            />
            <Input
              type="date"
              value={current.endDate}
              onChange={(event) => onDraft("endDate", event.target.value)}
            />
            <Input
              value={current.location}
              placeholder="장소 / 위치"
              onChange={(event) => onDraft("location", event.target.value)}
            />
          </div>
          {(current.title !== suggestion.title ||
            current.startDate !== suggestion.startDate ||
            current.endDate !== (suggestion.endDate ?? "")) && (
            <div className="rounded-md border border-dashed border-[var(--border-strong)] bg-muted/40 p-3 text-xs text-[var(--text-3)]">
              <div className="mb-1 flex items-center gap-1 font-sf font-bold text-[var(--accent-text)]">
                <Sparkles className="h-3 w-3" />
                AI ORIGINAL EXTRACT // 원본 신호
              </div>
              <div className="font-semibold text-foreground">{suggestion.title}</div>
              <div className="font-mono">{formatDateRange(suggestion.startDate, suggestion.endDate)}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3.5">
          <h3 className="text-base font-extrabold leading-6 text-foreground">{current.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-xs text-[var(--text-2)]">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-[var(--hologram)]" />
              {formatDateRange(current.startDate, current.endDate)}
            </span>
            {current.location && <span>· {current.location}</span>}
            <span className="font-sf">
              · CONFIDENCE:{" "}
              <strong
                className={
                  percent >= 90
                    ? "text-[var(--success-text)]"
                    : percent >= 75
                      ? "text-[var(--warn-text)]"
                      : "text-[var(--accent-text)]"
                }
              >
                {percent}%
              </strong>
            </span>
          </div>

          {/* Telemetry Progress Bar */}
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${percent}%`,
                backgroundColor:
                  percent >= 90 ? "var(--success)" : percent >= 75 ? "var(--warn)" : "var(--accent)",
              }}
            />
          </div>
        </div>
      )}

      {/* Warnings & Diagnostics */}
      <div className="mt-3.5 rounded-md border border-[var(--border)] bg-muted/40 px-3.5 py-2 text-xs leading-5 text-[var(--text-2)]">
        {suggestion.warnings.length > 0 ? (
          <span className="text-[var(--warn-text)] font-medium">{suggestion.warnings.join(" · ")}</span>
        ) : (
          <span className="font-mono text-[11px] text-[var(--text-3)]">
            SIGNAL CLEAR // 중요 경고 없음 · 검수 후 스타차트에 반영하세요.
          </span>
        )}
      </div>

      {/* Action Controls */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3.5">
        {editing ? (
          <>
            <Button size="sm" onClick={onApproveEdit} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Check />}
              수정 사항 확정 + 스타차트 등록
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit} disabled={pending}>
              취소
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" onClick={onAccept} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Check />}
              승인 · 스타차트 등록
            </Button>
            <Button size="sm" variant="outline" onClick={onIgnore} disabled={pending}>
              <X className="h-4 w-4" />
              신호 무시
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onStartEdit}
              disabled={pending}
              className="sm:ml-auto"
            >
              <Edit3 className="h-3.5 w-3.5" />
              편집 후 승인
            </Button>
          </>
        )}
      </div>
    </article>
  );
}

function EmptyState({
  icon: Icon,
  title,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
}) {
  return (
    <div className="panel flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-muted/50 text-[var(--success)] shadow-sm">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-3 font-sf text-sm font-bold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-[var(--text-3)]">{detail}</p>
    </div>
  );
}

function latestPosts(runs: CrawlRun[]) {
  return runs[0]?.postsFound ?? 0;
}

function latestSuggestions(runs: CrawlRun[]) {
  return runs[0]?.suggestionsCreated ?? 0;
}

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.round(hours / 24)}일 전`;
}

function colorMix(color?: string, opacity = 0.14) {
  if (!color) return `color-mix(in oklch, var(--accent) ${Math.round(opacity * 100)}%, transparent)`;
  if (color.startsWith("var(")) {
    return `color-mix(in oklch, ${color} ${Math.round(opacity * 100)}%, transparent)`;
  }
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`;
}
