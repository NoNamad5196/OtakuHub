"use client";

import type { DateClickArg } from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Compass,
  MapPin,
  Plus,
  Radio,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { PageTop } from "@/components/dashboard-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateRange, todayIso } from "@/lib/date-utils";
import { eventTypeLabels } from "@/lib/event-labels";
import type { EventType, Franchise, OtakuEvent } from "@/lib/types";
import { eventTypes } from "@/lib/types";

const allFilter = "all";

export function CalendarClient({
  events,
  franchises,
}: {
  events: OtakuEvent[];
  franchises: Franchise[];
}) {
  const router = useRouter();
  const calendarRef = useRef<FullCalendar | null>(null);
  const [typeFilter, setTypeFilter] = useState<EventType | typeof allFilter>(allFilter);
  const [franchiseFilter, setFranchiseFilter] = useState<string>(allFilter);
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [view, setView] = useState<"dayGridMonth" | "timeGridWeek">("dayGridMonth");
  const [addOpen, setAddOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const franchiseById = useMemo(() => new Map(franchises.map((franchise) => [franchise.id, franchise])), [franchises]);

  const filteredEvents = events
    .filter((event) => typeFilter === allFilter || event.type === typeFilter)
    .filter((event) => franchiseFilter === allFilter || event.franchiseId === franchiseFilter);

  const selectedEvents = filteredEvents
    .filter((event) => selectedDate >= event.startDate && selectedDate <= (event.endDate ?? event.startDate))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const upcomingEvents = filteredEvents
    .filter((event) => event.startDate >= todayIso())
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 8);

  function changeView(nextView: "dayGridMonth" | "timeGridWeek") {
    setView(nextView);
    calendarRef.current?.getApi().changeView(nextView);
  }

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        franchiseId: String(formData.get("franchiseId")),
        type: String(formData.get("type")),
        title: String(formData.get("title")),
        startDate: String(formData.get("startDate")),
        endDate: String(formData.get("endDate") || "") || null,
        location: String(formData.get("location") || "") || null,
        saved: true,
        remindDays: [3, 7],
      }),
    });
    if (response.ok) {
      setAddOpen(false);
      router.refresh();
    } else {
      setError("일정을 추가하지 못했습니다.");
    }
    setPending(false);
  }

  return (
    <div className="min-h-full bg-background pb-12">
      <PageTop
        title="은하 스타차트"
        description={`승인된 목적지 ${events.length}건 · AI 검수 파이프라인을 통과한 일정만 표시됩니다`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => calendarRef.current?.getApi().today()}
              className="font-sf text-xs"
            >
              오늘 (TODAY)
            </Button>
            <div className="flex overflow-hidden rounded-md border border-[var(--border)] bg-card shadow-sm">
              <button
                type="button"
                className="px-2.5 py-1.5 text-sm font-bold text-[var(--text-2)] transition hover:bg-muted hover:text-foreground"
                onClick={() => calendarRef.current?.getApi().prev()}
                aria-label="이전"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="border-l border-[var(--border)] px-2.5 py-1.5 text-sm font-bold text-[var(--text-2)] transition hover:bg-muted hover:text-foreground"
                onClick={() => calendarRef.current?.getApi().next()}
                aria-label="다음"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex overflow-hidden rounded-md border border-[var(--border)] bg-card shadow-sm">
              <button
                type="button"
                className={`px-3 py-1.5 font-sf text-xs font-bold transition ${
                  view === "dayGridMonth"
                    ? "bg-[var(--accent)] text-[#070b18] font-black"
                    : "text-[var(--text-3)] hover:bg-muted hover:text-foreground"
                }`}
                onClick={() => changeView("dayGridMonth")}
              >
                MONTH
              </button>
              <button
                type="button"
                className={`border-l border-[var(--border)] px-3 py-1.5 font-sf text-xs font-bold transition ${
                  view === "timeGridWeek"
                    ? "bg-[var(--accent)] text-[#070b18] font-black"
                    : "text-[var(--text-3)] hover:bg-muted hover:text-foreground"
                }`}
                onClick={() => changeView("timeGridWeek")}
              >
                WEEK
              </button>
            </div>
            <Button size="sm" onClick={() => setAddOpen(true)} className="shadow-[0_0_12px_var(--gold-glow)]">
              <Plus className="h-4 w-4" />
              일정 등록
            </Button>
          </div>
        }
      />

      <div className="px-4 pb-8 sm:px-7">
        {/* Route Filter Rails */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterPill active={typeFilter === allFilter} onClick={() => setTypeFilter(allFilter)}>
              전체 신호
            </FilterPill>
            {eventTypes.map((type) => (
              <FilterPill key={type} active={typeFilter === type} onClick={() => setTypeFilter(type)}>
                {eventTypeLabels[type]}
              </FilterPill>
            ))}
          </div>

          <div className="relative">
            <select
              value={franchiseFilter}
              onChange={(event) => setFranchiseFilter(event.target.value)}
              className="h-8.5 rounded-md border border-[var(--border-strong)] bg-card px-3 pr-8 font-sf text-xs font-bold text-foreground outline-none transition focus:border-[var(--hologram)] focus:shadow-[0_0_10px_var(--cyan-glow)]"
            >
              <option value={allFilter}>전체 채널 ({franchises.length})</option>
              {franchises.map((franchise) => (
                <option key={franchise.id} value={franchise.id}>
                  {franchise.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Star Chart & Day Inspector */}
        <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* Cosmic Calendar Surface */}
          <div className="panel overflow-x-auto p-4 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
            <div className="min-w-[680px] lg:min-w-0">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                height="auto"
                headerToolbar={{
                  left: "",
                  center: "title",
                  right: "",
                }}
                dateClick={(arg: DateClickArg) => setSelectedDate(arg.dateStr)}
                events={filteredEvents.map((event) => {
                  const franchise = franchiseById.get(event.franchiseId);
                  return {
                    id: event.id,
                    title: event.title,
                    start: event.startDate,
                    end: event.endDate ?? undefined,
                    color: franchise?.colorCode ?? "#dfb96d",
                  };
                })}
              />
            </div>
          </div>

          {/* Right Inspector & Itinerary Column */}
          <aside className="space-y-4">
            {/* Selected Date Inspector */}
            <div className="panel divide-y divide-[var(--border)] overflow-hidden">
              <div className="flex items-center gap-2 bg-muted/60 px-4 py-3">
                <Compass className="h-4 w-4 text-[var(--accent)]" />
                <span className="font-sf text-xs font-bold text-foreground uppercase">
                  {formatSelectedDate(selectedDate)}
                </span>
                <Badge variant="default" className="ml-auto font-mono text-[10px]">
                  {selectedEvents.length}건
                </Badge>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {selectedEvents.length === 0 ? (
                  <div className="px-4 py-8 text-center font-mono text-xs text-[var(--text-3)]">
                    NO DESTINATIONS // 등록된 일정이 없습니다
                  </div>
                ) : (
                  selectedEvents.map((event) => (
                    <EventRow key={event.id} event={event} franchise={franchiseById.get(event.franchiseId)} />
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Itinerary */}
            <div className="panel divide-y divide-[var(--border)] overflow-hidden">
              <div className="flex items-center justify-between bg-muted/60 px-4 py-3 font-sf text-xs font-bold text-foreground uppercase">
                <span>UPCOMING ROUTES // 다가오는 여정</span>
                <span className="font-mono text-[10px] text-[var(--accent-text)]">
                  {upcomingEvents.length}건
                </span>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {upcomingEvents.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    franchise={franchiseById.get(event.franchiseId)}
                    compact
                  />
                ))}
                {upcomingEvents.length === 0 && (
                  <div className="px-4 py-8 text-center font-mono text-xs text-[var(--text-3)]">
                    FILTER EMPTY // 조건에 맞는 일정이 없습니다
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Add Destination Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <form action={submit} className="panel w-full max-w-lg border border-[var(--border-strong)] bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[var(--accent)]" />
                <h2 className="font-sf text-sm font-bold text-foreground uppercase tracking-wide">
                  REGISTER DESTINATION // 스타차트 일정 등록
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="text-[var(--text-3)] transition hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3.5">
              <Input name="title" required placeholder="일정명" className="font-semibold" />
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  name="franchiseId"
                  className="h-9.5 rounded-md border border-[var(--border)] bg-input px-3 text-sm text-foreground outline-none transition focus:border-[var(--hologram)]"
                >
                  {franchises.map((franchise) => (
                    <option key={franchise.id} value={franchise.id}>
                      {franchise.name}
                    </option>
                  ))}
                </select>
                <select
                  name="type"
                  className="h-9.5 rounded-md border border-[var(--border)] bg-input px-3 text-sm text-foreground outline-none transition focus:border-[var(--hologram)]"
                >
                  {eventTypes.map((type) => (
                    <option key={type} value={type}>
                      {eventTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input name="startDate" type="date" required defaultValue={selectedDate} />
                <Input name="endDate" type="date" />
              </div>
              <Input name="location" placeholder="장소 또는 온라인 채널" />
            </div>
            {error && <p className="mt-3 text-xs text-[var(--danger-text)]">{error}</p>}
            <div className="mt-5 flex justify-end gap-2 border-t border-[var(--border)] pt-3.5">
              <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(false)}>
                취소
              </Button>
              <Button size="sm" disabled={pending} className="shadow-[0_0_12px_var(--gold-glow)]">
                {pending ? "등록 중..." : "스타차트에 추가"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function FilterPill({
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
      className={`rounded-full border px-3 py-1 font-sf text-xs font-bold tracking-wide transition-all ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-[#070b18] shadow-[0_0_10px_var(--gold-glow)] font-black"
          : "border-[var(--border)] bg-card text-[var(--text-2)] hover:border-[var(--border-strong)] hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function EventRow({
  event,
  franchise,
  compact = false,
}: {
  event: OtakuEvent;
  franchise?: Franchise;
  compact?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3.5 transition hover:bg-muted/30">
      <div
        className="mt-1 h-2 w-2 shrink-0 rounded-full shadow-[0_0_6px_currentColor]"
        style={{
          backgroundColor: franchise?.colorCode ?? "var(--accent)",
          color: franchise?.colorCode ?? "var(--accent)",
        }}
      />
      <div className="min-w-0 flex-1">
        <p className={`${compact ? "text-xs font-bold" : "text-sm font-bold"} leading-5 text-foreground`}>
          {event.title}
        </p>
        <p className="mt-1 font-mono text-[11px] text-[var(--text-3)]">
          {franchise?.name ?? "미분류"} · {formatDateRange(event.startDate, event.endDate)}
          {event.location ? ` · ${event.location}` : ""}
        </p>
      </div>
      <Badge variant={event.isVerified ? "success" : "default"} className="font-sf text-[10px]">
        {eventTypeLabels[event.type]}
      </Badge>
    </div>
  );
}

function formatSelectedDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" }).format(parsed);
}
