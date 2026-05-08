import { NextResponse } from "next/server";
import { AuthenticationRequiredError } from "@/lib/repositories/auth";

export function apiError(error: unknown) {
  if (error instanceof AuthenticationRequiredError) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const message = error instanceof Error ? error.message : "Unexpected server error";
  return NextResponse.json({ error: message }, { status: 500 });
}
