// ============================================================
// MaatWork CRM — Sidebar Component
// ============================================================

import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Kanban,
  CheckSquare,
  UsersRound,
  Calendar,
  BarChart3,
  GraduationCap,
  Settings,
  Shield,
  Bell,
  LogOut,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/contacts", label: "Contactos", icon: Users },
  { to: "/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/tasks", label: "Tareas", icon: CheckSquare },
  { to: "/teams", label: "Equipos", icon: UsersRound },
  { to: "/calendar", label: "Calendario", icon: Calendar },
  { to: "/reports", label: "Reportes", icon: BarChart3 },
  { to: "/training", label: "Capacitación", icon: GraduationCap },
] as const;

const bottomItems = [
  { to: "/settings", label: "Configuración", icon: Settings },
  { to: "/settings/audit", label: "Auditoría", icon: Shield },
] as const;

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouterState();
  const currentPath = router.location.pathname;

  return (
    <>
      {/* Mobile overlay */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface-800 text-surface-200"
        onClick={() => setCollapsed(!collapsed)}
        type="button"
      >
        <Menu className="w-5 h-5" />
      </button>

      <aside
        className={cn(
          "fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300",
          "bg-surface-900/95 backdrop-blur-xl border-r border-surface-800",
          collapsed ? "w-16" : "w-64",
          "max-lg:hidden lg:flex"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-surface-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
            M
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-bold text-white text-lg leading-tight">MaatWork</h1>
              <p className="text-xs text-surface-400">CRM para Asesores</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-1 rounded hover:bg-surface-800 text-surface-400 transition-colors"
            type="button"
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentPath.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-brand-600/20 text-brand-400 border border-brand-600/30"
                    : "text-surface-400 hover:text-surface-200 hover:bg-surface-800"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="animate-fade-in">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom nav */}
        <div className="py-4 px-2 border-t border-surface-800 space-y-1">
          {bottomItems.map((item) => {
            const isActive = currentPath === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-brand-600/20 text-brand-400"
                    : "text-surface-400 hover:text-surface-200 hover:bg-surface-800"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
