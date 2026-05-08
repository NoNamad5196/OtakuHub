"use client";

import { Plus } from "lucide-react";
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
    if (response.status === 401) {
      setError("로그인이 필요합니다.");
      setPending(false);
      return;
    }
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
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        수동 일정
      </Button>
    );
  }

  return (
    <form action={submit} className="grid w-full gap-3 rounded-lg border bg-card p-4 sm:w-[420px]">
      <div className="grid gap-2">
        <Label htmlFor="title">일정명</Label>
        <Input id="title" name="title" required placeholder="콜라보 카페 예약 시작" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="franchiseId">프랜차이즈</Label>
          <select id="franchiseId" name="franchiseId" className="h-10 rounded-md border bg-input px-3 text-sm">
            {franchises.map((franchise) => (
              <option key={franchise.id} value={franchise.id}>
                {franchise.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="type">유형</Label>
          <select id="type" name="type" className="h-10 rounded-md border bg-input px-3 text-sm">
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
        <Label htmlFor="location">위치</Label>
        <Input id="location" name="location" placeholder="홍대 / 온라인" />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          닫기
        </Button>
        <Button disabled={pending}>{pending ? "추가 중" : "추가"}</Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
