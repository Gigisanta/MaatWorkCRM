"use client";

import dynamic from "next/dynamic";

interface LeadScoreGaugeProps {
  buckets: Array<{
    bucket: "cold" | "warm" | "hot" | "scorching";
    count: number;
    percentage: number;
    avgValue: number;
  }>;
  height?: number;
}

const LeadScoreGaugeImpl = dynamic(
  () =>
    import("./lead-score-gauge-impl").then((mod) => mod.LeadScoreGaugeImpl),
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

export default function LazyLeadScoreGauge({
  buckets,
  height = 80,
}: LeadScoreGaugeProps) {
  return <LeadScoreGaugeImpl buckets={buckets} height={height} />;
}
