"use client";

import * as React from "react";
import {
  Search,
  Plus,
  CheckSquare,
  User,
  LogOut,
  Loader2,
  Calendar,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommandPalette } from "./command-palette";
import { NotificationBell } from "@/components/notification-bell";
import { useAuth } from "@/lib/auth-context";
import { useQuickActions } from "@/lib/quick-actions-context";
import { motion } from "framer-motion";
import Link from "next/link";

export function AppHeader() {
  const { user, logout, isLoading } = useAuth();
  const { setCreateContactOpen, setCreateTaskOpen, setFeedbackOpen } = useQuickActions();
  const [showCommandPalette, setShowCommandPalette] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // Quick actions - these open modals so they don't need SSR
  const [quickActionsReady] = React.useState(() => false);

  const getInitials = React.useCallback((name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <header className="h-16 border-b border-white/6 glass">
        <div className="flex h-full items-center justify-between px-4 lg:px-6">
          {/* Search */}
          <div className="flex-1 max-w-xl">
            <button
              onClick={() => setShowCommandPalette(true)}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-500 bg-white/4 border border-white/8 rounded-xl hover:bg-white/7 hover:border-white/15 hover:text-slate-400 focus:bg-white/8 focus:border-violet-500/40 transition-all duration-200 group"
              aria-label="Abrir búsqueda"
            >
              <Search className="h-4 w-4 flex-shrink-0 text-slate-600 group-hover:text-slate-400 transition-colors duration-200" />
              <span className="truncate">Buscar contactos, tareas, deals...</span>
              <kbd className="hidden sm:inline-flex ml-auto px-2 py-0.5 text-xs bg-white/8 border border-white/10 rounded-md flex-shrink-0">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-4">
            {/* Quick actions */}
            <div className="hidden md:flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreateContactOpen(true)}
                className="text-slate-400 hover:text-slate-200 bg-white/4 border border-white/8 rounded-lg hover:bg-white/8 hover:border-white/15 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-1 text-violet-400" />
                Contacto
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreateTaskOpen(true)}
                className="text-slate-400 hover:text-slate-200 bg-white/4 border border-white/8 rounded-lg hover:bg-white/8 hover:border-white/15 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-1 text-violet-400" />
                Tarea
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFeedbackOpen(true)}
                className="text-slate-400 hover:text-slate-200 bg-white/4 border border-white/8 rounded-lg hover:bg-white/8 hover:border-white/15 transition-all duration-200"
              >
                <Lightbulb className="h-4 w-4 mr-1 text-violet-400" />
                Feedback
              </Button>
            </div>

            {/* Notifications */}
            <NotificationBell />

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.image || undefined} />
                    <AvatarFallback className="bg-violet-500/15 text-violet-300">
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        getInitials(user?.name)
                      )}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name || "Usuario"}</p>
                    <p className="text-xs text-slate-400">
                      {user?.email || ""}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/tasks" className="cursor-pointer">
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Mis tareas
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/calendar" className="cursor-pointer">
                    <Calendar className="mr-2 h-4 w-4" />
                    Calendario
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-rose-400 cursor-pointer focus:bg-rose-500/10 focus:text-rose-400"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Command Palette */}
      <CommandPalette 
        open={showCommandPalette} 
        onOpenChange={setShowCommandPalette} 
      />
    </>
  );
}
