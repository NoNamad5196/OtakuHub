"use client";

import { Compass, Plus, Radio } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { categoryLabels } from "@/lib/event-labels";
import type { Franchise, FranchiseCategory } from "@/lib/types";
import { franchiseCategories } from "@/lib/types";

const colorChoices = ["#dfb96d", "#5ce1ff", "#9d84ff", "#34d399", "#fbbf24", "#f87171"];

export function FranchiseManager({ initialFranchises }: { initialFranchises: Franchise[] }) {
  const [franchises, setFranchises] = useState(initialFranchises);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    const response = await fetch("/api/franchises", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name")),
        category: String(formData.get("category")) as FranchiseCategory,
        colorCode: String(formData.get("colorCode")),
      }),
    });
    if (!response.ok) {
      setError("등록에 실패했습니다.");
      setPending(false);
      return;
    }
    const payload = (await response.json()) as { data: Franchise };
    setFranchises((current) => [payload.data, ...current]);
    setPending(false);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <Card className="border-[var(--border-strong)] shadow-xl">
        <CardHeader className="border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-[var(--accent)]" />
            <CardTitle className="font-sf text-xs uppercase tracking-wider text-foreground">
              NEW ROUTE CHANNEL // 관심 게임 등록
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form action={submit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">프랜차이즈 / 게임명</Label>
              <Input id="name" name="name" placeholder="붕괴: 스타레일, 원신, 블루 아카이브" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">채널 카테고리</Label>
              <select
                id="category"
                name="category"
                className="h-9.5 rounded-md border border-[var(--border)] bg-input px-3 text-sm text-foreground outline-none transition focus:border-[var(--hologram)]"
              >
                {franchiseCategories.map((category) => (
                  <option key={category} value={category}>
                    {categoryLabels[category]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>채널 시그니처 색상</Label>
              <div className="flex flex-wrap gap-2.5">
                {colorChoices.map((color) => (
                  <label key={color} className="relative cursor-pointer">
                    <input
                      className="peer sr-only"
                      type="radio"
                      name="colorCode"
                      value={color}
                      defaultChecked={color === colorChoices[0]}
                    />
                    <span
                      className="block h-8 w-8 rounded-md border-2 border-transparent transition-all peer-checked:scale-110 peer-checked:border-foreground peer-checked:shadow-[0_0_10px_currentColor]"
                      style={{ backgroundColor: color, color }}
                    />
                  </label>
                ))}
              </div>
            </div>
            <Button className="w-full shadow-[0_0_12px_var(--gold-glow)]" disabled={pending}>
              <Plus className="h-4 w-4" />
              {pending ? "채널 등록 중..." : "열차 노선에 등록"}
            </Button>
            {error && <p className="text-xs text-[var(--danger-text)]">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3.5 sm:grid-cols-2">
        {franchises.map((franchise) => (
          <Card
            key={franchise.id}
            className="group relative overflow-hidden transition-all hover:border-[var(--hologram)] hover:shadow-[0_0_15px_var(--cyan-glow)]"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_6px_currentColor]"
                      style={{ backgroundColor: franchise.colorCode, color: franchise.colorCode }}
                    />
                    <h2 className="truncate font-sf text-sm font-bold text-foreground">{franchise.name}</h2>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">/{franchise.slug}</p>
                </div>
                <Badge variant={franchise.priority === 1 ? "default" : "outline"} className="font-sf text-[10px]">
                  {franchise.priority === 1 ? "MAIN ROUTE" : categoryLabels[franchise.category]}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
