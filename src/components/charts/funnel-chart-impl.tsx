"use client";

import * as React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

interface FunnelStage {
  name: string;
  count: number;
  value: number;
  conversionRate: number | null;
  color: string;
}

interface FunnelChartImplProps {
  data: FunnelStage[];
  height?: number;
  metric?: "count" | "value";
  showConversionRate?: boolean;
}

const TOOLTIP_STYLE = {
  background: "#0E0F12",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "8px",
  color: "#F0EFE9",
  fontSize: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
};

interface FunnelBar {
  name: string;
  count: number;
  value: number;
  conversionRate: number | null;
  color: string;
  fullWidth: number;
}

function buildFunnelBars(
  data: FunnelStage[],
  metric: "count" | "value"
): FunnelBar[] {
  const maxValue = Math.max(...data.map((d) => d[metric]));
  const minBarWidth = 0.1;

  return data.map((stage, index) => {
    const rawWidth = maxValue > 0 ? stage[metric] / maxValue : 0;
    const barWidth = Math.max(rawWidth, minBarWidth);
    return {
      ...stage,
      fullWidth: barWidth,
    };
  });
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value}`;
}

function formatCount(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

export function FunnelChartImpl({
  data,
  height = 350,
  metric = "count",
  showConversionRate = true,
}: FunnelChartImplProps) {
  const funnelBars = buildFunnelBars(data, metric);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={funnelBars}
        layout="vertical"
        margin={{ top: 10, right: 80, left: 20, bottom: 10 }}
      >
        <CartesianGrid
          stroke="rgba(255,255,255,0.05)"
          strokeDasharray="3 3"
          horizontal={false}
        />
        <XAxis
          type="number"
          domain={[0, 1]}
          axisLine={false}
          tickLine={false}
          tick={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#94a3b8", fontSize: 12 }}
          width={100}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{ color: "#F0EFE9", marginBottom: "4px" }}
          cursor={{ fill: "rgba(139,92,246,0.08)" }}
          formatter={(value: number, name: string) => {
            if (name === "count") return [formatCount(value), "Count"];
            if (name === "value") return [formatCurrency(value), "Value"];
            return [value, name];
          }}
          labelFormatter={(label) => {
            const stage = funnelBars.find((b) => b.name === label);
            return stage ? label : label;
          }}
        />
        <Bar
          dataKey="fullWidth"
          radius={[0, 4, 4, 0]}
          name={metric}
          isAnimationActive
        >
          {funnelBars.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              opacity={0.85 - index * 0.05}
            />
          ))}
          <LabelList
            dataKey={metric}
            position="right"
            formatter={(val: number) =>
              metric === "value" ? formatCurrency(val) : formatCount(val)
            }
            style={{ fill: "#94a3b8", fontSize: "11px" }}
          />
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
