"use client";

import {
  Activity,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  Package,
  Radio,
  RefreshCw,
  Sparkles,
  Star,
  Ticket,
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
    <div className="min-h-full bg-background pb-12">
      <PageTop
        title="은하 열차 대시보드"
        description={`${new Intl.DateTimeFormat("ko-KR", { dateStyle: "full" }).format(new Date())} · 마지막 수집: ${
          lastRun ? relativeTime(lastRun.finishedAt) : "대기 중"
        }`}
        action={
          <Button onClick={runCrawl} disabled={running}>
            <RefreshCw className={running ? "animate-spin" : undefined} />
            {running ? "신호 탐색 중..." : "지금 크롤링 실행"}
          </Button>
        }
      />

      <div className="px-4 pb-8 sm:px-7">
        {error && (
          <div className="mb-4 rounded-lg border border-[var(--danger)] bg-[var(--danger-bg)] px-4 py-3 text-sm font-medium text-[var(--danger-text)] shadow-sm">
            {error}
          </div>
        )}

        {/* Astral Express Warp Radar Console */}
        <section className="panel relative overflow-hidden border border-[var(--border-strong)] bg-gradient-to-r from-[var(--surface)] via-[var(--surface-raised)] to-[var(--surface)] p-5 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
          {/* Subtle cosmic beam animation */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--hologram)]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[var(--accent)]/10 blur-3xl" />

          <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="flex min-w-0 gap-4">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent-text)] shadow-[0_0_15px_var(--gold-glow)]">
                <Compass className="h-6 w-6 animate-pulse" />
                <span className="absolute -bottom-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-[var(--hologram)] shadow-[0_0_8px_var(--cyan-glow)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#070b18]" />
                </span>
              </div>
              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <Badge variant="success">
                    <Radio className="h-3 w-3 animate-pulse" />
                    WARP RELAY ACTIVE
                  </Badge>
                  <span className="font-mono text-xs text-[var(--text-3)]">
                    마지막 실행: {lastRun ? relativeTime(lastRun.finishedAt) : "아직 없음"}
                  </span>
                </div>
                <h2 className="break-keep text-base font-extrabold leading-7 tracking-tight text-foreground sm:text-lg">
                  Gemini가 게시글 <span className="font-mono text-[var(--hologram)]">{postsScanned}건</span>을 스캔하여{" "}
                  <span className="font-mono text-[var(--accent-text)]">{eventsExtracted}건</span>의 일정 후보를 도출했습니다.
                </h2>
                <p className="mt-1 break-keep text-xs text-[var(--text-2)] sm:text-sm">
                  검수 대기 <strong className="font-mono text-[var(--warn-text)]">{pendingSuggestions.length}건</strong>이 있습니다. 승인 시 캘린더 스타차트에 즉시 등록됩니다.
                </p>
                <PipelineMini posts={postsScanned} extracted={eventsExtracted} pending={pendingSuggestions.length} />
              </div>
            </div>
            <div className="flex flex-col gap-2 lg:items-end">
              <Button asChild className="shadow-[0_0_15px_var(--gold-glow)]">
                <Link href="/discover">
                  검수 콘솔 진입 ({pendingSuggestions.length})
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <span className="font-mono text-[11px] text-[var(--text-3)]">
                AUTO-CYCLE // 내일 03:00 KST
              </span>
            </div>
          </div>
        </section>

        {/* Express Telemetry Stat Cards */}
        <section className="mt-4 grid gap-3 md:grid-cols-3">
          <MetricCard
            icon={CalendarDays}
            label="2주 여정 일정"
            code="DESTINATIONS"
            value={`${upcomingEvents.length}건`}
            tone="success"
          />
          <MetricCard
            icon={Star}
            label="카고 위시리스트"
            code="CARGO MANIFEST"
            value={`${data.collections.filter((item) => item.isWishlist).length}개`}
            tone="warn"
          />
          <MetricCard
            icon={Activity}
            label="수집 레이더 상태"
            code="WARP BEACONS"
            value={`${activeSources.length} / ${data.sources.length}`}
            tone="neutral"
          />
        </section>

        {/* Boarding Passes & Stations Grid */}
        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="space-y-4">
            {/* AI Review Stream */}
            <SectionHeader
              icon={Sparkles}
              title="검수 대기 신호"
              code="WARP SCANNER QUEUE"
              count={pendingSuggestions.length}
              href="/discover"
              cta="전체 콘솔 열기"
            />
            <div className="space-y-2.5">
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
              {pendingSuggestions.length === 0 && (
                <EmptyPanel icon={CheckCircle2} title="검수 대기 신호가 없습니다" detail="모든 추출 일정이 승인되어 스타차트에 반영되었습니다." />
              )}
            </div>

            {/* Upcoming Boarding Passes */}
            <SectionHeader
              icon={CalendarDays}
              title="다가오는 탑승 일정"
              code="UPCOMING DESTINATIONS"
              href="/calendar"
              cta="스타차트 전체 보기"
            />
            <div className="space-y-2.5">
              {upcomingEvents.length === 0 ? (
                <EmptyPanel icon={CalendarDays} title="예정된 탑승 일정이 없습니다" detail="새로운 이벤트를 탐색하거나 캘린더에서 수동으로 등록해보세요." />
              ) : (
                upcomingEvents.map((event, index) => {
                  const franchise = franchiseById.get(event.franchiseId);
                  const delta = daysUntil(event.startDate);
                  return (
                    <article
                      key={event.id}
                      className="group relative flex flex-col sm:flex-row items-stretch overflow-hidden rounded-lg border border-[var(--border)] bg-card shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all hover:border-[var(--accent)] hover:shadow-[0_0_15px_var(--gold-glow)]"
                    >
                      {/* Left Boarding Pass Stub */}
                      <div className="flex sm:w-28 shrink-0 items-center justify-between sm:flex-col sm:justify-center border-b sm:border-b-0 sm:border-r border-dashed border-[var(--border-strong)] bg-muted/40 p-3 text-center">
                        <span className="font-sf text-[9px] font-bold tracking-widest text-[var(--accent-text)] uppercase">
                          BOARDING
                        </span>
                        <div className="font-mono text-base font-extrabold text-foreground">
                          {delta === 0 ? (
                            <span className="text-[var(--danger-text)]">TODAY</span>
                          ) : (
                            <span>D-{delta}</span>
                          )}
                        </div>
                        <span className="hidden font-mono text-[9px] text-[var(--text-3)] sm:inline">
                          ROUTE TICKET
                        </span>
                      </div>

                      {/* Ticket Body */}
                      <div className="flex min-w-0 flex-1 flex-col justify-between p-3.5 sm:p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 shrink-0 rounded-full shadow-[0_0_6px_currentColor]"
                                style={{ backgroundColor: franchise?.colorCode ?? "#dfb96d", color: franchise?.colorCode ?? "#dfb96d" }}
                              />
                              <span className="font-sf text-[11px] font-bold tracking-wider text-[var(--text-3)] uppercase">
                                DESTINATION // {franchise?.name ?? "미분류"}
                              </span>
                            </div>
                            <h3 className="mt-1 truncate text-sm font-bold text-foreground sm:text-base">
                              {event.title}
                            </h3>
                          </div>
                          <Badge variant={index === 0 ? "default" : "outline"} className="shrink-0 font-sf">
                            {eventTypeLabels[event.type]}
                          </Badge>
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center gap-3 font-mono text-xs text-[var(--text-2)]">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-[var(--hologram)]" />
                            {formatDateRange(event.startDate, event.endDate)}
                          </span>
                          {event.location && (
                            <span className="text-[var(--text-3)]">
                              · {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Radar & Manifest Column */}
          <aside className="space-y-5">
            {/* Crawler Sensors */}
            <SectionHeader
              icon={Activity}
              title="워프 비콘 레이더"
              code="ACTIVE SENSORS"
            />
            <div className="panel divide-y divide-[var(--border)] overflow-hidden">
              {data.sources.map((source) => {
                const franchise = franchiseById.get(source.franchiseId ?? "");
                return (
                  <div key={source.id} className="flex items-center gap-3 p-3 transition hover:bg-muted/40">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full shadow-[0_0_6px_currentColor]"
                      style={{
                        backgroundColor: source.isActive ? "var(--success)" : "var(--warn)",
                        color: source.isActive ? "var(--success)" : "var(--warn)",
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-foreground">{source.name}</p>
                      <p className="truncate font-mono text-[10px] text-[var(--text-3)]">
                        {crawlSourceTypeLabels[source.sourceType]} · {franchise?.name ?? "공통"} ·{" "}
                        {source.lastCrawledAt ? relativeTime(source.lastCrawledAt) : "대기 중"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cargo Bay Wishlist */}
            <SectionHeader
              icon={Package}
              title="카고 베이 위시리스트"
              code="CARGO MANIFEST"
              href="/collections"
              cta="관리"
            />
            <div className="panel divide-y divide-[var(--border)] overflow-hidden">
              {wishlist.map((item) => {
                const franchise = franchiseById.get(item.franchiseId ?? "");
                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 transition hover:bg-muted/40">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-sf text-xs font-bold"
                      style={{
                        backgroundColor: colorMix(franchise?.colorCode),
                        borderColor: colorMix(franchise?.colorCode, 0.35),
                        color: franchise?.colorCode ?? "var(--accent)",
                      }}
                    >
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-foreground">{item.itemName}</p>
                      <p className="font-sf text-[10px] text-[var(--text-3)]">{franchise?.name ?? "미분류"}</p>
                    </div>
                    <span className="font-mono text-xs font-bold text-[var(--accent-text)]">
                      {formatKRW(item.price)}
                    </span>
                  </div>
                );
              })}
              {wishlist.length === 0 && (
                <EmptyPanel icon={Star} title="위시리스트가 비어 있습니다" />
              )}
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
        <div className="flex items-center gap-2 font-sf text-[10px] font-extrabold tracking-widest text-[var(--hologram)] uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--hologram)] shadow-[0_0_6px_var(--cyan-glow)]" />
          ASTRAL EXPRESS // NAVIGATION LOG
        </div>
        <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--text-3)]">{description}</p>
      </div>
      {action && <div className="w-full shrink-0 lg:w-auto">{action}</div>}
    </header>
  );
}

function PipelineMini({ posts, extracted, pending }: { posts: number; extracted: number; pending: number }) {
  const stages = [
    { label: "게시글 스캔", value: `${posts}건` },
    { label: "신호 추출", value: `${extracted}건` },
    { label: "검수 대기", value: `${pending}건` },
  ];
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[11px] text-[var(--text-3)]">
      {stages.map((stage, index) => (
        <span key={stage.label} className="inline-flex items-center gap-2">
          <span>
            <strong className="font-bold text-[var(--accent-text)]">{stage.value}</strong> {stage.label}
          </span>
          {index < stages.length - 1 && <ArrowRight className="h-3 w-3 text-[var(--border-strong)]" />}
        </span>
      ))}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  code,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  code: string;
  value: string;
  tone: "success" | "warn" | "neutral";
}) {
  const toneClass =
    tone === "success"
      ? "bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success)]/30"
      : tone === "warn"
        ? "bg-[var(--warn-bg)] text-[var(--warn-text)] border-[var(--warn)]/30"
        : "bg-secondary text-[var(--hologram)] border-[var(--border)]";
  return (
    <div className="panel flex items-center gap-3.5 p-3.5 transition-all hover:border-[var(--hologram)]">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border shadow-sm ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="font-sf text-[9px] font-bold tracking-wider text-[var(--text-3)] uppercase">{code}</div>
        <div className="font-mono text-xl font-extrabold leading-tight text-foreground">{value}</div>
        <div className="text-xs text-[var(--text-2)]">{label}</div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  code,
  count,
  href,
  cta = "전체 보기",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  code?: string;
  count?: number;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--accent)]" />
        <span className="font-sf text-xs font-extrabold uppercase tracking-wider text-foreground">
          {title}
        </span>
        {code && (
          <span className="hidden font-mono text-[9px] text-[var(--text-3)] sm:inline">
            {"//"} {code}
          </span>
        )}
        {typeof count === "number" && count > 0 && (
          <Badge variant="default" className="font-mono text-[10px]">
            {count}건
          </Badge>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 font-sf text-xs font-bold text-[var(--accent-text)] transition hover:text-[var(--accent-hover)]"
        >
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
    <article className="panel relative overflow-hidden p-4 transition-all hover:border-[var(--hologram)]">
      {/* Top Holographic Micro Rail */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            style={{ color: franchise?.colorCode, borderColor: colorMix(franchise?.colorCode, 0.4) }}
            className="font-sf"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: franchise?.colorCode ?? "var(--accent)" }}
            />
            {franchise?.name ?? "미분류"}
          </Badge>
          <Badge variant="secondary" className="font-sf">
            <Sparkles className="h-3 w-3 text-[var(--hologram)]" />
            AI SIGNAL
          </Badge>
          <span className="font-sf text-xs font-semibold text-[var(--text-3)]">
            {eventTypeLabels[suggestion.eventType]}
          </span>
        </div>
        <a
          href={suggestion.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-mono text-xs text-[var(--text-3)] hover:text-[var(--hologram)]"
        >
          SOURCE
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <h3 className="text-sm font-bold leading-6 text-foreground">{suggestion.title}</h3>

      <div className="mt-1.5 flex flex-wrap items-center gap-3 font-mono text-xs text-[var(--text-2)]">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-[var(--hologram)]" />
          {formatDateRange(suggestion.startDate, suggestion.endDate)}
        </span>
        {suggestion.location && <span>· {suggestion.location}</span>}
        <span className="font-sf">· CONFIDENCE {percent}%</span>
      </div>

      {/* Telemetry Progress Bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percent}%`,
            backgroundColor:
              percent >= 90 ? "var(--success)" : percent >= 75 ? "var(--warn)" : "var(--accent)",
          }}
        />
      </div>

      {suggestion.warnings.length > 0 && (
        <div className="mt-3 rounded-md border border-[var(--warn)]/30 bg-[var(--warn-bg)] px-3 py-2 text-xs leading-5 text-[var(--warn-text)]">
          {suggestion.warnings.join(" · ")}
        </div>
      )}

      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onAccept} disabled={pending}>
          <Check className="h-3.5 w-3.5" />
          승인 · 스타차트 등록
        </Button>
        <Button size="sm" variant="outline" onClick={onIgnore} disabled={pending}>
          <X className="h-3.5 w-3.5" />
          거절
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <Link href="/discover">
            <Clock className="h-3.5 w-3.5" />
            검수 콘솔에서 편집
          </Link>
        </Button>
      </div>
    </article>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail?: string;
}) {
  return (
    <div className="panel flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-muted/50 text-[var(--accent)] shadow-sm">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-3 font-sf text-sm font-bold text-foreground">{title}</p>
      {detail && <p className="mt-1 text-xs text-[var(--text-3)]">{detail}</p>}
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

function colorMix(color?: string, opacity = 0.14) {
  if (!color) return `color-mix(in oklch, var(--accent) ${Math.round(opacity * 100)}%, transparent)`;
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`;
}
