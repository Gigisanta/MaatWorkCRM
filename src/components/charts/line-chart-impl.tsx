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
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
          }}
        />
        <Legend formatter={(value) => <span className="text-slate-300">{value}</span>} />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke="#6366f1"
          strokeWidth={2}
          name={name}
          dot={{ fill: "#6366f1" }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
