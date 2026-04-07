"use client";

import dynamic from "next/dynamic";

interface AreaChartProps {
  data: Array<{ label: string; [key: string]: number | string }>;
  dataKeys: Array<{ key: string; name: string; color: string }>;
  height?: number;
  showLegend?: boolean;
  showComparison?: boolean;
}

const AreaChartImpl = dynamic(
  () => import("./area-chart-impl").then((mod) => mod.AreaChartImpl),
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

export default function LazyAreaChart({
  data,
  dataKeys,
  height = 300,
  showLegend = true,
  showComparison = false,
}: AreaChartProps) {
  return (
    <AreaChartImpl
      data={data}
      dataKeys={dataKeys}
      height={height}
      showLegend={showLegend}
      showComparison={showComparison}
    />
  );
}
