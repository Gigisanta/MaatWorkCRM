"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  AlertTriangle,
  Activity,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ExecutiveMetrics } from "../types/analytics";

// Lazy ring chart with dynamic import fallback
import dynamic from "next/dynamic";

const LazyGoalProgressRing = dynamic(
  () => import("@/components/charts/lazy-goal-progress-ring"),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center animate-pulse"
        style={{ width: 48, height: 48 }}
      >
        <div className="w-10 h-10 rounded-full bg-white/5" />
      </div>
    ),
  }
);

// Animation variant
const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

interface Props {
  data: ExecutiveMetrics;
}

export default function ExecutiveSummary({ data }: Props) {
  const kpis: KPICardProps[] = [
    {
      title: "Pipeline Value",
      value: `$${data.pipelineValue.toLocaleString()}`,
      change: data.pipelineChange,
      icon: DollarSign,
      color: "text-violet-400",
      bgColor: "bg-violet-500/10",
    },
    {
      title: "Tasa de Conversión",
      value: `${data.winRate.toFixed(1)}%`,
      change: 0, // win rate doesn't have period-over-period in this data
      icon: Target,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Health Score",
      value: data.healthScore,
      change: data.healthScoreChange,
      icon: Activity,
      color: "text-violet-400",
      bgColor: "bg-violet-500/10",
      isHealthScore: true,
    },
    {
      title: "Progreso Objetivos",
      value: `${data.avgGoalProgress.toFixed(0)}%`,
      change: 0,
      icon: Target,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Revenue Forecast",
      value: `$${data.revenueForecast.toLocaleString()}`,
      change: data.revenueForecastChange,
      icon: DollarSign,
      color: "text-sky-400",
      bgColor: "bg-sky-500/10",
    },
    {
      title: "Contacts at Risk",
      value: data.staleContacts,
      change: 0,
      icon: AlertTriangle,
      color: data.staleContacts > 0 ? "text-rose-400" : "text-slate-400",
      bgColor: data.staleContacts > 0 ? "bg-rose-500/10" : "bg-slate-500/10",
      alert: data.staleContacts > 0,
    },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* KPI Grid - 6 columns on xl, 3 on lg, 2 on sm, 1 on xs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={i} variants={item}>
            <KPICard {...kpi} />
          </motion.div>
        ))}
      </div>

      {/* Secondary row - 3 metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <SecondaryMetric
          label="Contactos Totales"
          value={data.totalContacts}
          sub={`${data.activeContacts} activos`}
          icon={Users}
          color="text-violet-400"
        />
        <SecondaryMetric
          label="Tareas Vencidas"
          value={data.overdueTasks}
          sub={data.overdueTasks > 0 ? `${data.overdueTasksChange > 0 ? "+" : ""}${data.overdueTasksChange}% vs periodo anterior` : "Sin vencidas"}
          icon={AlertTriangle}
          color={data.overdueTasks > 0 ? "text-rose-400" : "text-emerald-400"}
          alert={data.overdueTasks > 0}
        />
        <SecondaryMetric
          label="Reuniones"
          value={data.meetingsHeld}
          sub={data.meetingsChange > 0 ? `+${data.meetingsChange}% vs periodo anterior` : `${data.meetingsChange}% vs periodo anterior`}
          icon={Calendar}
          color="text-sky-400"
        />
      </div>
    </motion.div>
  );
}

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  alert?: boolean;
  isHealthScore?: boolean;
}

function KPICard({ title, value, change, icon: Icon, color, bgColor, alert, isHealthScore }: KPICardProps) {
  const isPositive = change >= 0;

  return (
    <Card className={cn(
      "bg-[#0E0F12]/80 backdrop-blur-sm rounded-xl overflow-hidden",
      alert ? "border-rose-500/30" : "border-white/8"
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn("p-2.5 rounded-xl", bgColor)}>
            <Icon className={cn("h-5 w-5", color)} />
          </div>
          {change !== 0 && !isHealthScore && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isPositive ? "text-emerald-500" : "text-rose-500"
            )}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
          {isHealthScore && change !== 0 && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isPositive ? "text-emerald-500" : "text-rose-500"
            )}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>

        <div className="mt-4">
          {isHealthScore ? (
            <div className="flex items-center gap-3">
              <LazyGoalProgressRing
                value={value as number}
                size={48}
                strokeWidth={5}
                color="#8B5CF6"
                label=""
              />
              <div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{title}</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-400">{title}</p>
              <p className="text-2xl font-bold text-white mt-1">{value}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SecondaryMetricProps {
  label: string;
  value: number;
  sub: string;
  icon: React.ElementType;
  color: string;
  alert?: boolean;
}

function SecondaryMetric({ label, value, sub, icon: Icon, color, alert }: SecondaryMetricProps) {
  return (
    <Card className={cn(
      "bg-[#0E0F12]/80 backdrop-blur-sm border rounded-xl",
      alert ? "border-rose-500/30" : "border-white/8"
    )}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("p-2.5 rounded-xl", alert ? "bg-rose-500/10" : "bg-slate-500/10")}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className={cn("text-lg font-bold", alert ? "text-rose-400" : "text-white")}>
            {value.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}
