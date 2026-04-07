"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Users, TrendingDown, Target, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import LazyBarChart from "@/components/charts/lazy-bar-chart";
import LazyFunnelChart from "@/components/charts/lazy-funnel-chart";
import type { FunnelMetrics } from "../types/analytics";

interface FunnelAnalyticsProps {
  data: FunnelMetrics;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-500">
      <Target className="h-8 w-8 mb-2 opacity-50" />
      <p className="text-sm">No hay datos de embudo disponibles</p>
    </div>
  );
}

export default function FunnelAnalytics({ data }: FunnelAnalyticsProps) {
  const hasData = data && data.stages && data.stages.length > 0;

  // Prepare bar chart data for stage values
  const stageValueData = React.useMemo(() => {
    if (!hasData) return [];
    return data.stages
      .filter((s) => !s.isLost)
      .map((stage) => ({
        name: stage.name,
        value: stage.value,
        count: stage.count,
        color: stage.color,
      }));
  }, [data, hasData]);

  return (
    <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
      <CardHeader>
        <p className="text-xs text-violet-400 uppercase tracking-widest">ANALISIS</p>
        <CardTitle className="text-lg font-bold text-white">Analisis de Embudo</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Funnel Visualization */}
            <div>
              {data.stages.length > 0 ? (
                <LazyFunnelChart
                  data={data.stages.filter(s => !s.isLost).map((stage) => ({
                    name: stage.name,
                    count: stage.count,
                    value: stage.value,
                    conversionRate: stage.conversionRate,
                    color: stage.color,
                  }))}
                  height={280}
                  metric="count"
                  showConversionRate
                />
              ) : (
                <EmptyState />
              )}
            </div>

            {/* Right: Summary Stats */}
            <div className="space-y-4">
              {/* Total Contacts */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                <div className="p-2 rounded-lg bg-violet-500/10">
                  <Users className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Contactos Totales</p>
                  <p className="text-lg font-bold text-white">{data.totalContacts.toLocaleString()}</p>
                </div>
              </div>

              {/* Lost Contacts */}
              <div
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg",
                  data.lostContacts > 0 ? "bg-rose-500/10" : "bg-slate-800/50"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    data.lostContacts > 0 ? "bg-rose-500/10" : "bg-slate-700/50"
                  )}
                >
                  <TrendingDown
                    className={cn(
                      "h-4 w-4",
                      data.lostContacts > 0 ? "text-rose-400" : "text-slate-400"
                    )}
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Contactos Perdidos</p>
                  <p
                    className={cn(
                      "text-lg font-bold",
                      data.lostContacts > 0 ? "text-rose-400" : "text-white"
                    )}
                  >
                    {data.lostContacts.toLocaleString()}
                    {data.lostContactsValue > 0 && (
                      <span className="text-sm ml-2 text-rose-500/70">
                        (${data.lostContactsValue.toLocaleString()})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Overall Conversion Rate */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Target className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Tasa de Conversion</p>
                  <p className="text-lg font-bold text-emerald-400">
                    {data.overallConversionRate.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Stage Details */}
              <div className="space-y-2 pt-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Detalle por Etapa</p>
                {data.stages.slice(0, 5).map((stage) => (
                  <div
                    key={stage.id}
                    className="flex items-center justify-between text-sm py-1.5 border-b border-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="text-slate-300">{stage.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>{stage.count} contacts</span>
                      <span>${stage.value.toLocaleString()}</span>
                      {stage.avgTimeInStage !== null && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {stage.avgTimeInStage}d
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Value Bar Chart */}
              {stageValueData.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                    Valor por Etapa
                  </p>
                  <div className="h-[150px]">
                    <LazyBarChart data={stageValueData} layout="vertical" dataKey="value" nameKey="name" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
