"use client";

import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { CalendarPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateRange } from "@/lib/date-utils";
import { eventTypeLabels } from "@/lib/event-labels";
import type { Franchise, OtakuEvent } from "@/lib/types";

export function CalendarClient({
  events,
  franchises,
}: {
  events: OtakuEvent[];
  franchises: Franchise[];
}) {
  const franchiseById = new Map(franchises.map((franchise) => [franchise.id, franchise]));

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardContent className="p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            height="auto"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek",
            }}
            events={events.map((event) => {
              const franchise = franchiseById.get(event.franchiseId);
              return {
                id: event.id,
                title: event.title,
                start: event.startDate,
                end: event.endDate ?? undefined,
                color: franchise?.colorCode ?? "#38bdf8",
              };
            })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarPlus className="h-4 w-4 text-primary" />
            일정 목록
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.map((event) => {
            const franchise = franchiseById.get(event.franchiseId);
            return (
              <div key={event.id} className="rounded-md border bg-background/50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">{event.title}</p>
                  <Badge variant={event.isVerified ? "success" : "warning"}>
                    {event.isVerified ? "검증" : "대기"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {franchise?.name ?? "미분류"} · {eventTypeLabels[event.type]}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateRange(event.startDate, event.endDate)}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
