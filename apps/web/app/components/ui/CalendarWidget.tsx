import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Plus, Calendar, List, GripVertical } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<"month" | "agenda">("month");
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

  const getAllUpcomingEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allEvents: (CalendarEvent | GoogleEvent)[] = [
      ...localEvents.map(e => ({ ...e, eventType: 'local' as const })),
      ...googleEvents.map(e => ({ ...e, eventType: 'google' as const }))
    ];
    
    return allEvents
      .filter(e => {
        const eventDate = 'startAt' in e 
          ? new Date(e.startAt) 
          : new Date(e.start?.dateTime || e.start?.date || '');
        return eventDate >= today;
      })
      .sort((a, b) => {
        const dateA = 'startAt' in a ? new Date(a.startAt) : new Date(a.start?.dateTime || a.start?.date || '');
        const dateB = 'startAt' in b ? new Date(b.startAt) : new Date(b.start?.dateTime || b.start?.date || '');
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5);
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

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatEventTime = (event: CalendarEvent | GoogleEvent) => {
    if ('startAt' in event) {
      return new Date(event.startAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    }
    const dateTime = event.start?.dateTime || event.start?.date || '';
    if (!dateTime) return '';
    return new Date(dateTime).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatEventDate = (event: CalendarEvent | GoogleEvent) => {
    if ('startAt' in event) {
      return new Date(event.startAt).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
    }
    const dateTime = event.start?.dateTime || event.start?.date || '';
    if (!dateTime) return '';
    return new Date(dateTime).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <Card variant="elevated" className="h-full overflow-hidden">
      <div className="relative h-1 bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-[#8B5CF6]" />
      
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#8B5CF6]/10">
              <Calendar className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <CardTitle className="text-lg font-bold text-[#F5F5F5]">{title}</CardTitle>
          </div>
          
          <div className="flex items-center gap-1 bg-[#18181B] rounded-lg p-1">
            <Button
              variant={viewMode === "month" ? "primary" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setViewMode("month")}
            >
              Mes
            </Button>
            <Button
              variant={viewMode === "agenda" ? "primary" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setViewMode("agenda")}
            >
              <List size={14} className="mr-1" />
              Agenda
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 rounded-lg bg-[#18181B] hover:bg-[#8B5CF6]/20 hover:text-[#8B5CF6] transition-all"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft size={18} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 rounded-lg bg-[#18181B] hover:bg-[#8B5CF6]/20 hover:text-[#8B5CF6] transition-all font-medium text-sm"
              onClick={goToToday}
            >
              Hoy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 rounded-lg bg-[#18181B] hover:bg-[#8B5CF6]/20 hover:text-[#8B5CF6] transition-all"
              onClick={goToNextMonth}
            >
              <ChevronRight size={18} />
            </Button>
          </div>
          
          <motion.h2 
            key={`${currentDate.getMonth()}-${currentDate.getFullYear()}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-bold text-[#F5F5F5]"
          >
            {monthNames[currentDate.getMonth()]} <span className="text-[#8B5CF6]">{currentDate.getFullYear()}</span>
          </motion.h2>
          
          <div className="flex items-center gap-2">
            {showActions && (
              <Button
                variant="primary"
                size="sm"
                className="h-9 px-4 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] transition-all shadow-lg shadow-[#8B5CF6]/25"
                onClick={() => setShowNewEventModal(true)}
              >
                <Plus size={16} className="mr-1" />
                Nuevo
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-[#737373]">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
            <span>Evento local</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Google Calendar</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <AnimatePresence mode="wait">
          {viewMode === "month" ? (
            <motion.div
              key="month-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day) => (
                  <div 
                    key={day} 
                    className="text-[11px] font-bold text-[#737373] uppercase tracking-wider text-center py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1.5">
                {daysInMonth.map((day, idx) => {
                  if (day === null) {
                    return <div key={idx} className="h-12" />;
                  }
                  
                  const { local, google } = getEventsForDay(day);
                  const hasEvents = local.length > 0 || google.length > 0;
                  const hasManyEvents = local.length + google.length > 2;
                  
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(139, 92, 246, 0.1)" }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        h-12 rounded-xl flex flex-col items-center justify-start pt-2 cursor-pointer transition-all relative overflow-hidden
                        ${isToday(day) 
                          ? "bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] shadow-lg shadow-[#8B5CF6]/30" 
                          : "bg-[#18181B]/50 hover:bg-[#18181B]"
                        }
                      `}
                      >
                        <span className={`text-sm font-semibold ${isToday(day) ? "text-white" : day ? "text-[#F5F5F5]" : "text-[#52525B]"}`}>
                          {day}
                        </span>
                        
                        {hasEvents && (
                        <div className="absolute bottom-1.5 flex gap-1 flex-wrap justify-center max-w-[90%]">
                          {hasManyEvents ? (
                            <div className="flex items-center gap-0.5">
                              {google.length > 0 && (
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              )}
                              {local.length > 0 && (
                                <div className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />
                              )}
                              <span className="text-[9px] text-[#A3A3A3] ml-0.5">
                                {local.length + google.length}
                              </span>
                            </div>
                          ) : (
                            <>
                              {google.length > 0 && (
                                <div className="w-2 h-2 rounded-full bg-blue-400 shadow-sm shadow-blue-400/50" />
                              )}
                              {local.length > 0 && (
                                <div className="w-2 h-2 rounded-full bg-[#A78BFA] shadow-sm shadow-[#A78BFA]/50" />
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="agenda-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {getAllUpcomingEvents().length === 0 ? (
                <div className="text-center py-12 text-[#737373]">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No hay eventos proximos</p>
                  {showActions && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="mt-4"
                      onClick={() => setShowNewEventModal(true)}
                    >
                      <Plus size={16} className="mr-1" />
                      Crear evento
                    </Button>
                  )}
                </div>
              ) : (
                getAllUpcomingEvents().map((event, idx) => {
                  const isLocal = 'eventType' in event ? event.eventType === 'local' : 'startAt' in event;
                  const eventTitle = (event as GoogleEvent).summary || (event as CalendarEvent).title || '';
                  const eventDesc = (event as GoogleEvent).description || (event as CalendarEvent).description || '';
                  
                  return (
                    <motion.div
                      key={'id' in event ? event.id : idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-[#18181B] border border-white/5 hover:border-[#8B5CF6]/30 transition-colors group"
                    >
                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${isLocal ? "bg-[#8B5CF6]" : "bg-blue-400"}`} />
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#F5F5F5] truncate group-hover:text-[#A78BFA] transition-colors">
                          {eventTitle}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-[#737373]">
                          <div className="flex items-center gap-1">
                            <Clock size={12} className={isLocal ? "text-[#8B5CF6]" : "text-blue-400"} />
                            <span>{formatEventDate(event)}</span>
                            <span className="text-[#52525B]">|</span>
                            <span>{formatEventTime(event)}</span>
                          </div>
                        </div>
                        {eventDesc && (
                          <p className="text-xs text-[#52525B] mt-2 line-clamp-2">{eventDesc}</p>
                        )}
                      </div>
                      
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <GripVertical size={14} />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between mt-4 pt-4 border-t border-white/5"
        >
          <div className="flex items-center gap-4 text-xs text-[#737373]">
            <span>
              <strong className="text-[#F5F5F5]">{localEvents.length}</strong> eventos locales
            </span>
            <span>
              <strong className="text-[#F5F5F5]">{googleEvents.length}</strong> de Google
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs text-[#8B5CF6] hover:text-[#A78BFA]"
            onClick={() => setShowNewEventModal(true)}
          >
            <Plus size={14} className="mr-1" />
            Agregar
          </Button>
        </motion.div>
      </CardContent>

      {!showActions && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowNewEventModal(true)}
          className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white shadow-lg shadow-[#8B5CF6]/40 flex items-center justify-center z-10"
        >
          <Plus size={24} />
        </motion.button>
      )}

      <Modal open={showNewEventModal} onOpenChange={setShowNewEventModal}>
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#8B5CF6]/10">
              <Calendar size={18} className="text-[#8B5CF6]" />
            </div>
            Nuevo Evento
          </ModalTitle>
        </ModalHeader>
        <ModalContent className="space-y-4">
          <Input
            label="Titulo"
            placeholder="Reunion con cliente..."
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
