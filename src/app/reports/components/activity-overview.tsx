"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, AlertTriangle, ListTodo, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/utils";
import LazyLineChart from "@/components/charts/lazy-line-chart";
import type { ActivityMetrics } from "../types/analytics";

interface ActivityOverviewProps {
  data: ActivityMetrics;
}

function StatBox({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
  change,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  change?: number;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
      <div className={cn("p-2 rounded-lg", bgColor)}>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-400">{label}</p>
        <div className="flex items-center gap-2">
          <p className={cn("text-lg font-bold", color)}>{value}</p>
          {change !== undefined && change !== 0 && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                change > 0 ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {change > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(progress, 100)}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "h-full rounded-full",
          progress >= 75
            ? "bg-emerald-500"
            : progress >= 50
            ? "bg-amber-500"
            : "bg-rose-500"
        )}
      />
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-36 animate-pulse rounded bg-slate-700" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
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
      <ListTodo className="h-8 w-8 mb-2 opacity-50" />
      <p className="text-sm">No hay datos de actividad disponibles</p>
    </div>
  );
}

export default function ActivityOverview({ data }: ActivityOverviewProps) {
  const hasData = data && data.tasks && data.meetings;

  // Activity trend data for line chart
  const trendData = React.useMemo(() => {
    if (!data?.trend || data.trend.length === 0) return [];
    return data.trend.map((point) => ({
      label: point.label,
      tasks: point.tasksCompleted,
      meetings: point.meetings,
    }));
  }, [data]);

  // Calculate completion rate
  const completionRate = React.useMemo(() => {
    if (!hasData || !data.tasks) return 0;
    if (data.tasks.total === 0) return 0;
    return (data.tasks.completed / data.tasks.total) * 100;
  }, [data, hasData]);

  return (
    <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
      <CardHeader>
        <p className="text-xs text-violet-400 uppercase tracking-widest">RESUMEN</p>
        <CardTitle className="text-lg font-bold text-white">Resumen de Actividad</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {/* Task Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox
                label="Total Tareas"
                value={data.tasks.total}
                icon={ListTodo}
                color="text-white"
                bgColor="bg-slate-700/50"
              />
              <StatBox
                label="Completadas"
                value={data.tasks.completed}
                icon={CheckCircle}
                color="text-emerald-400"
                bgColor="bg-emerald-500/10"
              />
              <StatBox
                label="Pendientes"
                value={data.tasks.pending}
                icon={Clock}
                color="text-amber-400"
                bgColor="bg-amber-500/10"
              />
              <StatBox
                label="Vencidas"
                value={data.tasks.overdue}
                icon={AlertTriangle}
                color={data.tasks.overdue > 0 ? "text-rose-400" : "text-slate-400"}
                bgColor={data.tasks.overdue > 0 ? "bg-rose-500/10" : "bg-slate-700/50"}
              />
            </div>

            {/* Overdue Alert */}
            {data.tasks.overdue > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20"
              >
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <p className="text-sm text-rose-400">
                  Tienes <span className="font-bold">{data.tasks.overdue}</span> tarea
                  {data.tasks.overdue > 1 ? "s" : ""} vencida
                  {data.tasks.overdue > 1 ? "s" : ""}
                </p>
              </motion.div>
            )}

            {/* Completion Rate */}
            <div className="p-4 rounded-lg bg-slate-800/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400">Tasa de Completacion</p>
                <span
                  className={cn(
                    "text-sm font-bold",
                    completionRate >= 75
                      ? "text-emerald-400"
                      : completionRate >= 50
                      ? "text-amber-400"
                      : "text-rose-400"
                  )}
                >
                  {completionRate.toFixed(0)}%
                </span>
              </div>
              <ProgressBar progress={completionRate} />
              <div className="flex justify-between mt-1 text-xs text-slate-500">
                <span>{data.tasks.completed} completadas</span>
                <span>{data.tasks.total} total</span>
              </div>
            </div>

            {/* Meetings Stats */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Calendar className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Reuniones</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-white">{data.meetings.total}</p>
                  {data.meetings.totalChange !== 0 && (
                    <span
                      className={cn(
                        "flex items-center gap-0.5 text-xs font-medium",
                        data.meetings.totalChange > 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                      )}
                    >
                      {data.meetings.totalChange > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(data.meetings.totalChange).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Activity Trend Chart */}
            {trendData.length > 0 && (
              <div className="p-4 rounded-lg bg-slate-800/30">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                  Tendencia de Actividad
                </p>
                <div className="h-[200px]">
                  <LazyLineChart
                    data={trendData}
                    dataKey="tasks"
                    name="Tareas Completadas"
                  />
                </div>
              </div>
            )}

            {/* Tasks by Status/Priority breakdown */}
            {data.tasks.byStatus && Object.keys(data.tasks.byStatus).length > 0 && (
              <div className="p-4 rounded-lg bg-slate-800/30">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                  Tareas por Estado
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.tasks.byStatus).map(([status, count]) => (
                    <div
                      key={status}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/50"
                    >
                      <span className="text-xs text-slate-400 capitalize">
                        {status.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm font-medium text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks by Priority */}
            {data.tasks.byPriority && Object.keys(data.tasks.byPriority).length > 0 && (
              <div className="p-4 rounded-lg bg-slate-800/30">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                  Tareas por Prioridad
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.tasks.byPriority).map(([priority, count]) => {
                    const priorityColors: Record<string, string> = {
                      high: "bg-rose-500/20 text-rose-400",
                      medium: "bg-amber-500/20 text-amber-400",
                      low: "bg-emerald-500/20 text-emerald-400",
                    };
                    return (
                      <div
                        key={priority}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                          priorityColors[priority.toLowerCase()] || "bg-slate-700/50 text-slate-300"
                        )}
                      >
                        <span className="text-xs capitalize">{priority}</span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
