"use client";

import dynamic from "next/dynamic";

interface GoalProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  showPercentage?: boolean;
  status?: "healthy" | "warning" | "danger";
}

const GoalProgressRingImpl = dynamic(
  () =>
    import("./goal-progress-ring-impl").then(
      (mod) => mod.GoalProgressRingImpl
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full min-h-[200px]">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-400">Cargando gráfico...</span>
        </div>
      </div>
    ),
  }
);

export default function LazyGoalProgressRing({
  value,
  size = 120,
  strokeWidth = 12,
  color = "#8B5CF6",
  label,
  showPercentage = true,
  status,
}: GoalProgressRingProps) {
  return (
    <GoalProgressRingImpl
      value={value}
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      label={label}
      showPercentage={showPercentage}
      status={status}
    />
  );
}
