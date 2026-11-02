import { createHash } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Timestamp } from "firebase-admin/firestore";

const viewer = vi.hoisted(() => ({ uid: "otaku-alice" }));
vi.mock("@/lib/firebase/session", () => ({
  getSessionUser: async () => ({ uid: viewer.uid, email: "local@example.test", name: "Viewer" }),
  SESSION_COOKIE_NAME: "otakuhub_session",
}));

import { getAdminDb } from "@/lib/firebase/admin";
import {
  acceptFirestoreSuggestion,
  createFirestoreCollection,
  createFirestoreEvent,
  createFirestoreFranchise,
  saveFirestoreEvent,
} from "@/lib/repositories/mutations";
import {
  getCrawledPostId,
  persistFirestoreCrawlSuggestion,
} from "@/lib/repositories/crawler";
import { POST as activityPOST } from "@/app/api/integrations/agent/activity/route";
import { POST as spendingPOST } from "@/app/api/integrations/agent/spending-alert/route";
import { GET as configGET } from "@/app/api/integrations/agent/config/route";
import { GET as eventsGET } from "@/app/api/integrations/agent/events/route";

function sha256(str: string) {
  return createHash("sha256").update(str).digest("hex");
}

beforeAll(() => {
  if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error("Both emulators are required; real services are prohibited.");
  }
  process.env.FIREBASE_PROJECT_ID = "demo-otakus";
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "demo-otakus";
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "emulator-only";
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "demo-otakus.firebaseapp.com";
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID = "emulator-only";
});

beforeEach(async () => {
  viewer.uid = `user-${crypto.randomUUID()}`;
  const db = getAdminDb();
  await db.doc("franchises/blue-archive").set({
    name: "블루 아카이브",
    slug: "blue-archive",
    category: "game",
    color_code: "#38bdf8",
    icon_url: null,
    aliases: [],
    schema_version: 1,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });
});

describe("OtakuHub Firestore data layer and transactions", () => {
  it("creates franchises and events isolated to verified session", async () => {
    const franchise = await createFirestoreFranchise({
      name: "원신",
      category: "game",
      colorCode: "#123456",
    });
    expect(franchise.slug).toBe("원신");
    const doc = await getAdminDb().doc("franchises/원신").get();
    expect(doc.exists).toBe(true);
    expect(doc.get("color_code")).toBe("#123456");

    const event = await createFirestoreEvent({
      franchiseId: "blue-archive",
      type: "cafe",
      title: "콜라보 카페 1차",
      startDate: "2026-06-01",
      saved: true,
    });
    expect(event.isVerified).toBe(true);

    const userEvent = await getAdminDb().doc(`users/${viewer.uid}/hub/main/userEvents/${event.id}`).get();
    expect(userEvent.exists).toBe(true);
    expect(userEvent.get("remind_days")).toEqual([3, 7]);

    const saved = await saveFirestoreEvent(event.id);
    expect(saved?.saved).toBe(true);

    const collection = await createFirestoreCollection({
      franchiseId: "blue-archive",
      itemName: "피규어",
      price: 35000,
      isWishlist: false,
    });
    expect(collection.itemName).toBe("피규어");
    const colDoc = await getAdminDb().doc(`users/${viewer.uid}/hub/main/collections/${collection.id}`).get();
    expect(colDoc.exists).toBe(true);
  });

  it("performs atomic suggestion approval with deterministic event ID and post update", async () => {
    const db = getAdminDb();
    const suggestionId = `sug-${crypto.randomUUID()}`;
    const originalUrl = "https://example.com/events/123";
    const postId = sha256(originalUrl);
    const now = Timestamp.now();

    await db.doc(`modules/hub/crawledPosts/${postId}`).set({
      franchise_id: "blue-archive",
      crawl_source_id: "src-1",
      source: "dc",
      title: "신규 굿즈 예약",
      content: "6월 10일 온라인 예약 개시",
      original_url: originalUrl,
      content_hash: "hash-123",
      crawled_at: now,
      schema_version: 1,
      created_at: now,
      updated_at: now,
    });

    await db.doc(`modules/hub/eventSuggestions/${suggestionId}`).set({
      crawled_post_id: postId,
      content_hash: "hash-123",
      franchise_id: "blue-archive",
      title: "신규 굿즈 예약",
      event_type: "preorder",
      start_date: "2026-06-10",
      end_date: "2026-06-20",
      location: "온라인",
      source_url: originalUrl,
      confidence: 0.95,
      warnings: [],
      status: "pending",
      schema_version: 1,
      created_at: now,
      updated_at: now,
    });

    const result = await acceptFirestoreSuggestion(suggestionId);
    expect(result).not.toBeNull();
    const expectedEventId = `suggestion-${suggestionId}`;
    expect(result?.event.id).toBe(expectedEventId);
    expect(result?.suggestion.status).toBe("accepted");

    const eventDoc = await db.doc(`events/${expectedEventId}`).get();
    expect(eventDoc.exists).toBe(true);
    expect(eventDoc.get("is_verified")).toBe(true);
    expect(eventDoc.get("reviewed_by")).toBe(viewer.uid);

    const postDoc = await db.doc(`modules/hub/crawledPosts/${postId}`).get();
    expect(postDoc.get("event_id")).toBe(expectedEventId);

    const userEventDoc = await db.doc(`users/${viewer.uid}/hub/main/userEvents/${expectedEventId}`).get();
    expect(userEventDoc.exists).toBe(true);

    const remindersSnap = await db.collection(`users/${viewer.uid}/hub/main/reminders`).where("event_id", "==", expectedEventId).get();
    expect(remindersSnap.size).toBe(2);

    const repeated = await acceptFirestoreSuggestion(suggestionId);
    expect(repeated?.event.id).toBe(expectedEventId);
  });

  it("deduplicates crawled posts using deterministic sha256(original_url)", async () => {
    const post = {
      source: "official" as const,
      title: "원신 팝업스토어",
      content: "홍대 팝업스토어 오픈",
      originalUrl: "https://example.com/genshin/popup",
      crawledAt: new Date().toISOString(),
    };
    const source = {
      id: "src-official",
      sourceType: "official" as const,
      name: "Official",
      url: "https://example.com/genshin",
      keywords: ["팝업"],
      isActive: true,
      franchiseId: "blue-archive",
    };
    const extracted = {
      title: "원신 팝업스토어",
      eventType: "popup" as const,
      startDate: "2026-07-01",
      location: "홍대",
      sourceUrl: "https://example.com/genshin/popup",
      confidence: 0.9,
      warnings: [],
    };

    const first = await persistFirestoreCrawlSuggestion({ post, source, extracted });
    const second = await persistFirestoreCrawlSuggestion({ post, source, extracted });

    const expectedPostId = getCrawledPostId(post.originalUrl);
    expect(expectedPostId).toBe(sha256(post.originalUrl));

    const postDoc = await getAdminDb().doc(`modules/hub/crawledPosts/${expectedPostId}`).get();
    expect(postDoc.exists).toBe(true);
    expect(first.id).toBe(second.id);
  });

  it("enforces per-user agent tokens and rejects missing or invalid tokens", async () => {
    const db = getAdminDb();
    const rawToken = `secret-token-${crypto.randomUUID()}`;
    const tokenHash = sha256(rawToken);

    await db.doc(`users/${viewer.uid}`).set({
      agentTokenHash: tokenHash,
      profile: {
        user_id: viewer.uid,
        display_name: "Agent User",
        timezone: "Asia/Seoul",
        reset_day: 1,
        reset_hour: 4,
        reminders: { weekly: true, events: true, daily: true },
      },
    }, { merge: true });

    const missingTokenReq = new Request("http://localhost/api/integrations/agent/config");
    expect((await configGET(missingTokenReq)).status).toBe(401);

    const badTokenReq = new Request("http://localhost/api/integrations/agent/config", {
      headers: { authorization: "Bearer wrong-token" },
    });
    expect((await configGET(badTokenReq)).status).toBe(401);

    const validReq = new Request("http://localhost/api/integrations/agent/config", {
      headers: { authorization: `Bearer ${rawToken}` },
    });
    const validRes = await configGET(validReq);
    expect(validRes.status).toBe(200);

    const eventsReq = new Request("http://localhost/api/integrations/agent/events", {
      headers: { "x-otakus-agent-token": rawToken },
    });
    expect((await eventsGET(eventsReq)).status).toBe(200);
  });

  it("persists agent signals and spending alerts to users/{uid}/agentSignals", async () => {
    const db = getAdminDb();
    const rawToken = `token-${crypto.randomUUID()}`;
    await db.doc(`users/${viewer.uid}`).set({
      agentTokenHash: sha256(rawToken),
    }, { merge: true });

    const activityReq = new Request("http://localhost/api/integrations/agent/activity", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${rawToken}`,
      },
      body: JSON.stringify({
        appId: "sipsungjang",
        signal: "game_started",
        game: {
          franchiseId: "blue-archive",
          name: "블루 아카이브",
        },
      }),
    });
    const actRes = await activityPOST(activityReq);
    expect(actRes.status).toBe(202);

    const spendingReq = new Request("http://localhost/api/integrations/agent/spending-alert", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${rawToken}`,
      },
      body: JSON.stringify({
        appId: "gachaguard",
        franchiseSlug: "blue-archive",
        trigger: "budget_exceeded",
        budgetLimit: 50000,
        projectedSpend: 80000,
        currency: "KRW",
      }),
    });
    const spendRes = await spendingPOST(spendingReq);
    expect(spendRes.status).toBe(202);

    const signalsSnap = await db.collection(`users/${viewer.uid}/agentSignals`).get();
    expect(signalsSnap.size).toBe(2);

    const kinds = signalsSnap.docs.map((d) => d.get("kind"));
    expect(kinds).toContain("game_started");
    expect(kinds).toContain("spending_alert");
  });
});
