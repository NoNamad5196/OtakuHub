import type * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-9.5 w-full rounded-md border border-[var(--border)] bg-input px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-[var(--hologram)] focus:ring-1 focus:ring-[var(--hologram)] focus:shadow-[0_0_10px_var(--cyan-glow)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
