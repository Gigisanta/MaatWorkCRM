import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "~/components/ui/Modal";
import { Input } from "~/components/ui/Input";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  startAt: string | Date;
  endAt: string | Date;
  location?: string | null;
  type?: string;
}

interface GoogleEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
}

interface CalendarWidgetProps {
  localEvents?: CalendarEvent[];
  googleEvents?: GoogleEvent[];
  onCreateEvent?: (event: { title: string; start: string; end: string; description?: string }) => void;
  showActions?: boolean;
  title?: string;
}

export function CalendarWidget({
  localEvents = [],
  googleEvents = [],
  onCreateEvent,
  showActions = false,
  title = "Calendario",
}: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", startTime: "", endTime: "", description: "" });

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (number | null)[] = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(i);
    }
    return days;
  }, [currentDate]);

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    
    const local = localEvents.filter((e) => {
      const eventDate = new Date(e.startAt).toISOString().split("T")[0];
      return eventDate === dateStr;
    });
    
    const google = googleEvents.filter((e) => {
      const eventDate = e.start?.date || e.start?.dateTime?.split("T")[0];
      return eventDate === dateStr;
    });
    
    return { local, google };
  };

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.startTime || !newEvent.endTime) return;
    
    const start = `${newEvent.date}T${newEvent.startTime}:00`;
    const end = `${newEvent.date}T${newEvent.endTime}:00`;
    
    onCreateEvent?.({ title: newEvent.title, start, end, description: newEvent.description });
    setShowNewEventModal(false);
    setNewEvent({ title: "", date: "", startTime: "", endTime: "", description: "" });
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();

  return (
    <Card variant="elevated" className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold">{title}</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
              <ChevronRight size={16} />
            </Button>
          </div>
          {showActions && (
            <Button variant="ghost" size="sm" className="h-8" onClick={() => setShowNewEventModal(true)}>
              <Plus size={14} className="mr-1" /> Nuevo
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-[10px] font-semibold text-[#737373] uppercase">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.map((day, idx) => {
            if (day === null) {
              return <div key={idx} className="h-10" />;
            }
            
            const { local, google } = getEventsForDay(day);
            const hasEvents = local.length > 0 || google.length > 0;
            
            return (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className={`
                  h-10 rounded-lg flex flex-col items-center justify-center text-xs cursor-pointer transition-colors relative
                  ${isToday(day) ? "bg-[#8B5CF6] text-white font-bold" : "hover:bg-white/5"}
                `}
              >
                <span>{day}</span>
                {hasEvents && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    {google.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                    {local.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {localEvents.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">Próximos eventos</p>
            {localEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="p-2 bg-[#18181B] rounded-lg border border-white/5">
                <p className="text-sm font-semibold text-[#F5F5F5] truncate">{event.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={12} className="text-[#8B5CF6]" />
                  <span className="text-xs text-[#A3A3A3]">
                    {new Date(event.startAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Modal open={showNewEventModal} onOpenChange={setShowNewEventModal}>
        <ModalHeader>
          <ModalTitle>Nuevo Evento</ModalTitle>
        </ModalHeader>
        <ModalContent className="space-y-4">
          <Input
            label="Título"
            placeholder="Reunión con cliente..."
            value={newEvent.title}
            onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
          />
          <Input
            label="Fecha"
            type="date"
            value={newEvent.date}
            onChange={(e) => setNewEvent((prev) => ({ ...prev, date: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hora inicio"
              type="time"
              value={newEvent.startTime}
              onChange={(e) => setNewEvent((prev) => ({ ...prev, startTime: e.target.value }))}
            />
            <Input
              label="Hora fin"
              type="time"
              value={newEvent.endTime}
              onChange={(e) => setNewEvent((prev) => ({ ...prev, endTime: e.target.value }))}
            />
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowNewEventModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleCreateEvent}>Crear</Button>
        </ModalFooter>
      </Modal>
    </Card>
  );
}
