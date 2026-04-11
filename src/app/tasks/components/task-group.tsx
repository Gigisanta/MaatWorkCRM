"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { TaskCard } from "./task-card";
import { cn } from "@/lib/utils/utils";
import type { Task } from "../types";

interface TaskGroupProps {
  label: string;
  tasks: Task[];
  badgeColor: string;
  defaultOpen?: boolean;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  togglingTasks: Set<string>;
}

export function TaskGroup({
  label,
  tasks,
  badgeColor,
  defaultOpen = true,
  onToggle,
  onEdit,
  onDelete,
  togglingTasks,
}: TaskGroupProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  if (tasks.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-1 py-1 mb-2 text-left group"
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-slate-500 transition-transform duration-200",
            open && "rotate-90"
          )}
        />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          {label}
        </span>
        <span
          className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full border ml-1",
            badgeColor
          )}
        >
          {tasks.length}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="group-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={() => onToggle(task)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isToggling={togglingTasks.has(task.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
