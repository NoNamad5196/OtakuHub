"use client";

import { Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { CollectionItem, Franchise, OtakuEvent } from "@/lib/types";

export function CollectionManager({
  initialItems,
  franchises,
  events,
}: {
  initialItems: CollectionItem[];
  franchises: Franchise[];
  events: OtakuEvent[];
}) {
  const [items, setItems] = useState(initialItems);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const franchiseById = new Map(franchises.map((franchise) => [franchise.id, franchise]));

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    const response = await fetch("/api/collections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        itemName: String(formData.get("itemName")),
        price: Number(formData.get("price") || 0),
        franchiseId: String(formData.get("franchiseId") || "") || null,
        eventId: String(formData.get("eventId") || "") || null,
        isWishlist: formData.get("state") === "wishlist",
        boughtAt: formData.get("state") === "bought" ? new Date().toISOString().slice(0, 10) : null,
        memo: String(formData.get("memo") || "") || null,
      }),
    });
    if (response.status === 401) {
      setError("로그인이 필요합니다.");
      setPending(false);
      return;
    }
    if (!response.ok) {
      setError("굿즈 등록에 실패했습니다.");
      setPending(false);
      return;
    }
    const payload = (await response.json()) as { data: CollectionItem };
    setItems((current) => [payload.data, ...current]);
    setPending(false);
  }

  const totalBought = items.filter((item) => !item.isWishlist).reduce((sum, item) => sum + item.price, 0);
  const wishlistTotal = items.filter((item) => item.isWishlist).reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card>
        <CardContent className="p-5">
          <form action={submit} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingBag className="h-4 w-4 text-primary" />
              굿즈 등록
            </div>
            <div className="grid gap-2">
              <Label htmlFor="itemName">상품명</Label>
              <Input id="itemName" name="itemName" required placeholder="아크릴 스탠드" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="price">가격</Label>
                <Input id="price" name="price" type="number" min="0" defaultValue="0" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">상태</Label>
                <select id="state" name="state" className="h-10 rounded-md border bg-input px-3 text-sm">
                  <option value="wishlist">살 예정</option>
                  <option value="bought">이미 삼</option>
                </select>
              </div>
            </div>
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
              <Label htmlFor="eventId">연결 일정</Label>
              <select id="eventId" name="eventId" className="h-10 rounded-md border bg-input px-3 text-sm">
                <option value="">없음</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>
            <Button className="w-full" disabled={pending}>
              <Plus className="h-4 w-4" />
              {pending ? "저장 중" : "등록"}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="success">구매 완료 {totalBought.toLocaleString()}원</Badge>
            <Badge variant="warning">위시 {wishlistTotal.toLocaleString()}원</Badge>
          </div>
          <Table>
            <THead>
              <TR>
                <TH>상품</TH>
                <TH>프랜차이즈</TH>
                <TH>상태</TH>
                <TH className="text-right">가격</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((item) => (
                <TR key={item.id}>
                  <TD className="font-medium">{item.itemName}</TD>
                  <TD>{franchiseById.get(item.franchiseId ?? "")?.name ?? "미분류"}</TD>
                  <TD>
                    <Badge variant={item.isWishlist ? "warning" : "success"}>
                      {item.isWishlist ? "살 예정" : "이미 삼"}
                    </Badge>
                  </TD>
                  <TD className="text-right font-mono">{item.price.toLocaleString()}원</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
