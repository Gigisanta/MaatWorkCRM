"use client";

import dynamic from "next/dynamic";

interface LineChartProps {
  data: Array<{
    label: string;
    nuevos?: number;
    activos?: number;
  }>;
  dataKey?: string;
  name?: string;
}

const LineChartImpl = dynamic(
  () => import("./line-chart-impl").then((mod) => mod.LineChartImpl),
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

export default function LazyLineChart({
  data,
  dataKey = "nuevos",
  name = "Nuevos",
}: LineChartProps) {
  return <LineChartImpl data={data} dataKey={dataKey} name={name} />;
}
