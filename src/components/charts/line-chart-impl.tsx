"use client";

import * as React from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface LineChartImplProps {
  data: Array<{
    label: string;
    nuevos?: number;
    activos?: number;
  }>;
  dataKey?: string;
  name?: string;
}

export function LineChartImpl({
  data,
  dataKey = "nuevos",
  name = "Nuevos",
}: LineChartImplProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "#888888", fontSize: 11 }}
          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#888888", fontSize: 11 }}
          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "#0E0F12",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
            color: "#F0EFE9",
            fontSize: "12px",
          }}
          labelStyle={{ color: "#F0EFE9", marginBottom: "4px" }}
          cursor={{ stroke: "rgba(139,92,246,0.3)", strokeWidth: 1 }}
        />
        <Legend formatter={(value) => <span style={{ color: "#94a3b8", fontSize: "12px" }}>{value}</span>} />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke="#8B5CF6"
          strokeWidth={2}
          name={name}
          dot={{ fill: "#8B5CF6", r: 3 }}
          activeDot={{ fill: "#A78BFA", r: 5, stroke: "rgba(139,92,246,0.3)", strokeWidth: 4 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
