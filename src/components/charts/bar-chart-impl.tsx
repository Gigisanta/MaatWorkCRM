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
} from "recharts";

const BRAND_COLORS = [
  "#8B5CF6", // violet
  "#4ADE80", // emerald
  "#FBBF24", // amber
  "#A78BFA", // lavender
  "#F87171", // rose
  "#38BDF8", // sky
];

interface BarChartImplProps {
  data: Array<{
    name: string;
    value: number;
    count?: number;
    color?: string;
  }>;
  layout?: "horizontal" | "vertical";
  dataKey?: string;
  nameKey?: string;
}

export function BarChartImpl({
  data,
  layout = "horizontal",
  dataKey = "value",
  nameKey = "name",
}: BarChartImplProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data} layout={layout}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        {layout === "horizontal" ? (
          <>
            <XAxis
              type="number"
              axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
              tickLine={false}
              tick={{ fill: "#888888", fontSize: 11 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              dataKey={nameKey}
              type="category"
              axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
              tickLine={false}
              tick={{ fill: "#888888", fontSize: 11 }}
              width={80}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={nameKey}
              type="category"
              axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
              tickLine={false}
              tick={{ fill: "#888888", fontSize: 11 }}
            />
            <YAxis
              type="number"
              axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
              tickLine={false}
              tick={{ fill: "#888888", fontSize: 11 }}
            />
          </>
        )}
        <Tooltip
          contentStyle={{
            background: "#0E0F12",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
            color: "#F0EFE9",
            fontSize: "12px",
          }}
          labelStyle={{ color: "#F0EFE9", marginBottom: "4px" }}
          itemStyle={{ color: "#A78BFA" }}
          cursor={{ fill: "rgba(139,92,246,0.08)" }}
        />
        <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} name="Valor" fill="#8B5CF6">
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || BRAND_COLORS[index % BRAND_COLORS.length]}
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
