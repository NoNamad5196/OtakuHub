import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type AuthenticatedUser = {
  id: string;
  email?: string;
};

export async function getAuthenticatedUser(
  supabase: SupabaseClient<Database> | null,
): Promise<AuthenticatedUser | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return {
    id: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : undefined,
  };
}

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthenticationRequiredError";
  }
}

export function requireUser(user: AuthenticatedUser | null): AuthenticatedUser {
  if (!user) throw new AuthenticationRequiredError();
  return user;
}
