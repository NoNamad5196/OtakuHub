import { getSessionUser } from "@/lib/firebase/session";

export type AuthenticatedUser = {
  id: string;
  email?: string;
};

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

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  return {
    id: sessionUser.uid,
    email: sessionUser.email ?? undefined,
  };
}
