import { z } from "zod";
import { daysUntil } from "@/lib/date-utils";
import {
  agentActivitySignals,
  agentAppIds,
  eventTypes,
  type DashboardData,
  type EventType,
  type Franchise,
  type OtakuEvent,
} from "@/lib/types";

export const agentActivitySchema = z
  .object({
    appId: z.enum(agentAppIds).default("sipsungjang"),
    signal: z.enum(agentActivitySignals),
    occurredAt: z.string().datetime().optional(),
    game: z
      .object({
        franchiseId: z.string().min(1).optional(),
        franchiseSlug: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        externalGameId: z.string().min(1).optional(),
      })
      .optional(),
    note: z.string().max(500).optional(),
  })
  .strict();

export const spendingAlertSchema = z
  .object({
    appId: z.enum(agentAppIds).default("gachaguard"),
    franchiseId: z.string().min(1).optional(),
    franchiseSlug: z.string().min(1).optional(),
    gameName: z.string().min(1).optional(),
    trigger: z.enum(["budget_exceeded", "impulse_risk", "manual_check"]).default("budget_exceeded"),
    budgetLimit: z.number().nonnegative(),
    projectedSpend: z.number().nonnegative(),
    currency: z.string().min(1).default("KRW"),
    occurredAt: z.string().datetime().optional(),
  })
  .strict();

export type AgentActivityInput = z.infer<typeof agentActivitySchema>;
export type SpendingAlertInput = z.infer<typeof spendingAlertSchema>;

const eventTypesForAgent: EventType[] = ["goods_release", "preorder", "cafe", "popup", "broadcast"];

export function isAgentAuthorized(request: Request) {
  const token = process.env.OTAKUS_AGENT_API_TOKEN;
  if (!token) return true;
  return (
    request.headers.get("authorization") === `Bearer ${token}` ||
    request.headers.get("x-otakus-agent-token") === token
  );
}

export function rejectProcessPayload(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const keys = Object.keys(value);
  const blocked = keys.find((key) => ["processes", "processList", "process_list"].includes(key));
  return blocked ? `전체 프로세스 목록은 수신하지 않습니다: ${blocked}` : null;
}

export function buildAgentConfig(origin: string) {
  const protectedByToken = Boolean(process.env.OTAKUS_AGENT_API_TOKEN);
  return {
    appId: "otakuhub" as const,
    displayName: "OtakuHub",
    version: "0.1.0",
    mode: protectedByToken ? "token" : "demo",
    apps: [
      {
        id: "otakuhub",
        role: "calendar_source",
        signals: ["event_feed", "suggestion_review", "reminder"],
      },
      {
        id: "sipsungjang",
        role: "game_activity_source",
        signals: ["game_started", "game_stopped", "last_access"],
      },
      {
        id: "gachaguard",
        role: "spending_guard_source",
        signals: ["budget_exceeded", "impulse_risk"],
      },
    ],
    endpoints: {
      config: `${origin}/api/integrations/agent/config`,
      events: `${origin}/api/integrations/agent/events`,
      activity: `${origin}/api/integrations/agent/activity`,
      spendingAlert: `${origin}/api/integrations/agent/spending-alert`,
    },
    privacy: {
      accepts: ["user-approved game id", "event id", "budget alert summary"],
      rejects: ["process list", "window title list", "keystrokes", "screenshots"],
    },
  };
}

export function findFranchise(
  franchises: Franchise[],
  input?: {
    franchiseId?: string | null;
    franchiseSlug?: string | null;
    name?: string | null;
    gameName?: string | null;
  },
) {
  const name = normalizeKey(input?.name ?? input?.gameName ?? "");
  const slug = normalizeKey(input?.franchiseSlug ?? "");
  return (
    franchises.find((item) => item.id === input?.franchiseId) ??
    franchises.find((item) => normalizeKey(item.slug) === slug) ??
    franchises.find((item) => normalizeKey(item.name) === name) ??
    franchises.find((item) => name && normalizeKey(item.name).includes(name)) ??
    null
  );
}

export function listAgentEvents(
  data: DashboardData,
  options: {
    franchiseId?: string | null;
    franchiseSlug?: string | null;
    eventType?: EventType | null;
    limit?: number;
  } = {},
) {
  const franchise = findFranchise(data.franchises, options);
  const limit = options.limit ?? 20;
  return data.events
    .filter((event) => eventTypesForAgent.includes(event.type))
    .filter((event) => !options.eventType || event.type === options.eventType)
    .filter((event) => !franchise || event.franchiseId === franchise.id)
    .filter((event) => daysUntil(event.startDate) >= -1)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, limit)
    .map((event) => serializeAgentEvent(event, data.franchises));
}

export function parseEventType(value: string | null) {
  return eventTypes.find((item) => item === value) ?? null;
}

function serializeAgentEvent(event: OtakuEvent, franchises: Franchise[]) {
  const franchise = franchises.find((item) => item.id === event.franchiseId);
  return {
    id: event.id,
    franchiseId: event.franchiseId,
    franchiseSlug: franchise?.slug ?? null,
    franchiseName: franchise?.name ?? "미분류",
    type: event.type,
    title: event.title,
    startDate: event.startDate,
    endDate: event.endDate ?? null,
    location: event.location ?? null,
    sourceUrl: event.sourceUrl ?? null,
    verified: event.isVerified,
  };
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}
