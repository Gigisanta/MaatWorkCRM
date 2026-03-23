"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        "border-2 border-dashed border-white/8 rounded-xl",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-violet-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-xs mb-4">{description}</p>
      )}
      {action && (
        <Button
          size="sm"
          onClick={action.onClick}
          className="bg-violet-500 hover:bg-violet-600 text-white mt-1"
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
