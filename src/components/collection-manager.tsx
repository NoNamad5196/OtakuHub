"use client";

import {
  Archive,
  BarChart3,
  CheckCircle2,
  Clock,
  Compass,
  Grid2X2,
  Inbox,
  List,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Star,
  Ticket,
  X,
} from "lucide-react";
import { useState } from "react";
import { PageTop } from "@/components/dashboard-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CollectionItem, Franchise, OtakuEvent } from "@/lib/types";

type StatusTab = "all" | "wishlist" | "purchased" | "reserved";

const statusTabs: { id: StatusTab; label: string; code: string }[] = [
  { id: "all", label: "전체 카고", code: "ALL CARGO" },
  { id: "wishlist", label: "위시리스트", code: "WISHLIST" },
  { id: "purchased", label: "보관 완료", code: "SECURED" },
  { id: "reserved", label: "예약 중", code: "RESERVED" },
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
  const eventById = new Map(events.map((item) => [item.id, item]));

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
    <div className="min-h-full bg-background pb-12">
      <PageTop
        title="열차 카고 매니페스트"
        description={`등록 굿즈 ${items.length}개 · 위시리스트 ${counts.wishlist}개 · 보관 완료 ${counts.purchased}개`}
        action={
          <Button onClick={() => setShowAdd(true)} className="shadow-[0_0_12px_var(--gold-glow)]">
            <Plus className="h-4 w-4" />
            카고 등록
          </Button>
        }
      />

      <div className="px-4 pb-8 sm:px-7">
        {/* Insight Telemetry Cards */}
        <section className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
          <InsightCard
            label="이번 달 보관 지출"
            code="EXPENSES"
            value={formatKRW(spent)}
            icon={CheckCircle2}
            detail={`보관 완료 ${counts.purchased}개`}
            tone="success"
          />
          <InsightCard
            label="위시리스트 총액"
            code="WISHLIST VALUATION"
            value={formatKRW(wishlistTotal)}
            icon={Star}
            detail={`위시리스트 ${counts.wishlist}개`}
            tone="warn"
          />

          {/* Franchise Cargo Distribution */}
          <div className="panel p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-sf text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">
                CARGO DISTRIBUTION // 비중
              </span>
              <BarChart3 className="h-3.5 w-3.5 text-[var(--accent)]" />
            </div>
            <div className="space-y-2">
              {byFranchise.map(({ franchise: item, count }) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="w-20 truncate font-sf text-xs text-[var(--text-2)]">{item.name}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${(count / maxFranchiseCount) * 100}%`, backgroundColor: item.colorCode }}
                    />
                  </div>
                  <span className="w-5 text-right font-mono text-xs font-bold text-foreground">{count}</span>
                </div>
              ))}
              {byFranchise.length === 0 && (
                <p className="font-mono text-xs text-[var(--text-3)]">등록된 카고가 없습니다</p>
              )}
            </div>
          </div>

          {/* Next Arrival */}
          <div className="panel p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-sf text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">
                NEXT ARRIVAL // 다음 발매
              </span>
              <Clock className="h-3.5 w-3.5 text-[var(--hologram)]" />
            </div>
            {reserved ? (
              <>
                <p className="truncate text-sm font-bold text-foreground">{reserved.itemName}</p>
                <p className="mt-1 truncate font-mono text-xs text-[var(--text-3)]">
                  {franchiseById.get(reserved.franchiseId ?? "")?.name ?? "미분류"} · {reserved.memo ?? "발매일 미정"}
                </p>
              </>
            ) : (
              <p className="font-mono text-xs text-[var(--text-3)]">예약 중인 카고가 없습니다</p>
            )}
          </div>
        </section>

        {/* Filter & Control Bar */}
        <section className="mt-5 flex flex-col gap-3.5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex max-w-full overflow-x-auto rounded-lg border border-[var(--border)] bg-card/80 p-1 backdrop-blur-md xl:w-fit">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 font-sf text-xs font-bold tracking-wide transition-all ${
                  activeTab === tab.id
                    ? "border border-[var(--accent)] bg-[var(--accent)] text-[#070b18] shadow-[0_0_10px_var(--gold-glow)] font-black"
                    : "text-[var(--text-2)] hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 font-mono text-[10px] leading-4 ${
                    activeTab === tab.id ? "bg-[#070b18]/20 text-[#070b18] font-black" : "bg-muted text-[var(--text-3)]"
                  }`}
                >
                  {counts[tab.id]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-auto">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-3)]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="카고명, 채널 검색..."
                className="w-full pl-8 sm:w-56"
              />
            </div>
            <select
              value={franchise}
              onChange={(event) => setFranchise(event.target.value)}
              className="h-9.5 w-full rounded-md border border-[var(--border-strong)] bg-card px-3 font-sf text-xs font-bold text-foreground outline-none transition focus:border-[var(--hologram)] sm:w-auto"
            >
              <option value="all">전체 채널</option>
              {franchises.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <div className="flex overflow-hidden rounded-md border border-[var(--border)] bg-card shadow-sm">
              <IconButton active={viewMode === "table"} onClick={() => setViewMode("table")} label="매니페스트 테이블">
                <List className="h-4 w-4" />
              </IconButton>
              <IconButton active={viewMode === "grid"} onClick={() => setViewMode("grid")} label="카고 그리드">
                <Grid2X2 className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
        </section>

        {/* Main Content Display */}
        <section className="mt-4">
          {viewMode === "table" ? (
            <CollectionTable
              items={filtered}
              franchiseById={franchiseById}
              eventById={eventById}
              onReset={() => {
                setSearch("");
                setFranchise("all");
                setActiveTab("all");
              }}
              onAdd={() => setShowAdd(true)}
              hasFilter={Boolean(search || franchise !== "all" || activeTab !== "all")}
            />
          ) : (
            <CollectionGrid items={filtered} franchiseById={franchiseById} eventById={eventById} />
          )}
        </section>
      </div>

      {/* Add Cargo Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <form action={submit} className="panel w-full max-w-md border border-[var(--border-strong)] bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-[var(--accent)]" />
                <h2 className="font-sf text-sm font-bold text-foreground uppercase tracking-wide">
                  REGISTER CARGO // 카고 아이템 등록
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="text-[var(--text-3)] transition hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3.5">
              <Input name="itemName" required placeholder="굿즈/아이템명" className="font-semibold" />
              <div className="grid grid-cols-2 gap-3">
                <Input name="price" type="number" min="0" defaultValue="0" placeholder="가격(KRW)" className="font-mono" />
                <select
                  name="state"
                  className="h-9.5 rounded-md border border-[var(--border)] bg-input px-3 text-sm text-foreground outline-none transition focus:border-[var(--hologram)]"
                >
                  <option value="wishlist">위시리스트</option>
                  <option value="reserved">예약 중</option>
                  <option value="bought">보관 완료</option>
                </select>
              </div>
              <select
                name="franchiseId"
                className="h-9.5 w-full rounded-md border border-[var(--border)] bg-input px-3 text-sm text-foreground outline-none transition focus:border-[var(--hologram)]"
              >
                {franchises.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select
                name="eventId"
                className="h-9.5 w-full rounded-md border border-[var(--border)] bg-input px-3 text-sm text-foreground outline-none transition focus:border-[var(--hologram)]"
              >
                <option value="">연결 일정 없음</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
              <Input name="memo" placeholder="메모 / 발매처 / 특전" />
            </div>
            {error && <p className="mt-3 text-xs text-[var(--danger-text)]">{error}</p>}
            <div className="mt-5 flex justify-end gap-2 border-t border-[var(--border)] pt-3.5">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(false)}>
                취소
              </Button>
              <Button size="sm" disabled={pending} className="shadow-[0_0_12px_var(--gold-glow)]">
                {pending ? "등록 중..." : "매니페스트에 추가"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function InsightCard({
  label,
  code,
  value,
  icon: Icon,
  detail,
  tone,
}: {
  label: string;
  code: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  detail: string;
  tone: "success" | "warn";
}) {
  return (
    <div className="panel p-4 shadow-sm transition hover:border-[var(--border-strong)]">
      <div className="mb-1 font-sf text-[9px] font-bold uppercase tracking-wider text-[var(--text-3)]">
        {code}
      </div>
      <div className="text-xs text-[var(--text-2)]">{label}</div>
      <div className={`mt-1 font-mono text-xl font-extrabold ${tone === "success" ? "text-foreground" : "text-[var(--warn-text)]"}`}>
        {value}
      </div>
      <div className="mt-2 flex items-center gap-1.5 font-mono text-xs text-[var(--text-3)]">
        <Icon className={`h-3.5 w-3.5 ${tone === "success" ? "text-[var(--success)]" : "text-[var(--warn)]"}`} />
        <span>{detail}</span>
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
      className={`border-l border-[var(--border)] px-3 py-2 transition first:border-l-0 ${
        active
          ? "bg-[var(--accent)] text-[#070b18]"
          : "text-[var(--text-3)] hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function CollectionTable({
  items,
  franchiseById,
  eventById,
  onReset,
  onAdd,
  hasFilter,
}: {
  items: CollectionItem[];
  franchiseById: Map<string, Franchise>;
  eventById: Map<string, OtakuEvent>;
  onReset: () => void;
  onAdd: () => void;
  hasFilter: boolean;
}) {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  return (
    <div className="panel divide-y divide-[var(--border)] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
      <div className="hidden grid-cols-[minmax(0,1fr)_160px_130px_130px_56px] bg-muted/60 px-4 py-2.5 font-sf text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] md:grid">
        <div>CARGO ITEM / CHANNEL</div>
        <div>LINKED ITINERARY</div>
        <div>VALUATION</div>
        <div>STATUS</div>
        <div />
      </div>
      {items.length === 0 ? (
        <EmptyCollection hasFilter={hasFilter} onReset={onReset} onAdd={onAdd} />
      ) : (
        items.map((item) => {
          const franchise = franchiseById.get(item.franchiseId ?? "");
          const linkedEvent = eventById.get(item.eventId ?? "");
          return (
            <div
              key={item.id}
              className="grid gap-2 p-3.5 transition hover:bg-muted/30 md:grid-cols-[minmax(0,1fr)_160px_130px_130px_56px] md:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg border font-sf text-xs font-bold"
                  style={{
                    color: franchise?.colorCode ?? "var(--accent)",
                    backgroundColor: colorMix(franchise?.colorCode, 0.12),
                    borderColor: colorMix(franchise?.colorCode, 0.35),
                  }}
                >
                  <Package className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{item.itemName}</p>
                  <p className="truncate font-mono text-xs text-[var(--text-3)]">
                    {franchise?.name ?? "미분류"}
                    {item.memo ? ` · ${item.memo}` : ""}
                  </p>
                </div>
              </div>
              <div className="truncate font-mono text-xs text-[var(--text-2)]">
                {linkedEvent?.title ?? "연결 없음"}
              </div>
              <div className="font-mono text-sm font-bold text-[var(--accent-text)]">
                {formatKRW(item.price)}
              </div>
              <div>
                <StatusBadge status={statusOf(item)} />
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" size="icon" aria-label={`${item.itemName} 옵션`} className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })
      )}
      {items.length > 0 && (
        <div className="flex items-center justify-between bg-muted/60 px-4 py-3 font-mono text-xs text-[var(--text-2)]">
          <span className="font-sf text-[10px] uppercase text-[var(--text-3)]">MANIFEST SUM</span>
          <span>
            합계: <strong className="font-bold text-[var(--accent-text)]">{formatKRW(total)}</strong>
          </span>
        </div>
      )}
    </div>
  );
}

function CollectionGrid({
  items,
  franchiseById,
  eventById,
}: {
  items: CollectionItem[];
  franchiseById: Map<string, Franchise>;
  eventById: Map<string, OtakuEvent>;
}) {
  return (
    <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const franchise = franchiseById.get(item.franchiseId ?? "");
        const linkedEvent = eventById.get(item.eventId ?? "");
        return (
          <article
            key={item.id}
            className="panel relative overflow-hidden transition-all hover:border-[var(--hologram)] hover:shadow-[0_0_15px_var(--cyan-glow)]"
          >
            <div
              className="flex aspect-[16/10] items-center justify-center border-b border-[var(--border)]"
              style={{
                backgroundColor: colorMix(franchise?.colorCode, 0.1),
                color: franchise?.colorCode ?? "var(--accent)",
              }}
            >
              <Package className="h-10 w-10 opacity-70" />
            </div>
            <div className="p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="truncate text-sm font-bold text-foreground">{item.itemName}</h3>
                <StatusBadge status={statusOf(item)} compact />
              </div>
              <p className="font-sf text-[11px] font-semibold text-[var(--text-3)]">{franchise?.name ?? "미분류"}</p>
              {linkedEvent && (
                <p className="mt-1 truncate font-mono text-[10px] text-[var(--text-3)]">
                  {linkedEvent.title}
                </p>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-2.5">
                <span className="font-mono text-sm font-bold text-[var(--accent-text)]">{formatKRW(item.price)}</span>
                <span className="font-mono text-[10px] text-[var(--text-3)]">{item.boughtAt ?? "미보관"}</span>
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
      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border)] bg-muted text-[var(--accent)] shadow-sm">
        <Inbox className="h-7 w-7" />
      </div>
      <p className="mt-3 font-sf text-sm font-bold text-foreground">
        {hasFilter ? "조건에 맞는 카고가 없습니다" : "아직 등록된 카고가 없습니다"}
      </p>
      <p className="mt-1 text-xs text-[var(--text-3)]">
        {hasFilter
          ? "필터를 초기화하거나 다른 검색어를 입력해보세요."
          : "관심 굿즈를 카고 매니페스트에 등록하고 관리해보세요."}
      </p>
      <Button
        className="mt-4"
        variant={hasFilter ? "outline" : "default"}
        onClick={hasFilter ? onReset : onAdd}
      >
        {hasFilter ? (
          <>
            <X className="h-4 w-4" />
            필터 초기화
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            첫 카고 등록
          </>
        )}
      </Button>
    </div>
  );
}

function StatusBadge({ status, compact = false }: { status: Exclude<StatusTab, "all">; compact?: boolean }) {
  const config = {
    wishlist: { label: "위시리스트", variant: "warning" as const, icon: Star },
    purchased: { label: "보관 완료", variant: "success" as const, icon: CheckCircle2 },
    reserved: { label: "예약 중", variant: "secondary" as const, icon: Package },
  }[status];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="font-sf">
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

function colorMix(color?: string, opacity = 0.14) {
  if (!color) return `color-mix(in oklch, var(--accent) ${Math.round(opacity * 100)}%, transparent)`;
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`;
}
