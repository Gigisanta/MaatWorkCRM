"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Activity, ScrollText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import type { AuditLog } from "./types";

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) return formatDate(date);
  if (days > 0) return `hace ${days}d`;
  if (hours > 0) return `hace ${hours}h`;
  if (minutes > 0) return `hace ${minutes}m`;
  return "ahora";
}

function formatActionDescription(action: string, entityType: string): string {
  const actionLabels: Record<string, string> = {
    "user:create": "Usuario creado",
    "user:update": "Usuario actualizado",
    "user:delete": "Usuario eliminado",
    "user:activate": "Usuario activado",
    "user:deactivate": "Usuario desactivado",
    "role:change": "Rol cambiado",
    "team:create": "Equipo creado",
    "team:update": "Equipo actualizado",
    "team:delete": "Equipo eliminado",
    "teamMember:add": "Miembro añadido",
    "teamMember:remove": "Miembro eliminado",
  };
  return actionLabels[`${entityType.toLowerCase()}:${action.toLowerCase()}`] || `${action} ${entityType}`;
}

export function AdminActivityLogsTab() {
  const { data, isLoading } = useQuery<{ auditLogs: AuditLog[] }>({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/audit-logs");
      if (!res.ok) throw new Error("Error al cargar registros");
      return res.json();
    },
  });

  const logs: AuditLog[] = data?.auditLogs ?? [];

  return (
    <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-violet-400" />
          Registro de Actividad
        </CardTitle>
        <CardDescription className="text-slate-400">
          Historial de acciones realizadas en la organización
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No hay actividad registrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/8"
              >
                <Avatar className="h-8 w-8 mt-0.5">
                  <AvatarImage src={log.user.image || undefined} />
                  <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs">
                    {getInitials(log.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">
                      {log.user.name || "Sin nombre"}
                    </span>
                    <Badge variant="outline" size="sm" className="border-white/10 text-slate-400">
                      {formatActionDescription(log.action, log.entityType)}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {log.entityType} &middot; {formatRelativeTime(log.createdAt)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
