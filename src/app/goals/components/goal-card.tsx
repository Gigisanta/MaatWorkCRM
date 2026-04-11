'use client';

import * as React from "react";
import { motion } from "framer-motion";
import {
  Target,
  Calendar,
  Lock,
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  Archive,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GoalProgressRingImpl } from "@/components/charts/goal-progress-ring-impl";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/utils";
import { formatDistanceToNow, isPast, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

export interface Goal {
  id: string;
  ownerId: string;
  teamGoalId: string | null;
  title: string;
  description: string | null;
  type: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  period: string;
  month: number;
  year: number;
  startDate: string | null;
  endDate: string | null;
  status: string;
  health: string | null;
  progressMethod: string;
  parentGoalId: string | null;
  linkedDeals: string[];
  linkedContacts: string[];
  privacy: string;
  createdAt: string;
  updatedAt: string;
  teamGoal?: {
    id: string;
    title: string;
    teamId: string;
  } | null;
}

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  onArchive?: (goal: Goal) => void;
  onUpdateProgress?: (goal: Goal) => void;
}

const typeLabels: Record<string, string> = {
  revenue: "Ingresos",
  new_clients: "Nuevos Clientes",
  meetings: "Reuniones",
  new_aum: "Nuevos Activos",
  custom: "Personalizado",
};

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  active: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  completed: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  missed: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
  archived: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" },
  draft: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  cancelled: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" },
};

const healthColors: Record<string, { color: string; status: "healthy" | "warning" | "danger" }> = {
  "on-track": { color: "#4ADE80", status: "healthy" },
  "at-risk": { color: "#FBBF24", status: "warning" },
  "off-track": { color: "#F87171", status: "danger" },
  achieved: { color: "#4ADE80", status: "healthy" },
};

function getDeadlineColor(endDate: string | null): string {
  if (!endDate) return "text-slate-500";

  const end = new Date(endDate);
  const now = new Date();
  const daysLeft = differenceInDays(end, now);

  if (daysLeft < 0) return "text-rose-500";
  if (daysLeft <= 7) return "text-amber-500";
  if (daysLeft <= 14) return "text-sky-500";
  return "text-slate-400";
}

function formatValue(value: number, unit: string): string {
  if (unit === "currency") return `$${value.toLocaleString()}`;
  if (unit === "percentage") return `${value}%`;
  return value.toLocaleString();
}

export function GoalCard({ goal, onEdit, onDelete, onArchive, onUpdateProgress }: GoalCardProps) {
  const progress = goal.targetValue > 0
    ? Math.min(100, (goal.currentValue / goal.targetValue) * 100)
    : 0;

  const healthInfo = goal.health
    ? healthColors[goal.health] || { color: "#8B5CF6", status: "healthy" as const }
    : { color: "#8B5CF6", status: "healthy" as const };

  const deadlineColor = getDeadlineColor(goal.endDate);

  const isOverdue = goal.endDate && isPast(new Date(goal.endDate)) && goal.status === "active";
  const isAligned = !!goal.teamGoalId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl hover:border-white/15 transition-all p-5 group">
        <div className="flex items-start gap-4">
          {/* Progress Ring */}
          <div className="flex-shrink-0">
            <GoalProgressRingImpl
              value={progress}
              size={80}
              strokeWidth={8}
              color={healthInfo.color}
              showPercentage
              status={healthInfo.status}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    statusColors[goal.status]?.bg,
                    statusColors[goal.status]?.text,
                    statusColors[goal.status]?.border
                  )}
                >
                  {typeLabels[goal.type] || goal.type}
                </Badge>
                {goal.health && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5 py-0",
                      healthInfo.status === "healthy" && "border-emerald-500/30 text-emerald-400",
                      healthInfo.status === "warning" && "border-amber-500/30 text-amber-400",
                      healthInfo.status === "danger" && "border-rose-500/30 text-rose-400"
                    )}
                  >
                    {goal.health === "on-track" && "En camino"}
                    {goal.health === "at-risk" && "En riesgo"}
                    {goal.health === "off-track" && "Retrasado"}
                    {goal.health === "achieved" && "Logrado"}
                  </Badge>
                )}
                {isAligned && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <ArrowUpRight className="h-3 w-3 text-sky-400" />
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">
                        Alineado con: {goal.teamGoal?.title || "Objetivo de equipo"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* Dropdown menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onUpdateProgress && (
                    <DropdownMenuItem onClick={() => onUpdateProgress(goal)}>
                      <Target className="h-4 w-4 mr-2" />
                      Actualizar progreso
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(goal)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onArchive && (
                    <DropdownMenuItem onClick={() => onArchive(goal)}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archivar
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(goal)}
                        className="text-rose-400 focus:text-rose-300"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Title and description */}
            <h3 className="text-base font-semibold text-white mb-1 truncate">
              {goal.title}
            </h3>
            {goal.description && (
              <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                {goal.description}
              </p>
            )}

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400">
                  {formatValue(goal.currentValue, goal.unit)} / {formatValue(goal.targetValue, goal.unit)}
                </span>
                <span className="text-white font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress
                value={progress}
                className="h-1.5"
              />
            </div>

            {/* Footer row */}
            <div className="flex items-center justify-between">
              {/* Privacy */}
              <div className="flex items-center gap-1.5">
                {goal.privacy === "private" ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Lock className="h-3 w-3 text-slate-500" />
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Privado</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : goal.privacy === "team" ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Users className="h-3 w-3 text-sky-400" />
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Equipo</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}

                {/* Deadline */}
                {goal.endDate && (
                  <div className={cn("flex items-center gap-1", deadlineColor)}>
                    {isOverdue ? (
                      <AlertCircle className="h-3 w-3" />
                    ) : (
                      <Calendar className="h-3 w-3" />
                    )}
                    <span className="text-xs">
                      {isOverdue
                        ? `Venció ${formatDistanceToNow(new Date(goal.endDate), { locale: es, addSuffix: true })}`
                        : formatDistanceToNow(new Date(goal.endDate), { locale: es, addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>

              {/* Period */}
              <span className="text-[10px] text-slate-600 uppercase tracking-wider">
                {goal.period}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function GoalCardSkeleton() {
  return (
    <div className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl p-5">
      <div className="flex items-start gap-4">
        <Skeleton className="h-20 w-20 rounded-full bg-white/5" />
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 bg-white/5" />
            <Skeleton className="h-5 w-16 bg-white/5" />
          </div>
          <Skeleton className="h-5 w-48 bg-white/5" />
          <Skeleton className="h-3 w-full bg-white/5" />
          <Skeleton className="h-2 w-full bg-white/5 rounded-full" />
        </div>
      </div>
    </div>
  );
}
