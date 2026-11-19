import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <Card className="group relative overflow-hidden transition-all hover:border-[var(--hologram)] hover:shadow-[0_0_18px_var(--cyan-glow)]">
      <div className="absolute right-0 top-0 h-8 w-8 translate-x-4 -translate-y-4 rounded-full bg-[var(--hologram)]/10 blur-xl transition-all group-hover:scale-150" />
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2 border-b-0">
        <CardTitle className="font-sf text-xs font-bold tracking-wider text-muted-foreground uppercase">
          {label}
        </CardTitle>
        <span className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] bg-secondary/60 text-[var(--hologram)] shadow-sm">
          <Icon className="h-3.5 w-3.5" />
        </span>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="font-mono text-2xl font-extrabold tracking-tight text-foreground">
          {value}
        </div>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
          {detail}
        </p>
      </CardContent>
    </Card>
  );
}
