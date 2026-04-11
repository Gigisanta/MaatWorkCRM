"use client";

import * as React from "react";
import { Loader2, LogOut, Trash2, AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils/utils";
import type { Session } from "./types";

interface SecuritySettingsProps {
  sessions: Session[];
  isLoading: boolean;
  onLogoutOthers: () => void;
  isLoggingOutOthers: boolean;
  onDeleteAccount: () => void;
  isDeletingAccount: boolean;
}

function parseUserAgent(userAgent: string | null): { browser: string; os: string } {
  if (!userAgent) return { browser: "Desconocido", os: "Desconocido" };

  let browser = "Desconocido";
  let os = "Desconocido";

  if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Edge")) browser = "Edge";

  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";

  return { browser, os };
}

export function SecuritySettings({
  sessions,
  isLoading,
  onLogoutOthers,
  isLoggingOutOthers,
  onDeleteAccount,
  isDeletingAccount,
}: SecuritySettingsProps) {
  const [deleteAccountOpen, setDeleteAccountOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* Active Sessions Card */}
      <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
        <CardHeader>
          <CardTitle className="text-white">Sesiones Activas</CardTitle>
          <CardDescription className="text-slate-400">
            Dispositivos donde has iniciado sesión
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.length > 0 ? (
                <>
                  {sessions.map((session) => {
                    const { browser, os } = parseUserAgent(session.userAgent || null);
                    return (
                      <div
                        key={session.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg glass border",
                          session.isCurrent
                            ? "border-emerald-500/30"
                            : "border-white/10"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              session.isCurrent ? "bg-emerald-500" : "bg-slate-400"
                            )}
                          />
                          <div>
                            <p className="text-sm font-medium text-white">
                              {browser} en {os}
                            </p>
                            <p className="text-xs text-slate-400">
                              {session.ipAddress || "IP desconocida"} &bull;
                              {" "}
                              {new Date(session.createdAt).toLocaleDateString("es-MX", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        {session.isCurrent && (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/30 text-emerald-400"
                          >
                            Sesión actual
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                  {sessions.length > 1 && (
                    <Button
                      variant="outline"
                      className="mt-4 bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl text-slate-300"
                      onClick={onLogoutOthers}
                      disabled={isLoggingOutOthers}
                    >
                      {isLoggingOutOthers ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4 mr-2" />
                      )}
                      Cerrar otras sesiones
                    </Button>
                  )}
                </>
              ) : (
                <p className="text-slate-400 text-center py-4">
                  No hay sesiones activas
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone Card */}
      <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl border-rose-500/30">
        <CardHeader>
          <CardTitle className="text-rose-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Zona de Peligro
          </CardTitle>
          <CardDescription className="text-slate-400">
            Acciones irreversibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg bg-rose-500/5 border border-rose-500/20">
            <div>
              <p className="text-white font-medium">Eliminar cuenta</p>
              <p className="text-sm text-slate-400">
                Esta acción es permanente y no se puede deshacer
              </p>
            </div>
            <Button
              variant="outline"
              className="glass border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
              onClick={() => setDeleteAccountOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar mi cuenta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation */}
      <AlertDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <AlertDialogContent className="glass border-rose-500/30 bg-[#0E0F12]/80">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-400">
              Eliminar Cuenta
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Esta acción es permanente y no se puede deshacer. Se eliminarán todos
              tus datos, incluyendo contactos, tareas y notas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl text-slate-300">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={onDeleteAccount}
            >
              {isDeletingAccount ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Eliminar mi cuenta"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
