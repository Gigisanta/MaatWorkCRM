import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
<<<<<<< HEAD
=======
import {
  useTasks,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useContacts
} from "~/lib/hooks/use-crm";
import { Container, Stack, Grid } from "~/components/ui/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
>>>>>>> origin/feat/maatwork-redesign-jules-v2-6433543738996844966
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { ConfirmDialog } from "~/components/ui/ConfirmDialog";
import { EmptyState } from "~/components/ui/EmptyState";
import { Icon } from "~/components/ui/Icon";
import { Input } from "~/components/ui/Input";
import { Container, Grid, Stack } from "~/components/ui/Layout";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "~/components/ui/Modal";
import {
  useContacts,
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useTasks,
  useUpdateTaskMutation,
} from "~/lib/hooks/use-crm";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/_app/tasks")({
  component: TasksPage,
});

const priorityConfig: Record<string, { label: string; color: string; icon: "AlertTriangle" | "Clock" }> = {
  urgent: { label: "Urgente", color: "text-red-400 bg-red-400/10 border-red-400/20", icon: "AlertTriangle" },
  high: { label: "Alta", color: "text-amber-400 bg-amber-400/10 border-amber-400/20", icon: "AlertTriangle" },
  medium: { label: "Media", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: "Clock" },
  low: { label: "Baja", color: "text-text-muted bg-secondary/10 border-border/20", icon: "Clock" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-amber-500" },
  in_progress: { label: "En Progreso", color: "bg-blue-500" },
  completed: { label: "Completada", color: "bg-emerald-500" },
  cancelled: { label: "Cancelada", color: "bg-text-muted" },
};

function TasksPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { data: tasks, isLoading, error } = useTasks(statusFilter ? { status: statusFilter } : {});
  const { data: contacts } = useContacts();

  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation();

  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    title: "",
    priority: "medium",
    dueDate: "",
<<<<<<< HEAD
    contactId: "",
=======
    contactId: ""
>>>>>>> origin/feat/maatwork-redesign-jules-v2-6433543738996844966
  });

  const handleCreateTask = async () => {
    if (!newTaskForm.title) return;
    try {
      await createTaskMutation.mutateAsync({
        ...newTaskForm,
        dueDate: newTaskForm.dueDate ? new Date(newTaskForm.dueDate) : undefined,
        status: "pending",
      });
      setShowNewTaskModal(false);
      setNewTaskForm({ title: "", priority: "medium", dueDate: "", contactId: "" });
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const handleToggleTaskStatus = async (task: any) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    try {
      await updateTaskMutation.mutateAsync({
        id: task.id,
        data: { status: newStatus },
      });
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  if (isLoading) {
    return (
      <Container className="py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-12">
        <EmptyState
          title="Error al cargar tareas"
          description={(error as Error).message}
          icon={<Icon name="AlertTriangle" className="text-error" />}
        />
      </Container>
    );
  }

  return (
    <Container className="py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-black text-text tracking-tight font-display">Gestión de Tareas</h1>
          <p className="text-sm font-bold text-text-muted/70 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {tasks?.length || 0} tareas en total • {tasks?.filter((t: any) => t.status === "pending").length || 0}{" "}
            pendientes
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => setShowNewTaskModal(true)}
          className="shadow-xl shadow-primary/20 hover:shadow-primary/30 h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[11px]"
        >
          <Icon name="Plus" className="mr-2" size={16} strokeWidth={3} />
          Crear Tarea
        </Button>
      </div>

      {/* Filters & Actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface/30 p-2 rounded-2xl border border-border/20 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          {[
            { id: undefined, label: "Todas" },
            { id: "pending", label: "Pendientes" },
            { id: "in_progress", label: "En Proceso" },
            { id: "completed", label: "Completadas" },
          ].map((f) => (
            <Button
              key={f.id || "all"}
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter(f.id)}
              className={cn(
                "rounded-xl px-5 h-9 font-bold text-xs uppercase tracking-wider transition-all",
                statusFilter === f.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
<<<<<<< HEAD
                  : "text-text-muted hover:text-primary hover:bg-primary/5",
=======
                  : "text-text-muted hover:text-primary hover:bg-primary/5"
>>>>>>> origin/feat/maatwork-redesign-jules-v2-6433543738996844966
              )}
            >
              {f.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-2">
          <div className="h-4 w-[1px] bg-border/40 mx-2 hidden sm:block" />
          <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest hidden sm:block">
            Filtros Activos
          </p>
        </div>
      </div>

      {/* Task List */}
      <div className="grid gap-3">
        {tasks?.length === 0 ? (
          <EmptyState
            title="Sin tareas pendientes"
            description="Relájate, parece que estás al día con tus pendientes."
            icon={<Icon name="Calendar" className="text-primary/40" />}
          />
        ) : (
          tasks?.map((task: any, index: number) => {
            const priority = priorityConfig[task.priority] || priorityConfig.medium;
            const isOverdue = task.status !== "completed" && task.dueDate && new Date(task.dueDate) < new Date();

            return (
              <Card
                key={task.id}
                className={cn(
                  "hover:shadow-xl transition-all duration-300 group overflow-hidden border-border/20 bg-surface/40 backdrop-blur-md rounded-2xl relative",
                  task.status === "completed" ? "opacity-60 saturate-[0.8]" : "hover:border-primary/30",
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
<<<<<<< HEAD
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 transition-all duration-300",
                    priority.color.split(" ")[0].replace("text-", "bg-"),
                  )}
                />
=======
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1 transition-all duration-300",
                  priority.color.split(' ')[0].replace('text-', 'bg-')
                )} />
>>>>>>> origin/feat/maatwork-redesign-jules-v2-6433543738996844966

                <CardContent className="p-5 flex items-center gap-5">
                  <button
                    onClick={() => handleToggleTaskStatus(task)}
                    className={cn(
                      "w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-500 shadow-inner",
                      task.status === "completed"
                        ? "bg-primary border-primary text-white scale-110"
<<<<<<< HEAD
                        : "border-border hover:border-primary/50 bg-secondary/10",
=======
                        : "border-border hover:border-primary/50 bg-secondary/10"
>>>>>>> origin/feat/maatwork-redesign-jules-v2-6433543738996844966
                    )}
                  >
                    {task.status === "completed" && <Icon name="Check" size={16} strokeWidth={3} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-base font-bold transition-all truncate tracking-tight",
                        task.status === "completed" ? "text-text-muted/60 line-through" : "text-text",
                      )}
                    >
                      {task.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                      {task.contactId && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-muted/70 uppercase tracking-widest bg-secondary/10 px-2 py-0.5 rounded-md">
                          <Icon name="User" size={10} className="text-primary" />
                          {contacts?.find((c: any) => c.id === task.contactId)?.name || "Contacto"}
                        </div>
                      )}
                      {task.dueDate && (
                        <div
                          className={cn(
                            "flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.15em]",
                            isOverdue ? "text-error" : "text-text-muted/50",
                          )}
                        >
                          <Icon name="Calendar" size={10} />
                          {new Date(task.dueDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                          {isOverdue && (
                            <span className="flex items-center gap-1 ml-1 text-[9px] bg-error/10 px-1.5 rounded-full border border-error/20">
                              <span className="w-1 h-1 rounded-full bg-error animate-pulse" />
                              Vencido
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-8 px-3 flex items-center gap-2 border-[1.5px] font-black text-[10px] uppercase tracking-widest rounded-xl transition-all group-hover:px-4",
                        priority.color,
                      )}
                    >
                      <Icon name={priority.icon} size={12} strokeWidth={2.5} />
                      {priority.label}
                    </Badge>

                    <div
                      className={cn(
                        "w-3 h-3 rounded-full border-2 border-background shadow-lg",
                        statusConfig[task.status]?.color || "bg-border",
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* New Task Modal */}
      <Modal open={showNewTaskModal} onClose={() => setShowNewTaskModal(false)}>
        <ModalHeader className="border-b border-border/10 pb-4">
          <ModalTitle className="text-2xl font-black tracking-tight">Crear Nueva Tarea</ModalTitle>
        </ModalHeader>
        <ModalContent className="space-y-6 pt-6">
          <Input
            label="¿Qué hace falta hacer?"
            placeholder="Ej: Llamar a cliente para seguimiento..."
            value={newTaskForm.title}
            onChange={(e) => setNewTaskForm((prev) => ({ ...prev, title: e.target.value }))}
            className="text-lg font-bold"
          />
          <Grid cols={2} gap="lg">
            <div className="space-y-2">
<<<<<<< HEAD
              <label className="text-[10px] font-black text-text-muted/60 uppercase tracking-widest ml-1">
                Prioridad
              </label>
=======
              <label className="text-[10px] font-black text-text-muted/60 uppercase tracking-widest ml-1">Prioridad</label>
>>>>>>> origin/feat/maatwork-redesign-jules-v2-6433543738996844966
              <select
                className="w-full h-12 px-4 rounded-xl border-2 border-border/20 bg-secondary/5 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 text-sm font-bold transition-all appearance-none"
                value={newTaskForm.priority}
                onChange={(e) => setNewTaskForm((prev) => ({ ...prev, priority: e.target.value }))}
              >
                <option value="low">Low (Baja)</option>
                <option value="medium">Medium (Media)</option>
                <option value="high">High (Alta)</option>
                <option value="urgent">Urgent (Urgente)</option>
              </select>
            </div>
            <div className="space-y-2">
<<<<<<< HEAD
              <label className="text-[10px] font-black text-text-muted/60 uppercase tracking-widest ml-1">
                Fecha Límite
              </label>
=======
              <label className="text-[10px] font-black text-text-muted/60 uppercase tracking-widest ml-1">Fecha Límite</label>
>>>>>>> origin/feat/maatwork-redesign-jules-v2-6433543738996844966
              <Input
                type="date"
                value={newTaskForm.dueDate}
                onChange={(e) => setNewTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="h-12 rounded-xl"
              />
            </div>
          </Grid>
          <div className="space-y-2">
<<<<<<< HEAD
            <label className="text-[10px] font-black text-text-muted/60 uppercase tracking-widest ml-1">
              Contacto Asociado
            </label>
=======
            <label className="text-[10px] font-black text-text-muted/60 uppercase tracking-widest ml-1">Contacto Asociado</label>
>>>>>>> origin/feat/maatwork-redesign-jules-v2-6433543738996844966
            <select
              className="w-full h-12 px-4 rounded-xl border-2 border-border/20 bg-secondary/5 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 text-sm font-bold transition-all appearance-none"
              value={newTaskForm.contactId}
              onChange={(e) => setNewTaskForm((prev) => ({ ...prev, contactId: e.target.value }))}
            >
              <option value="">Sin contacto</option>
              {contacts?.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </ModalContent>
        <ModalFooter className="border-t border-border/10 pt-4 mt-6">
          <Button
            variant="ghost"
            onClick={() => setShowNewTaskModal(false)}
            className="font-bold text-xs uppercase tracking-widest"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleCreateTask}
            disabled={createTaskMutation.isPending || !newTaskForm.title}
            className="px-8 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20"
          >
            {createTaskMutation.isPending ? "Procesando..." : "Confirmar Tarea"}
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
}
