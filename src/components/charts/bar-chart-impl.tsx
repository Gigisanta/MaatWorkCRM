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

interface BarChartImplProps {
  data: Array<{
    name: string;
    value: number;
    count?: number;
    color: string;
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
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        {layout === "horizontal" ? (
          <>
            <XAxis
              type="number"
              stroke="#64748b"
              fontSize={12}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <YAxis dataKey={nameKey} type="category" stroke="#64748b" fontSize={12} width={80} />
          </>
        ) : (
          <>
            <XAxis dataKey={nameKey} type="category" stroke="#64748b" fontSize={12} />
            <YAxis type="number" stroke="#64748b" fontSize={12} />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
          }}
        />
        <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} name="Valor">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
