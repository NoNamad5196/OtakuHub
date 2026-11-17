import { getAdminDb } from "@/lib/firebase/admin";
import { hasFirebaseAdminEnv, hasFirebaseEnv } from "@/lib/firebase/env";
import { getSessionUser } from "@/lib/firebase/session";
import type { DashboardData } from "@/lib/types";
import {
  mapCollectionRow,
  mapCrawlRunRow,
  mapCrawlSourceRow,
  mapEventRow,
  mapFranchiseRow,
  mapReminderRow,
  mapSuggestionRow,
  toIsoDateString,
  type CollectionRow,
  type CrawlRunRow,
  type CrawlSourceRow,
  type EventRow,
  type EventSuggestionRow,
  type FranchiseRow,
  type ReminderRow,
  type UserEventRow,
  type UserFranchiseRow,
} from "@/lib/repositories/mappers";

function userFranchiseMap(rows: UserFranchiseRow[]) {
  return new Map(rows.map((row) => [row.franchise_id, row]));
}

function userEventMap(rows: UserEventRow[]) {
  return new Map(rows.map((row) => [row.event_id, row]));
}

export async function getFirestoreDashboardData(): Promise<DashboardData | null> {
  if (!hasFirebaseEnv() && !hasFirebaseAdminEnv()) return null;
  const db = getAdminDb();
  const user = await getSessionUser();

  const [franchiseSnap, eventSnap] = await Promise.all([
    db.collection("franchises").get(),
    db.collection("events").get(),
  ]);

  const franchiseRows = franchiseSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FranchiseRow[];
  franchiseRows.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const eventRows = eventSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as EventRow[];
  eventRows.sort((a, b) => (a.start_date || "").localeCompare(b.start_date || ""));

  let userFranchiseRows: UserFranchiseRow[] = [];
  let userEventRows: UserEventRow[] = [];
  let collectionRows: CollectionRow[] = [];
  let sourceRows: CrawlSourceRow[] = [];
  let suggestionRows: EventSuggestionRow[] = [];
  let reminderRows: ReminderRow[] = [];
  let crawlRunRows: CrawlRunRow[] = [];

  if (user) {
    const [
      userFranchiseSnap,
      userEventSnap,
      collectionSnap,
      sourceSnap,
      suggestionSnap,
      reminderSnap,
      crawlRunSnap,
    ] = await Promise.all([
      db.collection(`users/${user.uid}/userFranchises`).get(),
      db.collection(`users/${user.uid}/hub/main/userEvents`).get(),
      db.collection(`users/${user.uid}/hub/main/collections`).get(),
      db.collection("modules/hub/crawlSources").get(),
      db.collection("modules/hub/eventSuggestions").get(),
      db.collection(`users/${user.uid}/hub/main/reminders`).get(),
      db.collection("modules/hub/crawlRuns").get(),
    ]);

    userFranchiseRows = userFranchiseSnap.docs.map((doc) => ({
      id: doc.id,
      franchise_id: doc.id,
      ...doc.data(),
    })) as UserFranchiseRow[];

    userEventRows = userEventSnap.docs.map((doc) => ({
      id: doc.id,
      event_id: doc.id,
      ...doc.data(),
    })) as UserEventRow[];

    collectionRows = collectionSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CollectionRow[];
    collectionRows.sort((a, b) => {
      const timeA = toIsoDateString(a.created_at);
      const timeB = toIsoDateString(b.created_at);
      return timeB.localeCompare(timeA);
    });

    sourceRows = sourceSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as CrawlSourceRow)
      .filter((s) => s.is_active !== false);

    suggestionRows = suggestionSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EventSuggestionRow[];
    suggestionRows.sort((a, b) => {
      const timeA = toIsoDateString(a.created_at);
      const timeB = toIsoDateString(b.created_at);
      return timeB.localeCompare(timeA);
    });
    suggestionRows = suggestionRows.slice(0, 50);

    reminderRows = reminderSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ReminderRow[];
    reminderRows.sort((a, b) => {
      const timeA = toIsoDateString(a.remind_at);
      const timeB = toIsoDateString(b.remind_at);
      return timeA.localeCompare(timeB);
    });

    crawlRunRows = crawlRunSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CrawlRunRow[];
    crawlRunRows.sort((a, b) => {
      const timeA = toIsoDateString(a.started_at);
      const timeB = toIsoDateString(b.started_at);
      return timeB.localeCompare(timeA);
    });
    crawlRunRows = crawlRunRows.slice(0, 20);
  }

  const franchisePreferences = userFranchiseMap(userFranchiseRows);
  const savedEvents = userEventMap(userEventRows);

  return {
    franchises: franchiseRows.map((row) =>
      mapFranchiseRow(row, franchisePreferences.get(row.id)),
    ),
    events: eventRows.map((row) => mapEventRow(row, savedEvents.get(row.id))),
    collections: collectionRows.map(mapCollectionRow),
    sources: sourceRows.map(mapCrawlSourceRow),
    suggestions: suggestionRows.map(mapSuggestionRow),
    reminders: reminderRows.map(mapReminderRow),
    crawlRuns: crawlRunRows.map(mapCrawlRunRow),
  };
}

export const getSupabaseDashboardData = getFirestoreDashboardData;
