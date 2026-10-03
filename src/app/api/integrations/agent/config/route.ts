import { NextResponse } from "next/server";
import { buildAgentConfig, isAgentAuthorized } from "@/lib/integrations/agent";

export async function GET(request: Request) {
  if (!isAgentAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    data: buildAgentConfig(new URL(request.url).origin),
  });
}
