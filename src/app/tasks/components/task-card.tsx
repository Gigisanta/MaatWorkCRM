"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import Link from "next/link";
import {
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/utils";
import type { Task } from "../types";

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  isToggling: boolean;
}

export function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
  isToggling,
}: TaskCardProps) {
  const dueDate = task.dueDate ? parseISO(task.dueDate) : null;
  const isOverdue = dueDate && isPast(dueDate) && task.status !== "completed";
  const isDueToday = dueDate && isToday(dueDate);
  const isDueTomorrow = dueDate && isTomorrow(dueDate);

  const formatDueDate = (date: Date) => {
    if (isToday(date)) return "Hoy";
    if (isTomorrow(date)) return "Mañana";
    return format(date, "d MMM");
  };

  const getRecurrenceLabel = (rule: string | null) => {
    if (!rule) return "Recurrente";
    if (rule.includes("DAILY")) return "Diario";
    if (rule.includes("WEEKLY")) return "Semanal";
    if (rule.includes("MONTHLY")) return "Mensual";
    return "Recurrente";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "group p-4 rounded-lg glass border border-white/8 relative overflow-hidden",
        "hover:border-white/15 transition-all duration-200",
        task.status === "completed" && "opacity-60"
      )}
    >
      {/* Priority bar */}
      <div
        className={cn(
          "absolute left-0 top-3 bottom-3 w-[3px] rounded-full",
          task.priority === "urgent"
            ? "bg-rose-500"
            : task.priority === "high"
              ? "bg-amber-500"
              : task.priority === "medium"
                ? "bg-sky-500"
                : "bg-slate-600"
        )}
      />
      <div className="flex items-start gap-3 pl-4">
        <Checkbox
          id={`task-${task.id}`}
          checked={task.status === "completed"}
          onCheckedChange={() => onToggle(task.id)}
          disabled={isToggling}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p
                className={cn(
                  "font-medium",
                  task.status === "completed"
                    ? "text-slate-500 line-through"
                    : "text-white"
                )}
              >
                {task.title}
              </p>
              {task.description && (
                <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-rose-500"
                  onClick={() => onDelete(task.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {/* Priority */}
            <span
              className={cn(
                "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                task.priority === "urgent"
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  : task.priority === "high"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : task.priority === "medium"
                      ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                      : "bg-slate-500/10 text-slate-400 border-slate-500/20"
              )}
            >
              {task.priority === "urgent"
                ? "Urgente"
                : task.priority === "high"
                  ? "Alta"
                  : task.priority === "medium"
                    ? "Media"
                    : "Baja"}
            </span>

            {/* Due Date */}
            {dueDate && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs",
                  isOverdue ? "text-rose-400" : "text-slate-400"
                )}
              >
                <Calendar className="h-3 w-3" />
                {formatDueDate(dueDate)}
                {isOverdue && <span className="text-rose-400">(Vencida)</span>}
              </div>
            )}

            {/* Recurrence */}
            {task.isRecurrent && (
              <Badge
                variant="outline"
                className="text-xs text-violet-400 border-violet-500/30"
              >
                {getRecurrenceLabel(task.recurrenceRule)}
              </Badge>
            )}

            {/* Contact chip */}
            {task.contact && (
              <Link
                href={`/contacts?contactId=${task.contact.id}`}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 hover:bg-violet-500/20 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="leading-none">{task.contact.emoji || "👤"}</span>
                {task.contact.name}
              </Link>
            )}
          </div>

          {/* Assigned To */}
          {task.assignedUser && (
            <div className="flex items-center gap-2 mt-3">
              <Avatar className="h-5 w-5">
                <AvatarImage src={task.assignedUser.image || undefined} />
                <AvatarFallback className="bg-violet-500/20 text-violet-400 text-[10px]">
                  {task.assignedUser.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "NA"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-slate-400">
                {task.assignedUser.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
