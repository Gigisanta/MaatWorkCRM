"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Users, Phone, Calendar as CalendarIcon, Bell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils/utils";
import { format, parseISO } from "date-fns";
import type { CalendarEvent } from "../types";

// Zod Schema
const eventSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(200, "El título es muy largo"),
  description: z.string().max(1000, "La descripción es muy larga").optional().nullable(),
  startAt: z.string().min(1, "La fecha de inicio es requerida"),
  endAt: z.string().min(1, "La fecha de fin es requerida"),
  location: z.string().max(200, "La ubicación es muy larga").optional().nullable(),
  type: z.enum(["meeting", "call", "event", "reminder"]).default("meeting"),
  teamId: z.string().optional().nullable(),
}).refine((data) => {
  const start = new Date(data.startAt);
  const end = new Date(data.endAt);
  return end >= start;
}, {
  message: "La fecha de fin debe ser posterior a la fecha de inicio",
  path: ["endAt"],
});

type EventFormDataInput = z.input<typeof eventSchema>;
type EventFormData = z.infer<typeof eventSchema>;

// Event type config
const eventTypeConfig = {
  meeting: { color: "bg-blue-500", bgColor: "bg-blue-500/20", textColor: "text-blue-400", label: "Reunión", icon: Users },
  call: { color: "bg-emerald-500", bgColor: "bg-emerald-500/20", textColor: "text-emerald-400", label: "Llamada", icon: Phone },
  event: { color: "bg-violet-500", bgColor: "bg-violet-500/20", textColor: "text-violet-400", label: "Evento", icon: CalendarIcon },
  reminder: { color: "bg-amber-500", bgColor: "bg-amber-500/20", textColor: "text-amber-400", label: "Recordatorio", icon: Bell },
};

// API Functions
async function createEvent(data: EventFormData & { organizationId: string }): Promise<CalendarEvent> {
  const response = await fetch("/api/calendar-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al crear evento");
  }
  return response.json();
}

async function updateEvent(id: string, data: Partial<EventFormData>): Promise<CalendarEvent> {
  const response = await fetch(`/api/calendar-events/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al actualizar evento");
  }
  return response.json();
}

// Component
interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null | undefined;
  selectedDate?: Date | null;
  onSuccess: () => void;
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  selectedDate,
  onSuccess,
}: EventDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEditing = !!event;

  const getDefaultValues = (): EventFormData => {
    if (event) {
      return {
        title: event.title,
        description: event.description,
        startAt: format(parseISO(event.startAt), "yyyy-MM-dd'T'HH:mm"),
        endAt: format(parseISO(event.endAt), "yyyy-MM-dd'T'HH:mm"),
        location: event.location,
        type: event.type as "meeting" | "call" | "event" | "reminder",
        teamId: event.teamId,
      };
    }
    if (selectedDate) {
      const start = new Date(selectedDate);
      start.setHours(9, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(10, 0, 0, 0);
      return {
        title: "",
        description: "",
        startAt: format(start, "yyyy-MM-dd'T'HH:mm"),
        endAt: format(end, "yyyy-MM-dd'T'HH:mm"),
        location: "",
        type: "meeting",
        teamId: null,
      };
    }
    return {
      title: "",
      description: "",
      startAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      endAt: format(new Date(Date.now() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
      location: "",
      type: "meeting",
      teamId: null,
    };
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<EventFormDataInput>({
    resolver: zodResolver(eventSchema) as any,
    defaultValues: getDefaultValues(),
  });

  const selectedType = watch("type");

  // Reset form when event or dialog opens
  React.useEffect(() => {
    if (open) {
      reset(getDefaultValues());
    }
  }, [open, event, selectedDate, reset]);

  const mutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      if (isEditing && event) {
        return updateEvent(event.id, data);
      }
      return createEvent({ ...data, organizationId: user?.organizationId ?? "" });
    },
    onSuccess: () => {
      toast.success(isEditing ? "Evento actualizado" : "Evento creado");
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: EventFormDataInput) => {
    mutation.mutate(data as EventFormData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? "Editar Evento" : "Crear Nuevo Evento"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los detalles del evento"
              : "Completa los detalles para crear un nuevo evento"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">Título *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Título del evento"
              className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
            />
            {errors.title && (
              <p className="text-xs text-rose-400">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-white">Tipo</Label>
            <Select
              value={selectedType}
              onValueChange={(value) => setValue("type", value as EventFormData["type"])}
            >
              <SelectTrigger className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                <SelectValue placeholder="Tipo de evento" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(eventTypeConfig).map(([type, config]) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", config.color)} />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startAt" className="text-white">Inicio *</Label>
              <Input
                id="startAt"
                type="datetime-local"
                {...register("startAt")}
                className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
              />
              {errors.startAt && (
                <p className="text-xs text-rose-400">{errors.startAt.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endAt" className="text-white">Fin *</Label>
              <Input
                id="endAt"
                type="datetime-local"
                {...register("endAt")}
                className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
              />
              {errors.endAt && (
                <p className="text-xs text-rose-400">{errors.endAt.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-white">Ubicación</Label>
            <Input
              id="location"
              {...register("location")}
              placeholder="Ubicación (opcional)"
              className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
            />
            {errors.location && (
              <p className="text-xs text-rose-400">{errors.location.message}</p>
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
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
