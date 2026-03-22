'use client';

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
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
        <h1 className="text-2xl font-bold text-white">Contactos</h1>
        <p className="text-slate-400 mt-1">
          {isLoading ? "Cargando..." : `${total} contactos en total`}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => openDialog()}
          className="glass border-white/10"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Generar Planificacion
        </Button>
        <Button
          onClick={onCreateClick}
          className="bg-indigo-500 hover:bg-indigo-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Contacto
        </Button>
      </div>
    </div>
  );
}
