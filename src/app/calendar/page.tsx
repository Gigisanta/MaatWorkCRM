"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Phone,
  Bell,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/lib/auth-context";

// Constants
const ORGANIZATION_ID = "org_maatwork_demo";

// Types
interface CalendarEventUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface CalendarEventTeam {
  id: string;
  name: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  type: "meeting" | "call" | "event" | "reminder";
  location: string | null;
  teamId: string | null;
  team: CalendarEventTeam | null;
  createdBy: string | null;
  creator: CalendarEventUser | null;
  createdAt: string;
}

interface EventsResponse {
  events: CalendarEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

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

type EventFormData = z.infer<typeof eventSchema>;

// Event type config
const eventTypeConfig = {
  meeting: { color: "bg-blue-500", bgColor: "bg-blue-500/20", textColor: "text-blue-400", label: "Reunión", icon: Users },
  call: { color: "bg-emerald-500", bgColor: "bg-emerald-500/20", textColor: "text-emerald-400", label: "Llamada", icon: Phone },
  event: { color: "bg-violet-500", bgColor: "bg-violet-500/20", textColor: "text-violet-400", label: "Evento", icon: CalendarIcon },
  reminder: { color: "bg-amber-500", bgColor: "bg-amber-500/20", textColor: "text-amber-400", label: "Recordatorio", icon: Bell },
};

// API Functions
async function fetchEvents(params: {
  startDate: string;
  endDate: string;
}): Promise<EventsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("organizationId", ORGANIZATION_ID);
  searchParams.set("startDate", params.startDate);
  searchParams.set("endDate", params.endDate);

  const response = await fetch(`/api/calendar-events?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error("Error al cargar eventos");
  }
  return response.json();
}

async function createEvent(data: EventFormData): Promise<CalendarEvent> {
  const response = await fetch("/api/calendar-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      organizationId: ORGANIZATION_ID,
    }),
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
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al actualizar evento");
  }
  return response.json();
}

async function deleteEvent(id: string): Promise<void> {
  const response = await fetch(`/api/calendar-events/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al eliminar evento");
  }
}

// Event Skeleton
function EventSkeleton() {
  return (
    <div className="p-3 rounded-lg glass border border-white/10">
      <div className="flex items-start gap-2">
        <Skeleton className="h-8 w-8 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

// Calendar Day Skeleton
function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 35 }).map((_, i) => (
        <div
          key={i}
          className="min-h-[80px] p-2 rounded-lg glass border border-white/5"
        >
          <Skeleton className="h-4 w-4 mb-2" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

// Event Dialog Component
function EventDialog({
  open,
  onOpenChange,
  event,
  selectedDate,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  selectedDate?: Date | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!event;

  const getDefaultValues = (): EventFormData => {
    if (event) {
      return {
        title: event.title,
        description: event.description,
        startAt: format(parseISO(event.startAt), "yyyy-MM-dd'T'HH:mm"),
        endAt: format(parseISO(event.endAt), "yyyy-MM-dd'T'HH:mm"),
        location: event.location,
        type: event.type,
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
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
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
      return createEvent(data);
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

  const onSubmit = (data: EventFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-white/10 bg-slate-900/95 max-w-md">
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
              className="glass border-white/10 bg-white/5 text-white"
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
              <SelectTrigger className="glass border-white/10 bg-white/5 text-white">
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
                className="glass border-white/10 bg-white/5 text-white"
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
                className="glass border-white/10 bg-white/5 text-white"
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
              className="glass border-white/10 bg-white/5 text-white"
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
              className="glass border-white/10 bg-white/5 text-white resize-none"
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
              className="glass border-white/10"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-indigo-500 hover:bg-indigo-600"
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

// Event Detail Drawer
function EventDetailDrawer({
  open,
  onOpenChange,
  event,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!event) return null;

  const config = eventTypeConfig[event.type];
  const Icon = config.icon;
  const startDate = parseISO(event.startAt);
  const endDate = parseISO(event.endAt);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="glass border-white/10 bg-slate-900/95">
        <DrawerHeader>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              <Icon className={cn("h-5 w-5", config.textColor)} />
            </div>
            <div>
              <DrawerTitle className="text-white">{event.title}</DrawerTitle>
              <DrawerDescription>
                <Badge variant="outline" className={cn("mt-1", config.textColor, "border-current")}>
                  {config.label}
                </Badge>
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="p-4 space-y-4">
          {/* Date & Time */}
          <div className="flex items-start gap-3 p-3 rounded-lg glass border border-white/10">
            <Clock className="h-5 w-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-400">Fecha y hora</p>
              <p className="text-white font-medium">
                {format(startDate, "EEEE, d 'de' MMMM", { locale: es })}
              </p>
              <p className="text-slate-300">
                {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
              </p>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3 p-3 rounded-lg glass border border-white/10">
              <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-400">Ubicación</p>
                <p className="text-white">{event.location}</p>
              </div>
            </div>
          )}

          {/* Team */}
          {event.team && (
            <div className="flex items-start gap-3 p-3 rounded-lg glass border border-white/10">
              <Users className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-400">Equipo</p>
                <p className="text-white">{event.team.name}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="p-3 rounded-lg glass border border-white/10">
              <p className="text-sm text-slate-400 mb-1">Descripción</p>
              <p className="text-white whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {/* Creator */}
          {event.creator && (
            <div className="text-xs text-slate-500 pt-2">
              Creado por {event.creator.name || "Usuario"}
            </div>
          )}
        </div>

        <DrawerFooter className="border-t border-white/10 pt-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 glass border-white/10"
              onClick={() => {
                onOpenChange(false);
                onEdit();
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </div>
          <Button
            variant="ghost"
            className="w-full text-slate-400"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// Main Page
export default function CalendarPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [eventToDelete, setEventToDelete] = React.useState<CalendarEvent | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  // Calculate date range for current month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Fetch events for current month
  const { data, isLoading, error } = useQuery({
    queryKey: ["calendar-events", format(calendarStart, "yyyy-MM-dd"), format(calendarEnd, "yyyy-MM-dd")],
    queryFn: () => fetchEvents({
      startDate: format(calendarStart, "yyyy-MM-dd"),
      endDate: format(calendarEnd, "yyyy-MM-dd"),
    }),
  });

  // Delete event mutation
  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      toast.success("Evento eliminado");
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Group events by date
  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    if (!data?.events) return map;

    data.events.forEach((event) => {
      const dateKey = format(parseISO(event.startAt), "yyyy-MM-dd");
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, event]);
    });

    return map;
  }, [data]);

  // Get events for a specific day
  const getEventsForDay = (date: Date): CalendarEvent[] => {
    const dateKey = format(date, "yyyy-MM-dd");
    return eventsByDate.get(dateKey) || [];
  };

  // Selected date events
  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  // Upcoming events (sorted by startAt, limited to 5)
  const upcomingEvents = React.useMemo(() => {
    if (!data?.events) return [];
    const now = new Date();
    return data.events
      .filter((e) => parseISO(e.startAt) >= now)
      .sort((a, b) => parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime())
      .slice(0, 5);
  }, [data]);

  // Navigation handlers
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // Event handlers
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDetailDrawerOpen(true);
  };

  const handleCreateFromDay = (date: Date) => {
    setSelectedDate(date);
    setCreateDialogOpen(true);
  };

  const handleEditEvent = () => {
    setEditDialogOpen(true);
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      setEventToDelete(selectedEvent);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = () => {
    if (eventToDelete) {
      deleteMutation.mutate(eventToDelete.id);
    }
  };

  // Handle error
  if (error) {
    return (
      <div className="min-h-screen gradient-bg">
        <AppSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
        <div className={cn("transition-all duration-300", sidebarCollapsed ? "lg:pl-[80px]" : "lg:pl-[280px]")}>
          <AppHeader />
          <main className="p-4 lg:p-6">
            <Card className="glass border-white/10">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-3" />
                <p className="text-white mb-2">Error al cargar eventos</p>
                <p className="text-slate-400 text-sm mb-4">{(error as Error).message}</p>
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["calendar-events"] })}>
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
      <AppSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      <div className={cn("transition-all duration-300", sidebarCollapsed ? "lg:pl-[80px]" : "lg:pl-[280px]")}>
        <AppHeader />
        <main className="p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Calendario</h1>
                <p className="text-slate-400 mt-1">
                  Gestiona tus eventos y reuniones
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="glass border-white/10 text-slate-300"
                  onClick={goToToday}
                >
                  Hoy
                </Button>
                <Button
                  className="bg-indigo-500 hover:bg-indigo-600"
                  onClick={() => {
                    setSelectedDate(null);
                    setCreateDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Evento
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Calendar Grid */}
              <Card className="lg:col-span-3 glass border-white/10">
                <CardHeader className="border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={previousMonth}
                        className="text-slate-400 hover:text-white"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <h2 className="text-lg font-semibold text-white capitalize">
                        {format(currentDate, "MMMM yyyy", { locale: es })}
                      </h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={nextMonth}
                        className="text-slate-400 hover:text-white"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      {Object.entries(eventTypeConfig).map(([type, config]) => (
                        <div key={type} className="flex items-center gap-1">
                          <div className={cn("w-2 h-2 rounded-full", config.color)} />
                          <span className="text-xs text-slate-400 hidden sm:inline">
                            {config.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 mb-2">
                    {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                      <div
                        key={day}
                        className="text-center text-sm font-medium text-slate-400 py-2"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  {isLoading ? (
                    <CalendarSkeleton />
                  ) : (
                    <div className="grid grid-cols-7 gap-1">
                      {days.map((day, index) => {
                        const dayEvents = getEventsForDay(day);
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isTodayDate = isToday(day);

                        return (
                          <motion.button
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => handleDayClick(day)}
                            onDoubleClick={() => handleCreateFromDay(day)}
                            className={cn(
                              "relative min-h-[80px] p-2 rounded-lg text-left transition-all",
                              "hover:bg-white/10",
                              !isCurrentMonth && "opacity-30",
                              isSelected && "bg-indigo-500/20 border border-indigo-500/50",
                              isTodayDate && !isSelected && "bg-white/5 border border-white/20"
                            )}
                          >
                            <span
                              className={cn(
                                "text-sm font-medium",
                                isTodayDate
                                  ? "text-indigo-400"
                                  : isCurrentMonth
                                  ? "text-white"
                                  : "text-slate-500"
                              )}
                            >
                              {format(day, "d")}
                            </span>
                            <div className="mt-1 space-y-1">
                              {dayEvents.slice(0, 2).map((event) => {
                                const config = eventTypeConfig[event.type];
                                return (
                                  <div
                                    key={event.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEventClick(event);
                                    }}
                                    className={cn(
                                      "text-xs px-1.5 py-0.5 rounded truncate cursor-pointer",
                                      config.bgColor,
                                      "hover:opacity-80 transition-opacity"
                                    )}
                                  >
                                    <span className="text-white">{event.title}</span>
                                  </div>
                                );
                              })}
                              {dayEvents.length > 2 && (
                                <div className="text-xs text-slate-500">
                                  +{dayEvents.length - 2} más
                                </div>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Selected Day Events */}
              <div className="space-y-4">
                <Card className="glass border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-white">
                      {selectedDate
                        ? format(selectedDate, "d 'de' MMMM", { locale: es })
                        : "Selecciona un día"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-3">
                        <EventSkeleton />
                        <EventSkeleton />
                      </div>
                    ) : selectedDateEvents.length > 0 ? (
                      <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                          {selectedDateEvents.map((event) => {
                            const config = eventTypeConfig[event.type];
                            const Icon = config.icon;
                            return (
                              <motion.div
                                key={event.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-3 rounded-lg glass border border-white/10 cursor-pointer hover:border-white/20 transition-colors"
                                onClick={() => handleEventClick(event)}
                              >
                                <div className="flex items-start gap-2">
                                  <div className={cn("p-1.5 rounded", config.bgColor)}>
                                    <Icon className="h-4 w-4 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white truncate">
                                      {event.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                      <Clock className="h-3 w-3" />
                                      <span>
                                        {format(parseISO(event.startAt), "HH:mm")} -{" "}
                                        {format(parseISO(event.endAt), "HH:mm")}
                                      </span>
                                    </div>
                                    {event.location && (
                                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                        <MapPin className="h-3 w-3" />
                                        <span className="truncate">{event.location}</span>
                                      </div>
                                    )}
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-slate-400 hover:text-white"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreHorizontal className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedEvent(event);
                                          setEditDialogOpen(true);
                                        }}
                                      >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-rose-500"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEventToDelete(event);
                                          setDeleteDialogOpen(true);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Eliminar
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    ) : selectedDate ? (
                      <div className="text-center py-8">
                        <CalendarIcon className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">Sin eventos este día</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 glass border-white/10"
                          onClick={() => handleCreateFromDay(selectedDate)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Crear evento
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CalendarIcon className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">
                          Haz clic en un día para ver los eventos
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Upcoming Events */}
                <Card className="glass border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-white">
                      Próximos Eventos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3 p-2">
                            <Skeleton className="w-1 h-10 rounded-full" />
                            <div className="flex-1 space-y-1">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : upcomingEvents.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                        {upcomingEvents.map((event) => {
                          const config = eventTypeConfig[event.type];
                          return (
                            <div
                              key={event.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                              onClick={() => handleEventClick(event)}
                            >
                              <div className={cn("w-1 h-10 rounded-full", config.color)} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {event.title}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {format(parseISO(event.startAt), "d MMM, HH:mm", { locale: es })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-slate-500 text-sm">No hay eventos próximos</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Create Event Dialog */}
      <EventDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        selectedDate={selectedDate}
        onSuccess={() => setSelectedDate(null)}
      />

      {/* Edit Event Dialog */}
      <EventDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        event={selectedEvent}
        onSuccess={() => setSelectedEvent(null)}
      />

      {/* Event Detail Drawer */}
      <EventDetailDrawer
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        event={selectedEvent}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass border-white/10 bg-slate-900/95">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Eliminar evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El evento "{eventToDelete?.title}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass border-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 hover:bg-rose-600"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
