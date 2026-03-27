"use client";

import dynamic from "next/dynamic";

interface BarChartProps {
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

const BarChartImpl = dynamic(
  () => import("./bar-chart-impl").then((mod) => mod.BarChartImpl),
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

export default function LazyBarChart({
  data,
  layout = "horizontal",
  dataKey = "value",
  nameKey = "name",
}: BarChartProps) {
  return (
    <BarChartImpl
      data={data}
      layout={layout}
      dataKey={dataKey}
      nameKey={nameKey}
    />
  );
}
