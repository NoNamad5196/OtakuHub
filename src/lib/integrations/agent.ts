import { createHash } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase/admin";
import { hasFirebaseAdminEnv, hasFirebaseEnv } from "@/lib/firebase/env";
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

export function hashAgentToken(token: string) {
  return createHash("sha256").update(token.trim()).digest("hex");
}

export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  const customHeader = request.headers.get("x-otakus-agent-token");
  if (customHeader) {
    return customHeader.trim();
  }
  return null;
}

export async function authorizeAgentRequest(request: Request): Promise<{ uid: string } | null> {
  const token = extractBearerToken(request);
  const requestedUid =
    request.headers.get("x-otakus-user-id") ||
    request.headers.get("x-user-id") ||
    new URL(request.url).searchParams.get("userId") ||
    new URL(request.url).searchParams.get("uid");

  if (requestedUid !== null && !/^[A-Za-z0-9_-]{1,128}$/.test(requestedUid)) return null;

  if (hasFirebaseEnv() || hasFirebaseAdminEnv()) {
    if (!token) return null;
    const tokenHash = hashAgentToken(token);
    const db = getAdminDb();
    if (requestedUid) {
      const userDoc = await db.doc(`users/${requestedUid}`).get();
      if (userDoc.exists && userDoc.get("agentTokenHash") === tokenHash) {
        return { uid: requestedUid };
      }
      return null;
    }

    const snap = await db.collection("users").where("agentTokenHash", "==", tokenHash).limit(1).get();
    if (!snap.empty) {
      return { uid: snap.docs[0].id };
    }
    return null;
  }

  const legacyToken = process.env.OTAKUS_AGENT_API_TOKEN;
  if (legacyToken) {
    if (token === legacyToken) return { uid: requestedUid || "demo-user" };
    return null;
  }

  if (token) {
    return { uid: requestedUid || "demo-user" };
  }

  return { uid: requestedUid || "demo-user" };
}

export async function isAgentAuthorized(request: Request): Promise<boolean> {
  const auth = await authorizeAgentRequest(request);
  return Boolean(auth);
}

export async function persistAgentSignal(
  uid: string,
  data: {
    kind: "game_started" | "game_stopped" | "manual_sync" | "spending_alert";
    sourceApp: "sipsungjang" | "gachaguard" | "otakuhub";
    gameId?: string | null;
    userGameId?: string | null;
    occurredAt?: string | null;
    message?: string | null;
    amount?: number | null;
    currency?: string | null;
    signalId?: string;
  },
): Promise<string> {
  const signalId = data.signalId || crypto.randomUUID();
  if (hasFirebaseEnv() || hasFirebaseAdminEnv()) {
    const db = getAdminDb();
    const now = Timestamp.now();
    const occurredAt = data.occurredAt ? Timestamp.fromDate(new Date(data.occurredAt)) : now;
    const expiresAt = Timestamp.fromMillis(now.toMillis() + 30 * 24 * 60 * 60 * 1000);
    const signalRef = db.doc(`users/${uid}/agentSignals/${signalId}`);
    await signalRef.set({
      kind: data.kind,
      source_app: data.sourceApp,
      game_id: data.gameId ?? null,
      user_game_id: data.userGameId ?? null,
      occurred_at: occurredAt,
      received_at: now,
      expires_at: expiresAt,
      message: data.message ?? null,
      amount: data.amount ?? null,
      currency: data.currency ?? null,
      schema_version: 1,
      created_at: now,
      updated_at: now,
    });
  }
  return signalId;
}

export function rejectProcessPayload(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const keys = Object.keys(value);
  const blocked = keys.find((key) => ["processes", "processList", "process_list"].includes(key));
  return blocked ? `전체 프로세스 목록은 수신하지 않습니다: ${blocked}` : null;
}

export function buildAgentConfig(origin: string) {
  const protectedByToken = Boolean(
    hasFirebaseEnv() || hasFirebaseAdminEnv() || process.env.OTAKUS_AGENT_API_TOKEN,
  );
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
