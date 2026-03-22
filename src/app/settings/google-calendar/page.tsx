'use client';

import * as React from 'react';
import { signIn } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Calendar, RefreshCw, Link2Off, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface CalendarStatus {
  connected: boolean;
  email?: string;
  lastSync?: string;
  calendars: CalendarInfo[];
}

interface CalendarInfo {
  id: string;
  name: string;
  selected: boolean;
}

async function fetchCalendarStatus(): Promise<CalendarStatus> {
  const res = await fetch('/api/calendar/status');
  if (!res.ok) throw new Error('Failed to fetch calendar status');
  return res.json();
}

async function syncCalendar(): Promise<{ success: boolean; lastSync: string }> {
  const res = await fetch('/api/calendar/sync', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to sync calendar');
  return res.json();
}

async function updateCalendarPreferences(calendars: string[]): Promise<{ success: boolean }> {
  const res = await fetch('/api/calendar/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ calendars }),
  });
  if (!res.ok) throw new Error('Failed to update preferences');
  return res.json();
}

async function disconnectCalendar(): Promise<{ success: boolean }> {
  const res = await fetch('/api/calendar/disconnect', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to disconnect calendar');
  return res.json();
}

export default function GoogleCalendarPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['calendar-status'],
    queryFn: fetchCalendarStatus,
  });

  const syncMutation = useMutation({
    mutationFn: syncCalendar,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-status'] });
      toast.success('Calendario sincronizado correctamente');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const preferencesMutation = useMutation({
    mutationFn: updateCalendarPreferences,
    onSuccess: () => {
      toast.success('Preferencias guardadas');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-status'] });
      toast.success('Calendario desconectado');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleCalendarToggle = (calendarId: string, currentlySelected: boolean) => {
    if (!data) return;
    const updatedCalendars = currentlySelected
      ? data.calendars.filter((c) => c.id !== calendarId).map((c) => c.id)
      : [...data.calendars.filter((c) => c.selected).map((c) => c.id), calendarId];
    preferencesMutation.mutate(updatedCalendars);
  };

  const handleConnect = () => {
    signIn('google', { callbackUrl: '/settings/google-calendar' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Google Calendar</h2>
        <p className="text-sm text-slate-400 mt-1">
          Conecta tu calendario de Google para sincronizar eventos
        </p>
      </div>

      {error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-400">Error al cargar el estado del calendario</p>
          </CardContent>
        </Card>
      )}

      {data?.connected ? (
        <>
          {/* Status Card */}
          <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border-white/8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-violet-500/10 p-2.5 rounded-xl">
                    <Calendar className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-medium text-white">Calendario Conectado</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      {data.email}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                  Conectado
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-violet-400" />
                  <span className="text-sm text-slate-300">Ultima sincronizacion</span>
                </div>
                <span className="text-xs text-slate-400">
                  {data.lastSync ? new Date(data.lastSync).toLocaleString('es-ES') : 'Nunca'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  className="flex-1 border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
                >
                  {syncMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  )}
                  Sincronizar ahora
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                  className="border-white/10 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  {disconnectMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <Link2Off className="h-3.5 w-3.5 mr-1" />
                  )}
                  Desconectar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Calendars Selection Card */}
          <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border-white/8">
            <CardHeader>
              <CardTitle className="text-base font-medium text-white">Calendarios a sincronizar</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Selecciona que calendarios quieres importar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.calendars && data.calendars.length > 0 ? (
                  data.calendars.map((calendar) => (
                    <div
                      key={calendar.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 hover:bg-white/8 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={calendar.selected}
                          onCheckedChange={() => handleCalendarToggle(calendar.id, calendar.selected)}
                          disabled={preferencesMutation.isPending}
                          className="data-[state=checked]:bg-violet-500"
                        />
                        <span className="text-sm text-slate-300">{calendar.name}</span>
                      </div>
                      {calendar.selected && (
                        <Check className="h-4 w-4 text-violet-400" />
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 py-4 text-center">No se encontraron calendarios</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border-white/8">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="bg-violet-500/10 p-4 rounded-2xl">
              <Calendar className="h-8 w-8 text-violet-400" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-medium text-white">Calendario no conectado</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm">
                Conecta tu cuenta de Google para sincronizar eventos con tu calendario personal
              </p>
            </div>
            <Button
              onClick={handleConnect}
              className="bg-violet-500 hover:bg-violet-600 text-white"
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Conectar Google Calendar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
