"use client";

import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  Globe,
  Info,
  Link2,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Sparkles,
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
    { id: "sources" as const, label: "수집 소스", count: sources.filter((source) => source.isActive).length },
    { id: "suggestions" as const, label: "AI 제안", count: pendingSuggestions.length },
    { id: "approved" as const, label: "승인 완료", count: approvedSuggestions.length },
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
          ? { message: "승인한 일정이 캘린더에 추가되었습니다.", href: "/calendar" }
          : { message: "제안을 거절했습니다. 캘린더에는 반영되지 않습니다." },
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
    setNotice({ message: "수정한 일정이 캘린더에 추가되었습니다.", href: "/calendar" });
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
        message: `크롤링 완료: 게시글 ${payload.data.postsFound}건에서 AI 제안 ${payload.data.suggestionsCreated}건을 만들었습니다.`,
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
    <div className="min-h-full bg-background">
      <PageTop
        title="탐색"
        description="수집 소스 살펴보기 → AI 일정 추출 → 검수 · 승인"
        action={
          <Button onClick={runCrawl} disabled={running}>
            {running ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            {running ? "수집 중..." : "지금 크롤링 실행"}
          </Button>
        }
      />

      <div className="px-4 pb-8 sm:px-7">
        {error && (
          <div className="mb-3 rounded-lg border border-[var(--danger)] bg-[var(--danger-bg)] px-4 py-3 text-sm font-medium text-[var(--danger-text)]">
            {error}
          </div>
        )}
        {notice && <NoticePanel notice={notice} />}

        <PipelinePanel
          running={running}
          pipeStep={pipeStep}
          posts={pipeCounts.posts || latestPosts(crawlRuns)}
          extracted={pipeCounts.extracted || latestSuggestions(crawlRuns)}
          pending={pendingSuggestions.length}
        />

        <div className="mt-4 flex max-w-full overflow-x-auto rounded-lg border bg-card p-1 sm:w-fit">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-bold transition ${
                tab === item.id ? "bg-primary text-white" : "text-[var(--text-2)] hover:bg-muted"
              }`}
            >
              {item.label}
              <span
                className={`rounded-full px-1.5 text-[10px] leading-4 ${
                  tab === item.id ? "bg-white/25 text-white" : "bg-muted text-[var(--text-3)]"
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>

        <section className="mt-4">
          {tab === "sources" && (
            <SourcesTab sources={sources} franchiseById={franchiseById} crawlRuns={crawlRuns} />
          )}

          {tab === "suggestions" && (
            <div>
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-[color-mix(in_oklch,var(--accent)_30%,var(--border))] bg-[var(--accent-bg)] px-4 py-3 text-sm text-[var(--accent-text)]">
                <Info className="h-4 w-4 shrink-0" />
                <p>
                  아래 일정은 <strong>AI가 크롤링된 게시글에서 추출</strong>한 후보입니다. 승인 전까지 캘린더에 반영되지 않습니다.
                </p>
              </div>
              {pendingSuggestions.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="모든 AI 제안을 검수했습니다" detail="새 수집을 실행하면 다시 제안이 생성됩니다." />
              ) : (
                <div className="space-y-3">
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
            <div className="panel overflow-hidden">
              <div className="border-b bg-muted px-4 py-3 text-xs font-bold text-[var(--text-2)]">
                승인된 일정 {approvedSuggestions.length}건
              </div>
              {approvedSuggestions.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="아직 승인된 AI 제안이 없습니다" detail="제안을 승인하면 이곳에 기록됩니다." />
              ) : (
                approvedSuggestions.map((suggestion) => {
                  const franchise = franchiseById.get(suggestion.franchiseId ?? "");
                  return (
                    <div key={suggestion.id} className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: franchise?.colorCode ?? "var(--accent)" }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-semibold">{suggestion.title}</span>
                          <Badge variant="outline">{franchise?.name ?? "미분류"}</Badge>
                          <Badge variant="success">{eventTypeLabels[suggestion.eventType]}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-[var(--text-3)]">
                          {formatDateRange(suggestion.startDate, suggestion.endDate)} · 승인 완료
                        </p>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
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
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-[color-mix(in_oklch,var(--success)_30%,var(--border))] bg-[var(--success-bg)] px-4 py-3 text-sm font-medium text-[var(--success-text)]">
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1">{notice.message}</span>
      {notice.href && (
        <Button variant="outline" size="sm" asChild>
          <Link href={notice.href}>
            캘린더 보기
            <ArrowRight className="h-4 w-4" />
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
    { icon: Link2, label: "수집 소스", value: "등록됨", step: 0, color: "var(--text-2)" },
    { icon: Globe, label: "크롤링", value: `${posts} 게시글`, step: 1, color: "var(--accent)" },
    { icon: Sparkles, label: "AI 추출", value: `${extracted} 일정`, step: 3, color: "var(--warn)" },
    { icon: Clock, label: "검수 대기", value: `${pending}건`, step: 4, color: "var(--warn)" },
    { icon: CheckCircle2, label: "캘린더", value: "승인 반영", step: 5, color: "var(--success)" },
  ];
  return (
    <div className="panel relative overflow-hidden p-4">
      {running && (
        <div className="absolute left-0 top-0 h-0.5 w-2/5 bg-[linear-gradient(90deg,transparent,var(--accent),transparent)] [animation:pipe-beam_1.6s_linear_infinite]" />
      )}
      <div className="flex flex-wrap items-center justify-center gap-3 lg:flex-nowrap">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const active = running && pipeStep === stage.step;
          const dim = running && pipeStep < stage.step;
          return (
            <div key={stage.label} className="flex min-w-24 flex-1 items-center">
              <div className={`flex min-w-20 flex-col items-center gap-1.5 transition-opacity ${dim ? "opacity-35" : "opacity-100"}`}>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg border transition"
                  style={{
                    backgroundColor: active ? stage.color : colorMix(stage.color, 0.12),
                    borderColor: colorMix(stage.color, 0.3),
                    color: active ? "white" : stage.color,
                    boxShadow: active ? `0 0 0 4px ${colorMix(stage.color, 0.18)}` : "none",
                  }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-sm font-bold tabular-nums">{stage.value}</div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-3)]">
                  {active && <span className="h-1 w-1 rounded-full bg-current [animation:pulse-dot_0.8s_ease-in-out_infinite]" />}
                  {stage.label}
                </div>
              </div>
              {index < stages.length - 1 && <ArrowRight className="hidden h-4 w-4 flex-none text-[var(--text-3)] lg:block" />}
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
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b bg-muted px-4 py-3">
        <span className="text-xs font-bold text-[var(--text-2)]">등록된 수집 소스 ({sources.length})</span>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4" />
          소스 추가
        </Button>
      </div>
      {sources.map((source) => {
        const franchise = franchiseById.get(source.franchiseId ?? "");
        const run = crawlRuns.find((item) => item.sourceId === source.id);
        return (
          <div key={source.id} className="flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: source.isActive ? "var(--success)" : "var(--text-3)" }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{source.name}</span>
                <Badge variant="outline">{crawlSourceTypeLabels[source.sourceType]}</Badge>
                <Badge
                  variant="outline"
                  style={{ color: franchise?.colorCode, borderColor: colorMix(franchise?.colorCode, 0.3) }}
                >
                  {franchise?.name ?? "공통"}
                </Badge>
              </div>
              <p className="mt-1 truncate text-xs text-[var(--text-3)]">
                {source.url} · 마지막 수집 {source.lastCrawledAt ? relativeTime(source.lastCrawledAt) : "대기 중"}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-[var(--accent-text)]">+{run?.postsFound ?? 0} 게시글</div>
              <div className="text-[10px] text-[var(--text-3)]">이번 수집</div>
            </div>
            <Button variant="ghost" size="icon" aria-label={`${source.name} 옵션`}>
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
    <article className={`panel p-4 transition ${editing ? "border-[var(--accent)] shadow-[0_0_0_4px_var(--accent-bg)]" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            style={{ color: franchise?.colorCode, borderColor: colorMix(franchise?.colorCode, 0.3) }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: franchise?.colorCode ?? "var(--accent)" }} />
            {franchise?.name ?? "미분류"}
          </Badge>
          <Badge variant="secondary">
            <Sparkles className="h-3 w-3" />
            AI 제안
          </Badge>
          <Badge variant="outline">{eventTypeLabels[suggestion.eventType]}</Badge>
        </div>
        <a
          href={suggestion.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-[var(--text-3)] hover:text-[var(--accent-text)]"
        >
          원문 보기
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {editing ? (
        <div className="mt-3 grid gap-3">
          <Input value={current.title} onChange={(event) => onDraft("title", event.target.value)} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input type="date" value={current.startDate} onChange={(event) => onDraft("startDate", event.target.value)} />
            <Input type="date" value={current.endDate} onChange={(event) => onDraft("endDate", event.target.value)} />
            <Input value={current.location} placeholder="장소" onChange={(event) => onDraft("location", event.target.value)} />
          </div>
          {(current.title !== suggestion.title ||
            current.startDate !== suggestion.startDate ||
            current.endDate !== (suggestion.endDate ?? "")) && (
            <div className="rounded-md border border-dashed bg-muted px-3 py-2 text-xs text-[var(--text-3)]">
              <div className="mb-1 flex items-center gap-1 font-bold text-[var(--text-2)]">
                <Sparkles className="h-3 w-3" />
                AI 원본
              </div>
              <div>{suggestion.title}</div>
              <div>{formatDateRange(suggestion.startDate, suggestion.endDate)}</div>
            </div>
          )}
        </div>
      ) : (
        <>
          <h3 className="mt-3 text-base font-bold leading-6">{current.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-2)]">
            <CalendarDays className="h-3.5 w-3.5 text-[var(--text-3)]" />
            {formatDateRange(current.startDate, current.endDate)}
            {current.location && <span>· {current.location}</span>}
            <span>· 신뢰도</span>
            <strong className={percent >= 90 ? "text-[var(--success-text)]" : percent >= 75 ? "text-[var(--warn-text)]" : "text-[var(--accent-text)]"}>
              {percent}%
            </strong>
          </div>
        </>
      )}

      <div className="mt-3 rounded-md bg-muted px-3 py-2 text-xs leading-5 text-[var(--text-2)]">
        {suggestion.warnings.length > 0 ? suggestion.warnings.join(" · ") : "중요 경고 없음 · 원문과 날짜를 확인한 뒤 승인하세요."}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {editing ? (
          <>
            <Button size="sm" onClick={onApproveEdit} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Check />}
              수정사항 저장 + 승인
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit} disabled={pending}>
              취소
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" onClick={onAccept} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Check />}
              승인 · 캘린더 추가
            </Button>
            <Button size="sm" variant="outline" onClick={onIgnore} disabled={pending}>
              <X className="h-4 w-4" />
              거절
            </Button>
            <Button size="sm" variant="ghost" onClick={onStartEdit} disabled={pending} className="sm:ml-auto">
              <Edit3 className="h-4 w-4" />
              편집
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
      <Icon className="h-10 w-10 text-[var(--success)]" />
      <p className="mt-3 text-sm font-bold">{title}</p>
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

function colorMix(color?: string, opacity = 0.12) {
  if (!color) return `color-mix(in oklch, var(--accent) ${Math.round(opacity * 100)}%, transparent)`;
  if (color.startsWith("var(")) {
    return `color-mix(in oklch, ${color} ${Math.round(opacity * 100)}%, transparent)`;
  }
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`;
}
