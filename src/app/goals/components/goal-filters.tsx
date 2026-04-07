'use client';

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type GoalStatus = "all" | "active" | "completed" | "archived" | "draft" | "missed";
export type GoalType = "all" | "revenue" | "new_clients" | "meetings" | "new_aum" | "custom";
export type GoalPeriod = "all" | "this_month" | "this_quarter" | "this_year";

interface GoalFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: GoalStatus;
  onStatusChange: (value: GoalStatus) => void;
  type: GoalType;
  onTypeChange: (value: GoalType) => void;
  period: GoalPeriod;
  onPeriodChange: (value: GoalPeriod) => void;
  showTeamGoals: boolean;
  onShowTeamGoalsChange: (value: boolean) => void;
}

const statusOptions: { value: GoalStatus; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "completed", label: "Completados" },
  { value: "archived", label: "Archivados" },
  { value: "draft", label: "Borrador" },
  { value: "missed", label: "Perdidos" },
];

const typeOptions: { value: GoalType; label: string }[] = [
  { value: "all", label: "Todos los tipos" },
  { value: "revenue", label: "Ingresos" },
  { value: "new_clients", label: "Nuevos Clientes" },
  { value: "meetings", label: "Reuniones" },
  { value: "new_aum", label: "Nuevos Activos" },
  { value: "custom", label: "Personalizado" },
];

const periodOptions: { value: GoalPeriod; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "this_month", label: "Este mes" },
  { value: "this_quarter", label: "Este quarter" },
  { value: "this_year", label: "Este año" },
];

export function GoalFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  type,
  onTypeChange,
  period,
  onPeriodChange,
  showTeamGoals,
  onShowTeamGoalsChange,
}: GoalFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-[#0E0F12]/60 border border-white/8">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
        <Input
          placeholder="Buscar objetivos..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-white/4 border-white/10 text-white placeholder:text-slate-600 focus:border-violet-500/40 h-9 rounded-lg"
        />
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={status} onValueChange={(v) => onStatusChange(v as GoalStatus)}>
          <SelectTrigger className="w-[130px] bg-white/4 border-white/10 text-white h-9 rounded-lg focus:border-violet-500/40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={(v) => onTypeChange(v as GoalType)}>
          <SelectTrigger className="w-[150px] bg-white/4 border-white/10 text-white h-9 rounded-lg focus:border-violet-500/40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={(v) => onPeriodChange(v as GoalPeriod)}>
          <SelectTrigger className="w-[130px] bg-white/4 border-white/10 text-white h-9 rounded-lg focus:border-violet-500/40">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "bg-white/4 border-white/10 text-slate-300 h-9 px-3 rounded-lg hover:bg-white/8 hover:border-white/20 transition-all",
                showTeamGoals && "border-violet-500/40 text-violet-300"
              )}
            >
              {showTeamGoals ? "Equipo" : "Personales"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuCheckboxItem
              checked={showTeamGoals}
              onCheckedChange={(checked) => {
                if (checked !== undefined) {
                  onShowTeamGoalsChange(Boolean(checked));
                }
              }}
            >
              Mostrar objetivos de equipo
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
