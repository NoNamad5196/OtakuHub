import { NextResponse } from "next/server";
import { z } from "zod";
import { createCollection, listCollections } from "@/lib/mock-store";
import { apiError } from "@/lib/api/errors";
import { getDashboardData } from "@/lib/data";
import { createSupabaseCollection } from "@/lib/repositories/mutations";
import { hasSupabaseEnv } from "@/lib/supabase/env";

const createCollectionSchema = z.object({
  eventId: z.string().nullable().optional(),
  franchiseId: z.string().nullable().optional(),
  itemName: z.string().min(1),
  price: z.number().int().min(0).default(0),
  isWishlist: z.boolean().default(true),
  boughtAt: z.string().nullable().optional(),
  memo: z.string().nullable().optional(),
});

export async function GET() {
  if (!hasSupabaseEnv()) return NextResponse.json({ data: listCollections() });
  const data = await getDashboardData();
  return NextResponse.json({ data: data.collections });
}

export async function POST(request: Request) {
  try {
    const input = createCollectionSchema.parse(await request.json());
    const item = hasSupabaseEnv()
      ? await createSupabaseCollection(input)
      : createCollection(input);
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
