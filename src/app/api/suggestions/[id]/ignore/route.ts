import { NextResponse } from "next/server";
import { ignoreSuggestion } from "@/lib/mock-store";
import { apiError } from "@/lib/api/errors";
import { updateSupabaseSuggestionStatus } from "@/lib/repositories/mutations";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const suggestion = hasSupabaseEnv()
      ? await updateSupabaseSuggestionStatus(id, "ignored")
      : ignoreSuggestion(id);
    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }
    return NextResponse.json({ data: suggestion });
  } catch (error) {
    return apiError(error);
  }
}
