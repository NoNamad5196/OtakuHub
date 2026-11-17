"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type OtakuSServiceId = "sipsungjang" | "otakuhub" | "gachaguard";

export interface OtakuSService {
  readonly id: OtakuSServiceId;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly color: string;
  readonly href: string | null;
  readonly current: boolean;
}

export interface OtakuSEnv {
  readonly NEXT_PUBLIC_SIPSUNGJANG_URL?: string;
  readonly NEXT_PUBLIC_GACHAGUARD_URL?: string;
}

export function validUrl(value?: string): string | null {
  try {
    const url = new URL(value ?? "");
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export function getOtakuSServices(env?: OtakuSEnv): readonly OtakuSService[] {
  const sipsungjangUrl = env
    ? env.NEXT_PUBLIC_SIPSUNGJANG_URL
    : process.env.NEXT_PUBLIC_SIPSUNGJANG_URL;
  const gachaguardUrl = env
    ? env.NEXT_PUBLIC_GACHAGUARD_URL
    : process.env.NEXT_PUBLIC_GACHAGUARD_URL;

  return [
    {
      id: "sipsungjang",
      name: "SipSungJang",
      description: "육성 · 주간 목표 · 플레이 수첩",
      icon: "✦",
      color: "#c9a84c",
      href: validUrl(sipsungjangUrl),
      current: false,
    },
    {
      id: "otakuhub",
      name: "OtakuHub",
      description: "게임 · 서브컬처 이벤트와 일정",
      icon: "◈",
      color: "#6ab0e8",
      href: "/dashboard",
      current: true,
    },
    {
      id: "gachaguard",
      name: "GachaGuard",
      description: "소비 기록 · 예산 · 과금 돌아보기",
      icon: "⊕",
      color: "#a882e8",
      href: validUrl(gachaguardUrl),
      current: false,
    },
  ];
}

export function AppLauncher({
  compact = false,
  services,
  onNavigate,
}: {
  compact?: boolean;
  services?: readonly OtakuSService[];
  onNavigate?: () => void;
}) {
  const items = services ?? getOtakuSServices();

  return (
    <div className={compact ? "flex flex-col gap-1.5" : "grid gap-3 p-4 md:grid-cols-3"}>
      {items.map((service) => {
        const statusLabel = service.current
          ? "◆ 현재 서비스"
          : service.href
            ? "서비스 열기 ↗"
            : "연결 준비 중";

        const cardClass = compact
          ? cn(
              "flex items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-left transition",
              service.current
                ? "border-[oklch(52%_0.22_265/0.45)] bg-[var(--sidebar-active)] text-white"
                : service.href
                  ? "border-[var(--sidebar-border)] bg-[oklch(18%_0.012_270)] text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-white"
                  : "cursor-not-allowed border-[var(--sidebar-border)] bg-[oklch(16%_0.01_270)] text-[var(--sidebar-muted)] opacity-75",
            )
          : cn(
              "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition",
              service.current
                ? "border-[var(--accent)] bg-[var(--accent-bg)] hover:border-[var(--accent-hover)]"
                : service.href
                  ? "border-[var(--border-strong)] bg-card hover:bg-muted"
                  : "cursor-not-allowed border-[var(--border-strong)] bg-muted opacity-70",
            );

        const content = compact ? (
          <>
            <span className="flex min-w-0 items-center gap-2">
              <span aria-hidden="true" className="text-xs font-bold" style={{ color: service.color }}>
                {service.icon}
              </span>
              <strong className="truncate text-xs font-semibold">{service.name}</strong>
            </span>
            <span
              className={cn(
                "shrink-0 text-[10px] font-semibold",
                service.current || service.href
                  ? "text-[oklch(80%_0.12_265)]"
                  : "text-[var(--sidebar-muted)]",
              )}
            >
              {statusLabel}
            </span>
          </>
        ) : (
          <>
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-lg border text-base font-bold"
              style={{
                color: service.color,
                borderColor: `${service.color}40`,
                backgroundColor: `${service.color}14`,
              }}
            >
              {service.icon}
            </span>
            <strong className="text-sm font-bold text-foreground">{service.name}</strong>
            <small className="text-xs leading-5 text-[var(--text-2)]">{service.description}</small>
            <span
              className={cn(
                "mt-auto pt-1 text-[11px] font-semibold",
                service.current || service.href
                  ? "text-[var(--accent-text)]"
                  : "text-[var(--text-3)]",
              )}
            >
              {statusLabel}
            </span>
          </>
        );

        if (service.href) {
          if (service.current) {
            return (
              <Link key={service.id} href={service.href} onClick={onNavigate} className={cardClass}>
                {content}
              </Link>
            );
          }
          return (
            <a
              key={service.id}
              href={service.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cardClass}
            >
              {content}
            </a>
          );
        }

        return (
          <div key={service.id} aria-disabled="true" className={cardClass}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
