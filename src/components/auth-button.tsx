"use client";

import { LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient, hasBrowserSupabaseEnv } from "@/lib/supabase/client";

export function AuthButton({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!hasBrowserSupabaseEnv()) return;
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn() {
    if (!hasBrowserSupabaseEnv()) return;
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function signOut() {
    if (!hasBrowserSupabaseEnv()) return;
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setEmail(null);
  }

  if (!hasBrowserSupabaseEnv()) {
    return (
      <Button variant="outline" size="sm" disabled className={compact ? "h-8 w-full text-xs" : undefined}>
        Demo mode
      </Button>
    );
  }

  if (email) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={signOut}
        className={compact ? "h-8 w-full justify-start truncate text-xs" : undefined}
      >
        <LogOut className="h-4 w-4" />
        <span className="truncate">{email}</span>
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={signIn} className={compact ? "h-8 w-full text-xs" : undefined}>
      <LogIn className="h-4 w-4" />
      Google 로그인
    </Button>
  );
}
