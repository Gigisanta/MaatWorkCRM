"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import type { LucideIcon } from "lucide-react";

export interface FABAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

interface MobileFABProps {
  actions: FABAction[];
  className?: string;
}

export function MobileFAB({ actions, className }: MobileFABProps) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div className={cn("fixed bottom-6 right-6 z-50 lg:hidden flex flex-col items-end gap-2", className)}>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 -z-10"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-end gap-2 mb-1"
          >
            {[...actions].reverse().map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: 16, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 16, scale: 0.9 }}
                transition={{ duration: 0.18, delay: i * 0.04 }}
                onClick={() => {
                  action.onClick();
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2.5 pl-3.5 pr-4 py-2.5 rounded-full",
                  "border backdrop-blur-sm shadow-lg shadow-black/30",
                  "text-sm font-medium transition-all duration-200",
                  "bg-[#0E0F12] border-white/15 text-slate-200 hover:bg-white/8 hover:border-white/25"
                )}
              >
                <action.icon className="h-4 w-4 text-violet-400" />
                {action.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-violet-500 hover:bg-violet-600 text-white shadow-xl shadow-violet-500/35 flex items-center justify-center transition-colors duration-200"
        aria-label={open ? "Cerrar menú" : "Acciones rápidas"}
      >
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <Plus className="h-6 w-6" />
        </motion.div>
      </motion.button>
    </div>
  );
}
