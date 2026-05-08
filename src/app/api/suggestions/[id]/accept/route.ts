import { NextResponse } from "next/server";
import { acceptSuggestion } from "@/lib/mock-store";
import { apiError } from "@/lib/api/errors";
import { acceptSupabaseSuggestion } from "@/lib/repositories/mutations";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const result = hasSupabaseEnv() ? await acceptSupabaseSuggestion(id) : acceptSuggestion(id);
    if (!result) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }
    return NextResponse.json({ data: result });
  } catch (error) {
    return apiError(error);
  }
}
