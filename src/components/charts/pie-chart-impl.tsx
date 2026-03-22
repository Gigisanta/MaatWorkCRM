"use client";

import * as React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PieChartImplProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  innerRadius?: number;
  outerRadius?: number;
}

export function PieChartImpl({
  data,
  innerRadius = 60,
  outerRadius = 100,
}: PieChartImplProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={5}
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
          }}
        />
        <Legend formatter={(value) => <span className="text-slate-300">{value}</span>} />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
