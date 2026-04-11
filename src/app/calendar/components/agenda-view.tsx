"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { format, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { CalendarEvent } from "../types";

// Event type config
const eventTypeConfig: Record<string, { color: string; bgColor: string; textColor: string; label: string }> = {
  meeting: { color: "bg-blue-500", bgColor: "bg-blue-500/20", textColor: "text-blue-400", label: "Reunión" },
  call: { color: "bg-emerald-500", bgColor: "bg-emerald-500/20", textColor: "text-emerald-400", label: "Llamada" },
  event: { color: "bg-violet-500", bgColor: "bg-violet-500/20", textColor: "text-violet-400", label: "Evento" },
  reminder: { color: "bg-amber-500", bgColor: "bg-amber-500/20", textColor: "text-amber-400", label: "Recordatorio" },
};

interface AgendaViewProps {
  agendaDays: { day: Date; events: CalendarEvent[] }[];
  onEventClick: (event: CalendarEvent) => void;
}

export function AgendaView({ agendaDays, onEventClick }: AgendaViewProps) {
  const daysWithEvents = agendaDays.filter((d) => d.events.length > 0);

  if (daysWithEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CalendarIcon
          className="h-10 w-10 text-violet-400/30 mb-3"
          strokeWidth={1.5}
        />
        <p className="text-slate-400">Sin eventos en los próximos 14 días</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-auto max-h-[600px] custom-scrollbar">
      {daysWithEvents.map(({ day, events }) => (
        <div key={day.toISOString()}>
          {/* Day label */}
          <div className="flex items-center gap-3 mb-2">
            <div
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold flex-shrink-0",
                isToday(day)
                  ? "bg-violet-500 text-white"
                  : "bg-white/8 text-slate-300"
              )}
            >
              {format(day, "d")}
            </div>
            <div>
              <p className="text-sm font-medium text-white capitalize">
                {format(day, "EEEE", { locale: es })}
              </p>
              <p className="text-xs text-slate-500">
                {format(day, "d 'de' MMMM", { locale: es })}
              </p>
            </div>
          </div>

          {/* Events for the day */}
          <div className="ml-12 space-y-2">
            {events.map((event) => {
              const config = eventTypeConfig[event.type];
              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/4 border border-white/8 hover:border-violet-500/20 cursor-pointer transition-colors"
                >
                  <div
                    className={cn(
                      "w-1.5 min-h-[36px] rounded-full flex-shrink-0 mt-0.5",
                      config.color
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {event.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {format(parseISO(event.startAt), "HH:mm")}
                      {" – "}
                      {format(parseISO(event.endAt), "HH:mm")}
                      {event.location && ` · ${event.location}`}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5",
                      config.bgColor,
                      config.textColor
                    )}
                  >
                    {config.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
