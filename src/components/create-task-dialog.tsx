'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { taskSchema, type TaskFormData, type TaskFormDataInput, createTask } from "@/lib/task-utils";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTaskDialog({ open, onOpenChange }: CreateTaskDialogProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<TaskFormDataInput>({
    resolver: zodResolver(taskSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
      assignedTo: "",
      contactId: "",
      isRecurrent: false,
      recurrenceRule: null,
    },
  });

  const isRecurrent = watch("isRecurrent");

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      reset({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        assignedTo: "",
        contactId: "",
        isRecurrent: false,
        recurrenceRule: null,
      });
    }
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      return createTask(data);
    },
    onSuccess: () => {
      toast.success("Tarea creada");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onOpenChange(false);
      reset();
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
            Crear Nueva Tarea
          </DialogTitle>
          <DialogDescription>
            Completa los detalles para crear una nueva tarea
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">Título *</Label>
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
            <Label htmlFor="description" className="text-white">Descripción</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Descripción (opcional)"
              className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white resize-none"
              rows={3}
            />
            {errors.description && (
              <p className="text-xs text-rose-400">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Prioridad</Label>
              <Select
                defaultValue="medium"
                onValueChange={(value) => setValue("priority", value as TaskFormData["priority"])}
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
              <Label htmlFor="dueDate" className="text-white">Fecha límite</Label>
              <Input
                id="dueDate"
                type="date"
                {...register("dueDate")}
                className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-violet-500 hover:bg-violet-600"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Tarea
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
