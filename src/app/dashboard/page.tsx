import { Bell, CalendarClock, CheckCircle2, DatabaseZap, RadioTower, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateRange, isWithinDays } from "@/lib/date-utils";
import { eventTypeLabels } from "@/lib/event-labels";
import { getDashboardData } from "@/lib/data";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const franchiseById = new Map(data.franchises.map((item) => [item.id, item]));
  const upcomingEvents = data.events
    .filter((event) => isWithinDays(event.startDate, 14))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const pendingSuggestions = data.suggestions.filter((suggestion) => suggestion.status === "pending");
  const wishlistCount = data.collections.filter((item) => item.isWishlist).length;

  return (
    <>
      <PageHeader
        icon={Sparkles}
        title="덕질 상황판"
        description="관심 프랜차이즈의 이번 주 일정, 새로 감지된 글, 굿즈 체크 상태를 한 화면에서 봅니다."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarClock}
          label="14일 내 일정"
          value={upcomingEvents.length}
          detail="저장/검증된 이벤트 기준"
        />
        <StatCard
          icon={RadioTower}
          label="검수 대기"
          value={pendingSuggestions.length}
          detail="AI가 구조화했지만 사용자 확인 전"
        />
        <StatCard
          icon={DatabaseZap}
          label="수집 소스"
          value={data.sources.filter((source) => source.isActive).length}
          detail="네이버 라운지, DC, 공식 사이트"
        />
        <StatCard icon={CheckCircle2} label="위시리스트" value={wishlistCount} detail="구매 전 굿즈 항목" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card>
          <CardHeader>
            <CardTitle>오늘부터 2주</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.map((event) => {
              const franchise = franchiseById.get(event.franchiseId);
              return (
                <div key={event.id} className="rounded-md border bg-background/50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: franchise?.colorCode ?? "#38bdf8" }}
                        />
                        <p className="font-medium">{event.title}</p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {franchise?.name ?? "미분류"} · {formatDateRange(event.startDate, event.endDate)}
                        {event.location ? ` · ${event.location}` : ""}
                      </p>
                    </div>
                    <Badge variant={event.saved ? "success" : "outline"}>
                      {event.saved ? "내 일정" : eventTypeLabels[event.type]}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                알림 큐
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.reminders.map((reminder) => {
                const event = data.events.find((item) => item.id === reminder.eventId);
                return (
                  <div key={reminder.id} className="rounded-md border bg-background/50 p-3">
                    <p className="text-sm font-medium">{event?.title ?? "삭제된 일정"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{reminder.remindAt.slice(0, 10)} 예정</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>최근 수집 상태</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.crawlRuns.slice(0, 4).map((run) => {
                const source = data.sources.find((item) => item.id === run.sourceId);
                return (
                  <div key={run.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium">{source?.name ?? "전체 수집"}</p>
                      <p className="text-xs text-muted-foreground">
                        글 {run.postsFound}개 · 제안 {run.suggestionsCreated}개
                      </p>
                    </div>
                    <Badge variant={run.status === "success" ? "success" : "warning"}>{run.status}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
