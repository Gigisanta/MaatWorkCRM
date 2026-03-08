// ============================================================
// MaatWork CRM — Calendar Page
// UI/UX REFINED BY JULES v2
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  RefreshCw,
  Sparkles,
  Video,
} from "lucide-react";
import { useState } from "react";
import { useSession } from "~/lib/auth-client";
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
    title: "Meeting with Maria Lopez",
    type: "meeting",
    startAt: "10:00",
    endAt: "11:00",
    day: 4,
    location: "Office",
    color: "primary",
  },
  { id: "2", title: "Call Juan Martinez", type: "call", startAt: "14:00", endAt: "14:30", day: 5, color: "success" },
  {
    id: "3",
    title: "Weekly Team Sync",
    type: "meeting",
    startAt: "09:00",
    endAt: "10:00",
    day: 7,
    location: "Zoom",
    color: "warning",
  },
  { id: "4", title: "Follow-up Roberto", type: "call", startAt: "16:00", endAt: "16:30", day: 10, color: "accent" },
  {
    id: "5",
    title: "Proposal Presentation",
    type: "meeting",
    startAt: "11:00",
    endAt: "12:00",
    day: 11,
    location: "Client HQ",
    color: "info",
  },
];

const typeIcons: Record<string, any> = { meeting: "MapPin", call: "Phone", event: "Video", reminder: "Clock" };

const colorMap: Record<string, string> = {
  primary: "bg-primary/10 border-primary/20 text-primary",
  success: "bg-success/10 border-success/20 text-success",
  warning: "bg-warning/10 border-warning/20 text-warning",
  accent: "bg-accent/10 border-accent/20 text-accent",
  info: "bg-info/10 border-info/20 text-info",
};

function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 4)); // March 4, 2026
  const [showGoogleCalendar, setShowGoogleCalendar] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const { data: session } = useSession();

  const fetchGoogleEvents = async () => {
    if (!session?.user) return;
    setLoadingGoogle(true);
    try {
      const response = await fetch("/api/google/calendar/events");
      if (response.ok) {
        const data = await response.json();
        setGoogleEvents(data);
      }
    } catch (error) {
      console.error("Failed to fetch Google Calendar events:", error);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const toggleGoogleCalendar = () => {
    if (!showGoogleCalendar && session?.user) {
      fetchGoogleEvents();
    }
    setShowGoogleCalendar(!showGoogleCalendar);
  };

  // Transform Google Calendar events to local format
  const googleEventsTransformed = googleEvents.map((event: any) => {
    const startDate = new Date(event.start?.dateTime || event.start?.date || new Date());
    const endDate = new Date(event.end?.dateTime || event.end?.date || new Date());
    return {
      id: event.id,
      title: event.summary || "Untitled Event",
      type: "meeting" as const,
      startAt: startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      endAt: endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      day: startDate.getDate(),
      location: event.location || "",
      color: "info" as const,
      isGoogle: true,
    };
  });

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const today = 4;

  const monthName = currentDate.toLocaleString("en-US", { month: "long" });
  const year = currentDate.getFullYear();

  return (
    <Container className="py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2"
      >
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-text font-display tracking-tight">Calendar</h1>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Sync your events and business commitments.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant={showGoogleCalendar ? "primary" : "outline"}
            onClick={toggleGoogleCalendar}
            disabled={!session?.user}
            className={cn(
              "h-10 px-4 border-border bg-surface hover:bg-surface-hover transition-all",
              showGoogleCalendar && "bg-primary hover:bg-primary-hover text-white"
            )}
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            Google Calendar
          </Button>
          {showGoogleCalendar && session?.user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchGoogleEvents}
              disabled={loadingGoogle}
              className="h-10 px-3"
            >
              <RefreshCw className={cn("w-4 h-4", loadingGoogle && "animate-spin")} />
            </Button>
          )}
          <Button
            variant="outline"
            className="h-10 px-4 border-border bg-surface text-text-secondary hover:text-primary hover:bg-surface-hover hover:border-border-hover transition-all"
          >
            <Sparkles className="w-4 h-4 mr-2 text-accent" />
            Smart Schedule
          </Button>
          <Button
            variant="primary"
            className="shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] rounded-xl h-10 px-5 font-semibold text-sm bg-primary hover:bg-primary-hover transition-all"
          >
            <Plus className="w-4 h-4 mr-2" strokeWidth={2.5} /> New Event
          </Button>
        </div>
      </motion.div>

      <Grid cols={{ sm: 1, lg: 4 }} gap={6}>
        {/* Calendar Main Grid */}
        <div className="lg:col-span-3 space-y-4">
          <Card variant="glass" className="overflow-hidden border-border bg-surface">
            <CardHeader className="bg-surface-hover border-b border-border px-6 py-4">
              <Stack direction="row" align="center" justify="between">
                <h2 className="text-xl font-bold text-text capitalize tracking-tight">
                  {monthName} {year}
                </h2>
                <Stack direction="row" gap="xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-lg hover:bg-surface text-text-muted hover:text-text p-0 flex items-center justify-center"
                  >
                    <ChevronLeft size={18} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-xs font-bold uppercase tracking-wider border-border hover:bg-surface hover:text-primary"
                  >
                    Today
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-lg hover:bg-surface text-text-muted hover:text-text p-0 flex items-center justify-center"
                  >
                    <ChevronRight size={18} />
                  </Button>
                </Stack>
              </Stack>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b border-border">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div
                    key={d}
                    className="py-3 text-center text-[10px] font-bold text-text-muted uppercase tracking-wider bg-surface-hover/50"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {/* Empty cells for padding */}
                {Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-32 border-b border-r border-border/50 bg-background/50" />
                ))}

                {days.map((day) => {
                  const dayEvents = DEMO_EVENTS.filter((e) => e.day === day);
                  const googleDayEvents = showGoogleCalendar
                    ? googleEventsTransformed.filter((e) => e.day === day)
                    : [];
                  const isToday = day === today;

                  return (
                    <div
                      key={day}
                      className={cn(
                        "h-32 border-b border-r border-border/50 p-2 transition-all hover:bg-surface-hover/50 group relative",
                        isToday && "bg-primary/5",
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <span
                          className={cn(
                            "text-xs font-bold rounded-lg w-7 h-7 flex items-center justify-center transition-all",
                            isToday
                              ? "bg-primary text-white shadow-[0_0_10px_rgba(139,92,246,0.5)] scale-110"
                              : "text-text-secondary group-hover:text-text",
                          )}
                        >
                          {day}
                        </span>
                        {dayEvents.length > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_5px_rgba(139,92,246,0.8)] mt-1 mr-1" />
                        )}
                      </div>

                      <div className="mt-2 space-y-1.5 overflow-y-auto max-h-[80px] scrollbar-hide">
                          {dayEvents.map((e) => (
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              key={e.id}
                              className={cn(
                                "text-[10px] px-2 py-1 rounded-md border font-semibold truncate transition-all cursor-pointer hover:brightness-110",
                                colorMap[e.color],
                              )}
                            >
                              {e.startAt} {e.title}
                            </motion.div>
                          ))}
                          {googleDayEvents.map((e: any) => (
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              key={e.id}
                              className="text-[10px] px-2 py-1 rounded-md border font-semibold truncate transition-all cursor-pointer hover:brightness-110 bg-info/10 border-info/20 text-info flex items-center gap-1"
                              title={e.location || "Google Calendar Event"}
                            >
                              <ExternalLink size={8} />
                              {e.startAt} {e.title}
                            </motion.div>
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
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider px-1">Upcoming Events</h3>
            <div className="space-y-3">
              {(showGoogleCalendar ? [...DEMO_EVENTS, ...googleEventsTransformed] : DEMO_EVENTS).map((e: any, idx: number) => (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={e.id}
                >
                  <Card className={cn(
                    "hover:shadow-[0_4px_15px_rgba(0,0,0,0.1)] border-border bg-surface hover:border-primary/30 transition-all duration-300 group",
                    e.isGoogle && "border-info/30 hover:border-info/50"
                  )}>
                    <CardContent className="p-3.5">
                      <Stack direction="row" gap="sm" align="start">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                            e.isGoogle ? "bg-info/10 border-info/20" : colorMap[e.color],
                          )}
                        >
                          {e.isGoogle ? <ExternalLink size={18} className="text-info" /> : <Icon name={typeIcons[e.type] as any} size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-text truncate group-hover:text-primary-light transition-colors">
                            {e.title}
                          </h4>
                          <p className="text-[10px] font-medium text-text-muted mt-1 flex items-center gap-1">
                            <Clock size={10} />
                            {e.startAt} - {e.endAt} {e.location && `• ${e.location}`}
                          </p>
                        </div>
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <Card variant="cyber" className="bg-surface border-border relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
            <CardContent className="p-5 space-y-5 relative z-10">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={14} /> Weekly Summary
              </h3>
              <div className="space-y-3">
                <Stack direction="row" justify="between" align="center">
                  <span className="text-sm font-medium text-text-secondary">Meetings</span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold">
                    12
                  </Badge>
                </Stack>
                <Stack direction="row" justify="between" align="center">
                  <span className="text-sm font-medium text-text-secondary">Calls</span>
                  <Badge variant="outline" className="bg-surface-hover text-text-muted border-border font-bold">
                    24
                  </Badge>
                </Stack>
                <div className="pt-3 border-t border-border/50">
                  <p className="text-xs text-text-muted leading-relaxed font-medium">
                    Your schedule is <span className="text-primary font-bold">15% busier</span> than last week.
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
