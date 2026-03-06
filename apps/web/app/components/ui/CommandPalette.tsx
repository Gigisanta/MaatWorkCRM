<<<<<<< HEAD
import { useNavigate } from "@tanstack/react-router";
import { Command } from "cmdk";
import { Kanban, LayoutDashboard, Search, Settings, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
=======
import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Search, LayoutDashboard, Users, Kanban, Settings } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
>>>>>>> origin/feat/maatwork-redesign-jules-v2-6433543738996844966

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
<<<<<<< HEAD
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
=======
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
>>>>>>> origin/feat/maatwork-redesign-jules-v2-6433543738996844966
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

<<<<<<< HEAD
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
=======
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
>>>>>>> origin/feat/maatwork-redesign-jules-v2-6433543738996844966
  }, []);

  const handleSelect = (path: string) => {
    setOpen(false);
    navigate({ to: path });
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl bg-[#0F0F0F] rounded-2xl border border-white/5 shadow-[0_0_40px_rgba(139,92,246,0.15)] overflow-hidden">
        <div className="flex items-center px-4 border-b border-white/5">
          <Search className="w-5 h-5 text-[#A3A3A3] mr-3" />
          <Command.Input
            placeholder="Search commands, contacts, or settings... (⌘K)"
            className="w-full bg-transparent h-14 outline-none text-[#F5F5F5] placeholder:text-[#737373] text-lg font-body"
          />
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2 overscroll-contain">
          <Command.Empty className="p-8 text-center text-[#737373] font-body">No results found.</Command.Empty>

          <Command.Group heading="Navigation" className="text-xs font-bold uppercase tracking-wider text-[#A3A3A3] p-2">
            <Command.Item
<<<<<<< HEAD
              onSelect={() => handleSelect("/dashboard")}
=======
              onSelect={() => handleSelect('/dashboard')}
>>>>>>> origin/feat/maatwork-redesign-jules-v2-6433543738996844966
              className="flex items-center px-4 py-3 rounded-xl cursor-pointer text-[#F5F5F5] data-[selected=true]:bg-[#8B5CF6]/10 data-[selected=true]:text-[#8B5CF6] transition-colors"
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Go to Dashboard
            </Command.Item>
            <Command.Item
<<<<<<< HEAD
              onSelect={() => handleSelect("/contacts")}
=======
              onSelect={() => handleSelect('/contacts')}
>>>>>>> origin/feat/maatwork-redesign-jules-v2-6433543738996844966
              className="flex items-center px-4 py-3 rounded-xl cursor-pointer text-[#F5F5F5] data-[selected=true]:bg-[#8B5CF6]/10 data-[selected=true]:text-[#8B5CF6] transition-colors"
            >
              <Users className="w-5 h-5 mr-3" />
              Go to Contacts
            </Command.Item>
            <Command.Item
<<<<<<< HEAD
              onSelect={() => handleSelect("/pipeline")}
=======
              onSelect={() => handleSelect('/pipeline')}
>>>>>>> origin/feat/maatwork-redesign-jules-v2-6433543738996844966
              className="flex items-center px-4 py-3 rounded-xl cursor-pointer text-[#F5F5F5] data-[selected=true]:bg-[#8B5CF6]/10 data-[selected=true]:text-[#8B5CF6] transition-colors"
            >
              <Kanban className="w-5 h-5 mr-3" />
              Go to Pipeline
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Settings" className="text-xs font-bold uppercase tracking-wider text-[#A3A3A3] p-2">
            <Command.Item
<<<<<<< HEAD
              onSelect={() => handleSelect("/settings")}
=======
              onSelect={() => handleSelect('/settings')}
>>>>>>> origin/feat/maatwork-redesign-jules-v2-6433543738996844966
              className="flex items-center px-4 py-3 rounded-xl cursor-pointer text-[#F5F5F5] data-[selected=true]:bg-[#8B5CF6]/10 data-[selected=true]:text-[#8B5CF6] transition-colors"
            >
              <Settings className="w-5 h-5 mr-3" />
              Global Settings
            </Command.Item>
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
