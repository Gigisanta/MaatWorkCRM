"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { NotificationSettings } from "./types";

interface NotificationSettingsProps {
  settings: NotificationSettings | null;
  isLoading: boolean;
  onChange: (key: string, value: boolean) => void;
  isUpdating: boolean;
}

const notificationOptions = [
  {
    key: "emailNotifications" as keyof NotificationSettings,
    label: "Notificaciones por email",
    description: "Recibe actualizaciones importantes por correo",
  },
  {
    key: "pushNotifications" as keyof NotificationSettings,
    label: "Notificaciones push",
    description: "Recibe alertas en tiempo real",
  },
  {
    key: "taskReminders" as keyof NotificationSettings,
    label: "Recordatorios de tareas",
    description: "Alertas de tareas vencidas y próximas",
  },
  {
    key: "goalProgressAlerts" as keyof NotificationSettings,
    label: "Alertas de objetivos",
    description: "Actualizaciones de progreso de objetivos",
  },
  {
    key: "newLeadsNotifications" as keyof NotificationSettings,
    label: "Nuevos leads",
    description: "Cuando se asignan nuevos contactos",
  },
];

export function NotificationSettings({
  settings,
  isLoading,
  onChange,
}: NotificationSettingsProps) {
  const defaultSettings: NotificationSettings = {
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    goalProgressAlerts: true,
    newLeadsNotifications: true,
  };

  const currentSettings = settings || defaultSettings;

  return (
    <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
      <CardHeader>
        <CardTitle className="text-white">Preferencias de Notificación</CardTitle>
        <CardDescription className="text-slate-400">
          Elige qué notificaciones quieres recibir
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {notificationOptions.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-4 rounded-lg glass border border-white/8"
              >
                <div>
                  <p className="font-medium text-white">{item.label}</p>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </div>
                <Switch
                  checked={currentSettings[item.key]}
                  onCheckedChange={(checked) => onChange(item.key, checked)}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
