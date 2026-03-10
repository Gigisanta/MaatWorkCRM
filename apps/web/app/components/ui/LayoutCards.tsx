import type { LucideIcon } from "lucide-react";
import type React from "react";
import { cn } from "~/lib/utils";
import { Card } from "./Card";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down";
  icon: LucideIcon;
  variant?: "brand" | "emerald" | "amber" | "violet" | "white";
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeType,
  icon: Icon,
  variant = "brand",
  className,
}: StatCardProps) {
  const colors = {
    brand: "bg-primary/10 text-primary border border-primary/20",
    emerald: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
    violet: "bg-violet-500/10 text-violet-600 border border-violet-500/20",
    white: "bg-surface-100 text-surface-700 border border-border/50",
  };

  return (
    <Card variant="elevated" className={cn("p-6 group", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 px-1 relative z-10">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] opacity-70 group-hover:opacity-100 transition-opacity">
            {label}
          </p>
          <p className="text-3xl font-black text-text tracking-tighter group-hover:text-primary transition-all duration-150">
            {value}
          </p>

          {change && (
            <div
              className={cn(
                "flex items-center gap-1.5 mt-3 text-[10px] font-black px-2.5 py-1 rounded-md w-fit uppercase tracking-widest transition-all duration-150",
                changeType === "up"
                  ? "bg-success/10 text-success border border-success/20"
                  : "bg-error/10 text-error border border-error/20",
              )}
            >
              <span className="flex items-center gap-1">
                {changeType === "up" ? "↗" : "↘"} {change}
              </span>
            </div>
          )}
        </div>

        <div className={cn("p-3 rounded-lg transition-all duration-150 group-hover:scale-[1.005]", colors[variant])}>
          <Icon className="w-6 h-6" strokeWidth={2.5} />
        </div>
      </div>
    </Card>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, icon: Icon, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8", className)}>
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center border border-border/50 text-primary">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text font-display tracking-tight">{title}</h1>
          {description && <p className="text-text-muted mt-1 text-sm sm:text-base font-medium">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}
