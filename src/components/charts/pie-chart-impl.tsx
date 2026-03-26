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

const PIE_COLORS = ['#8B5CF6', '#4ADE80', '#FBBF24', '#38BDF8', '#F87171', '#A78BFA'];

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
            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
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
        />
        <Legend formatter={(value) => <span className="text-slate-300">{value}</span>} />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
