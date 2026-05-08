import { NextResponse } from "next/server";
import { z } from "zod";
import { listSuggestions, updateSuggestionStatus } from "@/lib/mock-store";
import { apiError } from "@/lib/api/errors";
import { getDashboardData } from "@/lib/data";
import {
  updateSupabaseSuggestionStatus,
} from "@/lib/repositories/mutations";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { suggestionStatuses } from "@/lib/types";

const patchSuggestionSchema = z.object({
  id: z.string().min(1),
  status: z.enum(suggestionStatuses),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const validStatus = suggestionStatuses.find((item) => item === status);
    const suggestions = hasSupabaseEnv()
      ? (await getDashboardData()).suggestions.filter((suggestion) =>
          validStatus ? suggestion.status === validStatus : true,
        )
      : listSuggestions(validStatus);
    return NextResponse.json({ data: suggestions ?? [] });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const input = patchSuggestionSchema.parse(await request.json());
    const suggestion = hasSupabaseEnv()
      ? await updateSupabaseSuggestionStatus(input.id, input.status)
      : updateSuggestionStatus(input.id, input.status);
    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }
    return NextResponse.json({ data: suggestion });
  } catch (error) {
    return apiError(error);
  }
}
