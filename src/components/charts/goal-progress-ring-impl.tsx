"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface GoalProgressRingImplProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  showPercentage?: boolean;
  status?: "healthy" | "warning" | "danger";
}

const STATUS_COLORS = {
  healthy: "#4ADE80",
  warning: "#FBBF24",
  danger: "#F87171",
};

const TOOLTIP_STYLE = {
  background: "#0E0F12",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "8px",
  color: "#F0EFE9",
  fontSize: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
};

export function GoalProgressRingImpl({
  value,
  size = 120,
  strokeWidth = 12,
  color = "#8B5CF6",
  label,
  showPercentage = true,
  status,
}: GoalProgressRingImplProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const ringColor = status ? STATUS_COLORS[status] : color;

  const innerRadius = size / 2 - strokeWidth;
  const outerRadius = size / 2;

  const data = [
    { name: "progress", value: clampedValue },
    { name: "remaining", value: 100 - clampedValue },
  ];

  const centerX = size / 2;
  const centerY = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ width: size, height: size, position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx={centerX}
              cy={centerY}
              startAngle={90}
              endAngle={-270}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={0}
              dataKey="value"
              strokeWidth={strokeWidth}
              isAnimationActive
            >
              <Cell
                key="progress-cell"
                fill={ringColor}
                stroke="none"
              />
              <Cell
                key="remaining-cell"
                fill="rgba(255,255,255,0.08)"
                stroke="none"
              />
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(_val: number) => [`${clampedValue}%`, "Progreso"] as [string, string]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          {showPercentage && (
            <span
              style={{
                fontSize: size * 0.22,
                fontWeight: 700,
                color: "#F0EFE9",
                lineHeight: 1,
              }}
            >
              {clampedValue}%
            </span>
          )}
        </div>
      </div>

      {label && (
        <span className="text-xs text-slate-400 text-center">{label}</span>
      )}
    </div>
  );
}
