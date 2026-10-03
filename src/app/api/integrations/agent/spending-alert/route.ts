import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/data";
import { apiError } from "@/lib/api/errors";
import {
  findFranchise,
  isAgentAuthorized,
  listAgentEvents,
  rejectProcessPayload,
  spendingAlertSchema,
} from "@/lib/integrations/agent";
import { recordSpendingAlert } from "@/lib/mock-store";

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

    const input = spendingAlertSchema.parse(body);
    const data = await getDashboardData();
    const franchise = findFranchise(data.franchises, {
      franchiseId: input.franchiseId,
      franchiseSlug: input.franchiseSlug,
      gameName: input.gameName,
    });
    const alert = recordSpendingAlert({
      appId: input.appId,
      franchiseId: franchise?.id ?? input.franchiseId ?? null,
      franchiseName: franchise?.name ?? input.gameName ?? null,
      trigger: input.trigger,
      budgetLimit: input.budgetLimit,
      projectedSpend: input.projectedSpend,
      currency: input.currency,
      occurredAt: input.occurredAt ?? new Date().toISOString(),
    });
    const relatedEvents = listAgentEvents(data, {
      franchiseId: franchise?.id ?? input.franchiseId,
      limit: 5,
    }).filter((event) => event.type === "preorder" || event.type === "goods_release");

    return NextResponse.json(
      {
        data: {
          accepted: true,
          alert,
          relatedEvents,
          recommendation:
            input.projectedSpend > input.budgetLimit
              ? "예산 초과 가능성이 있어 관련 일정을 다시 확인하세요."
              : "예산 안에 있지만 충동 결제 위험 신호로 기록했습니다.",
        },
      },
      { status: 202 },
    );
  } catch (error) {
    return apiError(error);
  }
}
