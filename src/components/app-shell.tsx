"use client";

import {
  CalendarDays,
  ChevronRight,
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { AuthButton } from "@/components/auth-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Franchise } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/discover", label: "탐색", icon: Compass },
  { href: "/calendar", label: "캘린더", icon: CalendarDays },
  { href: "/collections", label: "컬렉션", icon: Package },
  { href: "/settings", label: "설정", icon: Settings },
] as const;

export function AppShell({
  children,
  franchises,
  pendingSuggestionCount,
}: {
  children: React.ReactNode;
  franchises: Franchise[];
  pendingSuggestionCount: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <button
        type="button"
        aria-label={mobileOpen ? "내비게이션 닫기" : "내비게이션 열기"}
        className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] text-white shadow-lg lg:hidden"
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && (
        <button
          type="button"
          aria-label="내비게이션 배경 닫기"
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[228px] shrink-0 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] transition-transform duration-200 lg:relative lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent
          franchises={franchises}
          pendingSuggestionCount={pendingSuggestionCount}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>

      <main className="screen-enter min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-background">
        {children}
      </main>
    </div>
  );
}

function SidebarContent({
  franchises,
  pendingSuggestionCount,
  onNavigate,
}: {
  franchises: Franchise[];
  pendingSuggestionCount: number;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const [gamesOpen, setGamesOpen] = useState(true);
  const sortedFranchises = useMemo(
    () => [...franchises].sort((a, b) => (a.priority ?? 9) - (b.priority ?? 9) || a.name.localeCompare(b.name)),
    [franchises],
  );

  return (
    <nav className="flex h-full flex-col overflow-hidden">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-3 border-b border-[var(--sidebar-border)] px-4 py-5"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[oklch(52%_0.22_265)] text-xs font-extrabold tracking-tight text-white">
          OH
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold tracking-tight text-white">OtakuHub</span>
          <span className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--sidebar-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            Beta
          </span>
        </span>
      </Link>

      <div className="shrink-0 space-y-1 px-2 py-3">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const badge = item.href === "/discover" ? pendingSuggestionCount : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-[var(--sidebar-text)] transition hover:bg-[var(--sidebar-hover)] hover:text-white",
                active && "bg-[var(--sidebar-active)] text-[oklch(85%_0.06_265)]",
              )}
            >
              {active && <span className="absolute left-0 h-5 w-0.5 rounded-full bg-[oklch(52%_0.22_265)]" />}
              <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
              <span className="flex-1 truncate">{item.label}</span>
              {badge > 0 && (
                <span className="rounded-full bg-[var(--warn)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1 flex-col border-t border-[var(--sidebar-border)]">
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-3 text-left transition hover:bg-[var(--sidebar-hover)]"
          onClick={() => setGamesOpen((open) => !open)}
        >
          <ChevronRight
            className={cn("h-3 w-3 text-[var(--sidebar-muted)] transition-transform", gamesOpen && "rotate-90")}
          />
          <span className="flex-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--sidebar-muted)]">
            내 게임
          </span>
          <span className="text-[10px] font-semibold text-[var(--sidebar-muted)]">{sortedFranchises.length}</span>
        </button>

        <div
          className={cn(
            "sidebar-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-3 transition-opacity",
            gamesOpen ? "opacity-100" : "pointer-events-none h-0 flex-none opacity-0",
          )}
        >
          {sortedFranchises.map((franchise) => (
            <Link
              key={franchise.id}
              href={`/settings#games`}
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[var(--sidebar-text)] transition hover:bg-[var(--sidebar-hover)] hover:text-white"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-sm"
                style={{ backgroundColor: franchise.colorCode }}
              />
              <span className="truncate">{franchise.name}</span>
            </Link>
          ))}
          <Link
            href="/settings#games"
            onClick={onNavigate}
            className="mt-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[var(--sidebar-muted)] transition hover:bg-[var(--sidebar-hover)] hover:text-white"
          >
            <Plus className="h-3 w-3" />
            게임 추가 / 관리
          </Link>
        </div>
      </div>

      <div className="border-t border-[var(--sidebar-border)] p-3">
        <div className="mb-3 rounded-lg border border-[var(--sidebar-border)] bg-[oklch(18%_0.012_270)] p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
            AI 검수 대기
            <Badge variant="warning" className="ml-auto">
              {pendingSuggestionCount}건
            </Badge>
          </div>
          <p className="mt-1.5 text-[11px] leading-4 text-[var(--sidebar-muted)]">
            승인한 일정만 캘린더에 반영됩니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[oklch(30%_0.03_265)] bg-[oklch(24%_0.022_265)] text-xs font-bold text-[oklch(72%_0.08_265)]">
            N
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-[oklch(78%_0.006_270)]">NoNamad5196</div>
            <div className="text-[11px] text-[var(--sidebar-muted)]">베타 사용자</div>
          </div>
          <LogOut className="h-4 w-4 text-[var(--sidebar-muted)]" />
        </div>
        <div className="mt-3">
          <AuthButton compact />
        </div>
      </div>
    </nav>
  );
}
