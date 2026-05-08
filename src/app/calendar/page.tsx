import { CalendarDays } from "lucide-react";
import { CalendarClient } from "@/components/calendar-client";
import { EventCreator } from "@/components/event-creator";
import { PageHeader } from "@/components/page-header";
import { getDashboardData } from "@/lib/data";

export default async function CalendarPage() {
  const data = await getDashboardData();

  return (
    <>
      <PageHeader
        icon={CalendarDays}
        title="캘린더"
        description="월별/주별로 이벤트를 확인하고, 수동 일정도 바로 추가합니다."
        action={<EventCreator franchises={data.franchises} />}
      />
      <CalendarClient events={data.events} franchises={data.franchises} />
    </>
  );
}
