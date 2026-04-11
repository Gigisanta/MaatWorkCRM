"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/utils";
import {
  LayoutDashboard,
  Users,
  Target,
  CheckSquare,
  Calendar,
  BarChart3,
  GraduationCap,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  Building2,
  LogOut,
  Briefcase,
  UserPlus,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { MaatWorkLogo, MaatWorkIcon } from "@/components/brand";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";

interface AppSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export const AppSidebar = React.memo(function AppSidebar({ collapsed, onCollapsedChange }: AppSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Memoized navigation groups with labels and separators
  const navigationGroups = React.useMemo(() => [
    {
      label: "PRINCIPAL",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Contactos", href: "/contacts", icon: Users },
        { name: "Pipeline", href: "/pipeline", icon: Target },
      ]
    },
    {
      label: "PRODUCTIVIDAD",
      items: [
        { name: "Tareas", href: "/tasks", icon: CheckSquare },
        { name: "Calendario", href: "/calendar", icon: Calendar },
        { name: "Metas", href: "/goals", icon: Target },
      ]
    },
    {
      label: "EQUIPO",
      items: [
        { name: "Equipos", href: "/teams", icon: Building2 },
        { name: "Reclutamiento", href: "/reclutamiento", icon: UserPlus },
        { name: "Reportes", href: "/reports", icon: BarChart3 },
        { name: "Capacitación", href: "/training", icon: GraduationCap },
        { name: "Producción", href: "/production", icon: Briefcase },
      ]
    },
    {
      label: "SISTEMA",
      items: [
        { name: "Configuración", href: "/settings", icon: Settings },
      ]
    },
  ], []);

  // Unread notifications count
  const { data: notifData } = useQuery({
    queryKey: ["notifications-unread", user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return { unreadCount: 0 };
      const res = await fetch(
        `/api/notifications?organizationId=${user.organizationId}&limit=1`,
        { credentials: 'include' }
      );
      if (!res.ok) return { unreadCount: 0 };
      const data = await res.json();
      return { unreadCount: data.unreadCount || 0 };
    },
    enabled: !!user?.organizationId,
    staleTime: 5 * 60 * 1000,
  });
  const unreadCount = notifData?.unreadCount || 0;

  // Get user initials for avatar fallback
  const userInitials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden glass border-white/8"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
      >
        <Menu className="h-5 w-5 text-slate-300" />
      </Button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: collapsed ? 80 : 220,
        }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed left-0 top-0 z-40 h-screen",
          "bg-[#08090B]/95 backdrop-blur-xl border-r border-white/5",
          "flex flex-col",
          "transition-all duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-center px-4 border-b border-white/5 bg-gradient-to-b from-violet-500/5 to-transparent">
          <AnimatePresence mode="wait">
            {!collapsed ? (
              <motion.div
                key="full-logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center w-full gap-1"
              >
                <MaatWorkLogo size="lg" showWordmark showTagline={false} />
              </motion.div>
            ) : (
              <motion.div
                key="icon-logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center w-full"
              >
                <MaatWorkIcon size={40} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapse button - positioned absolutely on the right */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 hidden lg:flex text-slate-500 hover:text-white hover:bg-white/5"
            onClick={() => onCollapsedChange(!collapsed)}
            aria-label={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden">
          {navigationGroups.map((group, groupIndex) => (
            <React.Fragment key={group.label}>
              {groupIndex > 0 && (
                <div className="my-2 mx-1 border-t border-white/5" />
              )}
              {!collapsed && (
                <p className={cn(
                  "text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-1",
                  groupIndex > 0 ? "mt-3" : ""
                )}>
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  // Hide Reclutamiento from users with role "asesor"
                  if (item.name === "Reclutamiento" && (user?.role === "asesor" || user?.role === "advisor")) {
                    return null;
                  }

                  const isActive = pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));

                  const navItem = (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative",
                        isActive
                          ? "bg-violet-500/10 text-violet-300 border border-violet-500/20 shadow-sm shadow-violet-500/10"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-400 rounded-full" />
                      )}
                      <item.icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
                      <AnimatePresence mode="wait">
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="truncate"
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {item.name === "Configuración" && unreadCount > 0 && (
                        <span className="ml-auto h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.name}>
                        <TooltipTrigger asChild>
                          {navItem}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium bg-[#0E0F12] border-white/8">
                          {item.name}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return navItem;
                })}
              </div>
            </React.Fragment>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-white/5 p-3">
          <div className="group flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-all duration-200 cursor-pointer">
            <div className="relative flex-shrink-0">
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Avatar className="h-9 w-9 border border-white/8">
                        <AvatarImage src={user?.image || undefined} />
                        <AvatarFallback className="bg-violet-500/20 text-violet-300 text-sm font-medium">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[#08090B]" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">{user?.name ?? "Usuario"}</TooltipContent>
                </Tooltip>
              ) : (
                <div className="relative">
                  <Avatar className="h-9 w-9 border border-white/8">
                    <AvatarImage src={user?.image || undefined} />
                    <AvatarFallback className="bg-violet-500/20 text-violet-300 text-sm font-medium">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[#08090B]" />
                </div>
              )}
            </div>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-white truncate">
                    {user?.name || "Usuario"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {user?.role || "Miembro"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={async (e) => { e.stopPropagation(); await logout(); }}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full flex justify-center"
                    aria-label="Cerrar sesión"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Cerrar sesión</TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={async (e) => { e.stopPropagation(); await logout(); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-md hover:bg-white/10 text-slate-500 hover:text-rose-400 flex-shrink-0"
                title="Cerrar sesión"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
});
