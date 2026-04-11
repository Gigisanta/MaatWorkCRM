"use client";

import { GoalProgressRingImpl } from "@/components/charts/goal-progress-ring-impl";
import { cn } from "@/lib/utils/utils";

type GoalStatus = "healthy" | "warning" | "danger" | "achieved";
type GoalSize = "sm" | "md" | "lg";

interface GoalProgressRingProps {
  progress: number; // 0-100
  size?: GoalSize;
  status?: GoalStatus;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

const SIZE_MAP: Record<GoalSize, number> = {
  sm: 48,
  md: 80,
  lg: 120,
};

const STROKE_WIDTH_MAP: Record<GoalSize, number> = {
  sm: 5,
  md: 8,
  lg: 12,
};

const STATUS_COLOR_MAP: Record<GoalStatus, string> = {
  healthy: "#4ADE80",
  warning: "#FBBF24",
  danger: "#F87171",
  achieved: "#8B5CF6",
};

export function GoalProgressRing({
  progress,
  size = "md",
  status,
  label,
  showPercentage = true,
  className,
}: GoalProgressRingProps) {
  const ringSize = SIZE_MAP[size];
  const strokeWidth = STROKE_WIDTH_MAP[size];
  const color = status ? STATUS_COLOR_MAP[status] : undefined;

  // For achieved status, always show 100% progress with violet color
  const displayProgress = status === "achieved" ? 100 : progress;

  return (
    <GoalProgressRingImpl
      value={displayProgress}
      size={ringSize}
      strokeWidth={strokeWidth}
      color={color}
      label={label}
      showPercentage={showPercentage}
      status={status === "achieved" ? "healthy" : status}
    />
  );
}
