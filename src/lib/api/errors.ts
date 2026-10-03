import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthenticationRequiredError } from "@/lib/repositories/auth";

export function apiError(error: unknown) {
  if (error instanceof AuthenticationRequiredError) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "요청 형식이 올바르지 않습니다.", issues: error.issues },
      { status: 400 },
    );
  }
  const message = error instanceof Error ? error.message : "Unexpected server error";
  return NextResponse.json({ error: message }, { status: 500 });
}
