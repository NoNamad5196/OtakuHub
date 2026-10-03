import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/data";
import { apiError } from "@/lib/api/errors";
import {
  agentActivitySchema,
  findFranchise,
  isAgentAuthorized,
  rejectProcessPayload,
} from "@/lib/integrations/agent";
import { recordAgentActivity } from "@/lib/mock-store";

export async function POST(request: Request) {
  if (!isAgentAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const rejected = rejectProcessPayload(body);
    if (rejected) {
      return NextResponse.json({ error: rejected }, { status: 400 });
    }

    const input = agentActivitySchema.parse(body);
    const data = await getDashboardData();
    const franchise = findFranchise(data.franchises, {
      franchiseId: input.game?.franchiseId,
      franchiseSlug: input.game?.franchiseSlug,
      name: input.game?.name,
    });
    const record = recordAgentActivity({
      appId: input.appId,
      signal: input.signal,
      franchiseId: franchise?.id ?? input.game?.franchiseId ?? null,
      franchiseName: franchise?.name ?? input.game?.name ?? null,
      externalGameId: input.game?.externalGameId ?? null,
      occurredAt: input.occurredAt,
      note: input.note ?? null,
    });

    return NextResponse.json(
      {
        data: {
          accepted: true,
          record,
          matchedFranchise: franchise,
        },
      },
      { status: 202 },
    );
  } catch (error) {
    return apiError(error);
  }
}
