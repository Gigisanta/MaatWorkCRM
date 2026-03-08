// ============================================================
// MaatWork CRM — Command Palette Component
// UI/UX REFINED BY JULES v2
// ============================================================
// UI/UX REFINED BY JULES v2 (patch for keyboard shortcuts & interactions)

import { useNavigate } from "@tanstack/react-router";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  CheckSquare,
  FileText,
  GraduationCap,
  Kanban,
  LayoutDashboard,
  Search,
  Settings,
  Sparkles,
  Users,
  UsersRound,
} from "lucide-react";
import { X } from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";

// Lightweight Command Icon for shortcuts (inline SVG)
const CommandIcon = ({ size = 18, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 3a7 7 0 0 0-7 7v0a7 7 0 0 0 7 7h0a7 7 0 0 0 7-7v0a7 7 0 0 0-7-7z" />
    <path d="M14 3l-4 18" />
  </svg>
);

type Shortcut = {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

// Shortcuts to display in the palette header and tooltips
const SHORTCUTS: Shortcut[] = [
  { key: "k", label: "Command Palette", icon: CommandIcon },
  { key: "Escape", label: "Close Palette", icon: X },
];

// Simple Tooltip component: shows hint content on hover/focus
function Tooltip({ className = "", children, content }: { className?: string; children: React.ReactNode; content: React.ReactNode; }) {
  return (
    <span className={`group relative inline-block ${className}`}>
      {children}
      <span
        className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block group-focus:block
          bg-violet-900/90 text-white text-xs rounded px-2 py-1 border border-violet-700/40 shadow-md
          transition-opacity duration-150"
        role="tooltip"
      >
        {content}
      </span>
    </span>
  );
}

const commands: Array<{ id: string; label: string; icon: any; keywords: string[]; section: string; path: string; }> = [
  {
    id: "dashboard",
    label: "Go to Dashboard",
    icon: LayoutDashboard,
    keywords: ["dashboard", "home", "overview"],
    section: "Quick Actions",
    path: "/dashboard",
  },
  {
    id: "contacts",
    label: "Go to Contacts",
    icon: Users,
    keywords: ["contacts", "clients", "people"],
    section: "Quick Actions",
    path: "/contacts",
  },
  {
    id: "pipeline",
    label: "Go to Pipeline",
    icon: Kanban,
    keywords: ["pipeline", "deals", "sales"],
    section: "Quick Actions",
    path: "/pipeline",
  },
  {
    id: "tasks",
    label: "Go to Tasks",
    icon: CheckSquare,
    keywords: ["tasks", "todo", "assignments"],
    section: "Quick Actions",
    path: "/tasks",
  },
  {
    id: "teams",
    label: "Go to Teams",
    icon: UsersRound,
    keywords: ["teams", "group", "members"],
    section: "Quick Actions",
    path: "/teams",
  },
  {
    id: "calendar",
    label: "Go to Calendar",
    icon: Calendar,
    keywords: ["calendar", "events", "schedule"],
    section: "Quick Actions",
    path: "/calendar",
  },
  {
    id: "reports",
    label: "View Reports",
    icon: FileText,
    keywords: ["reports", "analytics", "stats"],
    section: "Resources",
    path: "/reports",
  },
  {
    id: "training",
    label: "Training Materials",
    icon: GraduationCap,
    keywords: ["training", "materials", "resources"],
    section: "Resources",
    path: "/training",
  },
  {
    id: "settings",
    label: "Global Settings",
    icon: Settings,
    keywords: ["settings", "config", "preferences"],
    section: "Settings",
    path: "/settings",
  },
  {
    id: "ai-copilot",
    label: "Ask AI Copilot",
    icon: Sparkles,
    keywords: ["ai", "copilot", "assistant", "help"],
    section: "AI Actions",
    path: "/ai-copilot",
  },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Accessibility: focus search input when opening
  useEffect(() => {
    if (open) {
      const el = document.querySelector<HTMLInputElement>('#command-palette-input');
      el?.focus();
    }
  }, [open]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
        setSearchQuery("");
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    const handleToggleCommandPalette = () => {
      setOpen((prev) => !prev);
      if (!open) {
        setSearchQuery("");
      }
    };

    document.addEventListener("keydown", down);
    document.addEventListener("keydown", onKey);
    window.addEventListener("toggle-command-palette", handleToggleCommandPalette);

    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("toggle-command-palette", handleToggleCommandPalette);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) {
      return commands;
    }

    const query = searchQuery.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.keywords.some((keyword) => keyword.toLowerCase().includes(query)) ||
        cmd.label.toLowerCase().includes(query) ||
        cmd.section.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const handleSelect = (path: string) => {
    setOpen(false);
    setSearchQuery("");
    navigate({ to: path });
  };

  return (
    <AnimatePresence>
      {open && (
        <Command.Dialog
          open={true}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setSearchQuery("");
            }
          }}
          label="Global Command Palette"
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4"
        >
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-2xl bg-surface/90 backdrop-blur-2xl rounded-2xl border border-border shadow-[0_0_40px_rgba(139,92,246,0.15)] overflow-hidden relative z-10"
          >
            <div className="flex items-center px-4 border-b border-border/50">
          <Search className="w-5 h-5 text-text-muted mr-3" />
          <Command.Input
            value={searchQuery}
            onValueChange={(value) => setSearchQuery(value)}
            placeholder={
              filteredCommands.length === commands.length
                ? "Search commands, contacts, or settings... (⌘K)"
                : `Search ${filteredCommands.length} commands... (⌘K)`
            }
            className="w-full bg-transparent h-14 outline-none text-text placeholder:text-text-muted text-lg font-body"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-hover text-[10px] font-mono font-bold text-text-muted border border-border/50">
            ESC
          </kbd>
        </div>

        {/* Keyboard shortcuts row (visual hints) */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border/50 bg-glass-2">
          {SHORTCUTS.map((s) => {
            const Icon = s.icon as any;
            const keyLabel = s.key.toLowerCase() === "k" ? "⌘K" : s.key.toUpperCase();
            return (
              <span
                key={s.key}
                className="flex items-center gap-1 px-2 py-1 rounded bg-surface-hover text-[11px] text-text-muted border border-border/50"
              >
                <Icon size={14} className="w-3.5 h-3.5" />
                <span className="font-mono">{keyLabel}</span>
              </span>
            );
          })}
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2 overscroll-contain scrollbar-hide">
          {filteredCommands.length === 0 ? (
            <Command.Empty className="p-12 text-center text-text-muted font-body flex flex-col items-center justify-center">
              <Search className="w-8 h-8 mb-3 opacity-20" />
              <p>No results found.</p>
              <p className="text-xs mt-1 opacity-60">Try searching for "{searchQuery || "all"}"</p>
            </Command.Empty>
          ) : (
            <>
              {Object.entries(
                filteredCommands.reduce((acc: Record<string, any[]>, cmd: any) => {
                  acc[cmd.section] = acc[cmd.section] || [];
                  acc[cmd.section].push(cmd);
                  return acc;
                }, {} as Record<string, any[]>),
              ).map(([section, sectionCommands]) => (
                <Command.Group
                  key={section}
                  heading={section}
                  className="text-xs font-bold uppercase tracking-wider text-text-muted p-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-2"
                >
                  {sectionCommands.map((cmd: any) => {
                    const Icon = cmd.icon as any;
                    return (
                      <Command.Item
                        key={cmd.id}
                        onSelect={() => handleSelect(cmd.path)}
                        className="flex items-center px-4 py-3 rounded-xl cursor-pointer text-text-secondary data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary transition-colors group"
                      >
                      <Tooltip content={cmd.label ? `Enter to open ${cmd.label}` : "Enter to open"}>
                        <span className="flex items-center gap-2">
                          <Icon
                            size={20}
                            className="w-5 h-5 mr-3 group-data-[selected=true]:scale-110 transition-transform"
                          />
                          <span className="truncate">{cmd.label}</span>
                        </span>
                      </Tooltip>
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              ))}
            </>
          )}

          <Command.Group
            heading="AI Actions"
            className="text-xs font-bold uppercase tracking-wider text-accent p-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-2 mt-2"
          >
            <Command.Item
              onSelect={() => {
                setOpen(false);
                window.dispatchEvent(new CustomEvent("open-ai-copilot"));
              }}
              className="flex items-center px-4 py-3 rounded-xl cursor-pointer text-text-secondary data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent transition-colors group"
            >
              <Sparkles className="w-5 h-5 mr-3 group-data-[selected=true]:scale-110 transition-transform" />
              Ask AI Copilot
            </Command.Item>
          </Command.Group>
        </Command.List>
      </motion.div>
    </Command.Dialog>
  )}
  </AnimatePresence>
  );
}
