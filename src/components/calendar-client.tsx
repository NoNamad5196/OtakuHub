"use client";

import type { DateClickArg } from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
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
    <div className="min-h-full bg-background">
      <PageTop
        title="캘린더"
        description={`승인된 일정 ${events.length}건 · AI 검수 후 반영된 일정만 표시됩니다`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => calendarRef.current?.getApi().today()}>
              오늘
            </Button>
            <div className="flex overflow-hidden rounded-md border bg-card">
              <button
                type="button"
                className="px-3 text-sm font-bold text-[var(--text-2)] hover:bg-muted"
                onClick={() => calendarRef.current?.getApi().prev()}
                aria-label="이전"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="border-l px-3 text-sm font-bold text-[var(--text-2)] hover:bg-muted"
                onClick={() => calendarRef.current?.getApi().next()}
                aria-label="다음"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex overflow-hidden rounded-md border bg-card">
              <button
                type="button"
                className={`px-3 py-2 text-sm font-bold ${view === "dayGridMonth" ? "bg-secondary text-[var(--accent-text)]" : "text-[var(--text-3)]"}`}
                onClick={() => changeView("dayGridMonth")}
              >
                월
              </button>
              <button
                type="button"
                className={`border-l px-3 py-2 text-sm font-bold ${view === "timeGridWeek" ? "bg-secondary text-[var(--accent-text)]" : "text-[var(--text-3)]"}`}
                onClick={() => changeView("timeGridWeek")}
              >
                주
              </button>
            </div>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              일정 추가
            </Button>
          </div>
        }
      />

      <div className="px-4 pb-8 sm:px-7">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1">
            <FilterPill active={typeFilter === allFilter} onClick={() => setTypeFilter(allFilter)}>
              전체
            </FilterPill>
            {eventTypes.map((type) => (
              <FilterPill key={type} active={typeFilter === type} onClick={() => setTypeFilter(type)}>
                {eventTypeLabels[type]}
              </FilterPill>
            ))}
          </div>
          <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
          <div className="relative">
            <select
              value={franchiseFilter}
              onChange={(event) => setFranchiseFilter(event.target.value)}
              className="h-8 rounded-full border border-[var(--border-strong)] bg-card px-3 pr-8 text-xs font-bold text-[var(--text-2)] outline-none"
            >
              <option value={allFilter}>전체 게임 ({franchises.length})</option>
              {franchises.map((franchise) => (
                <option key={franchise.id} value={franchise.id}>
                  {franchise.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="panel overflow-x-auto p-3">
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
                    color: franchise?.colorCode ?? "#0EA5E9",
                  };
                })}
              />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="panel overflow-hidden">
              <div className="flex items-center gap-2 border-b bg-muted px-4 py-3">
                <CalendarDays className="h-4 w-4 text-[var(--accent-text)]" />
                <span className="text-sm font-bold">{formatSelectedDate(selectedDate)}</span>
                <Badge variant="secondary" className="ml-auto">
                  {selectedEvents.length}건
                </Badge>
              </div>
              {selectedEvents.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-[var(--text-3)]">이 날은 등록된 일정이 없습니다</div>
              ) : (
                selectedEvents.map((event) => (
                  <EventRow key={event.id} event={event} franchise={franchiseById.get(event.franchiseId)} />
                ))
              )}
            </div>

            <div className="panel overflow-hidden">
              <div className="border-b bg-muted px-4 py-3 text-sm font-bold">다가오는 일정</div>
              {upcomingEvents.map((event) => (
                <EventRow key={event.id} event={event} franchise={franchiseById.get(event.franchiseId)} compact />
              ))}
              {upcomingEvents.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-[var(--text-3)]">필터에 맞는 일정이 없습니다</div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <form action={submit} className="w-full max-w-lg rounded-xl border bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold">일정 추가</h2>
              <button type="button" onClick={() => setAddOpen(false)} className="text-[var(--text-3)] hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3">
              <Input name="title" required placeholder="일정명" />
              <div className="grid gap-3 sm:grid-cols-2">
                <select name="franchiseId" className="h-10 rounded-md border bg-input px-3 text-sm outline-none">
                  {franchises.map((franchise) => (
                    <option key={franchise.id} value={franchise.id}>
                      {franchise.name}
                    </option>
                  ))}
                </select>
                <select name="type" className="h-10 rounded-md border bg-input px-3 text-sm outline-none">
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
              <Input name="location" placeholder="장소 또는 온라인" />
            </div>
            {error && <p className="mt-3 text-sm text-[var(--danger-text)]">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                닫기
              </Button>
              <Button disabled={pending}>{pending ? "추가 중..." : "추가"}</Button>
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
      className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
        active
          ? "border-[var(--accent)] bg-secondary text-[var(--accent-text)]"
          : "border-border bg-card text-[var(--text-2)] hover:bg-muted"
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
    <div className="flex items-start gap-3 border-b px-4 py-3 last:border-b-0">
      <div
        className="mt-1 h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: franchise?.colorCode ?? "var(--accent)" }}
      />
      <div className="min-w-0 flex-1">
        <p className={`${compact ? "text-xs" : "text-sm"} font-semibold leading-5`}>{event.title}</p>
        <p className="mt-1 text-xs text-[var(--text-3)]">
          {franchise?.name ?? "미분류"} · {formatDateRange(event.startDate, event.endDate)}
          {event.location ? ` · ${event.location}` : ""}
        </p>
      </div>
      <Badge variant={event.isVerified ? "success" : "warning"}>{eventTypeLabels[event.type]}</Badge>
    </div>
  );
}

function formatSelectedDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" }).format(parsed);
}
