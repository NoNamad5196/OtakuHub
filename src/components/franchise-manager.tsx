"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { categoryLabels } from "@/lib/event-labels";
import type { Franchise, FranchiseCategory } from "@/lib/types";
import { franchiseCategories } from "@/lib/types";

const colorChoices = ["#0EA5E9", "#2563EB", "#F59E0B", "#EC4899", "#8B5CF6", "#34D399"];

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
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card>
        <CardContent>
          <form action={submit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">프랜차이즈명</Label>
              <Input id="name" name="name" placeholder="원신, 블루 아카이브, 최애 그룹" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">카테고리</Label>
              <select id="category" name="category" className="h-10 rounded-md border bg-input px-3 text-sm">
                {franchiseCategories.map((category) => (
                  <option key={category} value={category}>
                    {categoryLabels[category]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>색상</Label>
              <div className="flex flex-wrap gap-2">
                {colorChoices.map((color) => (
                  <label key={color} className="relative">
                    <input className="peer sr-only" type="radio" name="colorCode" value={color} defaultChecked={color === colorChoices[0]} />
                    <span
                      className="block h-9 w-9 rounded-md border-2 border-transparent ring-offset-2 peer-checked:border-foreground"
                      style={{ backgroundColor: color }}
                    />
                  </label>
                ))}
              </div>
            </div>
            <Button className="w-full" disabled={pending}>
              <Plus className="h-4 w-4" />
              {pending ? "등록 중" : "관심 프랜차이즈 등록"}
            </Button>
            {error && <p className="text-sm text-[var(--danger-text)]">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {franchises.map((franchise) => (
          <Card key={franchise.id}>
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: franchise.colorCode }} />
                    <h2 className="truncate font-semibold">{franchise.name}</h2>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">/{franchise.slug}</p>
                </div>
                <Badge variant={franchise.priority === 1 ? "success" : "outline"}>
                  {franchise.priority === 1 ? "러브" : categoryLabels[franchise.category]}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
