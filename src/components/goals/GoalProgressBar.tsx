"use client";

import { cn } from "@/lib/utils";

interface GoalProgressBarProps {
  progress: number; // 0-100
  status?: "healthy" | "warning" | "danger" | "achieved";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const STATUS_COLORS = {
  healthy: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  achieved: "bg-violet-500",
};

const SIZE_CLASSES = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
};

export function GoalProgressBar({
  progress,
  status = "healthy",
  size = "md",
  showLabel = false,
  className,
}: GoalProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const barColor = STATUS_COLORS[status];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex-1 rounded-full bg-white/8 overflow-hidden",
          SIZE_CLASSES[size]
        )}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", barColor)}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-400 font-medium tabular-nums min-w-[2.5rem] text-right">
          {clampedProgress}%
        </span>
      )}
    </div>
  );
}
