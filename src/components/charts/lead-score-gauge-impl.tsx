"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

type BucketType = "cold" | "warm" | "hot" | "scorching";

interface Bucket {
  bucket: BucketType;
  count: number;
  percentage: number;
  avgValue: number;
}

interface LeadScoreGaugeImplProps {
  buckets: Bucket[];
  height?: number;
}

const BUCKET_COLORS: Record<BucketType, string> = {
  cold: "#60A5FA",
  warm: "#FBBF24",
  hot: "#FB923C",
  scorching: "#F43F5E",
};

const BUCKET_LABELS: Record<BucketType, string> = {
  cold: "Cold",
  warm: "Warm",
  hot: "Hot",
  scorching: "Scorching",
};

const TOOLTIP_STYLE = {
  background: "#0E0F12",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "8px",
  color: "#F0EFE9",
  fontSize: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
};

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value}`;
}

export function LeadScoreGaugeImpl({
  buckets,
  height = 80,
}: LeadScoreGaugeImplProps) {
  const orderedBuckets: BucketType[] = ["cold", "warm", "hot", "scorching"];
  const sortedBuckets = orderedBuckets
    .map((key) => buckets.find((b) => b.bucket === key))
    .filter((b): b is Bucket => b !== undefined);

  const chartData = sortedBuckets.map((b) => ({
    ...b,
    fill: BUCKET_COLORS[b.bucket],
  }));

  return (
    <div className="flex flex-col gap-3 w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={chartData}
          layout="horizontal"
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: "#F0EFE9", marginBottom: "4px" }}
            cursor={{ fill: "rgba(139,92,246,0.08)" }}
            formatter={(value: number, name: string) => {
              return [
                `${formatCurrency(value)} avg`,
                `Bucket: ${name}`,
              ];
            }}
            labelFormatter={(label) => label}
          />
          <Bar
            dataKey="percentage"
            radius={[4, 4, 4, 4]}
            isAnimationActive
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
            <LabelList
              dataKey="avgValue"
              position="insideTop"
              formatter={(val: number) => formatCurrency(val)}
              style={{
                fill: "#F0EFE9",
                fontSize: "10px",
                fontWeight: 500,
              }}
            />
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>

      <div className="flex justify-between px-1">
        {sortedBuckets.map((b) => (
          <div key={b.bucket} className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: BUCKET_COLORS[b.bucket] }}
              />
              <span className="text-xs font-medium text-slate-300">
                {BUCKET_LABELS[b.bucket]}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-slate-400">{b.count}</span>
              <span className="text-[10px] text-slate-500">
                ({b.percentage}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
