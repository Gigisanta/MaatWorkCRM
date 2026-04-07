'use client';

import * as React from "react";
import { Target, TrendingUp, CheckCircle2, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface GoalStatsProps {
  total: number;
  inProgress: number;
  completed: number;
  averageProgress: number;
  isLoading: boolean;
  onCreateClick: () => void;
}

export function GoalStats({
  total,
  inProgress,
  completed,
  averageProgress,
  isLoading,
  onCreateClick,
}: GoalStatsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-1">
          OBJETIVOS
        </p>
        <h1 className="text-2xl font-bold text-white tracking-tight">Mis Objetivos</h1>
        <p className="text-slate-500 mt-1 text-sm">
          {isLoading ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-600 animate-pulse" />
              Cargando...
            </span>
          ) : (
            <>
              <span className="text-white font-semibold">{total}</span>
              {" objetivos en total"}
            </>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={onCreateClick}
          className="bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-200 gap-2"
        >
          <Target className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo Objetivo</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>
    </div>
  );
}

export function GoalStatsSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <Skeleton className="h-3 w-20 bg-white/5 mb-2" />
        <Skeleton className="h-7 w-36 bg-white/5 mb-2" />
        <Skeleton className="h-4 w-44 bg-white/5" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28 bg-white/5" />
      </div>
    </div>
  );
}

interface GoalStatsCardsProps {
  total: number;
  inProgress: number;
  completed: number;
  averageProgress: number;
  isLoading: boolean;
}

export function GoalStatsCards({
  total,
  inProgress,
  completed,
  averageProgress,
  isLoading,
}: GoalStatsCardsProps) {
  const stats = [
    {
      label: "Total",
      value: total,
      icon: Target,
      color: "text-violet-400",
      bgColor: "bg-violet-500/10",
    },
    {
      label: "En Progreso",
      value: inProgress,
      icon: TrendingUp,
      color: "text-sky-400",
      bgColor: "bg-sky-500/10",
    },
    {
      label: "Completados",
      value: completed,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Progreso Promedio",
      value: `${Math.round(averageProgress)}%`,
      icon: Percent,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-[#0E0F12]/60 border border-white/8"
          >
            <Skeleton className="h-3 w-16 bg-white/5 mb-2" />
            <Skeleton className="h-7 w-12 bg-white/5" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="p-4 rounded-xl bg-[#0E0F12]/60 border border-white/8"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={cn("p-1.5 rounded-lg", stat.bgColor)}>
              <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
            </div>
            <span className="text-xs text-slate-400 uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
