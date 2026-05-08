import { NextResponse } from "next/server";
import { saveEvent } from "@/lib/mock-store";
import { apiError } from "@/lib/api/errors";
import { saveSupabaseEvent } from "@/lib/repositories/mutations";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const event = hasSupabaseEnv() ? await saveSupabaseEvent(id) : saveEvent(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json({ data: event });
  } catch (error) {
    return apiError(error);
  }
}
