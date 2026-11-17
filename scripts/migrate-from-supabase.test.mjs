import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  getIdentityMappingId,
  getReminderId,
  normalizeUidMapping,
  sha256,
  transformSupabaseData,
} from "./lib/migration-core.mjs";
import { parseArgs } from "./lib/cli-args.mjs";
import { preflightOperations } from "./lib/target-preflight.mjs";
import { applyBatches } from "./lib/apply-runner.mjs";
import { runMigration } from "./migrate-from-supabase.mjs";
import { createMockFirestore } from "./lib/test-mock-firestore.mjs";

test("UID mapping parsing and validation", () => {
  const validMap = normalizeUidMapping({
    "supa-user-1": "fire-uid-1",
    "supa-user-2": { uid: "fire-uid-2" },
  });
  assert.equal(validMap.get("supa-user-1")?.uid, "fire-uid-1");
  assert.equal(validMap.get("supa-user-2")?.uid, "fire-uid-2");

  assert.throws(() => normalizeUidMapping(null));
  assert.throws(() => normalizeUidMapping({}));
});

test("deterministic IDs for crawled posts, reminders, and identity mappings", () => {
  const url = "https://example.com/post/123";
  const expectedPostId = sha256(url);
  assert.equal(expectedPostId.length, 64);

  const reminderId1 = getReminderId("event-1", "2026-05-12T09:00:00.000Z");
  const reminderId2 = getReminderId("event-1", "2026-05-12T09:00:00.000Z");
  assert.equal(reminderId1, reminderId2);
  assert.equal(reminderId1.length, 64);

  const idMapId = getIdentityMappingId("otakuhub", "account", "supa-1", "fire-1");
  assert.equal(idMapId.length, 64);
});

test("transformSupabaseData transforms all OtakuHub entities per contract", () => {
  const sourceData = {
    profiles: [
      {
        id: "user-1",
        display_name: "OtakuTester",
        created_at: "2026-05-08T00:00:00.000Z",
      },
    ],
    franchises: [
      {
        id: "fr-1",
        name: "블루 아카이브",
        slug: "blue-archive",
        category: "game",
        color_code: "#38bdf8",
      },
    ],
    user_franchises: [
      {
        user_id: "user-1",
        franchise_id: "fr-1",
        priority: 1,
      },
    ],
    events: [
      {
        id: "ev-1",
        franchise_id: "fr-1",
        type: "cafe",
        title: "콜라보 카페",
        start_date: "2026-05-12",
        end_date: null,
      },
    ],
    user_events: [
      {
        user_id: "user-1",
        event_id: "ev-1",
        remind_days: [3, 7],
      },
    ],
    collections: [
      {
        id: "col-1",
        user_id: "user-1",
        item_name: "아크릴 스탠드",
        price: 15000,
        is_wishlist: false,
      },
    ],
    crawl_sources: [
      {
        id: "src-1",
        source_type: "dc",
        name: "DC",
        url: "https://example.com/dc",
        keywords: ["굿즈"],
      },
    ],
    crawled_posts: [
      {
        id: "post-1",
        source: "dc",
        title: "신규 굿즈 예약",
        content: "5월 12일 예약 개시",
        original_url: "https://example.com/dc/1",
      },
    ],
    event_suggestions: [
      {
        id: "sg-1",
        crawled_post_id: sha256("https://example.com/dc/1"),
        title: "신규 굿즈 예약",
        event_type: "preorder",
        start_date: "2026-05-12",
        source_url: "https://example.com/dc/1",
        confidence: 0.9,
      },
    ],
    reminders: [
      {
        id: "rem-1",
        user_id: "user-1",
        event_id: "ev-1",
        remind_at: "2026-05-09T09:00:00.000Z",
        status: "pending",
      },
    ],
    crawl_runs: [
      {
        id: "run-1",
        source_id: "src-1",
        status: "success",
        posts_found: 1,
        suggestions_created: 1,
        started_at: "2026-05-09T00:00:00.000Z",
        finished_at: "2026-05-09T00:00:05.000Z",
      },
    ],
  };

  const uidMapping = new Map([
    ["user-1", { uid: "firebase-uid-1", verified_at: new Date().toISOString() }],
  ]);

  const result = transformSupabaseData(sourceData, { uidMapping });
  assert.equal(result.errors.length, 0);
  assert.equal(result.stats.profiles, 1);
  assert.equal(result.stats.franchises, 1);
  assert.equal(result.stats.events, 1);
  assert.equal(result.stats.userEvents, 1);
  assert.equal(result.stats.collections, 1);
  assert.equal(result.stats.crawledPosts, 1);

  const paths = result.operations.map((op) => op.path);
  assert.ok(paths.includes("users/firebase-uid-1"));
  assert.ok(paths.includes("franchises/blue-archive"));
  assert.ok(paths.includes("users/firebase-uid-1/userFranchises/blue-archive"));
  assert.ok(paths.includes("events/ev-1"));
  assert.ok(paths.includes("users/firebase-uid-1/hub/main/userEvents/ev-1"));
  assert.ok(paths.includes("users/firebase-uid-1/hub/main/collections/col-1"));
  assert.ok(paths.includes(`modules/hub/crawledPosts/${sha256("https://example.com/dc/1")}`));
});

test("runMigration in dry-run mode validates data without writes", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "otakuhub-mig-test-"));
  const mappingPath = path.join(tmpDir, "mapping.json");
  const inputPath = path.join(tmpDir, "input.json");

  fs.writeFileSync(mappingPath, JSON.stringify({ "supa-1": "fire-1" }));
  fs.writeFileSync(
    inputPath,
    JSON.stringify({
      profiles: [{ id: "supa-1", display_name: "Test User" }],
      franchises: [{ id: "fr-1", name: "Game 1", slug: "game-1" }],
    }),
  );

  const options = parseArgs([
    "--uid-mapping",
    mappingPath,
    "--input-json",
    inputPath,
  ]);

  assert.equal(options.dryRun, true);
  assert.equal(options.apply, false);

  const result = await runMigration(options);
  assert.equal(result.success, true);
  assert.equal(result.mode, "dry-run");
  assert.ok(result.operationsCount > 0);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("preflightOperations and applyBatches with mock Firestore", async () => {
  const mockDb = createMockFirestore();
  const operations = [
    {
      path: "franchises/test-game",
      entity: "franchise",
      data: { name: "Test Game", slug: "test-game", category: "game" },
    },
    {
      path: "events/ev-test",
      entity: "event",
      data: { title: "Test Event", start_date: "2026-05-15" },
    },
  ];

  const plan = await preflightOperations(mockDb, operations);
  assert.equal(plan.length, 2);
  assert.equal(plan[0].action, "create");
  assert.equal(plan[1].action, "create");

  const applyResult = await applyBatches(mockDb, plan, null);
  assert.equal(applyResult.totalCommitted, 2);

  const secondPlan = await preflightOperations(mockDb, operations);
  assert.equal(secondPlan[0].action, "skip");
  assert.equal(secondPlan[1].action, "skip");
});
