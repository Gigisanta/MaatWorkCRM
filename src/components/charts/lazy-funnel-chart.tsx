"use client";

import dynamic from "next/dynamic";

interface FunnelChartProps {
  data: Array<{
    name: string;
    count: number;
    value: number;
    conversionRate: number | null;
    color: string;
  }>;
  height?: number;
  metric?: "count" | "value";
  showConversionRate?: boolean;
}

const FunnelChartImpl = dynamic(
  () => import("./funnel-chart-impl").then((mod) => mod.FunnelChartImpl),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full min-h-[200px]">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-400">Cargando gráfico...</span>
        </div>
      </div>
    ),
  }
);

export default function LazyFunnelChart({
  data,
  height = 350,
  metric = "count",
  showConversionRate = true,
}: FunnelChartProps) {
  return (
    <FunnelChartImpl
      data={data}
      height={height}
      metric={metric}
      showConversionRate={showConversionRate}
    />
  );
}
