import fs from "node:fs";
import path from "node:path";

export const TABLE_NAMES = [
  "profiles",
  "franchises",
  "user_franchises",
  "events",
  "user_events",
  "collections",
  "crawl_sources",
  "crawled_posts",
  "event_suggestions",
  "reminders",
  "crawl_runs",
];

export async function loadFromDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    throw new Error("Input directory not found: " + dirPath);
  }
  const data = {};
  for (const table of TABLE_NAMES) {
    const jsonPath = path.join(dirPath, table + ".json");
    if (fs.existsSync(jsonPath)) {
      try {
        const raw = fs.readFileSync(jsonPath, "utf8");
        data[table] = JSON.parse(raw);
      } catch (err) {
        throw new Error("Failed to parse JSON file " + jsonPath + ": " + err.message);
      }
    } else {
      data[table] = [];
    }
  }
  return data;
}

export async function loadSourceData(options) {
  if (options.inputJson) {
    if (!fs.existsSync(options.inputJson)) {
      throw new Error("Input JSON file not found: " + options.inputJson);
    }
    try {
      const raw = fs.readFileSync(options.inputJson, "utf8");
      return JSON.parse(raw);
    } catch (err) {
      throw new Error("Failed to parse input JSON: " + err.message);
    }
  }
  if (options.inputDir) {
    return loadFromDirectory(options.inputDir);
  }
  if (options.sourceSupabase) {
    throw new Error("Direct Supabase REST connection is not configured in this environment.");
  }
  throw new Error("No input source specified. Provide --input-json, --input-dir or --source-supabase.");
}
