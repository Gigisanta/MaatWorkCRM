"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemePreviewCard } from "@/components/theme-toggle";
import { cn } from "@/lib/utils/utils";

const accentColors = [
  { name: "Violeta", color: "#8B5CF6", active: true },
  { name: "Violet", color: "#8b5cf6", active: false },
  { name: "Blue", color: "#3b82f6", active: false },
  { name: "Emerald", color: "#10b981", active: false },
  { name: "Rose", color: "#f43f5e", active: false },
];

const themeLabels: Record<string, string> = {
  light: "Claro",
  dark: "Oscuro",
  system: "Sistema",
};

interface AppearanceSettingsProps {
  theme: string;
  onThemeChange: (theme: string) => void;
}

export function AppearanceSettings({
  theme,
  onThemeChange,
}: AppearanceSettingsProps) {
  const activeTheme = theme === "system"
    ? "Según preferencia del sistema"
    : theme === "light"
      ? "Modo claro"
      : "Modo oscuro";

  return (
    <div className="space-y-6">
      {/* Theme Card */}
      <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
        <CardHeader>
          <CardTitle className="text-white">Tema de la Interfaz</CardTitle>
          <CardDescription className="text-slate-400">
            Elige cómo quieres que se vea MaatWork CRM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Preview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ThemePreviewCard
              themeMode="light"
              isActive={theme === "light"}
              onClick={() => onThemeChange("light")}
            />
            <ThemePreviewCard
              themeMode="dark"
              isActive={theme === "dark"}
              onClick={() => onThemeChange("dark")}
            />
            <ThemePreviewCard
              themeMode="system"
              isActive={theme === "system"}
              onClick={() => onThemeChange("system")}
            />
          </div>

          <Separator className="bg-white/10" />

          {/* Theme Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-white">
              Información del tema
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg glass border border-white/8">
                <p className="text-slate-400">Tema seleccionado</p>
                <p className="text-white font-medium capitalize">
                  {themeLabels[theme] || theme}
                </p>
              </div>
              <div className="p-3 rounded-lg glass border border-white/8">
                <p className="text-slate-400">Tema activo</p>
                <p className="text-white font-medium">{activeTheme}</p>
              </div>
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Tips */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white">Consejos</h4>
            <ul className="text-sm text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>
                El modo oscuro es ideal para trabajar en ambientes con poca luz
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>
                El modo claro ofrece mejor legibilidad en ambientes luminosos
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>
                La opción &ldquo;Sistema&rdquo; adapta automáticamente el tema
                según la configuración de tu dispositivo
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Accent Color Card */}
      <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
        <CardHeader>
          <CardTitle className="text-white">Color de Acento</CardTitle>
          <CardDescription className="text-slate-400">
            Personaliza el color principal de la interfaz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {accentColors.map((accent) => (
              <button
                key={accent.name}
                className={cn(
                  "w-10 h-10 rounded-full border-2 transition-all hover:scale-110",
                  accent.active
                    ? "border-white ring-2 ring-white/30"
                    : "border-transparent"
                )}
                style={{ backgroundColor: accent.color }}
                title={accent.name}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">
            * Los colores de acento personalizados estarán disponibles próximamente
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
