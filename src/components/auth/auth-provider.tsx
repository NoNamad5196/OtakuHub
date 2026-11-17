"use client";

import { useEffect, type ReactNode } from "react";
import { getRedirectResult } from "firebase/auth";
import { firebaseConfigured, getFirebaseAuth } from "@/lib/firebase/client";
import { establishSession } from "@/lib/firebase/browser-session";

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  useEffect(() => {
    if (!firebaseConfigured) return;
    void getRedirectResult(getFirebaseAuth())
      .then(async (result) => {
        if (!result) return;
        const next = sessionStorage.getItem("otakuhub_auth_next") || window.location.pathname;
        await establishSession(result.user);
        sessionStorage.removeItem("otakuhub_auth_next");
        window.location.replace(next);
      })
      .catch((error: unknown) => {
        console.error("Redirect sign-in error:", error);
      });
  }, []);

  return children;
}
