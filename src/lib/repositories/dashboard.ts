import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DashboardData } from "@/lib/types";
import {
  mapCollectionRow,
  mapCrawlRunRow,
  mapCrawlSourceRow,
  mapEventRow,
  mapFranchiseRow,
  mapReminderRow,
  mapSuggestionRow,
  type UserEventRow,
  type UserFranchiseRow,
} from "@/lib/repositories/mappers";
import { getAuthenticatedUser } from "@/lib/repositories/auth";

function userFranchiseMap(rows: UserFranchiseRow[]) {
  return new Map(rows.map((row) => [row.franchise_id, row]));
}

function userEventMap(rows: UserEventRow[]) {
  return new Map(rows.map((row) => [row.event_id, row]));
}

async function throwOnError<T>({ data, error }: { data: T | null; error: unknown }) {
  if (error) throw error;
  return data;
}

export async function getSupabaseDashboardData(): Promise<DashboardData | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const user = await getAuthenticatedUser(supabase);

  const [franchiseRows, eventRows] = await Promise.all([
    throwOnError(
      await supabase.from("franchises").select("*").order("name", { ascending: true }),
    ),
    throwOnError(
      await supabase.from("events").select("*").order("start_date", { ascending: true }),
    ),
  ]);

  const [
    userFranchiseRows,
    userEventRows,
    collectionRows,
    sourceRows,
    suggestionRows,
    reminderRows,
    crawlRunRows,
  ] = user
    ? await Promise.all([
        throwOnError(await supabase.from("user_franchises").select("*").eq("user_id", user.id)),
        throwOnError(await supabase.from("user_events").select("*").eq("user_id", user.id)),
        throwOnError(
          await supabase
            .from("collections")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        ),
        throwOnError(
          await supabase
            .from("crawl_sources")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false }),
        ),
        throwOnError(
          await supabase
            .from("event_suggestions")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50),
        ),
        throwOnError(
          await supabase
            .from("reminders")
            .select("*")
            .eq("user_id", user.id)
            .order("remind_at", { ascending: true }),
        ),
        throwOnError(
          await supabase
            .from("crawl_runs")
            .select("*")
            .order("started_at", { ascending: false })
            .limit(20),
        ),
      ])
    : [[], [], [], [], [], [], []];

  const franchisePreferences = userFranchiseMap(userFranchiseRows ?? []);
  const savedEvents = userEventMap(userEventRows ?? []);

  return {
    franchises: (franchiseRows ?? []).map((row) =>
      mapFranchiseRow(row, franchisePreferences.get(row.id)),
    ),
    events: (eventRows ?? []).map((row) => mapEventRow(row, savedEvents.get(row.id))),
    collections: (collectionRows ?? []).map(mapCollectionRow),
    sources: (sourceRows ?? []).map(mapCrawlSourceRow),
    suggestions: (suggestionRows ?? []).map(mapSuggestionRow),
    reminders: (reminderRows ?? []).map(mapReminderRow),
    crawlRuns: (crawlRunRows ?? []).map(mapCrawlRunRow),
  };
}
