import { KeyRound, Settings, ShieldCheck, Terminal } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { hasSupabaseEnv, hasSupabaseServiceEnv } from "@/lib/supabase/env";

const apiRows = [
  ["GET/POST", "/api/franchises", "프랜차이즈 조회/등록"],
  ["GET/POST", "/api/events", "일정 조회/수동 등록"],
  ["POST", "/api/events/:id/save", "내 일정으로 저장"],
  ["GET/POST", "/api/collections", "굿즈 조회/등록"],
  ["GET/PATCH", "/api/suggestions", "AI 제안 조회/상태 변경"],
  ["POST", "/api/suggestions/:id/accept", "제안 확정"],
  ["POST", "/api/suggestions/:id/ignore", "제안 무시"],
  ["GET/POST", "/api/crawl/run", "크롤러 실행"],
];

export default function SettingsPage() {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY);
  const cronHardened = Boolean(process.env.CRON_SECRET && process.env.CRON_SECRET !== "change-me-before-deploy");

  return (
    <>
      <PageHeader
        icon={Settings}
        title="설정"
        description="배포 전에 필요한 환경 변수, 보호 장치, 공개 API 표면을 확인합니다."
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Supabase
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant={hasSupabaseEnv() ? "success" : "warning"}>
              {hasSupabaseEnv() ? "client env ready" : "demo mode"}
            </Badge>
            <Badge variant={hasSupabaseServiceEnv() ? "success" : "outline"}>
              {hasSupabaseServiceEnv() ? "service role ready" : "service role missing"}
            </Badge>
            <p className="text-sm text-muted-foreground">
              키가 없으면 데모 데이터로 동작합니다. 실사용 베타에서는 Supabase migration과 RLS 적용이 필요합니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              Gemini
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant={geminiConfigured ? "success" : "warning"}>
              {geminiConfigured ? "AI extraction ready" : "heuristic fallback"}
            </Badge>
            <p className="text-sm text-muted-foreground">
              기본 모델은 `gemini-3.1-flash-lite`, fallback은 `gemini-2.5-flash-lite`입니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" />
              Cron
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant={cronHardened ? "success" : "danger"}>
              {cronHardened ? "protected" : "needs secret"}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Vercel Cron은 GET으로 `/api/crawl/run`을 호출하고 `Authorization: Bearer $CRON_SECRET` 헤더로 보호합니다. Discover 수동 실행은 POST를 사용합니다.
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Public Interfaces</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Method</TH>
                <TH>Route</TH>
                <TH>Purpose</TH>
              </TR>
            </THead>
            <TBody>
              {apiRows.map(([method, route, purpose]) => (
                <TR key={route}>
                  <TD className="font-mono text-xs">{method}</TD>
                  <TD className="font-mono text-xs">{route}</TD>
                  <TD>{purpose}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
