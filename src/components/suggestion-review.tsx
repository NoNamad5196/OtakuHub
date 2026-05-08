"use client";

import { Check, Loader2, Play, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateRange } from "@/lib/date-utils";
import { eventTypeLabels } from "@/lib/event-labels";
import type { CrawlRun, CrawlSource, EventSuggestion, Franchise } from "@/lib/types";

export function SuggestionReview({
  initialSuggestions,
  sources,
  franchises,
  runs,
}: {
  initialSuggestions: EventSuggestion[];
  sources: CrawlSource[];
  franchises: Franchise[];
  runs: CrawlRun[];
}) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [crawlRuns, setCrawlRuns] = useState(runs);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const franchiseById = new Map(franchises.map((franchise) => [franchise.id, franchise]));

  async function review(id: string, action: "accept" | "ignore") {
    setPendingId(id);
    setError(null);
    const response = await fetch(`/api/suggestions/${id}/${action}`, { method: "POST" });
    if (response.ok) {
      setSuggestions((current) =>
        current.map((suggestion) =>
          suggestion.id === id
            ? { ...suggestion, status: action === "accept" ? "accepted" : "ignored" }
            : suggestion,
        ),
      );
    } else if (response.status === 401) {
      setError("로그인이 필요합니다.");
    } else {
      setError("검수 처리에 실패했습니다.");
    }
    setPendingId(null);
  }

  async function runCrawl() {
    setRunning(true);
    setError(null);
    const response = await fetch("/api/crawl/run", { method: "POST" });
    if (response.ok) {
      const payload = (await response.json()) as {
        data: { suggestions: EventSuggestion[] };
      };
      setSuggestions((current) => [...payload.data.suggestions, ...current]);
      const runsResponse = await fetch("/api/suggestions?status=pending");
      if (runsResponse.ok) {
        const suggestionsPayload = (await runsResponse.json()) as { data: EventSuggestion[] };
        setSuggestions(suggestionsPayload.data);
      }
      setCrawlRuns((current) => [
        {
          id: `local-${Date.now()}`,
          status: "success",
          postsFound: payload.data.suggestions.length,
          suggestionsCreated: payload.data.suggestions.length,
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
        },
        ...current,
      ]);
    } else if (response.status === 401) {
      setError("CRON_SECRET 또는 로그인이 필요한 보호된 수집 엔드포인트입니다.");
    } else {
      setError("수집 실행에 실패했습니다.");
    }
    setRunning(false);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        {error && <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-red-100">{error}</p>}
        {suggestions.map((suggestion) => {
          const franchise = franchiseById.get(suggestion.franchiseId ?? "");
          return (
            <Card key={suggestion.id} className={suggestion.status !== "pending" ? "opacity-70" : undefined}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={suggestion.confidence >= 0.75 ? "success" : "warning"}>
                        {Math.round(suggestion.confidence * 100)}%
                      </Badge>
                      <Badge variant="outline">{eventTypeLabels[suggestion.eventType]}</Badge>
                      <span className="text-xs text-muted-foreground">{franchise?.name ?? "프랜차이즈 추정 필요"}</span>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold">{suggestion.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDateRange(suggestion.startDate, suggestion.endDate)}
                      {suggestion.location ? ` · ${suggestion.location}` : ""}
                    </p>
                    {suggestion.warnings.length > 0 && (
                      <ul className="mt-3 space-y-1 text-xs text-amber-100">
                        {suggestion.warnings.map((warning) => (
                          <li key={warning}>· {warning}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      disabled={pendingId === suggestion.id || suggestion.status !== "pending"}
                      onClick={() => review(suggestion.id, "ignore")}
                    >
                      <X className="h-4 w-4" />
                      무시
                    </Button>
                    <Button
                      disabled={pendingId === suggestion.id || suggestion.status !== "pending"}
                      onClick={() => review(suggestion.id, "accept")}
                    >
                      {pendingId === suggestion.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      추가
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>수집 실행</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={runCrawl} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? "수집 중" : "3개 소스 수집"}
            </Button>
            <div className="space-y-2">
              {sources.map((source) => (
                <div key={source.id} className="rounded-md border bg-background/50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{source.name}</p>
                    <Badge variant={source.isActive ? "success" : "outline"}>{source.sourceType}</Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{source.url}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>최근 실행 로그</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {crawlRuns.slice(0, 5).map((run) => (
              <div key={run.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">제안 {run.suggestionsCreated}개</p>
                  <p className="text-xs text-muted-foreground">글 {run.postsFound}개</p>
                </div>
                <Badge variant={run.status === "success" ? "success" : "warning"}>{run.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
