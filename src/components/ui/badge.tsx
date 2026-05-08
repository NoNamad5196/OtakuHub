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
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        variant === "default" && "bg-primary text-primary-foreground",
        variant === "secondary" && "bg-secondary text-secondary-foreground",
        variant === "outline" && "border text-muted-foreground",
        variant === "warning" && "bg-amber-400/15 text-amber-200",
        variant === "success" && "bg-emerald-400/15 text-emerald-200",
        variant === "danger" && "bg-destructive/20 text-red-100",
        className,
      )}
      {...props}
    />
  );
}
