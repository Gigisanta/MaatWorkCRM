import { createFileRoute } from "@tanstack/react-router";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Video,
} from "lucide-react";
import React, { useState } from "react";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Icon } from "~/components/ui/Icon";
import { Container, Grid, Stack } from "~/components/ui/Layout";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/_app/calendar")({
  component: CalendarPage,
});

const DEMO_EVENTS = [
  {
    id: "1",
    title: "Reunión María López",
    type: "meeting",
    startAt: "10:00",
    endAt: "11:00",
    day: 4,
    location: "Oficina",
    color: "indigo",
  },
  { id: "2", title: "Llamada Juan Martínez", type: "call", startAt: "14:00", endAt: "14:30", day: 5, color: "emerald" },
  {
    id: "3",
    title: "Equipo semanal",
    type: "meeting",
    startAt: "09:00",
    endAt: "10:00",
    day: 7,
    location: "Zoom",
    color: "amber",
  },
  { id: "4", title: "Follow-up Roberto", type: "call", startAt: "16:00", endAt: "16:30", day: 10, color: "violet" },
  {
    id: "5",
    title: "Presentación propuesta",
    type: "meeting",
    startAt: "11:00",
    endAt: "12:00",
    day: 11,
    location: "Cliente",
    color: "blue",
  },
];

const typeIcons: Record<string, any> = { meeting: "MapPin", call: "Phone", event: "Video", reminder: "Clock" };

function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 4)); // March 4, 2026

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const today = 4;

  const monthName = currentDate.toLocaleString("es-ES", { month: "long" });
  const year = currentDate.getFullYear();

  return (
    <Container className="py-6 space-y-8 animate-enter">
      {/* Header */}
      <Stack direction="row" align="center" justify="between">
        <Stack direction="column" gap="xs">
          <h1 className="text-4xl font-black text-text font-display tracking-tight">Calendario</h1>
          <p className="text-text-secondary">Sincronización de eventos y compromisos comerciales.</p>
        </Stack>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Evento
        </Button>
      </Stack>

      <Grid cols={1} lgCols={4} gap="lg">
        {/* Calendar Main Grid */}
        <div className="lg:col-span-3 space-y-4">
          <Card variant="glass" className="overflow-hidden border-secondary/10">
            <CardHeader className="bg-secondary/5 border-b border-secondary/10 px-6 py-4">
              <Stack direction="row" align="center" justify="between">
                <h2 className="text-xl font-bold text-text capitalize">
                  {monthName} {year}
                </h2>
                <Stack direction="row" gap="xs">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <ChevronLeft size={18} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 rounded-full text-xs font-bold uppercase tracking-wider"
                  >
                    Hoy
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <ChevronRight size={18} />
                  </Button>
                </Stack>
              </Stack>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b border-secondary/5">
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                  <div
                    key={d}
                    className="py-3 text-center text-[10px] font-black text-text-muted uppercase tracking-widest bg-secondary/5"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {/* Empty cells for padding */}
                {Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-32 border-b border-r border-secondary/5 bg-secondary/[0.02]" />
                ))}

                {days.map((day) => {
                  const dayEvents = DEMO_EVENTS.filter((e) => e.day === day);
                  const isToday = day === today;

                  return (
                    <div
                      key={day}
                      className={cn(
                        "h-32 border-b border-r border-secondary/5 p-2 transition-all hover:bg-secondary/5 group relative",
                        isToday && "bg-primary/[0.03]",
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <span
                          className={cn(
                            "text-xs font-bold rounded-md w-6 h-6 flex items-center justify-center transition-all",
                            isToday
                              ? "bg-primary text-white shadow-lg scale-110"
                              : "text-text-secondary group-hover:text-text",
                          )}
                        >
                          {day}
                        </span>
                        {dayEvents.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                      </div>

                      <div className="mt-2 space-y-1">
                        {dayEvents.map((e) => (
                          <div
                            key={e.id}
                            className={cn(
                              "text-[9px] px-1.5 py-1 rounded-md border font-bold truncate transition-all cursor-pointer hover:brightness-110 active:scale-95",
                              `bg-${e.color}-500/10 border-${e.color}-500/20 text-${e.color}-400`,
                            )}
                          >
                            {e.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Upcoming & Types */}
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest px-1">Próximos Eventos</h3>
            <div className="space-y-3">
              {DEMO_EVENTS.map((e) => (
                <Card key={e.id} variant="default" className="hover-lift border border-secondary/5">
                  <CardContent className="p-3">
                    <Stack direction="row" gap="sm" align="start">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          `bg-${e.color}-500/10 text-${e.color}-500`,
                        )}
                      >
                        <Icon name={typeIcons[e.type] as any} size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-text truncate">{e.title}</h4>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          {e.startAt} - {e.endAt} {e.location && `• ${e.location}`}
                        </p>
                      </div>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card variant="glass" className="bg-primary/5 border-primary/10">
            <CardContent className="p-4 space-y-4">
              <h3 className="text-xs font-black text-primary uppercase tracking-widest">Resumen Semanal</h3>
              <div className="space-y-2">
                <Stack direction="row" justify="between" align="center">
                  <span className="text-xs text-text-secondary">Reuniones</span>
                  <Badge variant="primary">12</Badge>
                </Stack>
                <Stack direction="row" justify="between" align="center">
                  <span className="text-xs text-text-secondary">Llamadas</span>
                  <Badge variant="secondary">24</Badge>
                </Stack>
                <div className="pt-2 border-t border-primary/10">
                  <p className="text-[10px] text-text-muted leading-relaxed">
                    Tu agenda está un <span className="text-primary font-bold">15% más ocupada</span> que la semana
                    pasada.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Grid>
    </Container>
  );
}
