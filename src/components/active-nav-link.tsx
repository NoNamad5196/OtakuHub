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
        "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground",
        active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="whitespace-nowrap">{children}</span>
    </Link>
  );
}
