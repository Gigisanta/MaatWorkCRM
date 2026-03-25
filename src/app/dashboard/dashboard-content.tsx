"use client";

import * as React from "react";
import { Suspense } from "react";
import { Loader2, Target, Users, CheckSquare, TrendingUp } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { useSidebar } from "@/lib/sidebar-context";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { format, isToday, isTomorrow, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { MobileFAB } from "@/components/ui/mobile-fab";
import { useQuickActions } from "@/lib/quick-actions-context";

const kpiConfig = [
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
] as const;

// Skeleton component for auth loading
function AuthSkeleton() {
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

// Skeleton for KPI cards section
function KPICardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[140px] rounded-xl bg-white/5 animate-pulse"
        />
      ))}
    </div>
  );
}

// Skeleton for pipeline summary
function PipelineSkeleton() {
  return (
    <div className="h-full min-h-[280px] rounded-xl bg-white/5 animate-pulse" />
  );
}

// Skeleton for tasks & goals
function TasksSkeleton() {
  return (
    <div className="h-full min-h-[280px] rounded-xl bg-white/5 animate-pulse" />
  );
}

// Wrapper component that handles auth
export function DashboardContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading || !isAuthenticated) {
    return <AuthSkeleton />;
  }

  return <DashboardData user={user} />;
}

// Separate component that fetches data - wrapped in Suspense for streaming
function DashboardData({ user }: { user: any }) {
  const { collapsed, setCollapsed } = useSidebar();
  const { setCreateContactOpen, setCreateTaskOpen } = useQuickActions();

  // Fetch dashboard stats
  const { data: stats } = useQuery({
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
    enabled: !!user?.organizationId,
    staleTime: 60 * 1000,
  });

  // Keep deals list query for pipeline funnel
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
    enabled: !!user?.organizationId,
  });

  // Activity feed query
  const { data: activityData } = useQuery({
    queryKey: ["dashboard-activity", user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return { activities: [] };
      const res = await fetch(
        `/api/dashboard/activity?organizationId=${user.organizationId}`,
        { credentials: 'include' }
      );
      if (!res.ok) return { activities: [] };
      return res.json();
    },
    enabled: !!user?.organizationId,
    staleTime: 2 * 60 * 1000,
  });
  const recentActivities = activityData?.activities || [];

  // Derive KPIs from stats endpoint
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
    enabled: !!user?.organizationId,
    staleTime: 60 * 1000,
  });
  const upcomingTasks = upcomingTasksData?.tasks || [];

  // Calendar events query for mini calendar
  const { data: calendarEventsData } = useQuery({
    queryKey: ["dashboard-calendar-events", user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return { events: [] };
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const res = await fetch(
        `/api/calendar/events?organizationId=${user.organizationId}&start=${startOfMonth}&end=${endOfMonth}`,
        { credentials: 'include' }
      );
      if (!res.ok) return { events: [] };
      return res.json();
    },
    enabled: !!user?.organizationId,
    staleTime: 60 * 1000,
  });
  const calendarEvents = calendarEventsData?.events || [];

  // Keep deals list for pipeline funnel
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
    contacts: String(activeContacts),
    tasks: String(pendingTasks),
    goals: `${Math.round(avgGoalProgress)}%`,
  };

  // Helper para renderizar trend dinamico
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
                Aqui esta el resumen de tu organizacion
              </p>
            </div>
          </motion.div>

          {/* KPI Cards - loads first, wrapped in Suspense */}
          <Suspense fallback={<KPICardsSkeleton />}>
            <KPISection
              kpiConfig={kpiConfig}
              kpiValues={kpiValues}
              stats={stats}
              renderTrend={renderTrend}
            />
          </Suspense>

          {/* Bottom section - Pipeline, Tasks and Calendar can load in parallel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

            {/* Pipeline summary */}
            <Suspense fallback={<PipelineSkeleton />}>
              <PipelineSummary
                activeDeals={activeDeals}
              />
            </Suspense>

            {/* Tasks & goals */}
            <Suspense fallback={<TasksSkeleton />}>
              <TasksAndGoals
                upcomingTasks={upcomingTasks}
                pendingTasks={pendingTasks}
                avgGoalProgress={avgGoalProgress}
              />
            </Suspense>

            {/* Mini Calendar */}
            <Suspense fallback={<TasksSkeleton />}>
              <MiniCalendar
                events={calendarEvents}
              />
            </Suspense>

          </div>

          {/* Activity Feed — full width row below the 3 panels */}
          <div className="mt-6">
            <Suspense fallback={<div className="h-32 rounded-xl bg-white/5 animate-pulse" />}>
              <ActivityFeed activities={recentActivities} />
            </Suspense>
          </div>

        </main>
      </div>

      {/* Mobile FAB — only visible on mobile/tablet (lg:hidden) */}
      <MobileFAB
        actions={[
          {
            label: "Nuevo contacto",
            icon: Users,
            onClick: () => setCreateContactOpen(true),
          },
          {
            label: "Nueva tarea",
            icon: CheckSquare,
            onClick: () => setCreateTaskOpen(true),
          },
        ]}
      />
    </div>
  );
}

// Extract KPI section into its own component for Suspense boundary
type KpiConfigType = typeof kpiConfig[number];

function KPISection({
  kpiConfig,
  kpiValues,
  stats,
  renderTrend,
}: {
  kpiConfig: readonly KpiConfigType[];
  kpiValues: Record<string, string>;
  stats: any;
  renderTrend: (val: number | null | undefined) => React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                kpi.key === "contacts" ? stats?.contactsTrend : null
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
  );
}

// Pipeline summary with mini-funnel — replaces the bugged 2x2 grid
function PipelineSummary({
  activeDeals,
}: {
  activeDeals: any[];
}) {
  // Group deals by stage name
  const stageGroups = activeDeals.reduce((acc: Record<string, number>, deal: any) => {
    const stageName = deal.stage?.name || "Sin etapa";
    acc[stageName] = (acc[stageName] || 0) + 1;
    return acc;
  }, {});

  const stages = Object.entries(stageGroups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxCount = Math.max(...stages.map(([, c]) => c), 1);

  return (
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

        {/* Total counter */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">Total en pipeline</span>
          <span className="text-sm font-semibold text-white">{activeDeals.length}</span>
        </div>

        {/* Mini funnel bars */}
        <div className="space-y-2 mt-3">
          {stages.length > 0 ? stages.map(([name, count]) => (
            <div key={name} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 truncate max-w-[140px]">{name}</span>
                <span className="text-xs font-semibold text-white ml-2">{count}</span>
              </div>
              <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-700"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          )) : (
            <p className="text-sm text-slate-500 py-2">Sin contactos en pipeline</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Extract Tasks & Goals into its own component for Suspense boundary
function TasksAndGoals({
  upcomingTasks,
  pendingTasks,
  avgGoalProgress,
}: {
  upcomingTasks: any[];
  pendingTasks: number;
  avgGoalProgress: number;
}) {
  return (
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
                       isTomorrow(new Date(task.dueDate)) ? "Manana" :
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
  );
}

// Mini Calendar component for dashboard
function MiniCalendar({ events }: { events: any[] }) {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const eventDays = new Set(
    events.map((e) => new Date(e.start || e.date).getDate())
  );

  const monthName = format(currentDate, "MMMM yyyy");

  const upcomingEvents = events
    .filter((e) => new Date(e.start || e.date) >= new Date())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.7 }}
      className="relative overflow-hidden rounded-xl border border-white/8 bg-[#0E0F12]/80 backdrop-blur-sm"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Calendario</h2>
          <Link
            href="/calendar"
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            Ver todo →
          </Link>
        </div>

        {/* Calendar grid */}
        <div className="mb-4">
          <p className="text-sm text-slate-400 text-center mb-2 capitalize">
            {monthName}
          </p>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["D", "L", "M", "X", "J", "V", "S"].map((d) => (
              <div key={d} className="text-xs text-slate-600 font-medium py-1">
                {d}
              </div>
            ))}
            {blanks.map((i) => (
              <div key={`blank-${i}`} className="py-1" />
            ))}
            {days.map((day) => {
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === currentDate.getMonth() &&
                new Date().getFullYear() === currentDate.getFullYear();
              const hasEvent = eventDays.has(day);
              return (
                <div
                  key={day}
                  className={cn(
                    "text-xs py-1 rounded-full transition-colors",
                    isToday
                      ? "bg-violet-500 text-white font-medium"
                      : hasEvent
                      ? "text-violet-400"
                      : "text-slate-400"
                  )}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming events */}
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider">
            Proximos eventos
          </p>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event: any) => (
              <div
                key={event.id}
                className="flex items-center gap-2 p-2 bg-white/4 rounded-lg"
              >
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">
                    {event.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {format(new Date(event.start), "d MMM")}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No hay eventos proximos</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Activity Feed component — uses existing /api/dashboard/activity endpoint
function ActivityFeed({ activities }: { activities: any[] }) {
  const getIcon = (type: string) => {
    if (type === "task_completed") {
      return <CheckSquare className="h-3.5 w-3.5 text-amber-400" />;
    }
    if (type === "note_added") {
      return <Target className="h-3.5 w-3.5 text-sky-400" />;
    }
    return <Users className="h-3.5 w-3.5 text-violet-400" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.8 }}
      className="relative overflow-hidden rounded-xl border border-white/8 bg-[#0E0F12]/80 backdrop-blur-sm lg:col-span-3"
    >
      <div className="p-6">
        <h2 className="text-base font-semibold text-white mb-4">Actividad Reciente</h2>
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity: any, i: number) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="flex items-start gap-3"
              >
                <div className="mt-0.5 p-1.5 rounded-lg bg-white/5 flex-shrink-0">
                  {getIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 truncate">{activity.title}</p>
                  {activity.description && (
                    <p className="text-xs text-slate-500 truncate">{activity.description}</p>
                  )}
                  <p className="text-xs text-slate-600 mt-0.5">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No hay actividad reciente</p>
        )}
      </div>
    </motion.div>
  );
}
