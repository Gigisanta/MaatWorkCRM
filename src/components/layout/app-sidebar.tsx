"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
import { useAuth } from "@/lib/auth-context";

interface AppSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function AppSidebar({ collapsed, onCollapsedChange }: AppSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Memoized navigation groups with separators
  const navigationGroups = React.useMemo(() => [
    [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Contactos", href: "/contacts", icon: Users },
      { name: "Pipeline", href: "/pipeline", icon: Target },
    ],
    [
      { name: "Tareas", href: "/tasks", icon: CheckSquare },
      { name: "Calendario", href: "/calendar", icon: Calendar },
    ],
    [
      { name: "Equipos", href: "/teams", icon: Building2 },
      { name: "Reportes", href: "/reports", icon: BarChart3 },
      { name: "Capacitación", href: "/training", icon: GraduationCap },
    ],
    [
      { name: "Configuración", href: "/settings", icon: Settings },
    ],
  ], []);

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
        className="fixed top-4 left-4 z-50 lg:hidden glass border-white/10"
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
            <React.Fragment key={groupIndex}>
              {groupIndex > 0 && (
                <div className="my-2 mx-1 border-t border-white/5" />
              )}
              <div className="space-y-0.5">
                {group.map((item) => {
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
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.name}>
                        <TooltipTrigger asChild>
                          {navItem}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium bg-[#0E0F12] border-white/10">
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
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-all duration-200 cursor-pointer">
            <div className="relative flex-shrink-0">
              <Avatar className="h-9 w-9 border border-white/10">
                <AvatarImage src={user?.image || undefined} />
                <AvatarFallback className="bg-violet-500/20 text-violet-300 text-sm font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[#08090B]" />
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
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
