"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isPast, parseISO } from "date-fns";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { useSidebar } from "@/contexts/sidebar-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MobileFAB } from "@/components/ui/mobile-fab";
import { cn } from "@/lib/utils/utils";
import { useAuth } from "@/contexts/auth-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TaskDialog } from "./task-dialog";
import { TasksFilters } from "./tasks-filters";
import { TasksStats } from "./tasks-stats";
import { TasksList } from "./tasks-list";
import { fetchTasks, completeTask, updateTask, deleteTask, fetchUsers } from "../api";
import type { Task } from "../types";

export function TasksPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { collapsed, setCollapsed } = useSidebar();

  // State - check URL param for action=create to auto-open dialog
  const [taskSearch, setTaskSearch] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [filterPriority, setFilterPriority] = React.useState<string>("all");
  const [filterAssignedTo, setFilterAssignedTo] = React.useState<string>("all");

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = React.useState(
    searchParams.get("action") === "create"
  );
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [taskToDelete, setTaskToDelete] = React.useState<string | null>(null);

  // Toggling state for individual tasks
  const [togglingTasks, setTogglingTasks] = React.useState<Set<string>>(
    new Set()
  );

  // Fetch users for assignment dropdown
  const { data: usersData } = useQuery({
    queryKey: ["users", user?.organizationId],
    queryFn: () => fetchUsers(user?.organizationId ?? ""),
    enabled: !!user?.organizationId,
    staleTime: 5 * 60 * 1000,
  });
  const users = usersData?.users || [];

  // Fetch tasks
  const { data, isLoading, error } = useQuery({
    queryKey: [
      "tasks",
      filterStatus,
      filterPriority,
      filterAssignedTo,
      user?.organizationId,
    ],
    queryFn: () =>
      fetchTasks({
        organizationId: user?.organizationId ?? "",
        status: filterStatus,
        priority: filterPriority,
        assignedTo: filterAssignedTo,
      }),
    enabled: !!user?.organizationId,
  });

  // Complete task mutation
  const completeMutation = useMutation({
    mutationFn: completeTask,
    onMutate: (id) => {
      setTogglingTasks((prev) => new Set(prev).add(id));
    },
    onSuccess: () => {
      toast.success("Tarea completada");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSettled: (_, __, id) => {
      setTogglingTasks((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
  });

  // Update task status mutation (for uncompleting)
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateTask(id, { priority: status as Task["priority"] }),
    onMutate: ({ id }) => {
      setTogglingTasks((prev) => new Set(prev).add(id));
    },
    onSuccess: () => {
      toast.success("Estado actualizado");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSettled: (_, __, { id }) => {
      setTogglingTasks((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      toast.success("Tarea eliminada");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Handlers
  const handleToggleTask = (task: Task) => {
    if (task.status === "completed") {
      // Uncomplete - change to pending
      updateStatusMutation.mutate({ id: task.id, status: "pending" });
    } else {
      // Complete
      completeMutation.mutate(task.id);
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setTaskToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (taskToDelete) {
      deleteMutation.mutate(taskToDelete);
    }
  };

  // Filter tasks by search
  const filteredTasks = React.useMemo(() => {
    const tasks = data?.tasks;
    if (!tasks) return [];
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
        task.description?.toLowerCase().includes(taskSearch.toLowerCase())
    );
  }, [data, taskSearch]);

  // Group tasks by status (for stats)
  const pendingTasks = filteredTasks.filter((t) => t.status === "pending");
  const inProgressTasks = filteredTasks.filter(
    (t) => t.status === "in_progress"
  );
  const completedTasks = filteredTasks.filter(
    (t) => t.status === "completed"
  );

  // Count overdue
  const overdueCount = React.useMemo(() => {
    return filteredTasks.filter((t) => {
      if (!t.dueDate || t.status === "completed") return false;
      return isPast(parseISO(t.dueDate));
    }).length;
  }, [filteredTasks]);

  // Handle error
  if (error) {
    return (
      <div className="min-h-screen gradient-bg">
        <AppSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
        <div
          className={cn(
            "transition-all duration-300",
            collapsed ? "lg:pl-[80px]" : "lg:pl-[220px]"
          )}
        >
          <AppHeader />
          <main className="p-4 lg:p-6">
            <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-3" />
                <p className="text-white mb-2">Error al cargar tareas</p>
                <p className="text-slate-400 text-sm mb-4">
                  {(error as Error).message}
                </p>
                <Button
                  onClick={() =>
                    queryClient.invalidateQueries({ queryKey: ["tasks"] })
                  }
                >
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <AppSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <div
        className={cn(
          "transition-all duration-300",
          collapsed ? "lg:pl-[80px]" : "lg:pl-[220px]"
        )}
      >
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
                  <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-1">
                    TAREAS
                  </p>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Tareas
                  </h1>
                  <p className="text-slate-500 mt-1 text-sm">
                    {pendingTasks.length + inProgressTasks.length} pendientes
                    {overdueCount > 0 && (
                      <span className="text-rose-400 ml-2">
                        • {overdueCount} vencida
                        {overdueCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Button
                className="bg-violet-500 hover:bg-violet-600"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Tarea
              </Button>
            </div>

            {/* Quick Stats */}
            <TasksStats
              pendingCount={pendingTasks.length}
              inProgressCount={inProgressTasks.length}
              completedCount={completedTasks.length}
              overdueCount={overdueCount}
            />

            {/* Filters */}
            <TasksFilters
              taskSearch={taskSearch}
              onTaskSearchChange={setTaskSearch}
              filterStatus={filterStatus}
              onFilterStatusChange={setFilterStatus}
              filterPriority={filterPriority}
              onFilterPriorityChange={setFilterPriority}
              filterAssignedTo={filterAssignedTo}
              onFilterAssignedToChange={setFilterAssignedTo}
              users={users}
            />

            {/* Tasks List */}
            <TasksList
              filteredTasks={filteredTasks}
              taskSearch={taskSearch}
              isLoading={isLoading}
              togglingTasks={togglingTasks}
              onToggle={handleToggleTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteClick}
            />
          </motion.div>
        </main>
      </div>

      {/* Create Task Dialog */}
      <TaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {}}
        users={users}
      />

      {/* Edit Task Dialog */}
      <TaskDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={selectedTask}
        onSuccess={() => setSelectedTask(null)}
        users={users}
      />

      {/* Mobile FAB */}
      <MobileFAB
        actions={[
          {
            label: "Nueva tarea",
            icon: Plus,
            onClick: () => setCreateDialogOpen(true),
          },
        ]}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-slate-900/95">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              ¿Eliminar tarea?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La tarea será eliminada
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 hover:bg-rose-600"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function TasksLoading() {
  return (
    <div className="min-h-screen bg-[#08090B] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
    </div>
  );
}
