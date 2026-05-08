import {
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { ActiveNavLink } from "@/components/active-nav-link";
import { AuthButton } from "@/components/auth-button";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/dashboard", label: "대시보드", iconName: "dashboard" },
  { href: "/calendar", label: "캘린더", iconName: "calendar" },
  { href: "/franchises", label: "프랜차이즈", iconName: "star" },
  { href: "/discover", label: "수집/검수", iconName: "radio" },
  { href: "/collections", label: "굿즈", iconName: "gem" },
  { href: "/settings", label: "설정", iconName: "settings" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-wide">
                OtakuHub
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                일정 수집부터 굿즈 체크까지
              </span>
            </span>
          </Link>
          <div className="hidden items-center gap-3 md:flex">
            <Badge variant="outline">Portfolio + Beta MVP</Badge>
            <AuthButton />
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6 md:hidden">
          {navItems.map((item) => (
            <ActiveNavLink key={item.href} href={item.href} iconName={item.iconName}>
              {item.label}
            </ActiveNavLink>
          ))}
        </nav>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-2">
            {navItems.map((item) => (
              <ActiveNavLink key={item.href} href={item.href} iconName={item.iconName}>
                {item.label}
              </ActiveNavLink>
            ))}
          </div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
