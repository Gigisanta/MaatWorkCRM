"use client";

import * as React from "react";
import { Loader2, Target, Users, CheckSquare, TrendingUp } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { useSidebar } from "@/lib/sidebar-context";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { format, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";

const kpiConfig = [
  {
    key: "pipeline",
    label: "Pipeline Value",
    icon: Target,
    accentClass: "bg-gradient-to-r from-violet-500 to-violet-400",
    iconBgClass: "bg-violet-500/10",
    iconColorClass: "text-violet-400",
  },
  {
    key: "contacts",
    label: "Contactos Activos",
    icon: Users,
    accentClass: "bg-gradient-to-r from-emerald-500 to-emerald-400",
    iconBgClass: "bg-emerald-500/10",
    iconColorClass: "text-emerald-400",
  },
  {
    key: "tasks",
    label: "Tareas Pendientes",
    icon: CheckSquare,
    accentClass: "bg-gradient-to-r from-amber-500 to-amber-400",
    iconBgClass: "bg-amber-500/10",
    iconColorClass: "text-amber-400",
  },
  {
    key: "goals",
    label: "Progreso Objetivos",
    icon: TrendingUp,
    accentClass: "bg-gradient-to-r from-violet-500 to-violet-400",
    iconBgClass: "bg-violet-500/10",
    iconColorClass: "text-violet-400",
  },
];

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { collapsed, setCollapsed } = useSidebar();

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats", user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return null;
      const response = await fetch(
        `/api/dashboard/stats?organizationId=${user.organizationId}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
    enabled: !!user?.organizationId && isAuthenticated,
    staleTime: 60 * 1000,
  });

  // Keep deals list query for pipeline table (not stats)
  const { data: dealsData } = useQuery({
    queryKey: ["dashboard-deals", user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return { deals: [] };
      const response = await fetch(
        `/api/deals?organizationId=${user.organizationId}&limit=1000`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error("Failed to fetch deals");
      return response.json();
    },
    enabled: !!user?.organizationId && isAuthenticated,
  });

  // Derive KPIs from stats endpoint
  const pipelineValue = stats?.pipelineValue || 0;
  const activeDealsCount = stats?.activeDealsCount || 0;
  const activeContacts = stats?.activeContacts || 0;
  const pendingTasks = stats?.pendingTasks || 0;
  const avgGoalProgress = stats?.avgGoalProgress || 0;

  // Upcoming tasks query
  const { data: upcomingTasksData } = useQuery({
    queryKey: ["dashboard-upcoming-tasks", user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return { tasks: [] };
      const res = await fetch(
        `/api/tasks?organizationId=${user.organizationId}&status=pending&limit=4&sortBy=dueDate&sortOrder=asc`,
        { credentials: 'include' }
      );
      if (!res.ok) return { tasks: [] };
      return res.json();
    },
    enabled: !!user?.organizationId && isAuthenticated,
    staleTime: 60 * 1000,
  });
  const upcomingTasks = upcomingTasksData?.tasks || [];

  // Keep deals list for pipeline table
  const deals = dealsData?.deals || [];
  const inactiveStageNames = ["Caído", "Caida", "Cuenta vacia", "Cuenta Vacía"];
  const activeDeals = React.useMemo(() =>
    deals.filter((deal: any) => {
      if (!deal.stage) return true;
      return !inactiveStageNames.includes(deal.stage.name);
    }), [deals]
  );

  const todayDateString = format(new Date(), "EEEE, d 'de' MMMM");
  const capitalizedDate = todayDateString.charAt(0).toUpperCase() + todayDateString.slice(1);

  const kpiValues: Record<string, string> = {
    pipeline: `$${pipelineValue.toLocaleString()}`,
    contacts: String(activeContacts),
    tasks: String(pendingTasks),
    goals: `${Math.round(avgGoalProgress)}%`,
  };

  // Helper para renderizar trend dinámico
  const renderTrend = (trendValue: number | null | undefined) => {
    if (trendValue === null || trendValue === undefined) return null;
    const isPositive = trendValue >= 0;
    return (
      <span className={cn(
        "text-xs font-medium px-2 py-0.5 rounded-full",
        isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
      )}>
        {isPositive ? "↑" : "↓"} {Math.abs(trendValue)}%
      </span>
    );
  };

  // Auth loading or redirecting
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#08090B] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/15 flex items-center justify-center mx-auto">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          </div>
          <p className="text-slate-500 text-sm">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <AppSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <div className={cn(
        "transition-all duration-300",
        collapsed ? "lg:pl-[80px]" : "lg:pl-[220px]"
      )}>
        <AppHeader />
        <main className="p-4 lg:p-6">

          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 flex items-start justify-between"
          >
            <div>
              <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-1.5">
                {capitalizedDate}
              </p>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Bienvenido,{" "}
                <span className="text-violet-400">
                  {user?.name?.split(" ")[0] || "Usuario"}
                </span>
              </h1>
              <p className="text-slate-500 mt-1.5 text-sm">
                Aquí está el resumen de tu organización
              </p>
            </div>
          </motion.div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpiConfig.map((kpi, index) => (
              <motion.div
                key={kpi.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                className="group relative overflow-hidden rounded-xl border border-white/8 bg-[#0E0F12]/80 backdrop-blur-sm hover:border-violet-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 cursor-default"
              >
                {/* Top accent line */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] ${kpi.accentClass}`} />

                <div className="p-6">
                  {/* Icon + trend row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl ${kpi.iconBgClass} transition-all duration-300 group-hover:scale-110`}>
                      <kpi.icon className={`h-5 w-5 ${kpi.iconColorClass}`} strokeWidth={1.75} />
                    </div>
                    {renderTrend(
                      kpi.key === "contacts" ? stats?.contactsTrend :
                      kpi.key === "pipeline" ? stats?.pipelineTrend :
                      null
                    )}
                  </div>

                  {/* Value */}
                  <div>
                    <p className="text-sm text-slate-500 font-medium mb-1">{kpi.label}</p>
                    <p className="text-3xl font-bold text-white tracking-tight">
                      {kpiValues[kpi.key]}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Pipeline summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="relative overflow-hidden rounded-xl border border-white/8 bg-[#0E0F12]/80 backdrop-blur-sm"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-white">Estado del Pipeline</h2>
                  <Link
                    href="/pipeline"
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Ver todo →
                  </Link>
                </div>

                {/* Stats grid 2x2 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/4 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Negocios activos</p>
                    <p className="text-2xl font-bold text-white">{activeDeals.length}</p>
                  </div>
                  <div className="bg-white/4 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Valor total</p>
                    <p className="text-xl font-bold text-white">${pipelineValue.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/4 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Total contactos</p>
                    <p className="text-2xl font-bold text-white">{activeContacts}</p>
                  </div>
                  <div className="bg-white/4 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Equipos</p>
                    <p className="text-2xl font-bold text-white">{stats?.teamsCount || 0}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tasks & goals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="relative overflow-hidden rounded-xl border border-white/8 bg-[#0E0F12]/80 backdrop-blur-sm"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-white">Mis Tareas</h2>
                  <Link
                    href="/tasks"
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Ver todas →
                  </Link>
                </div>

                {/* Upcoming tasks */}
                <div className="space-y-2 mb-4">
                  {upcomingTasks.length > 0 ? (
                    upcomingTasks.map((task: any) => (
                      <div key={task.id} className="relative flex items-start gap-3 p-3 bg-white/4 rounded-lg pl-4">
                        <div className={cn(
                          "absolute left-0 top-2 bottom-2 w-[3px] rounded-full",
                          task.priority === "urgent" ? "bg-rose-500" :
                          task.priority === "high" ? "bg-amber-500" :
                          task.priority === "medium" ? "bg-sky-500" : "bg-slate-600"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200 truncate">{task.title}</p>
                          {task.dueDate && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {isToday(new Date(task.dueDate)) ? "Hoy" :
                               isTomorrow(new Date(task.dueDate)) ? "Mañana" :
                               format(new Date(task.dueDate), "d MMM")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-white/4 rounded-lg">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-sm text-slate-300">Pendientes</span>
                      </div>
                      <span className="text-sm font-semibold text-white">{pendingTasks}</span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="pt-1">
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Progreso general de objetivos</span>
                    <span>{Math.round(avgGoalProgress)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.round(avgGoalProgress)}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </main>
      </div>
    </div>
  );
}
