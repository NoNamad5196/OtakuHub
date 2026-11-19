import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold tracking-wide transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "border border-[var(--accent)] bg-[var(--accent)] text-[#070b18] shadow-sm hover:bg-[var(--accent-hover)] hover:border-[var(--accent-hover)] hover:shadow-[0_0_14px_var(--gold-glow)] font-bold",
        destructive:
          "border border-[var(--danger)] bg-[var(--danger)] text-white shadow-sm hover:brightness-110 hover:shadow-[0_0_12px_rgba(248,113,113,0.3)]",
        outline:
          "border border-[var(--border-strong)] bg-card/90 text-foreground shadow-sm hover:border-[var(--hologram)] hover:text-[var(--hologram)] hover:bg-[var(--hologram-bg)] hover:shadow-[0_0_12px_var(--cyan-glow)]",
        secondary:
          "border border-[var(--border)] bg-secondary text-secondary-foreground hover:bg-[var(--accent-bg)] hover:border-[var(--accent)] hover:text-[var(--accent-text)]",
        ghost:
          "text-[var(--text-2)] hover:bg-muted hover:text-foreground hover:border-transparent",
      },
      size: {
        sm: "h-8.5 px-3 text-xs [&_svg]:h-3.5 [&_svg]:w-3.5",
        default: "h-9.5 px-4 py-2 text-sm [&_svg]:h-4 [&_svg]:w-4",
        icon: "h-9.5 w-9.5 [&_svg]:h-4 [&_svg]:w-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
