'use client';

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ContactPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function ContactPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: ContactPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
      <p className="text-xs text-slate-500">
        Mostrando {(page - 1) * limit + 1} a{" "}
        {Math.min(page * limit, total)} de {total} contactos
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-white bg-white/4 border border-white/8 rounded-lg hover:bg-white/8 hover:border-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <div className="flex items-center gap-1">
          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            const pageNum = i + 1;
            return (
              <Button
                key={pageNum}
                variant={page === pageNum ? "default" : "outline"}
                size="sm"
                className={cn(
                  page === pageNum
                    ? "px-3 py-1.5 text-sm font-medium bg-violet-500/15 border border-violet-500/30 text-violet-300 rounded-lg"
                    : "flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-white bg-white/4 border border-white/8 rounded-lg hover:bg-white/8 hover:border-white/15 transition-all duration-200"
                )}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-white bg-white/4 border border-white/8 rounded-lg hover:bg-white/8 hover:border-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
