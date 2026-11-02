import { createHash } from "node:crypto";
import dayjs from "dayjs";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  AuthenticationRequiredError,
  getAuthenticatedUser,
  requireUser,
} from "@/lib/repositories/auth";
import {
  mapCollectionRow,
  mapEventRow,
  mapFranchiseRow,
  mapSuggestionRow,
  slugifyName,
  toIsoDateString,
  type CollectionRow,
  type EventRow,
  type EventSuggestionRow,
  type FranchiseRow,
  type UserEventRow,
} from "@/lib/repositories/mappers";
import type { CollectionItem, EventSuggestion, Franchise, OtakuEvent } from "@/lib/types";

export { AuthenticationRequiredError };

export type CreateFranchiseInput = {
  name: string;
  category: Franchise["category"];
  colorCode: string;
};

export type CreateEventInput = {
  franchiseId: string;
  type: OtakuEvent["type"];
  title: string;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  sourceUrl?: string | null;
  saved?: boolean;
  memo?: string | null;
  remindDays?: number[];
};

export type CreateCollectionInput = {
  eventId?: string | null;
  franchiseId?: string | null;
  itemName: string;
  price: number;
  isWishlist: boolean;
  boughtAt?: string | null;
  memo?: string | null;
};

function addDaysIso(date: string, days: number) {
  return dayjs(date).subtract(days, "day").hour(9).minute(0).second(0).millisecond(0).toISOString();
}

function getReminderId(eventId: string, remindAtIso: string): string {
  const utc = new Date(remindAtIso).toISOString();
  return createHash("sha256").update(JSON.stringify([eventId, utc])).digest("hex");
}

async function getClientAndUser() {
  const user = requireUser(await getAuthenticatedUser());
  const db = getAdminDb();
  return { db, user };
}

async function createReminders(
  db: FirebaseFirestore.Firestore,
  userId: string,
  eventId: string,
  startDate: string,
  remindDays: number[],
) {
  if (remindDays.length === 0) return;
  const now = Timestamp.now();
  const batch = db.batch();
  for (const days of remindDays) {
    const remindAtIso = addDaysIso(startDate, days);
    const reminderId = getReminderId(eventId, remindAtIso);
    const reminderRef = db.doc(`users/${userId}/hub/main/reminders/${reminderId}`);
    batch.set(
      reminderRef,
      {
        event_id: eventId,
        remind_at: Timestamp.fromDate(new Date(remindAtIso)),
        status: "pending",
        schema_version: 1,
        created_at: now,
        updated_at: now,
      },
      { merge: true },
    );
  }
  await batch.commit();
}

export async function createFirestoreFranchise(input: CreateFranchiseInput): Promise<Franchise> {
  const { db, user } = await getClientAndUser();
  const slug = slugifyName(input.name);
  const now = Timestamp.now();
  const franchiseRef = db.doc(`franchises/${slug}`);
  const franchiseData: FranchiseRow = {
    id: slug,
    name: input.name,
    slug,
    category: input.category,
    color_code: input.colorCode,
    icon_url: null,
    is_public: true,
    created_by: user.id,
    created_at: now,
    updated_at: now,
  };
  await franchiseRef.set(franchiseData, { merge: true });
  return mapFranchiseRow(franchiseData);
}

export async function createFirestoreEvent(input: CreateEventInput): Promise<OtakuEvent> {
  const { db, user } = await getClientAndUser();
  const eventId = crypto.randomUUID();
  const now = Timestamp.now();
  const eventRef = db.doc(`events/${eventId}`);
  const eventData: EventRow = {
    id: eventId,
    franchise_id: input.franchiseId,
    game_id: null,
    type: input.type,
    title: input.title,
    start_date: input.startDate,
    end_date: input.endDate ?? null,
    timezone: "Asia/Seoul",
    location: input.location ?? null,
    source_url: input.sourceUrl ?? null,
    status: "published",
    is_verified: true,
    reviewed_by: user.id,
    reviewed_at: now,
    moderation_reason: "user_created",
    created_by: user.id,
    created_at: now,
    updated_at: now,
  };
  await eventRef.set(eventData);

  let userEventData: UserEventRow | undefined = undefined;
  if (input.saved ?? true) {
    const remindDays = input.remindDays ?? [3, 7];
    userEventData = {
      id: eventId,
      user_id: user.id,
      event_id: eventId,
      remind_days: remindDays,
      is_attending: false,
      memo: input.memo ?? null,
      created_at: now,
      updated_at: now,
    };
    await db.doc(`users/${user.id}/hub/main/userEvents/${eventId}`).set(userEventData);
    await createReminders(db, user.id, eventId, input.startDate, remindDays);
  }

  return mapEventRow(eventData, userEventData);
}

export async function saveFirestoreEvent(eventId: string): Promise<OtakuEvent | null> {
  const { db, user } = await getClientAndUser();
  const eventDoc = await db.doc(`events/${eventId}`).get();
  if (!eventDoc.exists) return null;
  const eventData = { id: eventDoc.id, ...eventDoc.data() } as EventRow;

  const remindDays = [3, 7];
  const now = Timestamp.now();
  const userEventData: UserEventRow = {
    id: eventId,
    user_id: user.id,
    event_id: eventId,
    remind_days: remindDays,
    is_attending: false,
    memo: null,
    created_at: now,
    updated_at: now,
  };
  await db.doc(`users/${user.id}/hub/main/userEvents/${eventId}`).set(userEventData, { merge: true });
  await createReminders(db, user.id, eventId, eventData.start_date, remindDays);
  return mapEventRow(eventData, userEventData);
}

export async function createFirestoreCollection(
  input: CreateCollectionInput,
): Promise<CollectionItem> {
  const { db, user } = await getClientAndUser();
  const collectionId = crypto.randomUUID();
  const now = Timestamp.now();
  const collectionData: CollectionRow = {
    id: collectionId,
    user_id: user.id,
    event_id: input.eventId ?? null,
    franchise_id: input.franchiseId ?? null,
    game_id: null,
    item_name: input.itemName,
    price: input.price,
    currency: "KRW",
    is_wishlist: input.isWishlist,
    bought_at: input.boughtAt ? Timestamp.fromDate(new Date(input.boughtAt)) : null,
    image_url: null,
    memo: input.memo ?? null,
    created_at: now,
    updated_at: now,
  };
  await db.doc(`users/${user.id}/hub/main/collections/${collectionId}`).set(collectionData);
  return mapCollectionRow(collectionData);
}

export async function listFirestoreSuggestions(status?: EventSuggestion["status"]) {
  const db = getAdminDb();
  const snap = await db.collection("modules/hub/eventSuggestions").get();
  let suggestions = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as EventSuggestionRow);
  if (status) {
    suggestions = suggestions.filter((item) => item.status === status);
  }
  suggestions.sort((a, b) => {
    const timeA = toIsoDateString(a.created_at);
    const timeB = toIsoDateString(b.created_at);
    return timeB.localeCompare(timeA);
  });
  return suggestions.map(mapSuggestionRow);
}

export async function updateFirestoreSuggestionStatus(
  id: string,
  status: EventSuggestion["status"],
): Promise<EventSuggestion | null> {
  const { db, user } = await getClientAndUser();
  const ref = db.doc(`modules/hub/eventSuggestions/${id}`);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const now = Timestamp.now();
  await ref.update({
    status,
    reviewed_by: user.id,
    reviewed_at: now,
    updated_at: now,
  });
  const updated = await ref.get();
  return mapSuggestionRow({ id: updated.id, ...updated.data() } as EventSuggestionRow);
}

export async function acceptFirestoreSuggestion(id: string) {
  const { db, user } = await getClientAndUser();
  const suggestionRef = db.doc(`modules/hub/eventSuggestions/${id}`);

  return await db.runTransaction(async (transaction) => {
    const suggestionDoc = await transaction.get(suggestionRef);
    if (!suggestionDoc.exists) return null;
    const suggestion = { id: suggestionDoc.id, ...suggestionDoc.data() } as EventSuggestionRow;

    if (!suggestion.franchise_id) {
      throw new Error("Suggestion is missing a franchise_id and cannot be accepted.");
    }

    const eventId = `suggestion-${id}`;
    const eventRef = db.doc(`events/${eventId}`);
    const userEventRef = db.doc(`users/${user.id}/hub/main/userEvents/${eventId}`);

    if (suggestion.status === "accepted") {
      const existingEventDoc = await transaction.get(eventRef);
      if (existingEventDoc.exists) {
        const existingEvent = { id: existingEventDoc.id, ...existingEventDoc.data() } as EventRow;
        const existingUserEventDoc = await transaction.get(userEventRef);
        const existingUserEvent = existingUserEventDoc.exists
          ? ({ id: existingUserEventDoc.id, ...existingUserEventDoc.data() } as UserEventRow)
          : undefined;
        return {
          suggestion: mapSuggestionRow(suggestion),
          event: mapEventRow(existingEvent, existingUserEvent),
        };
      }
    }

    if (suggestion.status === "ignored") {
      throw new Error("Ignored suggestion cannot be accepted without re-review.");
    }

    let postRef: FirebaseFirestore.DocumentReference | null = null;
    if (suggestion.crawled_post_id) {
      postRef = db.doc(`modules/hub/crawledPosts/${suggestion.crawled_post_id}`);
    }

    const now = Timestamp.now();
    const eventData: EventRow = {
      id: eventId,
      franchise_id: suggestion.franchise_id,
      game_id: suggestion.game_id ?? null,
      type: suggestion.event_type,
      title: suggestion.title,
      start_date: suggestion.start_date,
      end_date: suggestion.end_date ?? null,
      timezone: "Asia/Seoul",
      location: suggestion.location ?? null,
      source_url: suggestion.source_url ?? null,
      status: "published",
      is_verified: true,
      reviewed_by: user.id,
      reviewed_at: now,
      moderation_reason: "suggestion_approved",
      suggestion_id: id,
      crawled_post_id: suggestion.crawled_post_id ?? null,
      created_by: user.id,
      created_at: now,
      updated_at: now,
    };

    const remindDays = [3, 7];
    const userEventData: UserEventRow = {
      id: eventId,
      user_id: user.id,
      event_id: eventId,
      remind_days: remindDays,
      is_attending: false,
      memo: null,
      created_at: now,
      updated_at: now,
    };

    transaction.set(eventRef, eventData);
    transaction.update(suggestionRef, {
      status: "accepted",
      event_id: eventId,
      reviewed_by: user.id,
      reviewed_at: now,
      moderation_reason: "suggestion_approved",
      updated_at: now,
    });
    if (postRef) {
      transaction.update(postRef, {
        event_id: eventId,
        updated_at: now,
      });
    }
    transaction.set(userEventRef, userEventData);

    for (const days of remindDays) {
      const remindAtIso = addDaysIso(suggestion.start_date, days);
      const reminderId = getReminderId(eventId, remindAtIso);
      const reminderRef = db.doc(`users/${user.id}/hub/main/reminders/${reminderId}`);
      transaction.set(reminderRef, {
        event_id: eventId,
        remind_at: Timestamp.fromDate(new Date(remindAtIso)),
        status: "pending",
        schema_version: 1,
        created_at: now,
        updated_at: now,
      });
    }

    return {
      suggestion: mapSuggestionRow({
        ...suggestion,
        status: "accepted",
        event_id: eventId,
        reviewed_by: user.id,
        reviewed_at: now,
      }),
      event: mapEventRow(eventData, userEventData),
    };
  });
}

export const createSupabaseFranchise = createFirestoreFranchise;
export const createSupabaseEvent = createFirestoreEvent;
export const saveSupabaseEvent = saveFirestoreEvent;
export const createSupabaseCollection = createFirestoreCollection;
export const listSupabaseSuggestions = listFirestoreSuggestions;
export const updateSupabaseSuggestionStatus = updateFirestoreSuggestionStatus;
export const acceptSupabaseSuggestion = acceptFirestoreSuggestion;
