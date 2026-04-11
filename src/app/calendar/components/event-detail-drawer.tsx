"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import {
  Clock,
  MapPin,
  Users,
  Calendar as CalendarIcon,
  Phone,
  Bell,
  Edit,
  Trash2,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/utils";
import type { CalendarEvent } from "../types";

// Event type config
const eventTypeConfig: Record<
  string,
  {
    color: string;
    bgColor: string;
    textColor: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  meeting: {
    color: "bg-blue-500",
    bgColor: "bg-blue-500/20",
    textColor: "text-blue-400",
    label: "Reunión",
    icon: Users,
  },
  call: {
    color: "bg-emerald-500",
    bgColor: "bg-emerald-500/20",
    textColor: "text-emerald-400",
    label: "Llamada",
    icon: Phone,
  },
  event: {
    color: "bg-violet-500",
    bgColor: "bg-violet-500/20",
    textColor: "text-violet-400",
    label: "Evento",
    icon: CalendarIcon,
  },
  reminder: {
    color: "bg-amber-500",
    bgColor: "bg-amber-500/20",
    textColor: "text-amber-400",
    label: "Recordatorio",
    icon: Bell,
  },
};

interface EventDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  onEdit: () => void;
  onDelete: () => void;
}

export function EventDetailDrawer({
  open,
  onOpenChange,
  event,
  onEdit,
  onDelete,
}: EventDetailDrawerProps) {
  if (!event) return null;

  const config = eventTypeConfig[event.type];
  const Icon = config.icon;
  const startDate = parseISO(event.startAt);
  const endDate = parseISO(event.endAt);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
        <DrawerHeader>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              <Icon className={cn("h-5 w-5", config.textColor)} />
            </div>
            <div>
              <DrawerTitle className="text-white">{event.title}</DrawerTitle>
              <DrawerDescription>
                <Badge
                  variant="outline"
                  className={cn("mt-1", config.textColor, "border-current")}
                >
                  {config.label}
                </Badge>
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="p-4 space-y-4">
          {/* Date & Time */}
          <div className="flex items-start gap-3 p-3 rounded-lg glass border border-white/8">
            <Clock className="h-5 w-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-400">Fecha y hora</p>
              <p className="text-white font-medium">
                {format(startDate, "EEEE, d 'de' MMMM")}
              </p>
              <p className="text-slate-300">
                {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
              </p>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3 p-3 rounded-lg glass border border-white/8">
              <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-400">Ubicación</p>
                <p className="text-white">{event.location}</p>
              </div>
            </div>
          )}

          {/* Team */}
          {event.team && (
            <div className="flex items-start gap-3 p-3 rounded-lg glass border border-white/8">
              <Users className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-400">Equipo</p>
                <p className="text-white">{event.team.name}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="p-3 rounded-lg glass border border-white/8">
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

        <DrawerFooter className="border-t border-white/8 pt-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl"
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
