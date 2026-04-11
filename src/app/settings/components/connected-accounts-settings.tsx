"use client";

import { Link as LinkIcon } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ConnectedAccountsSettings() {
  return (
    <div className="space-y-6">
      <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
        <CardHeader>
          <CardTitle className="text-white">Cuentas Vinculadas</CardTitle>
          <CardDescription className="text-slate-400">
            Conecta servicios externos a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Calendar Integration */}
          <div className="flex items-center justify-between p-4 rounded-lg glass border border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M19.5 4H5.5C4.67 4 4 4.67 4 5.5v13c0 .83.67 1.5 1.5 1.5h14c.83 0 1.5-.67 1.5-1.5v-13c0-.83-.67-1.5-1.5-1.5zm-4.5 13H8v-4h7v4zm0-5H8V8h7v4zm4.5 5h-3v-3h3v3zm0-5h-3V8h3v4z"
                    fill="#4285F4"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-white">Google Calendar</p>
                <p className="text-sm text-slate-400">
                  Sincroniza eventos con Google Calendar
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl text-slate-300"
              asChild
            >
              <Link href="/calendar">Configurar</Link>
            </Button>
          </div>

          {/* Connected Accounts */}
          <div className="flex items-center justify-between p-4 rounded-lg glass border border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <LinkIcon className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="font-medium text-white">Cuentas Conectadas</p>
                <p className="text-sm text-slate-400">
                  Gestiona Google y otros servicios
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl text-slate-300"
              asChild
            >
              <Link href="/settings/connected-accounts">Verificar</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
