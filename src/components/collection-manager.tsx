"use client";

import {
  BarChart3,
  CheckCircle2,
  Grid2X2,
  Inbox,
  List,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Star,
  X,
} from "lucide-react";
import { useState } from "react";
import { PageTop } from "@/components/dashboard-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CollectionItem, Franchise, OtakuEvent } from "@/lib/types";

type StatusTab = "all" | "wishlist" | "purchased" | "reserved";

const statusTabs: { id: StatusTab; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "wishlist", label: "위시리스트" },
  { id: "purchased", label: "구매 완료" },
  { id: "reserved", label: "예약 중" },
];

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
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [franchise, setFranchise] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showAdd, setShowAdd] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const franchiseById = new Map(franchises.map((item) => [item.id, item]));

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    const state = String(formData.get("state"));
    const memo = String(formData.get("memo") || "");
    const response = await fetch("/api/collections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        itemName: String(formData.get("itemName")),
        price: Number(formData.get("price") || 0),
        franchiseId: String(formData.get("franchiseId") || "") || null,
        eventId: String(formData.get("eventId") || "") || null,
        isWishlist: state !== "bought",
        boughtAt: state === "bought" ? new Date().toISOString().slice(0, 10) : null,
        memo: state === "reserved" && !memo ? "예약 중" : memo || null,
      }),
    });
    if (response.ok) {
      const payload = (await response.json()) as { data: CollectionItem };
      setItems((current) => [payload.data, ...current]);
      setShowAdd(false);
    } else {
      setError("굿즈 등록에 실패했습니다.");
    }
    setPending(false);
  }

  const counts: Record<StatusTab, number> = {
    all: items.length,
    wishlist: items.filter((item) => statusOf(item) === "wishlist").length,
    purchased: items.filter((item) => statusOf(item) === "purchased").length,
    reserved: items.filter((item) => statusOf(item) === "reserved").length,
  };

  const filtered = items.filter((item) => {
    const itemStatus = statusOf(item);
    const itemFranchise = franchiseById.get(item.franchiseId ?? "");
    const query = search.trim().toLowerCase();
    if (activeTab !== "all" && itemStatus !== activeTab) return false;
    if (franchise !== "all" && item.franchiseId !== franchise) return false;
    if (query && !item.itemName.toLowerCase().includes(query) && !itemFranchise?.name.toLowerCase().includes(query)) {
      return false;
    }
    return true;
  });

  const spent = items.filter((item) => statusOf(item) === "purchased").reduce((sum, item) => sum + item.price, 0);
  const wishlistTotal = items.filter((item) => item.isWishlist).reduce((sum, item) => sum + item.price, 0);
  const reserved = items.find((item) => statusOf(item) === "reserved");
  const byFranchise = franchises
    .map((item) => ({
      franchise: item,
      count: items.filter((collection) => collection.franchiseId === item.id).length,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  const maxFranchiseCount = Math.max(...byFranchise.map((item) => item.count), 1);

  return (
    <div className="min-h-full bg-background">
      <PageTop
        title="Collections"
        description={`굿즈 ${items.length}개 · 위시리스트 ${counts.wishlist}개 · 구매 완료 ${counts.purchased}개`}
        action={
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" />
            굿즈 추가
          </Button>
        }
      />

      <div className="px-4 pb-8 sm:px-7">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InsightCard label="이번 달 지출" value={formatKRW(spent)} icon={CheckCircle2} detail={`구매 완료 ${counts.purchased}개`} tone="success" />
          <InsightCard label="위시리스트 총액" value={formatKRW(wishlistTotal)} icon={Star} detail={`위시리스트 ${counts.wishlist}개`} tone="warn" />
          <div className="panel p-4">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-3)]">
              <BarChart3 className="h-3.5 w-3.5" />
              게임별 비중
            </div>
            <div className="space-y-2">
              {byFranchise.map(({ franchise: item, count }) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="w-20 truncate text-xs text-[var(--text-2)]">{item.name}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(count / maxFranchiseCount) * 100}%`, backgroundColor: item.colorCode }}
                    />
                  </div>
                  <span className="w-5 text-right text-xs font-bold">{count}</span>
                </div>
              ))}
              {byFranchise.length === 0 && <p className="text-xs text-[var(--text-3)]">등록된 굿즈가 없습니다</p>}
            </div>
          </div>
          <div className="panel p-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-3)]">
              다음 발매 예정
            </div>
            {reserved ? (
              <>
                <p className="truncate text-sm font-bold">{reserved.itemName}</p>
                <p className="mt-1 truncate text-xs text-[var(--text-3)]">
                  {franchiseById.get(reserved.franchiseId ?? "")?.name ?? "미분류"} · {reserved.memo ?? "발매일 미정"}
                </p>
              </>
            ) : (
              <p className="text-sm text-[var(--text-3)]">예약 중인 아이템이 없습니다</p>
            )}
          </div>
        </section>

        <section className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-fit rounded-lg border bg-card p-1">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-bold transition ${
                  activeTab === tab.id ? "bg-primary text-white" : "text-[var(--text-2)] hover:bg-muted"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 text-[10px] leading-4 ${
                    activeTab === tab.id ? "bg-white/25 text-white" : "bg-muted text-[var(--text-3)]"
                  }`}
                >
                  {counts[tab.id]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="굿즈명, 게임 검색..."
                className="w-56 pl-8"
              />
            </div>
            <select
              value={franchise}
              onChange={(event) => setFranchise(event.target.value)}
              className="h-10 rounded-md border bg-input px-3 text-sm outline-none"
            >
              <option value="all">전체 게임</option>
              {franchises.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <div className="flex overflow-hidden rounded-md border bg-card">
              <IconButton active={viewMode === "table"} onClick={() => setViewMode("table")} label="테이블">
                <List className="h-4 w-4" />
              </IconButton>
              <IconButton active={viewMode === "grid"} onClick={() => setViewMode("grid")} label="그리드">
                <Grid2X2 className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
        </section>

        <section className="mt-4">
          {viewMode === "table" ? (
            <CollectionTable
              items={filtered}
              franchiseById={franchiseById}
              onReset={() => {
                setSearch("");
                setFranchise("all");
                setActiveTab("all");
              }}
              onAdd={() => setShowAdd(true)}
              hasFilter={Boolean(search || franchise !== "all" || activeTab !== "all")}
            />
          ) : (
            <CollectionGrid items={filtered} franchiseById={franchiseById} />
          )}
        </section>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <form action={submit} className="w-full max-w-md rounded-xl border bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold">굿즈 추가</h2>
              <button type="button" onClick={() => setShowAdd(false)} className="text-[var(--text-3)] hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <Input name="itemName" required placeholder="굿즈명" />
              <div className="grid grid-cols-2 gap-3">
                <Input name="price" type="number" min="0" defaultValue="0" placeholder="가격" />
                <select name="state" className="h-10 rounded-md border bg-input px-3 text-sm outline-none">
                  <option value="wishlist">위시리스트</option>
                  <option value="reserved">예약 중</option>
                  <option value="bought">구매 완료</option>
                </select>
              </div>
              <select name="franchiseId" className="h-10 w-full rounded-md border bg-input px-3 text-sm outline-none">
                {franchises.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select name="eventId" className="h-10 w-full rounded-md border bg-input px-3 text-sm outline-none">
                <option value="">연결 일정 없음</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
              <Input name="memo" placeholder="메모" />
            </div>
            {error && <p className="mt-3 text-sm text-[var(--danger-text)]">{error}</p>}
            <Button className="mt-5 w-full" disabled={pending}>
              {pending ? "추가 중..." : "추가하기"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

function InsightCard({
  label,
  value,
  icon: Icon,
  detail,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  detail: string;
  tone: "success" | "warn";
}) {
  return (
    <div className="panel p-4">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-3)]">{label}</div>
      <div className={tone === "success" ? "text-2xl font-bold" : "text-2xl font-bold text-[var(--warn-text)]"}>
        {value}
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-[var(--text-3)]">
        <Icon className={tone === "success" ? "h-3.5 w-3.5 text-[var(--success)]" : "h-3.5 w-3.5 text-[var(--warn)]"} />
        {detail}
      </div>
    </div>
  );
}

function IconButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`border-l px-3 py-2 first:border-l-0 ${active ? "bg-secondary text-[var(--accent-text)]" : "text-[var(--text-3)] hover:bg-muted"}`}
    >
      {children}
    </button>
  );
}

function CollectionTable({
  items,
  franchiseById,
  onReset,
  onAdd,
  hasFilter,
}: {
  items: CollectionItem[];
  franchiseById: Map<string, Franchise>;
  onReset: () => void;
  onAdd: () => void;
  hasFilter: boolean;
}) {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  return (
    <div className="panel overflow-hidden">
      <div className="hidden grid-cols-[minmax(0,1fr)_140px_120px_120px_56px] border-b bg-muted px-4 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-3)] md:grid">
        <div>굿즈명 / 게임</div>
        <div>연결 일정</div>
        <div>가격</div>
        <div>상태</div>
        <div />
      </div>
      {items.length === 0 ? (
        <EmptyCollection hasFilter={hasFilter} onReset={onReset} onAdd={onAdd} />
      ) : (
        items.map((item) => {
          const franchise = franchiseById.get(item.franchiseId ?? "");
          return (
            <div
              key={item.id}
              className="grid gap-2 border-b px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1fr)_140px_120px_120px_56px] md:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border"
                  style={{
                    color: franchise?.colorCode ?? "var(--accent)",
                    backgroundColor: colorMix(franchise?.colorCode, 0.12),
                    borderColor: colorMix(franchise?.colorCode, 0.25),
                  }}
                >
                  <Package className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.itemName}</p>
                  <p className="truncate text-xs text-[var(--text-3)]">{franchise?.name ?? "미분류"}{item.memo ? ` · ${item.memo}` : ""}</p>
                </div>
              </div>
              <div className="truncate text-xs text-[var(--text-2)]">{item.eventId ?? "없음"}</div>
              <div className="text-sm font-bold">{formatKRW(item.price)}</div>
              <StatusBadge status={statusOf(item)} />
              <div className="flex justify-end">
                <Button variant="ghost" size="icon" aria-label={`${item.itemName} 옵션`}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })
      )}
      {items.length > 0 && (
        <div className="border-t bg-muted px-4 py-3 text-right text-sm text-[var(--text-2)]">
          필터 결과 합계: <strong className="text-foreground">{formatKRW(total)}</strong>
        </div>
      )}
    </div>
  );
}

function CollectionGrid({
  items,
  franchiseById,
}: {
  items: CollectionItem[];
  franchiseById: Map<string, Franchise>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const franchise = franchiseById.get(item.franchiseId ?? "");
        return (
          <article key={item.id} className="panel overflow-hidden">
            <div
              className="flex aspect-[16/9] items-center justify-center border-b"
              style={{ backgroundColor: colorMix(franchise?.colorCode, 0.1), color: franchise?.colorCode ?? "var(--accent)" }}
            >
              <Package className="h-9 w-9 opacity-75" />
            </div>
            <div className="p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold leading-5">{item.itemName}</h3>
                <StatusBadge status={statusOf(item)} compact />
              </div>
              <p className="text-xs text-[var(--text-3)]">{franchise?.name ?? "미분류"}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-bold">{formatKRW(item.price)}</span>
                <span className="text-xs text-[var(--text-3)]">{item.boughtAt ?? "미구매"}</span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function EmptyCollection({
  hasFilter,
  onReset,
  onAdd,
}: {
  hasFilter: boolean;
  onReset: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl border bg-muted">
        <Inbox className="h-7 w-7 text-[var(--text-3)]" />
      </div>
      <p className="mt-3 text-sm font-bold">{hasFilter ? "조건에 맞는 굿즈가 없습니다" : "아직 등록된 굿즈가 없습니다"}</p>
      <p className="mt-1 text-xs text-[var(--text-3)]">
        {hasFilter ? "필터를 초기화하거나 다른 검색어를 시도해보세요." : "관심 있는 굿즈를 추가하고 위시리스트로 관리해보세요."}
      </p>
      <Button className="mt-4" variant={hasFilter ? "outline" : "default"} onClick={hasFilter ? onReset : onAdd}>
        {hasFilter ? (
          <>
            <X className="h-4 w-4" />
            필터 초기화
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            첫 굿즈 추가
          </>
        )}
      </Button>
    </div>
  );
}

function StatusBadge({ status, compact = false }: { status: Exclude<StatusTab, "all">; compact?: boolean }) {
  const config = {
    wishlist: { label: "위시리스트", variant: "warning" as const, icon: Star },
    purchased: { label: "구매 완료", variant: "success" as const, icon: CheckCircle2 },
    reserved: { label: "예약 중", variant: "secondary" as const, icon: Package },
  }[status];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant}>
      <Icon className="h-3 w-3" />
      {!compact && config.label}
    </Badge>
  );
}

function statusOf(item: CollectionItem): Exclude<StatusTab, "all"> {
  if (!item.isWishlist) return "purchased";
  if (item.memo?.includes("예약") || item.memo?.includes("발매")) return "reserved";
  return "wishlist";
}

function formatKRW(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function colorMix(color?: string, opacity = 0.12) {
  if (!color) return `color-mix(in oklch, var(--accent) ${Math.round(opacity * 100)}%, transparent)`;
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`;
}
