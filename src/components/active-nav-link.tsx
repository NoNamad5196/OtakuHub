"use client";

import { CalendarDays, Gem, LayoutDashboard, RadioTower, Settings, Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const icons = {
  dashboard: LayoutDashboard,
  calendar: CalendarDays,
  star: Star,
  radio: RadioTower,
  gem: Gem,
  settings: Settings,
};

export function ActiveNavLink({
  href,
  iconName,
  children,
}: {
  href: string;
  iconName: keyof typeof icons;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const Icon = icons[iconName];

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-md border px-3 font-sf text-xs font-bold tracking-wide transition-all",
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-[#070b18] shadow-[0_0_12px_var(--gold-glow)]"
          : "border-transparent text-muted-foreground hover:border-[var(--border)] hover:bg-secondary hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="whitespace-nowrap">{children}</span>
    </Link>
  );
}
