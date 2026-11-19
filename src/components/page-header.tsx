import type { LucideIcon } from "lucide-react";

export function PageHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3.5">
        <span className="relative mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--border-strong)] bg-secondary text-[var(--accent-text)] shadow-[0_0_12px_var(--gold-glow)] backdrop-blur-md">
          <Icon className="h-5 w-5" />
          <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-[var(--hologram)] shadow-[0_0_6px_var(--cyan-glow)]" />
        </span>
        <div>
          <div className="font-sf text-[10px] font-extrabold tracking-widest text-[var(--hologram)] uppercase">
            ASTRAL DECK // STATION TELEMETRY
          </div>
          <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
