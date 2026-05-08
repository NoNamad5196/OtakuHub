import {
  demoCollections,
  demoCrawlRuns,
  demoEvents,
  demoFranchises,
  demoReminders,
  demoSources,
  demoSuggestions,
} from "@/lib/demo-data";
import type {
  CollectionItem,
  CrawlRun,
  DashboardData,
  EventSuggestion,
  Franchise,
  OtakuEvent,
} from "@/lib/types";

const store = {
  franchises: structuredClone(demoFranchises),
  events: structuredClone(demoEvents),
  collections: structuredClone(demoCollections),
  sources: structuredClone(demoSources),
  suggestions: structuredClone(demoSuggestions),
  reminders: structuredClone(demoReminders),
  crawlRuns: structuredClone(demoCrawlRuns),
};

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function getDemoDashboardData(): DashboardData {
  return structuredClone(store);
}

export function listFranchises() {
  return structuredClone(store.franchises);
}

export function createFranchise(input: Pick<Franchise, "name" | "category" | "colorCode">) {
  const franchise: Franchise = {
    id: id("fr"),
    name: input.name,
    slug: input.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-|-$/g, ""),
    category: input.category,
    colorCode: input.colorCode,
    priority: 3,
  };
  store.franchises.unshift(franchise);
  return structuredClone(franchise);
}

export function listEvents() {
  return structuredClone(store.events);
}

export function createEvent(input: Omit<OtakuEvent, "id" | "createdAt" | "isVerified">) {
  const event: OtakuEvent = {
    ...input,
    id: id("ev"),
    isVerified: true,
    createdAt: new Date().toISOString(),
  };
  store.events.unshift(event);
  return structuredClone(event);
}

export function saveEvent(eventId: string) {
  const event = store.events.find((item) => item.id === eventId);
  if (!event) return null;
  event.saved = true;
  event.remindDays = event.remindDays ?? [3, 7];
  return structuredClone(event);
}

export function listCollections() {
  return structuredClone(store.collections);
}

export function createCollection(input: Omit<CollectionItem, "id">) {
  const item: CollectionItem = {
    ...input,
    id: id("col"),
  };
  store.collections.unshift(item);
  return structuredClone(item);
}

export function listSuggestions(status?: EventSuggestion["status"]) {
  const suggestions = status
    ? store.suggestions.filter((suggestion) => suggestion.status === status)
    : store.suggestions;
  return structuredClone(suggestions);
}

export function updateSuggestionStatus(idToUpdate: string, status: EventSuggestion["status"]) {
  const suggestion = store.suggestions.find((item) => item.id === idToUpdate);
  if (!suggestion) return null;
  suggestion.status = status;
  return structuredClone(suggestion);
}

export function acceptSuggestion(idToAccept: string) {
  const suggestion = store.suggestions.find((item) => item.id === idToAccept);
  if (!suggestion) return null;
  suggestion.status = "accepted";
  const event = createEvent({
    franchiseId: suggestion.franchiseId ?? store.franchises[0]?.id ?? "unknown",
    type: suggestion.eventType,
    title: suggestion.title,
    startDate: suggestion.startDate,
    endDate: suggestion.endDate,
    location: suggestion.location,
    sourceUrl: suggestion.sourceUrl,
    saved: true,
    remindDays: [3, 7],
  });
  return { suggestion: structuredClone(suggestion), event };
}

export function ignoreSuggestion(idToIgnore: string) {
  return updateSuggestionStatus(idToIgnore, "ignored");
}

export function appendSuggestion(suggestion: Omit<EventSuggestion, "id" | "createdAt" | "status">) {
  const created: EventSuggestion = {
    ...suggestion,
    id: id("sg"),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  store.suggestions.unshift(created);
  return structuredClone(created);
}

export function appendCrawlRun(run: Omit<CrawlRun, "id">) {
  const created: CrawlRun = {
    ...run,
    id: id("run"),
  };
  store.crawlRuns.unshift(created);
  return structuredClone(created);
}
