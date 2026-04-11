"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Target, CheckCircle, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/utils";
import type { GoalsMetrics } from "../types/analytics";

interface GoalPerformanceProps {
  data: GoalsMetrics;
}

function ProgressBar({
  progress,
  colorClass,
}: {
  progress: number;
  colorClass: string;
}) {
  return (
    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(progress, 100)}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={cn("h-full rounded-full", colorClass)}
      />
    </div>
  );
}

function GoalTypeCard({
  goalType,
  index,
}: {
  goalType: GoalsMetrics["byType"][number];
  index: number;
}) {
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-emerald-500";
    if (progress >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getStatusColor = (onTrack: boolean) => {
    return onTrack ? "text-emerald-400" : "text-rose-400";
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        ease: [0.16, 1, 0.3, 1],
        delay: index * 0.05,
      }}
      className="p-4 rounded-lg bg-slate-800/30 border border-white/5"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-white">{goalType.label}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {goalType.goalsCount} objetivo{goalType.goalsCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {goalType.completedCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle className="h-3 w-3" />
              {goalType.completedCount}
            </span>
          )}
          {goalType.atRiskCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-rose-400">
              <AlertTriangle className="h-3 w-3" />
              {goalType.atRiskCount}
            </span>
          )}
        </div>
      </div>

      <ProgressBar progress={goalType.progress} colorClass={getProgressColor(goalType.progress)} />

      <div className="flex items-center justify-between mt-2 text-xs">
        <span className="text-slate-400">
          {formatValue(goalType.currentValue)} / {formatValue(goalType.targetValue)}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{goalType.progress.toFixed(0)}%</span>
          <span className={cn("flex items-center gap-1", getStatusColor(goalType.onTrack))}>
            {goalType.onTrack ? (
              <>
                <TrendingUp className="h-3 w-3" />
                Al ritmo
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" />
                Atrasado
              </>
            )}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-40 animate-pulse rounded bg-slate-700" />
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-800/50" />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-500">
      <Target className="h-8 w-8 mb-2 opacity-50" />
      <p className="text-sm">No hay datos de objetivos disponibles</p>
    </div>
  );
}

export default function GoalPerformance({ data }: GoalPerformanceProps) {
  const hasData = data && data.byType && data.byType.length > 0;

  // Summary stats
  const stats = React.useMemo(() => {
    if (!hasData || !data.overall) {
      return { active: 0, completed: 0, atRisk: 0, avgProgress: 0, pacingIndex: 0 };
    }
    return {
      active: data.overall.activeGoals,
      completed: data.overall.completedGoals,
      atRisk: data.overall.atRiskGoals,
      avgProgress: data.overall.avgProgress,
      pacingIndex: data.overall.pacingIndex,
    };
  }, [data, hasData]);

  return (
    <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
      <CardHeader>
        <p className="text-xs text-violet-400 uppercase tracking-widest">RENDIMIENTO</p>
        <CardTitle className="text-lg font-bold text-white">Rendimiento de Objetivos</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                <div className="p-2 rounded-lg bg-violet-500/10">
                  <Target className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Activos</p>
                  <p className="text-lg font-bold text-white">{stats.active}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Completados</p>
                  <p className="text-lg font-bold text-emerald-400">{stats.completed}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                <div className="p-2 rounded-lg bg-rose-500/10">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">En Riesgo</p>
                  <p className="text-lg font-bold text-rose-400">{stats.atRisk}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Progreso Prom.</p>
                  <p className="text-lg font-bold text-amber-400">{stats.avgProgress.toFixed(0)}%</p>
                </div>
              </div>
            </div>

            {/* Pacing Indicator */}
            <div
              className={cn(
                "flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium",
                stats.pacingIndex >= 0.8
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-amber-500/10 text-amber-400"
              )}
            >
              {stats.pacingIndex >= 0.8 ? (
                <>
                  <TrendingUp className="h-4 w-4" />
                  <span>Equipo al ritmo de los objetivos</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  <span>Equipo atrasado en objetivos</span>
                </>
              )}
            </div>

            {/* Goal Types Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.byType.map((goalType, index) => (
                <GoalTypeCard key={goalType.type} goalType={goalType} index={index} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
