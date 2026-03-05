import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
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
import { Badge } from "~/components/ui/Badge";
import { Icon } from "~/components/ui/Icon";
import { Input } from "~/components/ui/Input";
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from "~/components/ui/Modal";
import { EmptyState } from "~/components/ui/EmptyState";
import { ConfirmDialog } from "~/components/ui/ConfirmDialog";
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
    contactId: "" 
  });

  const handleCreateTask = async () => {
    if (!newTaskForm.title) return;
    try {
      await createTaskMutation.mutateAsync({
        ...newTaskForm,
        dueDate: newTaskForm.dueDate ? new Date(newTaskForm.dueDate) : undefined,
        status: "pending"
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
        data: { status: newStatus }
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
    <Container className="py-6 space-y-6">
      {/* Header */}
      <Stack direction="row" align="center" justify="between">
        <Stack direction="column" gap="xs">
          <h1 className="text-3xl font-bold text-text font-display">Tareas</h1>
          <p className="text-text-secondary">
            {tasks?.length || 0} tareas en total • {tasks?.filter((t: any) => t.status === "pending").length || 0} pendientes
          </p>
        </Stack>
        <Button variant="primary" onClick={() => setShowNewTaskModal(true)}>
          <Icon name="Plus" className="mr-2" size={16} />
          Nueva Tarea
        </Button>
      </Stack>

      {/* Filters */}
      <Stack direction="row" gap="sm" className="bg-secondary/5 p-1 rounded-xl w-fit">
        {[
          { id: undefined, label: "Todas" },
          { id: "pending", label: "Pendientes" },
          { id: "in_progress", label: "En Proceso" },
          { id: "completed", label: "Completadas" }
        ].map((f) => (
          <Button
            key={f.id || "all"}
            variant={statusFilter === f.id ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter(f.id)}
            className={cn(
              "rounded-lg px-4",
              statusFilter === f.id && "bg-background shadow-sm text-primary"
            )}
          >
            {f.label}
          </Button>
        ))}
      </Stack>

      {/* Task List */}
      <div className="grid gap-3">
        {tasks?.length === 0 ? (
          <EmptyState 
            title="Sin tareas" 
            description="No hay tareas que coincidan con el filtro seleccionado."
            icon={<Icon name="Calendar" className="text-text-muted" />}
          />
        ) : (
          tasks?.map((task: any, index: number) => {
            const priority = priorityConfig[task.priority] || priorityConfig.medium;
            const isOverdue = task.status !== "completed" && task.dueDate && new Date(task.dueDate) < new Date();

            return (
              <Card 
                key={task.id} 
                variant="glass" 
                className={cn(
                  "hover-lift animate-enter",
                  task.status === "completed" && "opacity-75"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <button 
                    onClick={() => handleToggleTaskStatus(task)}
                    className={cn(
                      "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                      task.status === "completed" 
                        ? "bg-primary border-primary text-white" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {task.status === "completed" && <Icon name="Check" size={14} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium transition-all truncate",
                      task.status === "completed" ? "text-text-muted line-through" : "text-text"
                    )}>
                      {task.title}
                    </p>
                    <Stack direction="row" gap="md" align="center" className="mt-1">
                      {task.contactId && (
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                          <Icon name="User" size={12} />
                          {contacts?.find((c: any) => c.id === task.contactId)?.name || "Contacto"}
                        </div>
                      )}
                      {task.dueDate && (
                        <div className={cn(
                          "flex items-center gap-1.5 text-xs",
                          isOverdue ? "text-error font-medium" : "text-text-muted"
                        )}>
                          <Icon name="Calendar" size={12} />
                          {new Date(task.dueDate).toLocaleDateString()}
                          {isOverdue && <span className="ml-1 uppercase text-[10px] tracking-wider">Vencido</span>}
                        </div>
                      )}
                    </Stack>
                  </div>

                  <Badge 
                    className={cn("px-2.5 py-1 flex items-center gap-1.5 border", priority.color)}
                  >
                    <Icon name={priority.icon} size={12} />
                    {priority.label}
                  </Badge>

                  <div className={cn("w-2 h-2 rounded-full", statusConfig[task.status]?.color || "bg-border")} />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* New Task Modal */}
      <Modal open={showNewTaskModal} onClose={() => setShowNewTaskModal(false)}>
        <ModalHeader>
          <ModalTitle>Nueva Tarea</ModalTitle>
        </ModalHeader>
        <ModalContent className="space-y-4">
          <Input 
            label="Título de la Tarea"
            placeholder="¿Qué hace falta hacer?"
            value={newTaskForm.title}
            onChange={(e) => setNewTaskForm(prev => ({ ...prev, title: e.target.value }))}
          />
          <Grid cols={2} gap="md">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">Prioridad</label>
              <select 
                className="w-full h-10 px-3 rounded-lg border border-border bg-secondary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                value={newTaskForm.priority}
                onChange={(e) => setNewTaskForm(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <Input 
              label="Fecha Límite"
              type="date"
              value={newTaskForm.dueDate}
              onChange={(e) => setNewTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </Grid>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Contacto Asociado</label>
            <select 
              className="w-full h-10 px-3 rounded-lg border border-border bg-secondary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              value={newTaskForm.contactId}
              onChange={(e) => setNewTaskForm(prev => ({ ...prev, contactId: e.target.value }))}
            >
              <option value="">Ninguno</option>
              {contacts?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowNewTaskModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateTask}
            disabled={createTaskMutation.isPending || !newTaskForm.title}
          >
            {createTaskMutation.isPending ? "Creando..." : "Crear Tarea"}
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
}
