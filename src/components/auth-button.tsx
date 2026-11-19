"use client";

import { LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { FirebaseError } from "firebase/app";
import { signInWithPopup, signInWithRedirect } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { establishSession } from "@/lib/firebase/browser-session";
import { firebaseConfigured, getFirebaseAuth, googleProvider } from "@/lib/firebase/client";

export function AuthButton({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!firebaseConfigured) return;
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.email) {
          setEmail(data.user.email);
        }
      })
      .catch(() => {});
  }, []);

  async function signIn() {
    if (!firebaseConfigured || busy) return;
    setBusy(true);
    try {
      const auth = getFirebaseAuth();
      try {
        const result = await signInWithPopup(auth, googleProvider);
        await establishSession(result.user);
        window.location.reload();
      } catch (e) {
        const code = e instanceof FirebaseError ? e.code : null;
        if (code === "auth/popup-blocked") {
          sessionStorage.setItem("otakuhub_auth_next", window.location.pathname);
          await signInWithRedirect(auth, googleProvider);
          return;
        } else if (code === "auth/popup-closed-by-user") {
          setBusy(false);
          return;
        } else {
          throw e;
        }
      }
    } catch (error) {
      console.error("Google sign-in error", error);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!firebaseConfigured || busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      setEmail(null);
      window.location.reload();
    } catch (error) {
      console.error("Sign-out error", error);
    } finally {
      setBusy(false);
    }
  }

  if (!firebaseConfigured) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className={compact ? "h-8 w-full font-sf text-[11px] font-bold tracking-wider uppercase" : "font-sf text-xs"}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
        DEMO PASS
      </Button>
    );
  }

  if (email) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={signOut}
        disabled={busy}
        className={compact ? "h-8 w-full justify-start truncate text-xs" : undefined}
      >
        <LogOut className="h-3.5 w-3.5 text-[var(--accent)]" />
        <span className="truncate">{email}</span>
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      onClick={signIn}
      disabled={busy}
      className={compact ? "h-8 w-full font-sf text-xs font-bold tracking-wide" : "font-sf text-xs"}
    >
      <LogIn className="h-3.5 w-3.5" />
      {busy ? "로그인 중..." : "Google 로그인"}
    </Button>
  );
}
