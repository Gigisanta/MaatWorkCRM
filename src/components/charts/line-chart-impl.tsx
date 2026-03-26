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
        <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#888888", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#888888", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "#0E0F12",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
            color: "#F0EFE9",
            fontSize: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
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
          dot={false}
          activeDot={{ r: 4, fill: "#8B5CF6" }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
