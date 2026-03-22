"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Target, Users, CheckSquare, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  // Fetch basic stats
  const { data: dealsData } = useQuery({
    queryKey: ["dashboard-deals", user?.organizationId],
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

  const { data: contactsData } = useQuery({
    queryKey: ["dashboard-contacts", user?.organizationId],
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

  const { data: tasksData } = useQuery({
    queryKey: ["dashboard-tasks", user?.organizationId],
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

  const { data: teamsData } = useQuery({
    queryKey: ["dashboard-teams", user?.organizationId],
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

  // Calculate KPIs
  const deals = dealsData?.deals || [];
  const contacts = contactsData?.contacts || [];
  const tasks = tasksData?.tasks || [];
  const teams = teamsData?.teams || [];

  const inactiveStageNames = ["Caído", "Caida", "Cuenta vacia", "Cuenta Vacía"];

  const activeDeals = deals.filter((deal: any) => {
    if (!deal.stage) return true;
    return !inactiveStageNames.includes(deal.stage.name);
  });
  const pipelineValue = activeDeals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);

  const activeContacts = contacts.filter((contact: any) => {
    if (!contact.pipelineStage) return true;
    return !inactiveStageNames.includes(contact.pipelineStage.name);
  }).length;

  const pendingTasks = tasks.filter((task: any) =>
    task.status !== "completed" && task.status !== "cancelled"
  ).length;

  const allGoals = teams.flatMap((team: any) => team.goals || []);
  const avgGoalProgress = allGoals.length > 0
    ? allGoals.reduce((sum: number, goal: any) => {
        const progress = goal.targetValue > 0
          ? (goal.currentValue / goal.targetValue) * 100
          : 0;
        return sum + Math.min(progress, 100);
      }, 0) / allGoals.length
    : 0;

  const isLoading = !dealsData || !contactsData || !tasksData || !teamsData;

  const todayDateString = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });
  const capitalizedDate = todayDateString.charAt(0).toUpperCase() + todayDateString.slice(1);

  // Auth loading or redirecting
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#08090B] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6] mx-auto" />
          <p className="text-slate-400 mt-4 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <AppSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "lg:pl-[80px]" : "lg:pl-[280px]"
      )}>
        <AppHeader />
        <main className="p-4 lg:p-6">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">
              Bienvenido, {user?.name || "Usuario"}. {capitalizedDate}
            </p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Pipeline Value */}
            <Card className="glass border-white/10">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-indigo-500/10">
                    <Target className="h-5 w-5 text-indigo-500" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-400">Valor Pipeline</p>
                  <p className="text-3xl font-bold mt-1 text-white">
                    ${pipelineValue.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Active Contacts */}
            <Card className="glass border-white/10">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Users className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-400">Contactos Activos</p>
                  <p className="text-3xl font-bold mt-1 text-white">{activeContacts}</p>
                </div>
              </CardContent>
            </Card>

            {/* Pending Tasks */}
            <Card className="glass border-white/10">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <CheckSquare className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-400">Tareas Pendientes</p>
                  <p className="text-3xl font-bold mt-1 text-white">{pendingTasks}</p>
                </div>
              </CardContent>
            </Card>

            {/* Goal Progress */}
            <Card className="glass border-white/10">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <TrendingUp className="h-5 w-5 text-violet-500" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-400">Progreso Objetivos</p>
                  <p className="text-3xl font-bold mt-1 text-white">
                    {Math.round(avgGoalProgress)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Equipos Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-white">{teams.length}</p>
                <p className="text-slate-400 mt-1">equipos en tu organización</p>
              </CardContent>
            </Card>

            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Negocios en Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-white">{deals.length}</p>
                <p className="text-slate-400 mt-1">negocios registrados</p>
              </CardContent>
            </Card>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
