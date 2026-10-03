import { SettingsClient } from "@/components/settings-client";
import { getDashboardData } from "@/lib/data";
import { hasSupabaseEnv, hasSupabaseServiceEnv } from "@/lib/supabase/env";

export default async function SettingsPage() {
  const data = await getDashboardData();
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY);
  const cronHardened = Boolean(process.env.CRON_SECRET && process.env.CRON_SECRET !== "change-me-before-deploy");
  const agentTokenConfigured = Boolean(process.env.OTAKUS_AGENT_API_TOKEN);

  return (
    <SettingsClient
      data={data}
      supabaseReady={hasSupabaseEnv()}
      serviceReady={hasSupabaseServiceEnv()}
      geminiConfigured={geminiConfigured}
      cronHardened={cronHardened}
      agentTokenConfigured={agentTokenConfigured}
    />
  );
}
