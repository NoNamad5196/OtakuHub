import dayjs from "dayjs";
import { AuthenticationRequiredError, getAuthenticatedUser, requireUser } from "@/lib/repositories/auth";
import {
  mapCollectionRow,
  mapEventRow,
  mapFranchiseRow,
  mapSuggestionRow,
  slugifyName,
} from "@/lib/repositories/mappers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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

async function getClientAndUser() {
  const supabase = await createServerSupabaseClient();
  const user = requireUser(await getAuthenticatedUser(supabase));
  if (!supabase) throw new AuthenticationRequiredError();
  return { supabase, user };
}

async function createReminders(userId: string, eventId: string, startDate: string, remindDays: number[]) {
  const supabase = await createServerSupabaseClient();
  if (!supabase || remindDays.length === 0) return;
  await supabase.from("reminders").insert(
    remindDays.map((days) => ({
      user_id: userId,
      event_id: eventId,
      remind_at: addDaysIso(startDate, days),
      status: "pending" as const,
    })),
  );
}

export async function createSupabaseFranchise(input: CreateFranchiseInput): Promise<Franchise> {
  const { supabase, user } = await getClientAndUser();
  const { data, error } = await supabase
    .from("franchises")
    .insert({
      name: input.name,
      slug: slugifyName(input.name),
      category: input.category,
      color_code: input.colorCode,
      created_by: user.id,
      is_public: true,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapFranchiseRow(data);
}

export async function createSupabaseEvent(input: CreateEventInput): Promise<OtakuEvent> {
  const { supabase, user } = await getClientAndUser();
  const { data, error } = await supabase
    .from("events")
    .insert({
      franchise_id: input.franchiseId,
      type: input.type,
      title: input.title,
      start_date: input.startDate,
      end_date: input.endDate ?? null,
      location: input.location ?? null,
      source_url: input.sourceUrl ?? null,
      is_verified: true,
      created_by: user.id,
    })
    .select("*")
    .single();
  if (error) throw error;

  if (input.saved ?? true) {
    await supabase.from("user_events").upsert(
      {
        user_id: user.id,
        event_id: data.id,
        remind_days: input.remindDays ?? [3, 7],
        memo: input.memo ?? null,
      },
      { onConflict: "user_id,event_id" },
    );
    await createReminders(user.id, data.id, data.start_date, input.remindDays ?? [3, 7]);
  }

  return mapEventRow(data, {
    id: crypto.randomUUID(),
    user_id: user.id,
    event_id: data.id,
    remind_days: input.remindDays ?? [3, 7],
    is_attending: false,
    memo: input.memo ?? null,
    created_at: new Date().toISOString(),
  });
}

export async function saveSupabaseEvent(eventId: string): Promise<OtakuEvent | null> {
  const { supabase, user } = await getClientAndUser();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();
  if (eventError || !event) return null;

  const remindDays = [3, 7];
  const { data: userEvent, error } = await supabase
    .from("user_events")
    .upsert(
      {
        user_id: user.id,
        event_id: event.id,
        remind_days: remindDays,
      },
      { onConflict: "user_id,event_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  await createReminders(user.id, event.id, event.start_date, remindDays);
  return mapEventRow(event, userEvent);
}

export async function createSupabaseCollection(
  input: CreateCollectionInput,
): Promise<CollectionItem> {
  const { supabase, user } = await getClientAndUser();
  const { data, error } = await supabase
    .from("collections")
    .insert({
      user_id: user.id,
      event_id: input.eventId ?? null,
      franchise_id: input.franchiseId ?? null,
      item_name: input.itemName,
      price: input.price,
      is_wishlist: input.isWishlist,
      bought_at: input.boughtAt ?? null,
      memo: input.memo ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapCollectionRow(data);
}

export async function listSupabaseSuggestions(status?: EventSuggestion["status"]) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  let query = supabase.from("event_suggestions").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapSuggestionRow);
}

export async function updateSupabaseSuggestionStatus(
  id: string,
  status: EventSuggestion["status"],
): Promise<EventSuggestion | null> {
  const { supabase, user } = await getClientAndUser();
  const { data, error } = await supabase
    .from("event_suggestions")
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) return null;
  return mapSuggestionRow(data);
}

export async function acceptSupabaseSuggestion(id: string) {
  const { supabase, user } = await getClientAndUser();
  const { data: suggestion, error: suggestionError } = await supabase
    .from("event_suggestions")
    .select("*")
    .eq("id", id)
    .single();
  if (suggestionError || !suggestion) return null;
  if (!suggestion.franchise_id) {
    throw new Error("Suggestion is missing a franchise_id and cannot be accepted.");
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      franchise_id: suggestion.franchise_id,
      type: suggestion.event_type,
      title: suggestion.title,
      start_date: suggestion.start_date,
      end_date: suggestion.end_date,
      location: suggestion.location,
      source_url: suggestion.source_url,
      is_verified: true,
      created_by: user.id,
    })
    .select("*")
    .single();
  if (eventError) throw eventError;

  const remindDays = [3, 7];
  const { data: userEvent, error: userEventError } = await supabase
    .from("user_events")
    .upsert(
      {
        user_id: user.id,
        event_id: event.id,
        remind_days: remindDays,
      },
      { onConflict: "user_id,event_id" },
    )
    .select("*")
    .single();
  if (userEventError) throw userEventError;

  await createReminders(user.id, event.id, event.start_date, remindDays);

  const { data: updatedSuggestion, error: updateError } = await supabase
    .from("event_suggestions")
    .update({
      status: "accepted",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", suggestion.id)
    .select("*")
    .single();
  if (updateError) throw updateError;

  return {
    suggestion: mapSuggestionRow(updatedSuggestion),
    event: mapEventRow(event, userEvent),
  };
}
