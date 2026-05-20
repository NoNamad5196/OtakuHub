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
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold leading-5",
        variant === "default" && "bg-primary text-primary-foreground",
        variant === "secondary" && "bg-secondary text-secondary-foreground",
        variant === "outline" && "border border-[var(--border-strong)] bg-card text-[var(--text-2)]",
        variant === "warning" && "bg-[var(--warn-bg)] text-[var(--warn-text)]",
        variant === "success" && "bg-[var(--success-bg)] text-[var(--success-text)]",
        variant === "danger" && "bg-[var(--danger-bg)] text-[var(--danger-text)]",
        className,
      )}
      {...props}
    />
  );
}
