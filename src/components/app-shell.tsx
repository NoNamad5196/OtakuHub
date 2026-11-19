"use client";

import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Compass,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  Package,
  Plus,
  Radio,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { AppLauncher } from "@/components/app-launcher";
import { AuthButton } from "@/components/auth-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Franchise } from "@/lib/types";

const navItems = [
  {
    href: "/dashboard",
    label: "대시보드",
    code: "EXPRESS DECK",
    icon: LayoutDashboard,
  },
  {
    href: "/discover",
    label: "탐색",
    code: "WARP SCANNER",
    icon: Compass,
  },
  {
    href: "/calendar",
    label: "캘린더",
    code: "STAR CHART",
    icon: CalendarDays,
  },
  {
    href: "/collections",
    label: "컬렉션",
    code: "CARGO BAY",
    icon: Package,
  },
  {
    href: "/settings",
    label: "설정",
    code: "BRIDGE",
    icon: Settings,
  },
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
      {/* Mobile Drawer Trigger */}
      <button
        type="button"
        aria-label={mobileOpen ? "내비게이션 닫기" : "내비게이션 열기"}
        className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-strong)] bg-[var(--sidebar-bg)] text-[var(--accent)] shadow-lg backdrop-blur-md transition-all hover:border-[var(--hologram)] hover:text-[var(--hologram)] hover:shadow-[0_0_12px_var(--cyan-glow)] lg:hidden"
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="내비게이션 배경 닫기"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Astral Express Navigation Rail */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[244px] shrink-0 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] transition-transform duration-200 lg:relative lg:translate-x-0",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        )}
      >
        <SidebarContent
          franchises={franchises}
          pendingSuggestionCount={pendingSuggestionCount}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>

      {/* Main Observatory Screen */}
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
  const [launcherOpen, setLauncherOpen] = useState(false);
  const sortedFranchises = useMemo(
    () => [...franchises].sort((a, b) => (a.priority ?? 9) - (b.priority ?? 9) || a.name.localeCompare(b.name)),
    [franchises],
  );

  return (
    <nav className="flex h-full flex-col overflow-hidden">
      {/* Astral Express Brand / Deck Header */}
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="group relative flex items-center gap-3 border-b border-[var(--sidebar-border)] px-4 py-4.5 transition-colors hover:bg-[var(--sidebar-hover)]"
      >
        {/* Glowing Astral Compass Logo */}
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--accent)] bg-[var(--accent-bg)] shadow-[0_0_12px_var(--gold-glow)] transition-transform group-hover:scale-105">
          <span className="font-sf text-xs font-black tracking-wider text-[var(--accent-text)]">
            ✦ OH
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[var(--sidebar-bg)] bg-[var(--hologram)]" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="block truncate font-sf text-sm font-extrabold tracking-wide text-foreground">
              OtakuHub
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-widest text-[var(--sidebar-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
            <span>ASTRAL EXPRESS</span>
          </div>
        </div>
      </Link>

      {/* Primary Rail Navigation */}
      <div className="shrink-0 space-y-1 px-2.5 py-3">
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
                "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 transition-all",
                active
                  ? "border border-[var(--accent)]/40 bg-[var(--sidebar-active)] text-foreground shadow-[inset_0_1px_0_rgba(223,185,109,0.2)]"
                  : "border border-transparent text-[var(--sidebar-text)] hover:border-[var(--sidebar-border)] hover:bg-[var(--sidebar-hover)] hover:text-foreground",
              )}
            >
              {/* Active Route Indicator */}
              {active && (
                <span className="absolute -left-2.5 h-6 w-1 rounded-r-full bg-[var(--accent)] shadow-[0_0_8px_var(--gold-glow)]" />
              )}
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active ? "text-[var(--accent-text)]" : "text-[var(--sidebar-muted)] group-hover:text-foreground",
                )}
                strokeWidth={active ? 2.4 : 1.8}
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-bold leading-tight">{item.label}</span>
                <span
                  className={cn(
                    "font-sf text-[9px] font-semibold tracking-wider transition-colors",
                    active ? "text-[var(--accent-text)]/90" : "text-[var(--sidebar-muted)]",
                  )}
                >
                  {item.code}
                </span>
              </div>
              {badge > 0 && (
                <span className="rounded-full border border-[var(--warn)]/40 bg-[var(--warn-bg)] px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-[var(--warn-text)] shadow-[0_0_8px_rgba(251,191,36,0.3)]">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Active Franchise Routes Section */}
      <div className="flex min-h-0 flex-1 flex-col border-t border-[var(--sidebar-border)]">
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2.5 text-left transition hover:bg-[var(--sidebar-hover)]"
          onClick={() => setGamesOpen((open) => !open)}
        >
          <ChevronRight
            className={cn("h-3 w-3 text-[var(--sidebar-muted)] transition-transform", gamesOpen && "rotate-90")}
          />
          <span className="flex-1 font-sf text-[10px] font-extrabold uppercase tracking-widest text-[var(--sidebar-muted)]">
            ROUTE CHANNELS // 내 게임
          </span>
          <span className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--sidebar-muted)]">
            {sortedFranchises.length}
          </span>
        </button>

        <div
          className={cn(
            "sidebar-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-5 space-y-1 transition-opacity",
            gamesOpen ? "opacity-100" : "pointer-events-none h-0 flex-none opacity-0",
          )}
        >
          {sortedFranchises.map((franchise) => (
            <Link
              key={franchise.id}
              href="/settings#games"
              onClick={onNavigate}
              className="group flex items-center gap-2 rounded-md border border-transparent px-2.5 py-1.5 text-xs text-[var(--sidebar-text)] transition hover:border-[var(--sidebar-border)] hover:bg-[var(--sidebar-hover)] hover:text-foreground"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full shadow-[0_0_6px_currentColor]"
                style={{ backgroundColor: franchise.colorCode, color: franchise.colorCode }}
              />
              <span className="truncate font-medium">{franchise.name}</span>
            </Link>
          ))}
          <Link
            href="/settings#games"
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-md border border-dashed border-[var(--sidebar-border)] px-2.5 py-1.5 text-xs text-[var(--sidebar-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent-text)]"
          >
            <Plus className="h-3 w-3 text-[var(--accent)]" />
            <span className="font-sf text-[11px] font-semibold">채널 관리 / 추가</span>
          </Link>
        </div>
      </div>

      {/* Bottom Telemetry & Controls */}
      <div className="border-t border-[var(--sidebar-border)] p-3">
        {/* Holographic App Launcher Relay */}
        <div className="mb-2.5">
          <button
            type="button"
            onClick={() => setLauncherOpen((open) => !open)}
            aria-expanded={launcherOpen}
            className="flex w-full items-center justify-between rounded-lg border border-[var(--sidebar-border)] bg-[var(--surface-raised)]/70 px-3 py-2 text-xs font-semibold text-foreground transition hover:border-[var(--hologram)] hover:shadow-[0_0_10px_var(--cyan-glow)]"
          >
            <span className="flex items-center gap-2">
              <LayoutGrid className="h-3.5 w-3.5 text-[var(--hologram)]" />
              <span>연결된 서비스</span>
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-[var(--sidebar-muted)] transition-transform",
                launcherOpen && "rotate-180",
              )}
            />
          </button>
          {launcherOpen && (
            <div className="mt-2 rounded-lg border border-[var(--sidebar-border)] bg-[var(--surface)] p-1.5 shadow-xl">
              <AppLauncher compact onNavigate={onNavigate} />
            </div>
          )}
        </div>

        {/* Warp Scanner Mini Telemetry */}
        <div className="mb-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)]/60 p-2.5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Radio className="h-3.5 w-3.5 text-[var(--hologram)] animate-pulse" />
            <span className="font-sf text-[11px] tracking-wider text-[var(--hologram)]">AI WARP SCAN</span>
            <Badge variant="warning" className="ml-auto font-mono text-[10px]">
              {pendingSuggestionCount}건
            </Badge>
          </div>
          <p className="mt-1 font-sans text-[11px] leading-4 text-[var(--sidebar-muted)]">
            승인한 일정만 캘린더에 기록됩니다.
          </p>
        </div>

        {/* Passenger Profile */}
        <div className="flex items-center gap-2.5 rounded-md border border-[var(--sidebar-border)] bg-[var(--surface)]/50 p-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--accent-bg)] font-sf text-xs font-bold text-[var(--accent-text)] shadow-[0_0_8px_var(--gold-glow)]">
            N
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-sf text-xs font-bold text-foreground">NoNamad5196</div>
            <div className="font-mono text-[10px] text-[var(--sidebar-muted)]">PASSENGER // BETA</div>
          </div>
          <LogOut className="h-3.5 w-3.5 text-[var(--sidebar-muted)]" />
        </div>

        <div className="mt-2">
          <AuthButton compact />
        </div>
      </div>
    </nav>
  );
}
