import type * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "outline" | "warning" | "success" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase transition-colors",
        variant === "default" &&
          "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent-text)] shadow-[0_0_8px_var(--gold-glow)]",
        variant === "secondary" &&
          "border-[var(--border)] bg-secondary text-secondary-foreground",
        variant === "outline" &&
          "border-[var(--border-strong)] bg-card/60 text-[var(--text-2)]",
        variant === "warning" &&
          "border-[var(--warn)]/40 bg-[var(--warn-bg)] text-[var(--warn-text)] shadow-[0_0_8px_rgba(251,191,36,0.15)]",
        variant === "success" &&
          "border-[var(--success)]/40 bg-[var(--success-bg)] text-[var(--success-text)] shadow-[0_0_8px_rgba(52,211,153,0.15)]",
        variant === "danger" &&
          "border-[var(--danger)]/40 bg-[var(--danger-bg)] text-[var(--danger-text)] shadow-[0_0_8px_rgba(248,113,113,0.15)]",
        className,
      )}
      {...props}
    />
  );
}
