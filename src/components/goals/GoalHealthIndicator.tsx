"use client";

import { CheckCircle2, AlertTriangle, XCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/utils";

type HealthStatus = "on-track" | "at-risk" | "off-track" | "achieved";

interface GoalHealthIndicatorProps {
  health: HealthStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const HEALTH_CONFIG: Record<HealthStatus, {
  icon: typeof CheckCircle2;
  color: string;
  bgColor: string;
  label: string;
}> = {
  "on-track": {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    label: "On Track",
  },
  "at-risk": {
    icon: AlertTriangle,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    label: "At Risk",
  },
  "off-track": {
    icon: XCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    label: "Off Track",
  },
  achieved: {
    icon: Sparkles,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    label: "Achieved",
  },
};

const SIZE_CLASSES = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function GoalHealthIndicator({
  health,
  size = "md",
  showLabel = false,
  className,
}: GoalHealthIndicatorProps) {
  const config = HEALTH_CONFIG[health] ?? HEALTH_CONFIG["on-track"];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full",
          config.bgColor,
          config.color,
          SIZE_CLASSES[size]
        )}
      >
        <Icon className={cn("shrink-0", size === "sm" ? "h-3 w-3" : size === "md" ? "h-3.5 w-3.5" : "h-4 w-4")} />
      </div>
      {showLabel && (
        <span className={cn("text-xs font-medium", config.color)}>
          {config.label}
        </span>
      )}
    </div>
  );
}
