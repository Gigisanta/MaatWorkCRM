"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, Trophy, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/utils";
import type { AdvisorMetrics } from "../types/analytics";

interface AdvisorPerformanceProps {
  data: AdvisorMetrics;
}

type SortKey = "rank" | "advisorName" | "contacts" | "pipelineValue" | "revenue" | "goalAttainment" | "tasksCompleted" | "compositeScore";
type SortDirection = "asc" | "desc";

function formatCurrency(value: number) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value}`;
}

function RankBadge({ rank }: { rank: number }) {
  const getBadgeStyle = () => {
    switch (rank) {
      case 1:
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case 2:
        return "bg-slate-400/20 text-slate-300 border-slate-400/30";
      case 3:
        return "bg-orange-600/20 text-orange-400 border-orange-600/30";
      default:
        return "bg-slate-700/50 text-slate-400 border-slate-600/30";
    }
  };

  return (
    <div
      className={cn(
        "w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-bold",
        getBadgeStyle()
      )}
    >
      #{rank}
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  currentSort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: { key: SortKey; direction: SortDirection };
  onSort: (key: SortKey) => void;
}) {
  const isActive = currentSort.key === sortKey;

  return (
    <button
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors group"
    >
      {label}
      <span className="flex flex-col">
        <ChevronUp
          className={cn(
            "h-3 w-3 -mb-1",
            isActive && currentSort.direction === "asc" ? "text-violet-400" : "text-slate-600"
          )}
        />
        <ChevronDown
          className={cn(
            "h-3 w-3",
            isActive && currentSort.direction === "desc" ? "text-violet-400" : "text-slate-600"
          )}
        />
      </span>
    </button>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const widthPercent = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="h-1.5 w-16 bg-slate-700 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${widthPercent}%` }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-500">
      <Trophy className="h-8 w-8 mb-2 opacity-50" />
      <p className="text-sm">No hay datos de asesores disponibles</p>
    </div>
  );
}

export default function AdvisorPerformance({ data }: AdvisorPerformanceProps) {
  const hasData = data && data.rankings && data.rankings.length > 0;

  const [sortState, setSortState] = React.useState<{ key: SortKey; direction: SortDirection }>({
    key: "rank",
    direction: "asc",
  });

  const handleSort = (key: SortKey) => {
    setSortState((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedRankings = React.useMemo(() => {
    if (!hasData) return [];

    const sorted = [...data.rankings].sort((a, b) => {
      let aVal: string | number = a[sortState.key];
      let bVal: string | number = b[sortState.key];

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (sortState.direction === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return sorted;
  }, [data, sortState, hasData]);

  // Max values for mini bar charts
  const maxValues = React.useMemo(() => {
    if (!hasData || data.rankings.length === 0) {
      return { pipelineValue: 0, revenue: 0 };
    }
    return {
      pipelineValue: Math.max(...data.rankings.map((r) => r.pipelineValue), 1),
      revenue: Math.max(...data.rankings.map((r) => r.revenue), 1),
    };
  }, [data, hasData]);

  const isNeedsAttention = (advisorId: string) => {
    return data?.comparisons?.needsAttention === advisorId;
  };

  return (
    <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
      <CardHeader>
        <p className="text-xs text-violet-400 uppercase tracking-widest">RENDIMIENTO</p>
        <CardTitle className="text-lg font-bold text-white">Rendimiento por Asesor</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {/* Comparison Badges */}
            {data.comparisons && (
              <div className="flex flex-wrap gap-3">
                {data.comparisons.bestPerformer && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Trophy className="h-3 w-3 text-amber-400" />
                    <span className="text-xs text-amber-400">
                      Mejor: {data.comparisons.bestPerformerName}
                    </span>
                  </div>
                )}
                {data.comparisons.mostImproved && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                    <span className="text-xs text-emerald-400">
                      Mas Mejorado: {data.comparisons.mostImprovedName}
                    </span>
                  </div>
                )}
                {data.comparisons.needsAttention && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <AlertTriangle className="h-3 w-3 text-rose-400" />
                    <span className="text-xs text-rose-400">
                      Atencion: {data.comparisons.needsAttentionName}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2">
                      <span className="text-xs text-slate-500 uppercase tracking-wider">#</span>
                    </th>
                    <th className="text-left py-3 px-2">
                      <SortableHeader
                        label="Nombre"
                        sortKey="advisorName"
                        currentSort={sortState}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="text-right py-3 px-2">
                      <SortableHeader
                        label="Contactos"
                        sortKey="contacts"
                        currentSort={sortState}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="text-right py-3 px-2">
                      <SortableHeader
                        label="Pipeline"
                        sortKey="pipelineValue"
                        currentSort={sortState}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="text-right py-3 px-2">
                      <SortableHeader
                        label="Revenue"
                        sortKey="revenue"
                        currentSort={sortState}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="text-right py-3 px-2">
                      <SortableHeader
                        label="Goals %"
                        sortKey="goalAttainment"
                        currentSort={sortState}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="text-right py-3 px-2">
                      <SortableHeader
                        label="Tasks"
                        sortKey="tasksCompleted"
                        currentSort={sortState}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="text-right py-3 px-2">
                      <SortableHeader
                        label="Score"
                        sortKey="compositeScore"
                        currentSort={sortState}
                        onSort={handleSort}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRankings.map((advisor, index) => {
                    const attention = isNeedsAttention(advisor.advisorId);

                    return (
                      <motion.tr
                        key={advisor.advisorId}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.35,
                          ease: [0.16, 1, 0.3, 1],
                          delay: index * 0.03,
                        }}
                        className={cn(
                          "border-b border-white/5 transition-colors",
                          attention
                            ? "bg-rose-500/5 hover:bg-rose-500/10"
                            : "hover:bg-white/5"
                        )}
                      >
                        <td className="py-3 px-2">
                          <RankBadge rank={advisor.rank} />
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium",
                                attention
                                  ? "bg-rose-500/20 text-rose-400"
                                  : "bg-violet-500/20 text-violet-400"
                              )}
                            >
                              {advisor.advisorName.charAt(0).toUpperCase()}
                            </div>
                            <span
                              className={cn(
                                "text-sm font-medium",
                                attention ? "text-rose-300" : "text-white"
                              )}
                            >
                              {advisor.advisorName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right text-sm text-slate-300">
                          {advisor.contacts}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-end gap-2">
                            <MiniBar
                              value={advisor.pipelineValue}
                              max={maxValues.pipelineValue}
                              color="#8B5CF6"
                            />
                            <span className="text-sm text-slate-300 w-16 text-right">
                              {formatCurrency(advisor.pipelineValue)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-end gap-2">
                            <MiniBar
                              value={advisor.revenue}
                              max={maxValues.revenue}
                              color="#4ADE80"
                            />
                            <span className="text-sm text-slate-300 w-16 text-right">
                              {formatCurrency(advisor.revenue)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              advisor.goalAttainment >= 75
                                ? "text-emerald-400"
                                : advisor.goalAttainment >= 50
                                ? "text-amber-400"
                                : "text-rose-400"
                            )}
                          >
                            {advisor.goalAttainment.toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right text-sm text-slate-300">
                          {advisor.tasksCompleted}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span
                            className={cn(
                              "text-sm font-bold",
                              advisor.compositeScore >= 80
                                ? "text-emerald-400"
                                : advisor.compositeScore >= 60
                                ? "text-amber-400"
                                : "text-rose-400"
                            )}
                          >
                            {advisor.compositeScore.toFixed(0)}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
