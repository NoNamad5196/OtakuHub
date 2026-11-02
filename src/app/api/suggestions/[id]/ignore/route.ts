import { NextResponse } from "next/server";
import { ignoreSuggestion } from "@/lib/mock-store";
import { apiError } from "@/lib/api/errors";
import { updateFirestoreSuggestionStatus } from "@/lib/repositories/mutations";
import { hasFirebaseAdminEnv, hasFirebaseEnv } from "@/lib/firebase/env";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const isConfigured = hasFirebaseEnv() || hasFirebaseAdminEnv();
    const suggestion = isConfigured
      ? await updateFirestoreSuggestionStatus(id, "ignored")
      : ignoreSuggestion(id);
    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }
    return NextResponse.json({ data: suggestion });
  } catch (error) {
    return apiError(error);
  }
}
