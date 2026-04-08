'use client';

import * as React from "react";
import { Search, Download, Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface ContactFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterStage: string;
  onFilterStageChange: (value: string) => void;
  stages: PipelineStage[];
  onTagManagerClick: () => void;
}

export function ContactFilters({
  search,
  onSearchChange,
  filterStage,
  onFilterStageChange,
  stages,
  onTagManagerClick,
}: ContactFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-[#0E0F12]/60 border border-white/8">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
        <Input
          placeholder="Buscar contactos..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-white/4 border-white/10 text-white placeholder:text-slate-600 focus:border-violet-500/40 h-9 rounded-lg"
        />
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2">
        <Select value={filterStage} onValueChange={onFilterStageChange}>
          <SelectTrigger className="w-[160px] bg-white/4 border-white/10 text-white h-9 rounded-lg focus:border-violet-500/40">
            <SelectValue placeholder="Etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las etapas</SelectItem>
            {stages.map((stage) => (
              <SelectItem key={stage.id} value={stage.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  {stage.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          className="bg-white/4 border-white/10 text-slate-400 hover:text-white hover:bg-white/8 hover:border-white/20 h-9 w-9 rounded-lg transition-all"
          onClick={onTagManagerClick}
          title="Gestionar Etiquetas"
        >
          <TagIcon className="h-4 w-4" />
        </Button>
        <span
          className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors hidden sm:inline"
          onClick={onTagManagerClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onTagManagerClick(); }}
        >
          Gestionar Etiquetas
        </span>

        <Button
          variant="outline"
          size="icon"
          className="bg-white/4 border-white/10 text-slate-400 hover:text-white hover:bg-white/8 hover:border-white/20 h-9 w-9 rounded-lg transition-all"
          title="Exportar contactos"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
