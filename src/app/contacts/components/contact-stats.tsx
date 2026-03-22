'use client';

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Users } from "lucide-react";
import { usePlanningDialog } from "./usePlanningDialog";

interface ContactStatsProps {
  total: number;
  isLoading: boolean;
  onCreateClick: () => void;
}

export function ContactStats({ total, isLoading, onCreateClick }: ContactStatsProps) {
  const { openDialog } = usePlanningDialog();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-1">
          CRM
        </p>
        <h1 className="text-2xl font-bold text-white tracking-tight">Contactos</h1>
        <p className="text-slate-500 mt-1 text-sm">
          {isLoading ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-600 animate-pulse" />
              Cargando...
            </span>
          ) : (
            <>
              <span className="text-white font-semibold">{total}</span>
              {" contactos en total"}
            </>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => openDialog()}
          className="bg-transparent border border-violet-500/30 text-violet-300 hover:bg-violet-500/10 hover:border-violet-500/50 hover:text-violet-200 transition-all duration-200 gap-2"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Generar Plan</span>
          <span className="sm:hidden">Plan</span>
        </Button>
        <Button
          onClick={onCreateClick}
          className="bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-200 gap-2"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo Contacto</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>
    </div>
  );
}
