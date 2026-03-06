// ============================================================
// MaatWork CRM — Settings Page
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { Bell, Building2, Palette, Shield, User } from "lucide-react";

export const Route = createFileRoute("/_app/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Configuración</h1>
        <p className="text-surface-400 mt-1">Perfil, organización y preferencias</p>
      </div>

      {/* Profile */}
      <div className="glass-card p-6 animate-fade-in">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-brand-400" /> Perfil
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-surface-400 mb-1">Nombre</label>
            <input
              type="text"
              defaultValue="Carlos Admin"
              className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm text-surface-400 mb-1">Email</label>
            <input
              type="email"
              defaultValue="admin@maatwork.com"
              className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm text-surface-400 mb-1">Rol</label>
              <span className="px-3 py-1 rounded bg-brand-600/20 text-brand-400 text-sm font-medium border border-brand-600/30">
                Administrador
              </span>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-surface-400 mb-1">Nivel</label>
              <span className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 text-sm font-medium border border-emerald-500/30">
                Senior
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Organization */}
      <div className="glass-card p-6 animate-fade-in">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-brand-400" /> Organización
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-surface-400 mb-1">Nombre</label>
            <input
              type="text"
              defaultValue="MaatWork Demo"
              className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-white focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm text-surface-400 mb-1">Slug</label>
            <input
              type="text"
              defaultValue="maatwork-demo"
              className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-surface-400 focus:outline-none"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card p-6 animate-fade-in">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-brand-400" /> Notificaciones
        </h2>
        <div className="space-y-3">
          {["Tareas vencidas", "Metas de equipo", "Nuevos contactos", "Actividad del pipeline"].map((item) => (
            <label key={item} className="flex items-center justify-between py-2">
              <span className="text-surface-200">{item}</span>
              <div className="w-11 h-6 bg-brand-600 rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow" />
              </div>
            </label>
          ))}
        </div>
      </div>

      <button className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors">
        Guardar Cambios
      </button>
    </div>
  );
}
