import { NextResponse } from "next/server";
import { runCrawlPipeline } from "@/lib/crawlers";
import { hasSupabaseServiceEnv } from "@/lib/supabase/env";

function authorize(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!hasSupabaseServiceEnv() && (!secret || secret === "change-me-before-deploy")) return true;
  if (!secret || secret === "change-me-before-deploy") return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runCrawlPipeline();
  return NextResponse.json({
    data: result,
    warning:
      !process.env.CRON_SECRET || process.env.CRON_SECRET === "change-me-before-deploy"
        ? "CRON_SECRET is not hardened; set it before deployment."
        : null,
  });
}
