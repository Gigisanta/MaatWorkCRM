"use client";

import * as React from "react";
import {
  format,
  isToday,
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils/utils";
import type { CalendarEvent } from "../types";

// Event type config
const eventTypeConfig: Record<string, { color: string; bgColor: string; textColor: string; label: string }> = {
  meeting: { color: "bg-blue-500", bgColor: "bg-blue-500/20", textColor: "text-blue-400", label: "Reunión" },
  call: { color: "bg-emerald-500", bgColor: "bg-emerald-500/20", textColor: "text-emerald-400", label: "Llamada" },
  event: { color: "bg-violet-500", bgColor: "bg-violet-500/20", textColor: "text-violet-400", label: "Evento" },
  reminder: { color: "bg-amber-500", bgColor: "bg-amber-500/20", textColor: "text-amber-400", label: "Recordatorio" },
};

export interface WeekViewProps {
  events: CalendarEvent[];
  weekDays: Date[];
  getEventsForSlot: (day: Date, hour: number) => CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function WeekView({
  events,
  weekDays,
  getEventsForSlot,
  onEventClick,
}: WeekViewProps) {
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00–20:00

  return (
    <div className="overflow-auto">
      {/* Day headers */}
      <div className="grid grid-cols-8 border-b border-white/8 sticky top-0 bg-[#0E0F12] z-10">
        <div className="py-2 px-3 text-xs text-slate-600" />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={cn("py-2 text-center", isToday(day) && "bg-violet-500/5")}
          >
            <p className="text-xs text-slate-500 uppercase">
              {format(day, "EEE", { locale: es })}
            </p>
            <p
              className={cn(
                "text-sm font-semibold mt-0.5",
                isToday(day) ? "text-violet-400" : "text-slate-300"
              )}
            >
              {format(day, "d")}
            </p>
          </div>
        ))}
      </div>

      {/* Hour rows */}
      <div>
        {hours.map((hour) => (
          <div
            key={hour}
            className="grid grid-cols-8 border-b border-white/4 min-h-[60px]"
          >
            <div className="py-2 px-3 text-xs text-slate-600 text-right flex-shrink-0 pt-2">
              {hour}:00
            </div>
            {weekDays.map((day) => {
              const slotEvents = getEventsForSlot(day, hour);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "border-l border-white/4 p-1 relative",
                    isToday(day) && "bg-violet-500/[0.03]"
                  )}
                >
                  {slotEvents.map((event) => {
                    const config = eventTypeConfig[event.type];
                    return (
                      <div
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className={cn(
                          "text-xs px-1.5 py-1 rounded truncate mb-1 cursor-pointer transition-opacity hover:opacity-80",
                          config.bgColor
                        )}
                      >
                        <span className="text-white">{event.title}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
