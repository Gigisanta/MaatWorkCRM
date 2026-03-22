"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Download,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  endOfWeek,
  endOfMonth,
  endOfYear,
  isWithinInterval,
  format,
  parseISO,
  startOfDay,
  endOfQuarter,
} from "date-fns";

// Lazy chart wrappers - pre-composed with recharts
import LazyLineChart from '@/components/charts/lazy-line-chart';
import LazyBarChart from '@/components/charts/lazy-bar-chart';
import LazyPieChart from '@/components/charts/lazy-pie-chart';

// Chart skeleton fallback
function ChartSkeleton({ height = 300 }: { height?: number }) {
  return <div className="h-[300px] animate-pulse bg-muted" style={{ height }} />;
}

// Types
interface Deal {
  id: string;
  title: string;
  value: number;
  probability: number;
  stageId: string | null;
  createdAt: string;
  expectedCloseDate: string | null;
  stage?: {
    id: string;
    name: string;
    color: string;
    order: number;
  } | null;
  contact?: {
    id: string;
    name: string;
    emoji: string;
  } | null;
  assignedUser?: {
    id: string;
    name: string | null;
  } | null;
}

interface Contact {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  createdAt: string;
  pipelineStageId: string | null;
  pipelineStage?: {
    id: string;
    name: string;
    order: number;
  } | null;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
}

interface Team {
  id: string;
  name: string;
  goals: TeamGoal[];
  members: TeamMember[];
}

interface TeamGoal {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  status: string;
}

interface TeamMember {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
  };
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
}

type PeriodFilter = "week" | "month" | "quarter" | "year";

// Chart colors
const CHART_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#10b981", // emerald
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
];

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass border border-white/10 rounded-lg p-3 bg-slate-900/90">
        <p className="text-sm font-medium text-white mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' && entry.name.toLowerCase().includes('value') || entry.name.toLowerCase().includes('valor') 
              ? `$${entry.value.toLocaleString()}` 
              : entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [period, setPeriod] = React.useState<PeriodFilter>("month");
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  // Get date range based on period filter
  const getDateRange = React.useCallback(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case "week":
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case "month":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "quarter":
        start = startOfQuarter(now);
        end = endOfQuarter(now);
        break;
      case "year":
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }

    return { start, end };
  }, [period]);

  // Fetch deals
  const { data: dealsData, isLoading: dealsLoading, error: dealsError } = useQuery({
    queryKey: ["reports-deals", user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return { deals: [] };
      const response = await fetch(
        `/api/deals?organizationId=${user.organizationId}&limit=1000`
      );
      if (!response.ok) throw new Error("Failed to fetch deals");
      return response.json();
    },
    enabled: !!user?.organizationId && isAuthenticated,
  });

  // Fetch contacts
  const { data: contactsData, isLoading: contactsLoading, error: contactsError } = useQuery({
    queryKey: ["reports-contacts", user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return { contacts: [] };
      const response = await fetch(
        `/api/contacts?organizationId=${user.organizationId}&limit=1000`
      );
      if (!response.ok) throw new Error("Failed to fetch contacts");
      return response.json();
    },
    enabled: !!user?.organizationId && isAuthenticated,
  });

  // Fetch tasks
  const { data: tasksData, isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ["reports-tasks", user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return { tasks: [] };
      const response = await fetch(
        `/api/tasks?organizationId=${user.organizationId}&limit=1000`
      );
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
    enabled: !!user?.organizationId && isAuthenticated,
  });

  // Fetch teams with goals
  const { data: teamsData, isLoading: teamsLoading, error: teamsError } = useQuery({
    queryKey: ["reports-teams", user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return { teams: [] };
      const response = await fetch(
        `/api/teams?organizationId=${user.organizationId}&limit=100`
      );
      if (!response.ok) throw new Error("Failed to fetch teams");
      return response.json();
    },
    enabled: !!user?.organizationId && isAuthenticated,
  });

  // Fetch pipeline stages
  const { data: stagesData } = useQuery({
    queryKey: ["reports-stages", user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return { stages: [] };
      const response = await fetch(
        `/api/pipeline-stages?organizationId=${user.organizationId}`
      );
      if (!response.ok) throw new Error("Failed to fetch stages");
      return response.json();
    },
    enabled: !!user?.organizationId && isAuthenticated,
  });

  // Process data
  const deals: Deal[] = dealsData?.deals || [];
  const contacts: Contact[] = contactsData?.contacts || [];
  const tasks: Task[] = tasksData?.tasks || [];
  const teams: Team[] = teamsData?.teams || [];
  const stages: PipelineStage[] = stagesData?.stages || [];

  const { start: periodStart, end: periodEnd } = getDateRange();

  // Filter data by period - memoized
  const filterByPeriod = React.useCallback(<T extends { createdAt: string }>(items: T[]): T[] => {
    return items.filter((item) => {
      try {
        const itemDate = parseISO(item.createdAt);
        return isWithinInterval(itemDate, { start: periodStart, end: periodEnd });
      } catch {
        return false;
      }
    });
  }, [periodStart, periodEnd]);

  // Calculate KPIs - memoized
  const periodDeals = React.useMemo(() => filterByPeriod(deals), [filterByPeriod, deals]);
  const periodContacts = React.useMemo(() => filterByPeriod(contacts), [filterByPeriod, contacts]);
  const periodTasks = React.useMemo(() => filterByPeriod(tasks), [filterByPeriod, tasks]);

  // Total Pipeline Value - memoized
  const totalPipelineValue = React.useMemo(() =>
    deals.reduce((sum, deal) => sum + (deal.value || 0), 0), [deals]
  );

  // Weighted Pipeline Value - memoized
  const weightedPipelineValue = React.useMemo(() =>
    deals.reduce(
      (sum, deal) => sum + (deal.value || 0) * ((deal.probability || 0) / 100),
      0
    ), [deals]
  );

  // Active Contacts (not in "Caido" or "Cuenta vacia" stages) - memoized
  const inactiveStages = ["Caído", "Caida", "Cuenta vacia", "Cuenta Vacía"];
  const activeContacts = React.useMemo(() =>
    contacts.filter(
      (contact) => !contact.pipelineStage || !inactiveStages.includes(contact.pipelineStage.name)
    ).length, [contacts]
  );

  // Overdue Tasks - memoized
  const now = new Date();
  const overdueTasks = React.useMemo(() =>
    tasks.filter((task) => {
      if (task.status === "completed" || task.status === "cancelled") return false;
      if (!task.dueDate) return false;
      try {
        const dueDate = parseISO(task.dueDate);
        return dueDate < startOfDay(now);
      } catch {
        return false;
      }
    }).length, [tasks]
  );

  // Average Goal Progress - memoized
  const allGoals: TeamGoal[] = React.useMemo(() =>
    teams.flatMap((team) => team.goals || []), [teams]
  );
  const averageGoalProgress = React.useMemo(() =>
    allGoals.length > 0
      ? allGoals.reduce((sum, goal) => {
          const progress = goal.targetValue > 0
            ? (goal.currentValue / goal.targetValue) * 100
            : 0;
          return sum + Math.min(progress, 100);
        }, 0) / allGoals.length
      : 0, [allGoals]
  );

  // Pipeline by Stage chart data - memoized
  const getPipelineByStage = React.useCallback(() => {
    const stageMap = new Map<string, { name: string; value: number; count: number; color: string; order: number }>();

    // Initialize all stages
    stages.forEach((stage) => {
      stageMap.set(stage.id, {
        name: stage.name,
        value: 0,
        count: 0,
        color: stage.color || CHART_COLORS[0],
        order: stage.order,
      });
    });

    // Add deal values to stages
    deals.forEach((deal) => {
      if (deal.stageId) {
        const stage = stageMap.get(deal.stageId);
        if (stage) {
          stage.value += deal.value || 0;
          stage.count += 1;
        }
      }
    });

    return Array.from(stageMap.values())
      .sort((a, b) => a.order - b.order)
      .filter((stage) => stage.value > 0 || stage.count > 0);
  }, [stages, deals]);

  const pipelineByStage = React.useMemo(() => getPipelineByStage(), [getPipelineByStage]);

  // Deal Distribution (Pie chart) - memoized
  const dealDistribution = React.useMemo(() =>
    pipelineByStage.filter((stage) => stage.value > 0), [pipelineByStage]
  );

  // Contact Trend (Line chart - group by week/month) - memoized
  const getContactTrend = React.useCallback(() => {
    const periodContactsForTrend = filterByPeriod(contacts);

    // Group by week or month depending on period
    const groupedByDate = new Map<string, { nuevos: number; activos: number; label: string }>();

    periodContactsForTrend.forEach((contact) => {
      try {
        const date = parseISO(contact.createdAt);
        let key: string;
        let label: string;

        if (period === "week") {
          // Group by day
          key = format(date, "yyyy-MM-dd");
          label = format(date, "EEE d");
        } else if (period === "month") {
          // Group by week
          const weekStart = startOfWeek(date, { weekStartsOn: 1 });
          key = format(weekStart, "yyyy-ww");
          label = `Sem ${format(weekStart, "w")}`;
        } else {
          // Group by month
          key = format(date, "yyyy-MM");
          label = format(date, "MMM");
        }

        const existing = groupedByDate.get(key) || { nuevos: 0, activos: 0, label };
        existing.nuevos += 1;
        groupedByDate.set(key, existing);
      } catch {
        // Skip invalid dates
      }
    });

    // Convert to array and sort
    return Array.from(groupedByDate.entries())
      .map(([_, data]) => data)
      .slice(-12); // Last 12 data points
  }, [filterByPeriod, contacts, period]);

  const contactTrend = React.useMemo(() => getContactTrend(), [getContactTrend]);

  // Team Performance (Advisor stats) - memoized
  const getAdvisorPerformance = React.useCallback(() => {
    const advisorMap = new Map<string, { name: string; deals: number; value: number; completedGoals: number; totalGoals: number }>();

    // Get team member stats from teams
    teams.forEach((team) => {
      const teamGoals = team.goals || [];
      team.members?.forEach((member) => {
        const userId = member.userId;
        const userName = member.user?.name || "Sin nombre";

        if (!advisorMap.has(userId)) {
          advisorMap.set(userId, {
            name: userName,
            deals: 0,
            value: 0,
            completedGoals: 0,
            totalGoals: 0,
          });
        }

        const advisor = advisorMap.get(userId)!;
        advisor.totalGoals += teamGoals.length;
        advisor.completedGoals += teamGoals.filter((g) => g.status === "completed").length;
      });
    });

    // Add deal stats
    filterByPeriod(deals).forEach((deal) => {
      if (deal.assignedUser) {
        const userId = deal.assignedUser.id;
        const userName = deal.assignedUser.name || "Sin nombre";

        if (!advisorMap.has(userId)) {
          advisorMap.set(userId, {
            name: userName,
            deals: 0,
            value: 0,
            completedGoals: 0,
            totalGoals: 0,
          });
        }

        const advisor = advisorMap.get(userId)!;
        advisor.deals += 1;
        advisor.value += deal.value || 0;
      }
    });

    return Array.from(advisorMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10
  }, [teams, filterByPeriod, deals]);

  const advisorPerformance = React.useMemo(() => getAdvisorPerformance(), [getAdvisorPerformance]);

  // Period comparison (for % change)
  const getPreviousPeriodChange = React.useCallback((current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }, []);

  // Get previous period data for comparison
  const getPreviousPeriodRange = React.useCallback(() => {
    const { start, end } = getDateRange();
    const duration = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);
    return { start: prevStart, end: prevEnd };
  }, [getDateRange]);

  const prevRange = React.useMemo(() => getPreviousPeriodRange(), [getPreviousPeriodRange]);
  const previousPeriodDeals = React.useMemo(() => deals.filter((deal) => {
    try {
      const date = parseISO(deal.createdAt);
      return isWithinInterval(date, prevRange);
    } catch {
      return false;
    }
  }), [deals, prevRange]);

  const previousPipelineValue = React.useMemo(() =>
    previousPeriodDeals.reduce((sum, deal) => sum + (deal.value || 0), 0), [previousPeriodDeals]
  );
  const pipelineChange = React.useMemo(() =>
    getPreviousPeriodChange(totalPipelineValue, previousPipelineValue), [getPreviousPeriodChange, totalPipelineValue, previousPipelineValue]
  );

  const previousPeriodContacts = React.useMemo(() => contacts.filter((contact) => {
    try {
      const date = parseISO(contact.createdAt);
      return isWithinInterval(date, prevRange);
    } catch {
      return false;
    }
  }), [contacts, prevRange]);
  const contactsChange = React.useMemo(() =>
    getPreviousPeriodChange(periodContacts.length, previousPeriodContacts.length), [getPreviousPeriodChange, periodContacts.length, previousPeriodContacts.length]
  );

  // Conversion rate calculation - memoized
  const wonDeals = React.useMemo(() => deals.filter((d) => d.stage?.name === "Cliente"), [deals]);
  const conversionRate = React.useMemo(() =>
    deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0, [deals, wonDeals]
  );

  // Goals change calculation (simplified - just show current progress) - memoized
  const goalsChange = React.useMemo(() =>
    allGoals.length > 0
      ? allGoals.filter((g) => g.status === "completed").length / allGoals.length * 100
      : 0, [allGoals]
  );

  // Export to CSV
  const exportToCSV = () => {
    const csvRows: string[][] = [];
    
    // Header
    csvRows.push(["Reporte de MaatWork CRM", format(new Date(), "dd/MM/yyyy HH:mm")]);
    csvRows.push([]);
    
    // KPIs
    csvRows.push(["KPIs", ""]);
    csvRows.push(["Valor Pipeline Total", totalPipelineValue.toLocaleString()]);
    csvRows.push(["Valor Pipeline Ponderado", weightedPipelineValue.toLocaleString()]);
    csvRows.push(["Contactos Activos", activeContacts.toString()]);
    csvRows.push(["Tareas Vencidas", overdueTasks.toString()]);
    csvRows.push(["Progreso Promedio Objetivos", `${averageGoalProgress.toFixed(1)}%`]);
    csvRows.push([]);
    
    // Pipeline by Stage
    csvRows.push(["Pipeline por Etapa", "", ""]);
    csvRows.push(["Etapa", "Valor", "Cantidad"]);
    pipelineByStage.forEach((stage) => {
      csvRows.push([stage.name, stage.value.toString(), stage.count.toString()]);
    });
    csvRows.push([]);
    
    // Advisor Performance
    csvRows.push(["Rendimiento por Asesor", "", "", "", ""]);
    csvRows.push(["Nombre", "Deals", "Valor", "Objetivos Completados", "Objetivos Totales"]);
    advisorPerformance.forEach((advisor) => {
      csvRows.push([
        advisor.name,
        advisor.deals.toString(),
        advisor.value.toString(),
        advisor.completedGoals.toString(),
        advisor.totalGoals.toString(),
      ]);
    });

    // Create and download CSV
    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte-maatwork-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  // Loading state
  const isLoading = dealsLoading || contactsLoading || tasksLoading || teamsLoading;

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  // Not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl p-8">
          <CardContent className="text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Acceso Requerido</h2>
            <p className="text-slate-400">Inicia sesión para ver los reportes</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <AppSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      <div className={cn("transition-all duration-300", sidebarCollapsed ? "lg:pl-[80px]" : "lg:pl-[220px]")}>
        <AppHeader />
        <main className="p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div>
                  <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-1">REPORTES</p>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Reportes</h1>
                  <p className="text-slate-500 mt-1 text-sm">Análisis y métricas de tu negocio</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
                  <SelectTrigger className="w-[160px] bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Esta semana</SelectItem>
                    <SelectItem value="month">Este mes</SelectItem>
                    <SelectItem value="quarter">Este trimestre</SelectItem>
                    <SelectItem value="year">Este año</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl text-slate-300"
                  onClick={exportToCSV}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              </div>
            ) : (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { 
                      title: "Valor Pipeline", 
                      value: `$${totalPipelineValue.toLocaleString()}`, 
                      change: pipelineChange,
                      icon: DollarSign,
                      color: "text-violet-400",
                      bgColor: "bg-violet-500/10"
                    },
                    { 
                      title: "Nuevos Contactos", 
                      value: periodContacts.length.toString(), 
                      change: contactsChange,
                      icon: Users,
                      color: "text-emerald-400",
                      bgColor: "bg-emerald-500/10"
                    },
                    { 
                      title: "Tareas Vencidas", 
                      value: overdueTasks.toString(), 
                      change: 0,
                      icon: Target,
                      color: overdueTasks > 0 ? "text-rose-400" : "text-amber-400",
                      bgColor: overdueTasks > 0 ? "bg-rose-500/10" : "bg-amber-500/10"
                    },
                    { 
                      title: "Progreso Objetivos", 
                      value: `${averageGoalProgress.toFixed(0)}%`, 
                      change: goalsChange,
                      icon: BarChart3,
                      color: "text-violet-400",
                      bgColor: "bg-violet-500/10"
                    },
                  ].map((kpi, i) => (
                    <Card key={i} className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className={cn("p-2 rounded-lg", kpi.bgColor)}>
                            <kpi.icon className={cn("h-5 w-5", kpi.color)} />
                          </div>
                          {kpi.change !== 0 && (
                            <div className={cn(
                              "flex items-center gap-1 text-sm font-medium",
                              kpi.change >= 0 ? "text-emerald-500" : "text-rose-500"
                            )}>
                              {kpi.change >= 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              {Math.abs(kpi.change).toFixed(1)}%
                            </div>
                          )}
                        </div>
                        <div className="mt-4">
                          <p className="text-sm text-slate-400">{kpi.title}</p>
                          <p className="text-2xl font-bold text-white mt-1">{kpi.value}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Additional KPIs Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                    <CardContent className="p-4">
                      <p className="text-sm text-slate-400">Pipeline Ponderado</p>
                      <p className="text-xl font-bold text-emerald-400">
                        ${weightedPipelineValue.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                    <CardContent className="p-4">
                      <p className="text-sm text-slate-400">Contactos Activos</p>
                      <p className="text-xl font-bold text-blue-400">{activeContacts}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                    <CardContent className="p-4">
                      <p className="text-sm text-slate-400">Tasa de Conversión</p>
                      <p className="text-xl font-bold text-amber-400">{conversionRate.toFixed(1)}%</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pipeline by Stage */}
                  <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">
                        Pipeline por Etapa
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {pipelineByStage.length > 0 ? (
                          <LazyBarChart data={pipelineByStage} layout="vertical" dataKey="value" nameKey="name" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400">
                            No hay datos disponibles
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pipeline Distribution */}
                  <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">
                        Distribución del Pipeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {dealDistribution.length > 0 ? (
                          <LazyPieChart data={dealDistribution} innerRadius={60} outerRadius={100} />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400">
                            No hay datos disponibles
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Contact Trend */}
                  <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">
                        Tendencia de Contactos Nuevos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {contactTrend.length > 0 ? (
                          <LazyLineChart data={contactTrend} dataKey="nuevos" name="label" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400">
                            No hay datos disponibles para el período seleccionado
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Deals by Stage Count */}
                  <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">
                        Deals por Etapa
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {pipelineByStage.length > 0 ? (
                          <LazyBarChart data={pipelineByStage} nameKey="name" dataKey="count" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400">
                            No hay datos disponibles
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Advisor Performance */}
                <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">
                      Rendimiento por Asesor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {advisorPerformance.length > 0 ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                        {advisorPerformance.map((advisor, i) => {
                          const maxValue = Math.max(...advisorPerformance.map(a => a.value));
                          const progress = maxValue > 0 ? (advisor.value / maxValue) * 100 : 0;
                          
                          return (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-lg glass border border-white/10">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-white">{advisor.name}</span>
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className="text-slate-400">
                                      <span className="text-white font-medium">{advisor.deals}</span> deals
                                    </span>
                                    <span className="text-emerald-400 font-medium">
                                      ${advisor.value.toLocaleString()}
                                    </span>
                                    {advisor.totalGoals > 0 && (
                                      <span className="text-violet-400">
                                        {advisor.completedGoals}/{advisor.totalGoals} objetivos
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1, delay: i * 0.1 }}
                                    className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        No hay datos de asesores disponibles
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
