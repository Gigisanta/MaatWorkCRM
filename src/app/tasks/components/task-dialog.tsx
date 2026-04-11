"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { taskSchema, createTask, updateTask, type TaskFormDataInput, type TaskFormData } from "../api";
import type { Task } from "../types";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSuccess: () => void;
  users: { id: string; name: string | null }[];
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  onSuccess,
  users,
}: TaskDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!task;
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<TaskFormDataInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(taskSchema) as any,
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      priority: task?.priority || "medium",
      dueDate: task?.dueDate ? format(parseISO(task.dueDate), "yyyy-MM-dd") : "",
      assignedTo: task?.assignedTo || "",
      contactId: task?.contactId || "",
      isRecurrent: task?.isRecurrent || false,
      recurrenceRule: task?.recurrenceRule?.includes("DAILY")
        ? "daily"
        : task?.recurrenceRule?.includes("WEEKLY")
          ? "weekly"
          : task?.recurrenceRule?.includes("MONTHLY")
            ? "monthly"
            : null,
    },
  });

  const isRecurrent = watch("isRecurrent");

  // Reset form when task changes
  React.useEffect(() => {
    if (open) {
      reset({
        title: task?.title || "",
        description: task?.description || "",
        priority: task?.priority || "medium",
        dueDate: task?.dueDate ? format(parseISO(task.dueDate), "yyyy-MM-dd") : "",
        assignedTo: task?.assignedTo || "",
        contactId: task?.contactId || "",
        isRecurrent: task?.isRecurrent || false,
        recurrenceRule: task?.recurrenceRule?.includes("DAILY")
          ? "daily"
          : task?.recurrenceRule?.includes("WEEKLY")
            ? "weekly"
            : task?.recurrenceRule?.includes("MONTHLY")
              ? "monthly"
              : null,
      });
    }
  }, [open, task, reset]);

  const mutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      if (isEditing && task) {
        return updateTask(task.id, data);
      }
      return createTask({ ...data, organizationId: user?.organizationId ?? "" });
    },
    onSuccess: () => {
      toast.success(isEditing ? "Tarea actualizada" : "Tarea creada");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: TaskFormDataInput) => {
    mutation.mutate(data as TaskFormData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? "Editar Tarea" : "Crear Nueva Tarea"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los detalles de la tarea"
              : "Completa los detalles para crear una nueva tarea"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              Título *
            </Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Título de la tarea"
              className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
            />
            {errors.title && (
              <p className="text-xs text-rose-400">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Descripción
            </Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Descripción (opcional)"
              className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white resize-none"
              rows={3}
            />
            {errors.description && (
              <p className="text-xs text-rose-400">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Prioridad</Label>
              <Select
                defaultValue={task?.priority || "medium"}
                onValueChange={(value) =>
                  setValue("priority", value as TaskFormData["priority"])
                }
              >
                <SelectTrigger className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-white">
                Fecha límite
              </Label>
              <Input
                id="dueDate"
                type="date"
                {...register("dueDate")}
                className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Asignado a</Label>
            <Select
              defaultValue={task?.assignedTo ?? "unassigned"}
              onValueChange={(value) =>
                setValue("assignedTo", value === "unassigned" ? null : value)
              }
            >
              <SelectTrigger className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                <SelectValue placeholder="Sin asignar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Sin asignar</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Checkbox
              id="isRecurrent"
              checked={isRecurrent}
              onCheckedChange={(checked) =>
                setValue("isRecurrent", checked as boolean)
              }
            />
            <Label htmlFor="isRecurrent" className="text-white cursor-pointer">
              Tarea recurrente
            </Label>
          </div>

          {isRecurrent && (
            <div className="space-y-2">
              <Label className="text-white">Frecuencia</Label>
              <Select
                defaultValue={
                  task?.recurrenceRule?.includes("DAILY")
                    ? "daily"
                    : task?.recurrenceRule?.includes("WEEKLY")
                      ? "weekly"
                      : task?.recurrenceRule?.includes("MONTHLY")
                        ? "monthly"
                        : "weekly"
                }
                onValueChange={(value) =>
                  setValue(
                    "recurrenceRule",
                    value as "daily" | "weekly" | "monthly"
                  )
                }
              >
                <SelectTrigger className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                  <SelectValue placeholder="Frecuencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-violet-500 hover:bg-violet-600"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isEditing ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Import useMutation from @tanstack/react-query
import { useMutation } from "@tanstack/react-query";
