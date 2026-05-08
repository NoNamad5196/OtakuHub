import { NextResponse } from "next/server";
import { z } from "zod";
import { createEvent, listEvents } from "@/lib/mock-store";
import { apiError } from "@/lib/api/errors";
import { getDashboardData } from "@/lib/data";
import { createSupabaseEvent } from "@/lib/repositories/mutations";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { eventTypes } from "@/lib/types";

const createEventSchema = z.object({
  franchiseId: z.string().min(1),
  type: z.enum(eventTypes),
  title: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  location: z.string().nullable().optional(),
  sourceUrl: z.string().url().nullable().optional(),
  saved: z.boolean().optional(),
  memo: z.string().nullable().optional(),
  remindDays: z.array(z.number().int().min(0).max(30)).optional(),
});

export async function GET() {
  if (!hasSupabaseEnv()) return NextResponse.json({ data: listEvents() });
  const data = await getDashboardData();
  return NextResponse.json({ data: data.events });
}

export async function POST(request: Request) {
  try {
    const input = createEventSchema.parse(await request.json());
    const event = hasSupabaseEnv() ? await createSupabaseEvent(input) : createEvent(input);
    return NextResponse.json({ data: event }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
