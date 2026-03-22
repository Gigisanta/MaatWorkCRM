"use client";

import dynamic from "next/dynamic";

interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  innerRadius?: number;
  outerRadius?: number;
}

const PieChartImpl = dynamic(
  () => import("./pie-chart-impl").then((mod) => mod.PieChartImpl),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full min-h-[200px]">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-400">Cargando gráfico...</span>
        </div>
      </div>
    ),
  }
);

export default function LazyPieChart({
  data,
  innerRadius = 60,
  outerRadius = 100,
}: PieChartProps) {
  return (
    <PieChartImpl
      data={data}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
    />
  );
}
