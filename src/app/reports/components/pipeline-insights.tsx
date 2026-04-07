"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Target, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import LazyBarChart from "@/components/charts/lazy-bar-chart";
import LazyLineChart from "@/components/charts/lazy-line-chart";
import type { PipelineMetrics } from "../types/analytics";

interface PipelineInsightsProps {
  data: PipelineMetrics;
}

function formatCurrency(value: number) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value}`;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
  subtext,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  subtext?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
      <div className={cn("p-2 rounded-lg", bgColor)}>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className={cn("text-lg font-bold", color)}>{value}</p>
        {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-36 animate-pulse rounded bg-slate-700" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-800/50" />
        ))}
      </div>
      <div className="h-[200px] animate-pulse rounded-lg bg-slate-800/30" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-500">
      <Target className="h-8 w-8 mb-2 opacity-50" />
      <p className="text-sm">No hay datos de pipeline disponibles</p>
    </div>
  );
}

export default function PipelineInsights({ data }: PipelineInsightsProps) {
  const hasData = data && data.stageDistribution && data.stageDistribution.length > 0;

  // Stage distribution for bar chart
  const stageBarData = React.useMemo(() => {
    if (!hasData) return [];
    return data.stageDistribution.map((stage) => ({
      name: stage.stageName,
      value: stage.value,
      count: stage.count,
      color: stage.color,
    }));
  }, [data, hasData]);

  // Stage count data
  const stageCountData = React.useMemo(() => {
    if (!hasData) return [];
    return data.stageDistribution.map((stage) => ({
      name: stage.stageName,
      value: stage.count,
      color: stage.color,
    }));
  }, [data, hasData]);

  // Revenue forecast by month for line chart
  const forecastLineData = React.useMemo(() => {
    if (!data?.revenueForecast?.byMonth || data.revenueForecast.byMonth.length === 0) {
      return [];
    }
    return data.revenueForecast.byMonth.map((month) => ({
      label: month.month,
      forecast: month.value,
      weighted: month.weightedValue,
    }));
  }, [data]);

  return (
    <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
      <CardHeader>
        <p className="text-xs text-violet-400 uppercase tracking-widest">INSIGHTS</p>
        <CardTitle className="text-lg font-bold text-white">Insights de Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData && !data?.revenueForecast ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MetricCard
                label="Mejor Caso"
                value={formatCurrency(data?.revenueForecast?.bestCase || 0)}
                icon={TrendingUp}
                color="text-emerald-400"
                bgColor="bg-emerald-500/10"
              />
              <MetricCard
                label="Mas Probable"
                value={formatCurrency(data?.revenueForecast?.mostLikely || 0)}
                icon={DollarSign}
                color="text-violet-400"
                bgColor="bg-violet-500/10"
              />
              <MetricCard
                label="Cerrado Este Periodo"
                value={formatCurrency(data?.revenueForecast?.closedThisPeriod || 0)}
                icon={Target}
                color="text-amber-400"
                bgColor="bg-amber-500/10"
              />
            </div>

            {/* Bottleneck Alert */}
            {data?.velocityMetrics?.bottleneckStage && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <p className="text-sm text-amber-400">
                  Etapa cuello de botella: <span className="font-medium">{data.velocityMetrics.bottleneckStage}</span>
                </p>
              </div>
            )}

            {/* Velocity Metrics */}
            {data?.velocityMetrics && (
              <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/30 text-xs">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-400">Dias promedio para cerrar:</span>
                  <span className="font-medium text-white">{data.velocityMetrics.avgDaysToClose}</span>
                </div>
                {data.velocityMetrics.avgDaysToCloseChange !== 0 && (
                  <div
                    className={cn(
                      "flex items-center gap-1",
                      data.velocityMetrics.avgDaysToCloseChange < 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    )}
                  >
                    <TrendingUp
                      className={cn(
                        "h-3 w-3",
                        data.velocityMetrics.avgDaysToCloseChange < 0 && "rotate-180"
                      )}
                    />
                    <span>{Math.abs(data.velocityMetrics.avgDaysToCloseChange).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Stage Distribution Charts */}
            {stageBarData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Value by Stage */}
                <div className="p-4 rounded-lg bg-slate-800/30">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                    Valor por Etapa
                  </p>
                  <div className="h-[180px]">
                    <LazyBarChart data={stageBarData} layout="vertical" dataKey="value" nameKey="name" />
                  </div>
                </div>

                {/* Count by Stage */}
                <div className="p-4 rounded-lg bg-slate-800/30">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                    Cantidad por Etapa
                  </p>
                  <div className="h-[180px]">
                    <LazyBarChart data={stageCountData} layout="vertical" dataKey="value" nameKey="name" />
                  </div>
                </div>
              </div>
            )}

            {/* Revenue Forecast by Month */}
            {forecastLineData.length > 0 && (
              <div className="p-4 rounded-lg bg-slate-800/30">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                  Pronostico de Ingresos por Mes
                </p>
                <div className="h-[200px]">
                  <LazyLineChart
                    data={forecastLineData}
                    dataKey="forecast"
                    name="Pronostico"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
