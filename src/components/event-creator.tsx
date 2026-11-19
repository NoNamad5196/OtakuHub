"use client";

import { CalendarPlus, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { eventTypeLabels } from "@/lib/event-labels";
import type { Franchise } from "@/lib/types";
import { eventTypes } from "@/lib/types";

export function EventCreator({ franchises }: { franchises: Franchise[] }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        franchiseId: String(formData.get("franchiseId")),
        type: String(formData.get("type")),
        title: String(formData.get("title")),
        startDate: String(formData.get("startDate")),
        endDate: String(formData.get("endDate") || "") || null,
        location: String(formData.get("location") || "") || null,
        saved: true,
        remindDays: [3, 7],
      }),
    });
    if (!response.ok) {
      setError("일정 추가에 실패했습니다.");
      setPending(false);
      return;
    }
    setPending(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="shadow-[0_0_12px_var(--gold-glow)]">
        <Plus className="h-4 w-4" />
        수동 일정 등록
      </Button>
    );
  }

  return (
    <form
      action={submit}
      className="panel relative grid w-full gap-3.5 border border-[var(--border-strong)] bg-card p-5 shadow-2xl sm:w-[440px]"
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2">
          <CalendarPlus className="h-4 w-4 text-[var(--accent)]" />
          <h2 className="font-sf text-sm font-bold tracking-wide text-foreground">
            DESTINATION // 수동 일정 등록
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[var(--text-3)] transition hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="title">일정명</Label>
        <Input id="title" name="title" required placeholder="예: 콜라보 카페 예약 시작" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="franchiseId">프랜차이즈</Label>
          <select
            id="franchiseId"
            name="franchiseId"
            className="h-9.5 rounded-md border border-[var(--border)] bg-input px-3 text-sm text-foreground outline-none transition focus:border-[var(--hologram)]"
          >
            {franchises.map((franchise) => (
              <option key={franchise.id} value={franchise.id}>
                {franchise.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="type">유형</Label>
          <select
            id="type"
            name="type"
            className="h-9.5 rounded-md border border-[var(--border)] bg-input px-3 text-sm text-foreground outline-none transition focus:border-[var(--hologram)]"
          >
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {eventTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="startDate">시작일</Label>
          <Input id="startDate" name="startDate" type="date" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="endDate">종료일</Label>
          <Input id="endDate" name="endDate" type="date" />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="location">장소 또는 URL</Label>
        <Input id="location" name="location" placeholder="홍대 애니플러스 / 온라인" />
      </div>

      {error && <p className="text-xs text-[var(--danger-text)]">{error}</p>}

      <div className="mt-2 flex justify-end gap-2 border-t border-[var(--border)] pt-3">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          취소
        </Button>
        <Button size="sm" disabled={pending}>
          {pending ? "등록 중..." : "스타차트에 등록"}
        </Button>
      </div>
    </form>
  );
}
