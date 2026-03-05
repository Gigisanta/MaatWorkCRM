// ============================================================
// MaatWork CRM — Calendar Page
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { Plus, ChevronLeft, ChevronRight, Video, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/_app/calendar")({
  component: CalendarPage,
});

const DEMO_EVENTS = [
  { id: "1", title: "Reunión María López", type: "meeting", startAt: "10:00", endAt: "11:00", day: 4, location: "Oficina", color: "#6366f1" },
  { id: "2", title: "Llamada Juan Martínez", type: "call", startAt: "14:00", endAt: "14:30", day: 5, color: "#10b981" },
  { id: "3", title: "Equipo semanal", type: "meeting", startAt: "09:00", endAt: "10:00", day: 7, location: "Zoom", color: "#f59e0b" },
  { id: "4", title: "Follow-up Roberto", type: "call", startAt: "16:00", endAt: "16:30", day: 10, color: "#8b5cf6" },
  { id: "5", title: "Presentación propuesta", type: "meeting", startAt: "11:00", endAt: "12:00", day: 11, location: "Cliente", color: "#3b82f6" },
];

const typeIcons: Record<string, React.ElementType> = { meeting: MapPin, call: Phone, event: Video, reminder: Video };

function CalendarPage() {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const today = 4; // March 4

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Calendario</h1>
          <p className="text-surface-400 mt-1">Marzo 2026</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium">
          <Plus className="w-4 h-4" />
          Nuevo Evento
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center gap-4 glass-card p-3 w-fit">
        <button className="p-1.5 hover:bg-surface-800 rounded"><ChevronLeft className="w-4 h-4 text-surface-400" /></button>
        <span className="text-white font-semibold">Marzo 2026</span>
        <button className="p-1.5 hover:bg-surface-800 rounded"><ChevronRight className="w-4 h-4 text-surface-400" /></button>
      </div>

      {/* Calendar Grid */}
      <div className="glass-card p-4 animate-fade-in">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
            <div key={d} className="text-center text-xs text-surface-500 font-medium py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for March 2026 starting on Sunday */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`empty-${i}`} className="h-24 rounded-lg" />
          ))}
          {days.map((day) => {
            const dayEvents = DEMO_EVENTS.filter((e) => e.day === day);
            const isToday = day === today;
            return (
              <div
                key={day}
                className={`h-24 rounded-lg p-1.5 border transition-all ${
                  isToday
                    ? "border-brand-500/50 bg-brand-500/5"
                    : "border-surface-800/50 hover:border-surface-700"
                }`}
              >
                <span className={`text-xs font-medium ${isToday ? "text-brand-400" : "text-surface-400"}`}>{day}</span>
                <div className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 2).map((e) => (
                    <div
                      key={e.id}
                      className="text-[10px] px-1.5 py-0.5 rounded truncate text-white font-medium"
                      style={{ backgroundColor: e.color }}
                    >
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-[10px] text-surface-500">+{dayEvents.length - 2} más</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="glass-card p-6 animate-fade-in">
        <h2 className="text-lg font-semibold text-white mb-4">Próximos Eventos</h2>
        <div className="space-y-3">
          {DEMO_EVENTS.map((e) => {
            const Icon = typeIcons[e.type] ?? MapPin;
            return (
              <div key={e.id} className="flex items-center gap-4 p-3 rounded-lg bg-surface-800/50 border border-surface-700/30">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${e.color}20` }}>
                  <Icon className="w-5 h-5" style={{ color: e.color }} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{e.title}</p>
                  <p className="text-xs text-surface-400">Mar {e.day} • {e.startAt} - {e.endAt}{e.location ? ` • ${e.location}` : ""}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
