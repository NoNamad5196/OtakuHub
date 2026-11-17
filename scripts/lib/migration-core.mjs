import { getIdentityMappingId, getReminderId, normalizeUidMapping, sha256 } from "./identity.mjs";
import { toTimestampObj } from "./dates.mjs";

export const SCHEMA_VERSION = 1;
export { sha256, getIdentityMappingId, getReminderId, normalizeUidMapping };

export function transformSupabaseData(sourceData, options = {}) {
  const {
    uidMapping: rawUidMapping,
    now = new Date(),
  } = options;

  const uidMap = rawUidMapping instanceof Map
    ? rawUidMapping
    : normalizeUidMapping(rawUidMapping);

  const errors = [];
  const warnings = [];
  const operations = [];

  const profiles = sourceData.profiles || [];
  const franchises = sourceData.franchises || [];
  const userFranchises = sourceData.user_franchises || [];
  const events = sourceData.events || [];
  const userEvents = sourceData.user_events || [];
  const collections = sourceData.collections || [];
  const crawlSources = sourceData.crawl_sources || [];
  const crawledPosts = sourceData.crawled_posts || [];
  const eventSuggestions = sourceData.event_suggestions || [];
  const reminders = sourceData.reminders || [];
  const crawlRuns = sourceData.crawl_runs || [];

  const franchiseSlugMap = new Map();

  function addOp(path, data, entity, opType = "set") {
    operations.push({ path, data, entity, op: opType });
  }

  function resolveUser(supabaseUserId, context) {
    if (!supabaseUserId) return null;
    const mapped = uidMap.get(String(supabaseUserId));
    if (!mapped) {
      warnings.push(`Unmapped user '${supabaseUserId}' in ${context}. Item skipped.`);
      return null;
    }
    return mapped.uid;
  }

  for (const prof of profiles) {
    const sourceId = prof.id || prof.user_id;
    const uid = resolveUser(sourceId, "profiles");
    if (!uid) continue;

    const mappingId = getIdentityMappingId("otakuhub", "account", sourceId, uid);
    addOp(`identityMappings/${mappingId}`, {
      source: "otakuhub",
      entity: "account",
      source_id: String(sourceId),
      target_id: uid,
      uid,
      verified_at: toTimestampObj(now),
    }, "identityMapping");

    addOp(`users/${uid}`, {
      profile: {
        user_id: uid,
        display_name: prof.display_name || "Otaku",
        timezone: "Asia/Seoul",
        reset_day: prof.reset_day ?? 1,
        reset_hour: prof.reset_hour ?? 4,
        reminders: prof.reminders || { weekly: true, events: true, daily: true },
      },
      account: {
        email: null,
        avatar_url: null,
        providers: ["google.com"],
        created_at: toTimestampObj(prof.created_at || now),
        updated_at: toTimestampObj(prof.updated_at || now),
      },
    }, "userProfile");
  }

  for (const fr of franchises) {
    const slug = fr.slug || fr.id;
    franchiseSlugMap.set(fr.id, slug);

    const mappingId = getIdentityMappingId("otakuhub", "franchise", fr.id, null);
    addOp(`identityMappings/${mappingId}`, {
      source: "otakuhub",
      entity: "franchise",
      source_id: String(fr.id),
      target_id: slug,
      uid: null,
      verified_at: toTimestampObj(now),
    }, "identityMapping");

    addOp(`franchises/${slug}`, {
      name: fr.name,
      slug,
      category: fr.category || "other",
      color_code: fr.color_code || "#38bdf8",
      icon_url: fr.icon_url || null,
      aliases: Array.isArray(fr.aliases) ? fr.aliases : [],
      schema_version: SCHEMA_VERSION,
      created_at: toTimestampObj(fr.created_at || now),
      updated_at: toTimestampObj(fr.updated_at || now),
    }, "franchise");
  }

  for (const uf of userFranchises) {
    const uid = resolveUser(uf.user_id, "user_franchises");
    if (!uid) continue;
    const franchiseId = franchiseSlugMap.get(uf.franchise_id) || uf.franchise_id;
    addOp(`users/${uid}/userFranchises/${franchiseId}`, {
      franchise_id: franchiseId,
      priority: uf.priority || 1,
      nickname: uf.nickname || null,
    }, "userFranchise");
  }

  for (const ev of events) {
    const franchiseId = franchiseSlugMap.get(ev.franchise_id) || ev.franchise_id;
    addOp(`events/${ev.id}`, {
      franchise_id: franchiseId,
      game_id: ev.game_id || null,
      type: ev.type || "other",
      title: ev.title,
      start_date: ev.start_date,
      end_date: ev.end_date || null,
      timezone: "Asia/Seoul",
      location: ev.location || null,
      source_url: ev.source_url || null,
      status: ev.status || "published",
      is_verified: true,
      reviewed_by: ev.reviewed_by ? (uidMap.get(ev.reviewed_by)?.uid || ev.reviewed_by) : null,
      reviewed_at: toTimestampObj(ev.reviewed_at || ev.created_at || now),
      moderation_reason: ev.moderation_reason || "migrated",
      suggestion_id: ev.suggestion_id || null,
      crawled_post_id: ev.crawled_post_id || null,
      schema_version: SCHEMA_VERSION,
      created_at: toTimestampObj(ev.created_at || now),
      updated_at: toTimestampObj(ev.updated_at || now),
    }, "event");
  }

  for (const ue of userEvents) {
    const uid = resolveUser(ue.user_id, "user_events");
    if (!uid) continue;
    addOp(`users/${uid}/hub/main/userEvents/${ue.event_id}`, {
      event_id: ue.event_id,
      remind_days: Array.isArray(ue.remind_days) ? ue.remind_days : [3, 7],
      is_attending: Boolean(ue.is_attending),
      memo: ue.memo || null,
      schema_version: SCHEMA_VERSION,
      created_at: toTimestampObj(ue.created_at || now),
      updated_at: toTimestampObj(ue.updated_at || now),
    }, "userEvent");
  }

  for (const col of collections) {
    const uid = resolveUser(col.user_id, "collections");
    if (!uid) continue;
    const franchiseId = col.franchise_id ? (franchiseSlugMap.get(col.franchise_id) || col.franchise_id) : null;
    addOp(`users/${uid}/hub/main/collections/${col.id}`, {
      event_id: col.event_id || null,
      franchise_id: franchiseId,
      game_id: col.game_id || null,
      item_name: col.item_name,
      price: col.price || 0,
      currency: col.currency || "KRW",
      is_wishlist: Boolean(col.is_wishlist),
      bought_at: col.bought_at ? toTimestampObj(col.bought_at) : null,
      image_url: col.image_url || null,
      memo: col.memo || null,
      schema_version: SCHEMA_VERSION,
      created_at: toTimestampObj(col.created_at || now),
      updated_at: toTimestampObj(col.updated_at || now),
    }, "collection");
  }

  for (const src of crawlSources) {
    const franchiseId = src.franchise_id ? (franchiseSlugMap.get(src.franchise_id) || src.franchise_id) : null;
    addOp(`modules/hub/crawlSources/${src.id}`, {
      franchise_id: franchiseId,
      game_id: src.game_id || null,
      source_type: src.source_type,
      name: src.name,
      url: src.url,
      keywords: Array.isArray(src.keywords) ? src.keywords : [],
      is_active: src.is_active !== false,
      last_crawled_at: src.last_crawled_at ? toTimestampObj(src.last_crawled_at) : null,
      last_error: src.last_error || null,
      created_by: src.created_by || null,
      schema_version: SCHEMA_VERSION,
      created_at: toTimestampObj(src.created_at || now),
      updated_at: toTimestampObj(src.updated_at || now),
    }, "crawlSource");
  }

  for (const post of crawledPosts) {
    const postId = sha256(post.original_url.trim());
    const franchiseId = post.franchise_id ? (franchiseSlugMap.get(post.franchise_id) || post.franchise_id) : null;
    addOp(`modules/hub/crawledPosts/${postId}`, {
      franchise_id: franchiseId,
      crawl_source_id: post.crawl_source_id || null,
      source: post.source || "official",
      title: post.title,
      content: post.content,
      original_url: post.original_url,
      content_hash: post.content_hash || sha256(`${post.title}\n${post.content}`),
      event_id: post.event_id || null,
      crawled_at: toTimestampObj(post.crawled_at || post.created_at || now),
      schema_version: SCHEMA_VERSION,
      created_at: toTimestampObj(post.created_at || now),
      updated_at: toTimestampObj(post.updated_at || now),
    }, "crawledPost");
  }

  for (const sug of eventSuggestions) {
    const franchiseId = sug.franchise_id ? (franchiseSlugMap.get(sug.franchise_id) || sug.franchise_id) : null;
    addOp(`modules/hub/eventSuggestions/${sug.id}`, {
      crawled_post_id: sug.crawled_post_id || null,
      content_hash: sug.content_hash || null,
      franchise_id: franchiseId,
      game_id: sug.game_id || null,
      title: sug.title,
      event_type: sug.event_type || "other",
      start_date: sug.start_date,
      end_date: sug.end_date || null,
      location: sug.location || null,
      source_url: sug.source_url || "",
      confidence: Number(sug.confidence || 0),
      warnings: Array.isArray(sug.warnings) ? sug.warnings : [],
      status: sug.status || "pending",
      raw_ai: sug.raw_ai || null,
      reviewed_by: sug.reviewed_by ? (uidMap.get(sug.reviewed_by)?.uid || sug.reviewed_by) : null,
      reviewed_at: sug.reviewed_at ? toTimestampObj(sug.reviewed_at) : null,
      moderation_reason: sug.moderation_reason || null,
      event_id: sug.event_id || null,
      schema_version: SCHEMA_VERSION,
      created_at: toTimestampObj(sug.created_at || now),
      updated_at: toTimestampObj(sug.updated_at || now),
    }, "eventSuggestion");
  }

  for (const rem of reminders) {
    const uid = resolveUser(rem.user_id, "reminders");
    if (!uid) continue;
    const reminderId = getReminderId(rem.event_id, rem.remind_at);
    addOp(`users/${uid}/hub/main/reminders/${reminderId}`, {
      event_id: rem.event_id,
      remind_at: toTimestampObj(rem.remind_at),
      status: rem.status || "pending",
      schema_version: SCHEMA_VERSION,
      created_at: toTimestampObj(rem.created_at || now),
      updated_at: toTimestampObj(rem.updated_at || now),
    }, "reminder");
  }

  for (const run of crawlRuns) {
    addOp(`modules/hub/crawlRuns/${run.id}`, {
      source_id: run.source_id || null,
      status: run.status || "success",
      posts_found: run.posts_found || 0,
      suggestions_created: run.suggestions_created || 0,
      error: run.error || null,
      started_at: toTimestampObj(run.started_at || now),
      finished_at: toTimestampObj(run.finished_at || now),
      schema_version: SCHEMA_VERSION,
      created_at: toTimestampObj(run.created_at || now),
      updated_at: toTimestampObj(run.updated_at || now),
    }, "crawlRun");
  }

  const stats = {
    profiles: profiles.length,
    franchises: franchises.length,
    userFranchises: userFranchises.length,
    events: events.length,
    userEvents: userEvents.length,
    collections: collections.length,
    crawlSources: crawlSources.length,
    crawledPosts: crawledPosts.length,
    eventSuggestions: eventSuggestions.length,
    reminders: reminders.length,
    crawlRuns: crawlRuns.length,
    totalOperations: operations.length,
  };

  return { errors, warnings, operations, stats };
}
