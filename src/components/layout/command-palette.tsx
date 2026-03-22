"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Users,
  Target,
  CheckSquare,
  Calendar,
  BarChart,
  GraduationCap,
  Settings,
  User,
  Sun,
  Moon,
  Monitor,
  Clock,
  Mail,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useAuth } from "@/lib/auth-context";

// Types
interface Contact {
  id: string;
  name: string;
  email: string | null;
  emoji: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface RecentItem {
  id: string;
  type: "contact" | "task";
  name: string;
  timestamp: number;
}

// Navigation items with keyboard shortcuts
const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3, shortcut: "G D" },
  { name: "Contactos", href: "/contacts", icon: Users, shortcut: "G C" },
  { name: "Pipeline", href: "/pipeline", icon: Target, shortcut: "G P" },
  { name: "Tareas", href: "/tasks", icon: CheckSquare, shortcut: "G T" },
  { name: "Calendario", href: "/calendar", icon: Calendar, shortcut: "G A" },
  { name: "Equipos", href: "/teams", icon: Users, shortcut: "G E" },
  { name: "Reportes", href: "/reports", icon: BarChart, shortcut: "G R" },
  { name: "Capacitación", href: "/training", icon: GraduationCap, shortcut: "G K" },
  { name: "Configuración", href: "/settings", icon: Settings, shortcut: "G S" },
];

// Quick actions
const quickActions = [
  { name: "Nuevo Contacto", action: "create-contact", icon: User, shortcut: "N C" },
  { name: "Nueva Tarea", action: "create-task", icon: CheckSquare, shortcut: "N T" },
  { name: "Nuevo Deal", action: "create-deal", icon: Target, shortcut: "N D" },
  { name: "Nuevo Evento", action: "create-event", icon: Calendar, shortcut: "N E" },
];

// Custom event for triggering modals
export const COMMAND_PALETTE_EVENT = "command-palette-action";

export function dispatchCommandAction(action: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_EVENT, { detail: action }));
  }
}

// Hook for listening to command palette actions
export function useCommandAction(callback: (action: string) => void) {
  React.useEffect(() => {
    const handler = (e: CustomEvent) => {
      callback(e.detail);
    };
    window.addEventListener(COMMAND_PALETTE_EVENT, handler as EventListener);
    return () => window.removeEventListener(COMMAND_PALETTE_EVENT, handler as EventListener);
  }, [callback]);
}

// Recent items storage
const RECENT_ITEMS_KEY = "maatwork_recent_items";
const MAX_RECENT_ITEMS = 5;

function getRecentItems(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentItem(item: Omit<RecentItem, "timestamp">) {
  if (typeof window === "undefined") return;
  
  const items = getRecentItems();
  const filtered = items.filter(i => !(i.id === item.id && i.type === item.type));
  const newItems = [
    { ...item, timestamp: Date.now() },
    ...filtered,
  ].slice(0, MAX_RECENT_ITEMS);
  
  localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(newItems));
}

// Navigation mapping for keyboard shortcuts
const navMapping: Record<string, string> = {
  "d": "/",
  "c": "/contacts",
  "p": "/pipeline",
  "t": "/tasks",
  "a": "/calendar",
  "e": "/teams",
  "r": "/reports",
  "k": "/training",
  "s": "/settings",
};

// Quick action mapping for keyboard shortcuts
const actionMapping: Record<string, string> = {
  "c": "create-contact",
  "t": "create-task",
  "d": "create-deal",
  "e": "create-event",
};

// Theme commands
const themeCommands = [
  { name: "Cambiar a tema claro", theme: "light", icon: Sun },
  { name: "Cambiar a tema oscuro", theme: "dark", icon: Moon },
  { name: "Usar tema del sistema", theme: "system", icon: Monitor },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [search, setSearch] = React.useState("");
  const [recentItems, setRecentItems] = React.useState<RecentItem[]>([]);
  const [mounted, setMounted] = React.useState(false);
  const [isSecondKey, setIsSecondKey] = React.useState(false);
  const [firstKey, setFirstKey] = React.useState<string | null>(null);
  const secondKeyTimeout = React.useRef<NodeJS.Timeout | null>(null);

  // runCommand callback - defined before use
  const runCommand = React.useCallback((command: () => void) => {
    onOpenChange(false);
    command();
  }, [onOpenChange]);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Load recent items when palette opens
  React.useEffect(() => {
    if (open) {
      setRecentItems(getRecentItems());
    }
  }, [open]);

  // Global keyboard shortcuts (Cmd/Ctrl+K, Escape)
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to toggle
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      
      // Escape to close
      if (e.key === "Escape" && open) {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  // Two-key shortcuts (G + key) when command palette is open
  React.useEffect(() => {
    if (!open) {
      setIsSecondKey(false);
      setFirstKey(null);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Clear any existing timeout
      if (secondKeyTimeout.current) {
        clearTimeout(secondKeyTimeout.current);
      }

      // If we're waiting for second key
      if (isSecondKey && firstKey) {
        const key = e.key.toLowerCase();
        
        // Navigation shortcuts (G + key)
        if (firstKey === "g" && navMapping[key]) {
          e.preventDefault();
          runCommand(() => router.push(navMapping[key]));
        }
        
        // Quick action shortcuts (N + key)
        if (firstKey === "n" && actionMapping[key]) {
          e.preventDefault();
          runCommand(() => dispatchCommandAction(actionMapping[key]));
        }
        
        setIsSecondKey(false);
        setFirstKey(null);
        return;
      }

      // First key detection
      if (e.key.toLowerCase() === "g" || e.key.toLowerCase() === "n") {
        e.preventDefault();
        setIsSecondKey(true);
        setFirstKey(e.key.toLowerCase());
        
        // Reset after 1.5 seconds if no second key
        secondKeyTimeout.current = setTimeout(() => {
          setIsSecondKey(false);
          setFirstKey(null);
        }, 1500);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (secondKeyTimeout.current) {
        clearTimeout(secondKeyTimeout.current);
      }
    };
  }, [open, isSecondKey, firstKey, router, runCommand]);

  // Search contacts
  const { data: contactsResults, isFetching: isFetchingContacts } = useQuery({
    queryKey: ["command-search-contacts", search],
    queryFn: async () => {
      if (!search || search.length < 2 || !user?.organizationId) return [];
      const res = await fetch(
        `/api/contacts?search=${encodeURIComponent(search)}&limit=5&organizationId=${user.organizationId}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      return data.contacts as Contact[];
    },
    enabled: search.length >= 2 && !!user?.organizationId,
  });

  // Search tasks
  const { data: tasksResults, isFetching: isFetchingTasks } = useQuery({
    queryKey: ["command-search-tasks", search],
    queryFn: async () => {
      if (!search || search.length < 2 || !user?.organizationId) return [];
      const res = await fetch(
        `/api/tasks?search=${encodeURIComponent(search)}&limit=5&organizationId=${user.organizationId}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      return data.tasks as Task[];
    },
    enabled: search.length >= 2 && !!user?.organizationId,
  });

  const handleSelectContact = (contact: Contact) => {
    addRecentItem({ id: contact.id, type: "contact", name: contact.name });
    runCommand(() => router.push(`/contacts?highlight=${contact.id}`));
  };

  const handleSelectTask = (task: Task) => {
    addRecentItem({ id: task.id, type: "task", name: task.title });
    runCommand(() => router.push(`/tasks?highlight=${task.id}`));
  };

  const handleSelectRecent = (item: RecentItem) => {
    runCommand(() => router.push(`/${item.type === "contact" ? "contacts" : "tasks"}?highlight=${item.id}`));
  };

  const hasSearchResults = (contactsResults && contactsResults.length > 0) ||
                           (tasksResults && tasksResults.length > 0);
  const isSearching = isFetchingContacts || isFetchingTasks;

  if (!mounted) {
    return null;
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      className="bg-[#0E0F12] border-white/8 backdrop-blur-xl max-w-xl rounded-xl overflow-hidden shadow-2xl shadow-black/60"
    >
      <CommandInput
        placeholder="Escribe un comando o busca..."
        value={search}
        onValueChange={setSearch}
        className="text-lg text-white placeholder:text-slate-400 px-4 py-3 border-b border-white/8"
      />
      <CommandList className="max-h-[400px] overflow-y-auto">
        <CommandEmpty className="text-slate-500 text-sm py-6 text-center">
          {isSearching ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Buscando...</span>
            </div>
          ) : (
            "No se encontraron resultados."
          )}
        </CommandEmpty>

        {/* Search Results */}
        {hasSearchResults && (
          <>
            {contactsResults && contactsResults.length > 0 && (
              <CommandGroup heading="Contactos" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-slate-500 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest">
                {contactsResults.map((contact) => (
                  <CommandItem
                    key={contact.id}
                    value={`contact-${contact.id}`}
                    onSelect={() => handleSelectContact(contact)}
                    className="text-slate-200 cursor-pointer data-[selected=true]:bg-violet-500/15 data-[selected=true]:text-violet-200 hover:bg-white/6"
                  >
                    <span className="mr-2 text-lg">{contact.emoji || "👤"}</span>
                    <div className="flex flex-col">
                      <span>{contact.name}</span>
                      {contact.email && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4 text-slate-500" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {tasksResults && tasksResults.length > 0 && (
              <CommandGroup heading="Tareas" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-slate-500 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest">
                {tasksResults.map((task) => (
                  <CommandItem
                    key={task.id}
                    value={`task-${task.id}`}
                    onSelect={() => handleSelectTask(task)}
                    className="text-slate-200 cursor-pointer data-[selected=true]:bg-violet-500/15 data-[selected=true]:text-violet-200 hover:bg-white/6"
                  >
                    <CheckSquare className="mr-2 h-4 w-4 text-slate-400" />
                    <div className="flex flex-col">
                      <span>{task.title}</span>
                      <span className="text-xs text-slate-500">
                        {task.status === "completed" ? "Completada" : 
                         task.status === "in_progress" ? "En progreso" : "Pendiente"}
                        {" • "}{task.priority === "urgent" ? "Urgente" : 
                         task.priority === "high" ? "Alta" : 
                         task.priority === "medium" ? "Media" : "Baja"}
                      </span>
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4 text-slate-500" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandSeparator className="bg-white/10" />
          </>
        )}

        {/* Recent Items (only when not searching) */}
        {search.length < 2 && recentItems.length > 0 && (
          <>
            <CommandGroup heading="Recientes" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-slate-500 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest">
              {recentItems.map((item) => (
                <CommandItem
                  key={`${item.type}-${item.id}`}
                  value={`recent-${item.id}`}
                  onSelect={() => handleSelectRecent(item)}
                  className="text-slate-200 cursor-pointer data-[selected=true]:bg-violet-500/15 data-[selected=true]:text-violet-200 hover:bg-white/6"
                >
                  {item.type === "contact" ? (
                    <User className="mr-2 h-4 w-4 text-slate-400" />
                  ) : (
                    <CheckSquare className="mr-2 h-4 w-4 text-slate-400" />
                  )}
                  <span>{item.name}</span>
                  <span className="ml-2 text-xs text-slate-500 font-medium">
                    {item.type === "contact" ? "Contacto" : "Tarea"}
                  </span>
                  <Clock className="ml-auto h-4 w-4 text-slate-500" />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator className="bg-white/10" />
          </>
        )}

        {/* Quick Actions */}
        {search.length < 2 && (
          <>
            <CommandGroup heading="Acciones Rápidas" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-slate-500 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest">
              {quickActions.map((action) => (
                <CommandItem
                  key={action.name}
                  value={action.name}
                  onSelect={() => {
                    runCommand(() => dispatchCommandAction(action.action));
                  }}
                  className="text-slate-200 cursor-pointer data-[selected=true]:bg-violet-500/15 data-[selected=true]:text-violet-200 hover:bg-white/6"
                >
                  <action.icon className="mr-2 h-4 w-4 text-violet-400" />
                  {action.name}
                  {action.shortcut && (
                    <CommandShortcut className="text-slate-400">
                      {action.shortcut}
                    </CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator className="bg-white/10" />
          </>
        )}

        {/* Navigation */}
        {search.length < 2 && (
          <>
            <CommandGroup heading="Navegación" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-slate-500 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest">
              {navigation.map((item) => (
                <CommandItem
                  key={item.name}
                  value={item.name}
                  onSelect={() => {
                    runCommand(() => router.push(item.href));
                  }}
                  className="text-slate-200 cursor-pointer data-[selected=true]:bg-violet-500/15 data-[selected=true]:text-violet-200 hover:bg-white/6"
                >
                  <item.icon className="mr-2 h-4 w-4 text-violet-400" />
                  {item.name}
                  {item.shortcut && (
                    <CommandShortcut className="text-slate-400">
                      {item.shortcut}
                    </CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator className="bg-white/10" />
          </>
        )}

        {/* Theme Commands */}
        {search.length < 2 && (
          <CommandGroup heading="Tema" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-slate-500 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest">
            {themeCommands.map((cmd) => (
              <CommandItem
                key={cmd.name}
                value={cmd.name}
                onSelect={() => {
                  runCommand(() => setTheme(cmd.theme));
                }}
                className="text-slate-200 cursor-pointer data-[selected=true]:bg-violet-500/15 data-[selected=true]:text-violet-200 hover:bg-white/6"
              >
                <cmd.icon className="mr-2 h-4 w-4 text-violet-400" />
                {cmd.name}
                {theme === cmd.theme && (
                  <span className="ml-auto text-xs text-violet-400">Activo</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Two-key shortcut indicator */}
        {isSecondKey && firstKey && (
          <div className="p-2 border-t border-white/10">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <kbd className="px-2 py-0.5 bg-white/10 rounded text-xs">{firstKey.toUpperCase()}</kbd>
              <span>+</span>
              <span className="animate-pulse">?</span>
              <span className="text-xs ml-2">
                {firstKey === "g" ? "Presiona D, C, P, T, A, E, R, K o S" : 
                 firstKey === "n" ? "Presiona C, T, D o E" : ""}
              </span>
            </div>
          </div>
        )}
      </CommandList>

      {/* Footer with help */}
      <div className="border-t border-white/10 p-2 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↑↓</kbd>
            Navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↵</kbd>
            Seleccionar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded">esc</kbd>
            Cerrar
          </span>
        </div>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded">⌘K</kbd>
          Paleta de comandos
        </span>
      </div>
    </CommandDialog>
  );
}
