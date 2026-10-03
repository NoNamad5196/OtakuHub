import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/data";
import {
  isAgentAuthorized,
  listAgentEvents,
  parseEventType,
} from "@/lib/integrations/agent";

export async function GET(request: Request) {
  if (!isAgentAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const data = await getDashboardData();
  const events = listAgentEvents(data, {
    franchiseId: url.searchParams.get("franchiseId"),
    franchiseSlug: url.searchParams.get("franchiseSlug"),
    eventType: parseEventType(url.searchParams.get("eventType")),
    limit: Number(url.searchParams.get("limit") || 20),
  });

  return NextResponse.json({
    data: {
      generatedAt: new Date().toISOString(),
      events,
    },
  });
}
