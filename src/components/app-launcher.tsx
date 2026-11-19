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
      color: "#dfb96d",
      href: validUrl(sipsungjangUrl),
      current: false,
    },
    {
      id: "otakuhub",
      name: "OtakuHub",
      description: "게임 · 서브컬처 이벤트와 일정",
      icon: "◈",
      color: "#5ce1ff",
      href: "/dashboard",
      current: true,
    },
    {
      id: "gachaguard",
      name: "GachaGuard",
      description: "소비 기록 · 예산 · 과금 돌아보기",
      icon: "⊕",
      color: "#9d84ff",
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
              "flex items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-left transition-all",
              service.current
                ? "border-[var(--accent)]/60 bg-[var(--sidebar-active)] text-foreground shadow-[0_0_10px_var(--gold-glow)]"
                : service.href
                  ? "border-[var(--sidebar-border)] bg-[var(--surface-raised)]/80 text-[var(--sidebar-text)] hover:border-[var(--hologram)] hover:bg-[var(--sidebar-hover)] hover:text-foreground hover:shadow-[0_0_8px_var(--cyan-glow)]"
                  : "cursor-not-allowed border-[var(--sidebar-border)]/60 bg-[var(--surface)]/40 text-[var(--sidebar-muted)] opacity-70",
            )
          : cn(
              "group relative flex flex-col items-start gap-2.5 rounded-lg border p-4 text-left backdrop-blur-md transition-all",
              service.current
                ? "border-[var(--accent)] bg-[var(--accent-bg)] shadow-[0_0_15px_var(--gold-glow)]"
                : service.href
                  ? "border-[var(--border)] bg-card hover:border-[var(--hologram)] hover:shadow-[0_0_16px_var(--cyan-glow)]"
                  : "cursor-not-allowed border-[var(--border)]/60 bg-muted/40 opacity-70",
            );

        const content = compact ? (
          <>
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden="true"
                className="font-sf text-xs font-bold drop-shadow-[0_0_6px_currentColor]"
                style={{ color: service.color }}
              >
                {service.icon}
              </span>
              <strong className="truncate font-sf text-xs font-bold text-foreground">{service.name}</strong>
            </span>
            <span
              className={cn(
                "shrink-0 font-sf text-[10px] font-bold tracking-wider",
                service.current || service.href
                  ? "text-[var(--accent-text)]"
                  : "text-[var(--sidebar-muted)]",
              )}
            >
              {statusLabel}
            </span>
          </>
        ) : (
          <>
            <div className="flex w-full items-center justify-between">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-lg border font-sf text-base font-bold shadow-sm"
                style={{
                  color: service.color,
                  borderColor: `${service.color}60`,
                  backgroundColor: `${service.color}18`,
                  boxShadow: `0 0 12px ${service.color}30`,
                }}
              >
                {service.icon}
              </span>
              <span
                className={cn(
                  "font-sf text-[10px] font-bold tracking-wider uppercase",
                  service.current
                    ? "text-[var(--accent-text)]"
                    : service.href
                      ? "text-[var(--hologram)]"
                      : "text-muted-foreground",
                )}
              >
                {statusLabel}
              </span>
            </div>
            <strong className="font-sf text-base font-bold tracking-wide text-foreground">
              {service.name}
            </strong>
            <small className="text-xs leading-5 text-[var(--text-2)]">{service.description}</small>
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
