"use client";

import {
  Activity,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Package,
  RefreshCw,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateRange, daysUntil } from "@/lib/date-utils";
import { crawlSourceTypeLabels, eventTypeLabels } from "@/lib/event-labels";
import type { DashboardData, EventSuggestion, Franchise } from "@/lib/types";

export function DashboardClient({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState(data.suggestions);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const franchiseById = useMemo(() => new Map(data.franchises.map((item) => [item.id, item])), [data.franchises]);
  const pendingSuggestions = suggestions.filter((suggestion) => suggestion.status === "pending");
  const upcomingEvents = data.events
    .filter((event) => daysUntil(event.startDate) >= 0 && daysUntil(event.startDate) <= 14)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 5);
  const wishlist = data.collections.filter((item) => item.isWishlist).slice(0, 5);
  const activeSources = data.sources.filter((source) => source.isActive);
  const lastRun = [...data.crawlRuns].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  const postsScanned = lastRun?.postsFound ?? activeSources.length * 4;
  const eventsExtracted = lastRun?.suggestionsCreated ?? pendingSuggestions.length;

  async function review(id: string, action: "accept" | "ignore") {
    setPendingId(id);
    setError(null);
    const response = await fetch(`/api/suggestions/${id}/${action}`, { method: "POST" });
    if (response.ok) {
      setSuggestions((current) =>
        current.map((suggestion) =>
          suggestion.id === id
            ? { ...suggestion, status: action === "accept" ? "accepted" : "ignored" }
            : suggestion,
        ),
      );
      router.refresh();
    } else {
      setError(action === "accept" ? "제안을 승인하지 못했습니다." : "제안을 거절하지 못했습니다.");
    }
    setPendingId(null);
  }

  async function runCrawl() {
    if (running) return;
    setRunning(true);
    setError(null);
    const response = await fetch("/api/crawl/run", { method: "POST" });
    if (response.ok) {
      const payload = (await response.json()) as { data: { suggestions: EventSuggestion[] } };
      setSuggestions((current) => [...payload.data.suggestions, ...current]);
      router.refresh();
    } else {
      setError("크롤링 실행에 실패했습니다.");
    }
    setRunning(false);
  }

  return (
    <div className="min-h-full bg-background">
      <PageTop
        title="대시보드"
        description={`${new Intl.DateTimeFormat("ko-KR", { dateStyle: "full" }).format(new Date())} · 마지막 수집 ${
          lastRun ? relativeTime(lastRun.finishedAt) : "대기 중"
        }`}
        action={
          <Button onClick={runCrawl} disabled={running}>
            <RefreshCw className={running ? "animate-spin" : undefined} />
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

        <section className="panel relative overflow-hidden p-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-primary text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge variant="success">AI 파이프라인 운영 중</Badge>
                  <span className="text-xs text-[var(--text-3)]">
                    마지막 실행: {lastRun ? relativeTime(lastRun.finishedAt) : "아직 없음"}
                  </span>
                </div>
                <h2 className="text-base font-bold leading-7 tracking-tight">
                  Gemini가 새 게시글 <span className="text-[var(--accent-text)]">{postsScanned}건</span>을 스캔해서{" "}
                  <span className="text-[var(--accent-text)]">{eventsExtracted}건</span>의 일정 후보를 추출했어요.
                </h2>
                <p className="mt-1 text-sm text-[var(--text-2)]">
                  그 중 <strong>{pendingSuggestions.length}건</strong>이 검수 대기 중입니다. 승인해야 캘린더에 반영됩니다.
                </p>
                <PipelineMini posts={postsScanned} extracted={eventsExtracted} pending={pendingSuggestions.length} />
              </div>
            </div>
            <div className="flex flex-col gap-2 lg:items-end">
              <Button asChild>
                <Link href="/discover">
                  지금 검수하기 ({pendingSuggestions.length})
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <span className="text-xs text-[var(--text-3)]">다음 자동 실행 · 내일 오전 3:00</span>
            </div>
          </div>
        </section>

        <section className="mt-3 grid gap-3 md:grid-cols-3">
          <MetricCard icon={CalendarDays} label="2주 일정" value={`${upcomingEvents.length}건`} tone="success" />
          <MetricCard icon={Star} label="위시리스트" value={`${data.collections.filter((item) => item.isWishlist).length}개`} tone="warn" />
          <MetricCard icon={Activity} label="활성 소스" value={`${activeSources.length} / ${data.sources.length}`} tone="neutral" />
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <SectionHeader icon={Sparkles} title="AI 검수 대기" count={pendingSuggestions.length} href="/discover" />
            <div className="space-y-2">
              {pendingSuggestions.slice(0, 3).map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  franchise={franchiseById.get(suggestion.franchiseId ?? "")}
                  pending={pendingId === suggestion.id}
                  onAccept={() => review(suggestion.id, "accept")}
                  onIgnore={() => review(suggestion.id, "ignore")}
                />
              ))}
              {pendingSuggestions.length === 0 && <EmptyPanel icon={CheckCircle2} title="검수 대기 제안이 없습니다" />}
            </div>

            <SectionHeader icon={CalendarDays} title="다가오는 일정" />
            <div className="panel overflow-hidden">
              {upcomingEvents.length === 0 ? (
                <EmptyPanel icon={CalendarDays} title="다가오는 일정이 없습니다" />
              ) : (
                upcomingEvents.map((event, index) => {
                  const franchise = franchiseById.get(event.franchiseId);
                  const delta = daysUntil(event.startDate);
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
                    >
                      <div className="w-12 shrink-0 text-center">
                        <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-bold text-[var(--text-2)]">
                          {delta === 0 ? "오늘" : `D-${delta}`}
                        </span>
                      </div>
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: franchise?.colorCode ?? "#0EA5E9" }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{event.title}</p>
                        <p className="text-xs text-[var(--text-3)]">
                          {franchise?.name ?? "미분류"} · {formatDateRange(event.startDate, event.endDate)}
                        </p>
                      </div>
                      <Badge variant={index === 0 ? "success" : "outline"}>{eventTypeLabels[event.type]}</Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <SectionHeader icon={Activity} title="크롤러 상태" />
            <div className="panel overflow-hidden">
              {data.sources.map((source) => {
                const franchise = franchiseById.get(source.franchiseId ?? "");
                return (
                  <div key={source.id} className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: source.isActive ? "var(--success)" : "var(--warn)" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{source.name}</p>
                      <p className="truncate text-[11px] text-[var(--text-3)]">
                        {crawlSourceTypeLabels[source.sourceType]} · {franchise?.name ?? "공통"} ·{" "}
                        {source.lastCrawledAt ? relativeTime(source.lastCrawledAt) : "대기 중"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <SectionHeader icon={Package} title="위시리스트" href="/collections" cta="관리" />
            <div className="panel overflow-hidden">
              {wishlist.map((item) => {
                const franchise = franchiseById.get(item.franchiseId ?? "");
                return (
                  <div key={item.id} className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border"
                      style={{
                        backgroundColor: colorMix(franchise?.colorCode),
                        borderColor: colorMix(franchise?.colorCode, 0.25),
                        color: franchise?.colorCode ?? "var(--accent)",
                      }}
                    >
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{item.itemName}</p>
                      <p className="text-[11px] text-[var(--text-3)]">{franchise?.name ?? "미분류"}</p>
                    </div>
                    <span className="text-xs font-semibold">{formatKRW(item.price)}</span>
                  </div>
                );
              })}
              {wishlist.length === 0 && <EmptyPanel icon={Star} title="위시리스트가 비어 있습니다" />}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

export function PageTop({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 px-4 pb-4 pt-16 sm:px-7 sm:pt-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 truncate text-xs text-[var(--text-3)]">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

function PipelineMini({ posts, extracted, pending }: { posts: number; extracted: number; pending: number }) {
  const stages = [
    { label: "수집", value: `${posts} 게시글` },
    { label: "추출", value: `${extracted} 일정` },
    { label: "검수 대기", value: `${pending}건` },
  ];
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-3)]">
      {stages.map((stage, index) => (
        <span key={stage.label} className="inline-flex items-center gap-2">
          <span>
            <strong className="text-[var(--accent-text)]">{stage.value}</strong> {stage.label}
          </span>
          {index < stages.length - 1 && <ArrowRight className="h-3 w-3" />}
        </span>
      ))}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "success" | "warn" | "neutral";
}) {
  const toneClass =
    tone === "success"
      ? "bg-[var(--success-bg)] text-[var(--success-text)]"
      : tone === "warn"
        ? "bg-[var(--warn-bg)] text-[var(--warn-text)]"
        : "bg-muted text-[var(--text-2)]";
  return (
    <div className="panel flex items-center gap-3 p-3">
      <div className={`flex h-8 w-8 items-center justify-center rounded-md ${toneClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-lg font-bold leading-tight">{value}</div>
        <div className="text-xs text-[var(--text-3)]">{label}</div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  count,
  href,
  cta = "전체 보기",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count?: number;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--text-2)]" />
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-2)]">{title}</span>
        {typeof count === "number" && count > 0 && <Badge variant="secondary">{count}건</Badge>}
      </div>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent-text)]">
          {cta}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function SuggestionCard({
  suggestion,
  franchise,
  pending,
  onAccept,
  onIgnore,
}: {
  suggestion: EventSuggestion;
  franchise?: Franchise;
  pending: boolean;
  onAccept: () => void;
  onIgnore: () => void;
}) {
  const percent = Math.round(suggestion.confidence * 100);
  return (
    <article className="panel p-4">
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
          <span className="text-xs text-[var(--text-3)]">{eventTypeLabels[suggestion.eventType]}</span>
        </div>
        <a
          href={suggestion.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-[var(--text-3)] hover:text-[var(--accent-text)]"
        >
          출처
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <h3 className="mt-3 text-sm font-bold leading-6">{suggestion.title}</h3>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-2)]">
        <CalendarDays className="h-3.5 w-3.5 text-[var(--text-3)]" />
        {formatDateRange(suggestion.startDate, suggestion.endDate)}
        {suggestion.location && <span>· {suggestion.location}</span>}
        <span>· 신뢰도 {percent}%</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{
            width: `${percent}%`,
            backgroundColor: percent >= 90 ? "var(--success)" : percent >= 75 ? "var(--warn)" : "var(--accent)",
          }}
        />
      </div>
      {suggestion.warnings.length > 0 && (
        <div className="mt-3 rounded-md border border-[color-mix(in_oklch,var(--warn)_30%,var(--border))] bg-[var(--warn-bg)] px-3 py-2 text-xs leading-5 text-[var(--warn-text)]">
          {suggestion.warnings.join(" · ")}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onAccept} disabled={pending}>
          <Check className="h-4 w-4" />
          승인
        </Button>
        <Button size="sm" variant="outline" onClick={onIgnore} disabled={pending}>
          <X className="h-4 w-4" />
          거절
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <Link href="/discover">
            <Clock className="h-4 w-4" />
            편집 후 승인
          </Link>
        </Button>
      </div>
    </article>
  );
}

function EmptyPanel({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <div className="panel flex flex-col items-center justify-center px-4 py-10 text-center">
      <Icon className="h-8 w-8 text-[var(--text-3)]" />
      <p className="mt-3 text-sm font-semibold text-[var(--text-2)]">{title}</p>
    </div>
  );
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

function formatKRW(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function colorMix(color?: string, opacity = 0.12) {
  if (!color) return `color-mix(in oklch, var(--accent) ${Math.round(opacity * 100)}%, transparent)`;
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`;
}
