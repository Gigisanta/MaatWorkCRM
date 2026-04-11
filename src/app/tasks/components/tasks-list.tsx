"use client";

import * as React from "react";
import { isPast, parseISO, startOfDay, addDays, isToday, isTomorrow } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import { TaskGroup } from "./task-group";
import { TaskSkeleton } from "./tasks-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import type { Task } from "../types";

interface TasksListProps {
  filteredTasks: Task[];
  taskSearch: string;
  isLoading: boolean;
  togglingTasks: Set<string>;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

interface GroupedTasks {
  overdue: Task[];
  today: Task[];
  tomorrow: Task[];
  thisWeek: Task[];
  later: Task[];
  completed: Task[];
}

function groupTasksByTemporalProximity(tasks: Task[]): GroupedTasks {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const endOfWeek = addDays(today, 7);

  return {
    overdue: tasks.filter(
      (t) =>
        t.dueDate && new Date(t.dueDate) < today && t.status !== "completed"
    ),
    today: tasks.filter(
      (t) => t.dueDate && isToday(new Date(t.dueDate)) && t.status !== "completed"
    ),
    tomorrow: tasks.filter(
      (t) =>
        t.dueDate && isTomorrow(new Date(t.dueDate)) && t.status !== "completed"
    ),
    thisWeek: tasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) > tomorrow &&
        new Date(t.dueDate) <= endOfWeek &&
        t.status !== "completed"
    ),
    later: tasks.filter(
      (t) =>
        (!t.dueDate || new Date(t.dueDate) > endOfWeek) &&
        t.status !== "completed"
    ),
    completed: tasks.filter((t) => t.status === "completed"),
  };
}

export function TasksList({
  filteredTasks,
  taskSearch,
  isLoading,
  togglingTasks,
  onToggle,
  onEdit,
  onDelete,
}: TasksListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <TaskSkeleton key={i} />
        ))}
      </div>
    );
  }

  const groupedTasks = groupTasksByTemporalProximity(filteredTasks);

  return (
    <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
      <CardContent className="p-4 lg:p-6">
        <TaskGroup
          label="Vencidas"
          tasks={groupedTasks.overdue}
          badgeColor="bg-rose-500/15 text-rose-400 border-rose-500/25"
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          togglingTasks={togglingTasks}
        />
        <TaskGroup
          label="Hoy"
          tasks={groupedTasks.today}
          badgeColor="bg-amber-500/15 text-amber-400 border-amber-500/25"
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          togglingTasks={togglingTasks}
        />
        <TaskGroup
          label="Mañana"
          tasks={groupedTasks.tomorrow}
          badgeColor="bg-sky-500/15 text-sky-400 border-sky-500/25"
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          togglingTasks={togglingTasks}
        />
        <TaskGroup
          label="Esta semana"
          tasks={groupedTasks.thisWeek}
          badgeColor="bg-violet-500/15 text-violet-400 border-violet-500/25"
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          togglingTasks={togglingTasks}
        />
        <TaskGroup
          label="Más adelante"
          tasks={groupedTasks.later}
          badgeColor="bg-white/8 text-slate-400 border-white/10"
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          togglingTasks={togglingTasks}
        />
        <TaskGroup
          label="Completadas"
          tasks={groupedTasks.completed}
          badgeColor="bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
          defaultOpen={false}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          togglingTasks={togglingTasks}
        />
        {filteredTasks.length === 0 && (
          <EmptyState
            icon={CheckCircle2}
            title="No hay tareas que coincidan"
            description={
              taskSearch
                ? `No se encontraron tareas para "${taskSearch}"`
                : "No hay tareas en esta sección"
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
