// ============================================================
// MaatWork CRM — Command Palette Component
// UI/UX REFINED BY JULES v2
// ============================================================

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
import React, { useEffect, useState } from "react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (path: string) => {
    setOpen(false);
    navigate({ to: path });
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
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
            placeholder="Search commands, contacts, or settings... (⌘K)"
            className="w-full bg-transparent h-14 outline-none text-text placeholder:text-text-muted text-lg font-body"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-hover text-[10px] font-mono font-bold text-text-muted border border-border/50">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2 overscroll-contain scrollbar-hide">
          <Command.Empty className="p-12 text-center text-text-muted font-body flex flex-col items-center justify-center">
            <Search className="w-8 h-8 mb-3 opacity-20" />
            <p>No results found.</p>
            <p className="text-xs mt-1 opacity-60">Try searching for "contacts" or "settings"</p>
          </Command.Empty>

          <Command.Group
            heading="Navigation"
            className="text-xs font-bold uppercase tracking-wider text-text-muted p-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-2"
          >
            <Command.Item
              onSelect={() => handleSelect("/dashboard")}
              className="flex items-center px-4 py-3 rounded-xl cursor-pointer text-text-secondary data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary transition-colors group"
            >
              <LayoutDashboard className="w-5 h-5 mr-3 group-data-[selected=true]:scale-110 transition-transform" />
              Go to Dashboard
            </Command.Item>
            <Command.Item
              onSelect={() => handleSelect("/contacts")}
              className="flex items-center px-4 py-3 rounded-xl cursor-pointer text-text-secondary data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary transition-colors group"
            >
              <Users className="w-5 h-5 mr-3 group-data-[selected=true]:scale-110 transition-transform" />
              Go to Contacts
            </Command.Item>
            <Command.Item
              onSelect={() => handleSelect("/pipeline")}
              className="flex items-center px-4 py-3 rounded-xl cursor-pointer text-text-secondary data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary transition-colors group"
            >
              <Kanban className="w-5 h-5 mr-3 group-data-[selected=true]:scale-110 transition-transform" />
              Go to Pipeline
            </Command.Item>
            <Command.Item
              onSelect={() => handleSelect("/tasks")}
              className="flex items-center px-4 py-3 rounded-xl cursor-pointer text-text-secondary data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary transition-colors group"
            >
              <CheckSquare className="w-5 h-5 mr-3 group-data-[selected=true]:scale-110 transition-transform" />
              Go to Tasks
            </Command.Item>
            <Command.Item
              onSelect={() => handleSelect("/teams")}
              className="flex items-center px-4 py-3 rounded-xl cursor-pointer text-text-secondary data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary transition-colors group"
            >
              <UsersRound className="w-5 h-5 mr-3 group-data-[selected=true]:scale-110 transition-transform" />
              Go to Teams
            </Command.Item>
            <Command.Item
              onSelect={() => handleSelect("/calendar")}
              className="flex items-center px-4 py-3 rounded-xl cursor-pointer text-text-secondary data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary transition-colors group"
            >
              <Calendar className="w-5 h-5 mr-3 group-data-[selected=true]:scale-110 transition-transform" />
              Go to Calendar
            </Command.Item>
          </Command.Group>

          <Command.Group
            heading="Resources"
            className="text-xs font-bold uppercase tracking-wider text-text-muted p-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-2 mt-2"
          >
            <Command.Item
              onSelect={() => handleSelect("/reports")}
              className="flex items-center px-4 py-3 rounded-xl cursor-pointer text-text-secondary data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary transition-colors group"
            >
              <FileText className="w-5 h-5 mr-3 group-data-[selected=true]:scale-110 transition-transform" />
              View Reports
            </Command.Item>
            <Command.Item
              onSelect={() => handleSelect("/training")}
              className="flex items-center px-4 py-3 rounded-xl cursor-pointer text-text-secondary data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary transition-colors group"
            >
              <GraduationCap className="w-5 h-5 mr-3 group-data-[selected=true]:scale-110 transition-transform" />
              Training Materials
            </Command.Item>
          </Command.Group>

          <Command.Group
            heading="Settings"
            className="text-xs font-bold uppercase tracking-wider text-text-muted p-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-2 mt-2"
          >
            <Command.Item
              onSelect={() => handleSelect("/settings")}
              className="flex items-center px-4 py-3 rounded-xl cursor-pointer text-text-secondary data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary transition-colors group"
            >
              <Settings className="w-5 h-5 mr-3 group-data-[selected=true]:scale-110 transition-transform" />
              Global Settings
            </Command.Item>
          </Command.Group>

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
  );
}
