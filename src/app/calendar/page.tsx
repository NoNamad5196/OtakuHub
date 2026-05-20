import { CalendarClient } from "@/components/calendar-client";
import { getDashboardData } from "@/lib/data";

export default async function CalendarPage() {
  const data = await getDashboardData();

  return <CalendarClient events={data.events} franchises={data.franchises} />;
}
