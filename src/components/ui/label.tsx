import type * as React from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-xs font-bold tracking-wider uppercase text-foreground/90",
        className,
      )}
      {...props}
    />
  );
}
