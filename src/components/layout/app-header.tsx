"use client";

import * as React from "react";
import { 
  Search, 
  Plus, 
  CheckSquare,
  Users,
  Calendar,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
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
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

export function AppHeader() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [showCommandPalette, setShowCommandPalette] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

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
      <header className="h-16 border-b border-white/10 glass">
        <div className="flex h-full items-center justify-between px-4 lg:px-6">
          {/* Search */}
          <div className="flex-1 max-w-xl">
            <button
              onClick={() => setShowCommandPalette(true)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Abrir búsqueda"
            >
              <Search className="h-4 w-4" />
              <span>Buscar contactos, tareas, deals...</span>
              <kbd className="hidden sm:inline-flex ml-auto px-2 py-0.5 text-xs bg-white/10 rounded">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-4">
            {/* Quick actions */}
            <div className="hidden md:flex items-center gap-1">
              <Link href="/contacts">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <Plus className="h-4 w-4 mr-1" />
                  Contacto
                </Button>
              </Link>
              <Link href="/tasks">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <Plus className="h-4 w-4 mr-1" />
                  Tarea
                </Button>
              </Link>
            </div>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <NotificationBell />

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.image || undefined} />
                    <AvatarFallback className="bg-indigo-500/20 text-indigo-400">
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
                    <p className="text-xs text-muted-foreground">
                      {user?.email || ""}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Users className="mr-2 h-4 w-4" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/calendar" className="cursor-pointer">
                    <Calendar className="mr-2 h-4 w-4" />
                    Calendario
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/tasks" className="cursor-pointer">
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Mis tareas
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-rose-500 cursor-pointer"
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
