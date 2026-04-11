"use client";

import * as React from "react";
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
  Bell,
  RefreshCw,
  Check,
  AlertCircle,
} from "lucide-react";
import { useSidebar } from "@/contexts/sidebar-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/utils";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  isAfter,
  addMonths,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

import { EventDialog } from "./event-dialog";
import { EventDetailDrawer } from "./event-detail-drawer";
import { WeekView } from "./week-view";
import { AgendaView } from "./agenda-view";

// ============ SCHEMAS & TYPES ============

const eventSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
  startAt: z.string(),
  endAt: z.string(),
  location: z.string().optional(),
  type: z.string().default("meeting"),
  colorId: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

import type { CalendarEvent } from "../types";

const eventTypeConfig: Record<string, { label: string; color: string }> = {
  meeting: { label: "Reunión", color: "bg-violet-500" },
  call: { label: "Llamada", color: "bg-blue-500" },
  event: { label: "Evento", color: "bg-emerald-500" },
  reminder: { label: "Recordatorio", color: "bg-amber-500" },
};

// ============ SKELETON COMPONENTS ============

function EventSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}

// ============ MAIN CALENDAR PAGE ============

export default function CalendarPage() {
  const { collapsed, setCollapsed } = useSidebar();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [viewMode, setViewMode] = React.useState<"month" | "week" | "agenda">("month");
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<CalendarEvent | null>(null);
  const [selectedType, setSelectedType] = React.useState<string>("all");

  // Fetch events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["calendar-events"],
    queryFn: async () => {
      const res = await fetch("/api/calendar-events");
      if (!res.ok) throw new Error("Error fetching events");
      return res.json();
    },
  });

  // Create event mutation
  const createMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const res = await fetch("/api/calendar-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error creating event");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Evento creado");
      setDialogOpen(false);
    },
    onError: () => toast.error("Error al crear evento"),
  });

  // Update event mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EventFormData }) => {
      const res = await fetch(`/api/calendar-events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error updating event");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Evento actualizado");
      setDialogOpen(false);
    },
    onError: () => toast.error("Error al actualizar evento"),
  });

  // Delete event mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/calendar-events/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error deleting event");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Evento eliminado");
      setDrawerOpen(false);
    },
    onError: () => toast.error("Error al eliminar evento"),
  });

  // Handlers
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDrawerOpen(true);
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setDialogOpen(true);
  };

  const handleEditEvent = () => {
    if (selectedEvent) {
      setEditingEvent(selectedEvent);
      setDrawerOpen(false);
      setDialogOpen(true);
    }
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      deleteMutation.mutate(selectedEvent.id);
    }
  };

  const handleSaveEvent = (data: EventFormData) => {
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Helper for WeekView
  const getEventsForSlot = (day: Date, hour: number): CalendarEvent[] => {
    return filteredEvents.filter((event: CalendarEvent) => {
      const eventDate = parseISO(event.startAt);
      return (
        isSameDay(eventDate, day) &&
        eventDate.getHours() === hour
      );
    });
  };

  // Filter events by type
  const filteredEvents = React.useMemo(() => {
    if (selectedType === "all") return events;
    return events.filter((event: CalendarEvent) => event.type === selectedType);
  }, [events, selectedType]);

  // Get calendar days for month view
  const calendarDays = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Week view days
  const weekDays = React.useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Agenda view days (next 14 days)
  const agendaDays = React.useMemo(() => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 14);
    return eachDayOfInterval({ start, end }).map((day) => ({
      day,
      events: filteredEvents.filter((event: CalendarEvent) =>
        isSameDay(parseISO(event.startAt), day)
      ),
    }));
  }, [filteredEvents]);

  // Navigation
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="min-h-screen bg-[#08090B]">
      <AppSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <div
        className={`transition-[padding] duration-300 ${
          collapsed ? "lg:pl-[80px]" : "lg:pl-[220px]"
        }`}
      >
        <AppHeader />
        <main className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">Calendario</h1>
              <Badge variant="outline" className="text-xs">
                {events.length} eventos
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoy
              </Button>
              <div className="flex items-center border border-white/10 rounded-lg">
                <Button variant="ghost" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-sm font-medium min-w-[140px] text-center">
                  {format(currentDate, "MMMM yyyy", { locale: es })}
                </span>
                <Button variant="ghost" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* View Mode & Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("month")}
              >
                Mes
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("week")}
              >
                Semana
              </Button>
              <Button
                variant={viewMode === "agenda" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("agenda")}
              >
                Agenda
              </Button>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
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
            <Button onClick={handleCreateEvent}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Evento
            </Button>
          </div>

          {/* Calendar Content */}
          {isLoading ? (
            <CalendarSkeleton />
          ) : (
            <>
              {viewMode === "month" && (
                <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0E0F12]">
                  {/* Day headers */}
                  <div className="grid grid-cols-7 bg-[#0E0F12] border-b border-white/10">
                    {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                      <div
                        key={day}
                        className="p-3 text-center text-sm font-medium text-slate-400"
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  {/* Days grid */}
                  <div className="grid grid-cols-7">
                    {calendarDays.map((day, i) => {
                      const dayEvents = filteredEvents.filter((event: CalendarEvent) =>
                        isSameDay(parseISO(event.startAt), day)
                      );
                      const isCurrentMonth = isSameMonth(day, currentDate);
                      const isCurrentDay = isToday(day);

                      return (
                        <div
                          key={i}
                          className={cn(
                            "min-h-[120px] p-2 border-b border-r border-white/5",
                            !isCurrentMonth && "bg-[#08090B]/50",
                            isCurrentDay && "bg-violet-500/5"
                          )}
                        >
                          <div
                            className={cn(
                              "text-sm font-medium mb-1",
                              isCurrentMonth ? "text-white" : "text-slate-600",
                              isCurrentDay && "text-violet-400"
                            )}
                          >
                            {format(day, "d")}
                          </div>
                          <div className="space-y-1">
                            {dayEvents.slice(0, 3).map((event: CalendarEvent) => (
                              <button
                                key={event.id}
                                onClick={() => handleEventClick(event)}
                                className={cn(
                                  "w-full text-left text-xs p-1 rounded truncate",
                                  "hover:bg-white/10 transition-colors",
                                  event.type === "meeting" && "bg-violet-500/20 text-violet-300",
                                  event.type === "call" && "bg-blue-500/20 text-blue-300",
                                  event.type === "event" && "bg-emerald-500/20 text-emerald-300",
                                  event.type === "reminder" && "bg-amber-500/20 text-amber-300"
                                )}
                              >
                                {event.title}
                              </button>
                            ))}
                            {dayEvents.length > 3 && (
                              <span className="text-xs text-slate-500">
                                +{dayEvents.length - 3} más
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewMode === "week" && (
                <WeekView
                  weekDays={weekDays}
                  events={filteredEvents}
                  onEventClick={handleEventClick}
                  getEventsForSlot={getEventsForSlot}
                />
              )}

              {viewMode === "agenda" && (
                <AgendaView
                  agendaDays={agendaDays}
                  onEventClick={handleEventClick}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Event Dialog */}
      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
          setDialogOpen(false);
        }}
      />

      {/* Event Detail Drawer */}
      <EventDetailDrawer
        event={selectedEvent}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}
