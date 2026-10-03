import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api/errors";
import { lookupFranchisePalette } from "@/lib/palette";

const querySchema = z.string().trim().min(2).max(80);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = querySchema.parse(url.searchParams.get("query") ?? "");
    return NextResponse.json({ data: lookupFranchisePalette(query) });
  } catch (error) {
    return apiError(error);
  }
}
