"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "No se pudo cargar",
  description = "Hubo un problema al conectar con el servidor.",
  onRetry,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4">
        <AlertCircle className="h-6 w-6 text-rose-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-4">{description}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="border-white/10 text-slate-400 hover:text-white gap-2"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reintentar
        </Button>
      )}
    </motion.div>
  );
}
