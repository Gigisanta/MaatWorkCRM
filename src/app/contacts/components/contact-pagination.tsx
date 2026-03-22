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
    <div className="flex items-center justify-between">
      <p className="text-sm text-slate-400">
        Mostrando {(page - 1) * limit + 1} a{" "}
        {Math.min(page * limit, total)} de {total} contactos
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="glass border-white/10 text-slate-300"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
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
                    ? "bg-indigo-500 hover:bg-indigo-600"
                    : "glass border-white/10 text-slate-300"
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
          className="glass border-white/10 text-slate-300"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
