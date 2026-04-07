"use client";

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AreaChartDataPoint {
  label: string;
  [key: string]: number | string;
}

interface DataKeyConfig {
  key: string;
  name: string;
  color: string;
}

interface AreaChartImplProps {
  data: AreaChartDataPoint[];
  dataKeys: DataKeyConfig[];
  height?: number;
  showLegend?: boolean;
  showComparison?: boolean;
}

const TOOLTIP_STYLE = {
  background: "#0E0F12",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "8px",
  color: "#F0EFE9",
  fontSize: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
};

export function AreaChartImpl({
  data,
  dataKeys,
  height = 300,
  showLegend = true,
  showComparison = false,
}: AreaChartImplProps) {
  const isLargeValue = dataKeys.some((dk) => {
    const max = Math.max(...data.map((d) => Number(d[dk.key]) || 0));
    return max > 1000;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data}>
        <defs>
          {dataKeys.map((dk, index) => (
            <linearGradient
              key={`gradient-${index}`}
              id={`gradient-${dk.key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="5%" stopColor={dk.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={dk.color} stopOpacity={0} />
            </linearGradient>
          ))}
          {showComparison &&
            dataKeys.map((dk, index) => (
              <linearGradient
                key={`gradient-comparison-${index}`}
                id={`gradient-${dk.key}-comparison`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={dk.color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={dk.color} stopOpacity={0} />
              </linearGradient>
            ))}
        </defs>
        <CartesianGrid
          stroke="rgba(255,255,255,0.05)"
          strokeDasharray="3 3"
          vertical={false}
        />
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
          tickFormatter={(v) =>
            isLargeValue ? `$${(v / 1000).toFixed(0)}k` : v
          }
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{ color: "#F0EFE9", marginBottom: "4px" }}
          cursor={{ stroke: "rgba(139,92,246,0.3)", strokeWidth: 1 }}
        />
        {showLegend && (
          <Legend
            formatter={(value) => (
              <span style={{ color: "#94a3b8", fontSize: "12px" }}>{value}</span>
            )}
          />
        )}
        {dataKeys.map((dk) => (
          <Area
            key={dk.key}
            type="monotone"
            dataKey={dk.key}
            stroke={dk.color}
            strokeWidth={2}
            fill={`url(#gradient-${dk.key})`}
            name={dk.name}
            dot={false}
            activeDot={{ r: 4, fill: dk.color }}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
