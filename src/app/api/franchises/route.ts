import { NextResponse } from "next/server";
import { z } from "zod";
import { createFranchise, listFranchises } from "@/lib/mock-store";
import { apiError } from "@/lib/api/errors";
import { getDashboardData } from "@/lib/data";
import { createFirestoreFranchise } from "@/lib/repositories/mutations";
import { hasFirebaseAdminEnv, hasFirebaseEnv } from "@/lib/firebase/env";
import { franchiseCategories } from "@/lib/types";

const createFranchiseSchema = z.object({
  name: z.string().min(1),
  category: z.enum(franchiseCategories).default("other"),
  colorCode: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#38bdf8"),
});

function isConfigured() {
  return hasFirebaseEnv() || hasFirebaseAdminEnv();
}

export async function GET() {
  if (!isConfigured()) return NextResponse.json({ data: listFranchises() });
  const data = await getDashboardData();
  return NextResponse.json({ data: data.franchises });
}

export async function POST(request: Request) {
  try {
    const input = createFranchiseSchema.parse(await request.json());
    const franchise = isConfigured()
      ? await createFirestoreFranchise(input)
      : createFranchise(input);
    return NextResponse.json({ data: franchise }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
