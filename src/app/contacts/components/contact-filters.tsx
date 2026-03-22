'use client';

import * as React from "react";
import { Search, Download, Tag as TagIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="glass border-white/10">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Buscar contactos..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 glass border-white/10 bg-white/5 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterStage} onValueChange={onFilterStageChange}>
              <SelectTrigger className="w-[160px] glass border-white/10 bg-white/5 text-white">
                <SelectValue placeholder="Etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las etapas</SelectItem>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
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
              className="glass border-white/10 text-slate-300"
              onClick={onTagManagerClick}
            >
              <TagIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="glass border-white/10 text-slate-300">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
