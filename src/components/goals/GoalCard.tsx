"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Calendar, Lock, Users, Building2, MoreHorizontal, Pencil, Archive, Trash2 } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoalTypeBadge } from "./GoalTypeBadge";
import { GoalHealthIndicator } from "./GoalHealthIndicator";
import { GoalProgressRing } from "./GoalProgressRing";
import { GoalProgressBar } from "./GoalProgressBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type GoalType = "revenue" | "new_aum" | "new_clients" | "meetings" | "custom";
type HealthStatus = "on-track" | "at-risk" | "off-track" | "achieved";
type PrivacyLevel = "private" | "team" | "company";

export interface GoalCardData {
  id: string;
  title: string;
  description?: string | null;
  type: GoalType;
  targetValue: number;
  currentValue: number;
  unit: string; // currency, count, percentage
  progress: number; // 0-100
  health?: HealthStatus;
  privacy: PrivacyLevel;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  isExpanded?: boolean;
}

interface GoalCardProps {
  goal: GoalCardData;
  isLoading?: boolean;
  onEdit?: (goal: GoalCardData) => void;
  onDelete?: (goalId: string) => void;
  onArchive?: (goalId: string) => void;
  onClick?: (goal: GoalCardData) => void;
  className?: string;
}

const PRIVACY_CONFIG: Record<PrivacyLevel, { icon: typeof Lock; label: string }> = {
  private: { icon: Lock, label: "Privado" },
  team: { icon: Users, label: "Equipo" },
  company: { icon: Building2, label: "Empresa" },
};

const FORMAT_VALUE = (value: number, unit: string): string => {
  if (unit === "currency") {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (unit === "percentage") {
    return `${value}%`;
  }
  return new Intl.NumberFormat("es-ES").format(value);
};

export function GoalCard({
  goal,
  isLoading = false,
  onEdit,
  onDelete,
  onArchive,
  onClick,
  className,
}: GoalCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const progress = Math.min(Math.max(goal.progress, 0), 100);
  const health: HealthStatus = goal.health ?? (progress >= 100 ? "achieved" : progress >= 50 ? "on-track" : "at-risk");

  const status = progress >= 100 ? "achieved" : health === "on-track" ? "healthy" : health === "at-risk" ? "warning" : "danger";

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(goal);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(goal.id);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive?.(goal.id);
  };

  const handleClick = () => {
    onClick?.(goal);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      className={cn("cursor-pointer", className)}
    >
      <Card
        className={cn(
          "bg-[#0E0F12]/80 backdrop-blur-xl border-[#1C1D21] transition-all duration-200",
          isHovered && "shadow-lg shadow-black/20 border-white/12"
        )}
      >
        <CardHeader className="px-5 pt-5 pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <GoalTypeBadge type={goal.type} size="sm" />
                {goal.health && <GoalHealthIndicator health={goal.health} size="sm" />}
              </div>
              <h3 className="font-semibold text-white text-base truncate leading-tight">
                {goal.title}
              </h3>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-white shrink-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {onEdit && (
                  <DropdownMenuItem onClick={handleEdit}>
                    <Pencil className="h-4 w-4 mr-2 text-slate-400" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onArchive && (
                  <DropdownMenuItem onClick={handleArchive}>
                    <Archive className="h-4 w-4 mr-2 text-slate-400" />
                    Archivar
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDelete} variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="px-5 py-4">
          {goal.description && (
            <p className="text-sm text-slate-400 mb-4 line-clamp-2">
              {goal.description}
            </p>
          )}

          <div className="flex items-center gap-4">
            <GoalProgressRing
              progress={progress}
              size="md"
              status={status}
              showPercentage
            />
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-white tabular-nums">
                  {FORMAT_VALUE(goal.currentValue, goal.unit)}
                </span>
                <span className="text-sm text-slate-500">
                  / {FORMAT_VALUE(goal.targetValue, goal.unit)}
                </span>
              </div>
              <GoalProgressBar progress={progress} size="sm" status={status} />
            </div>
          </div>

          {goal.isExpanded && goal.description && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2 }}
              className="mt-4 pt-4 border-t border-white/8"
            >
              <p className="text-sm text-slate-400">{goal.description}</p>
            </motion.div>
          )}
        </CardContent>

        <CardFooter className="px-5 py-3 border-t border-[#1C1D21]">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              {goal.startDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{format(new Date(goal.startDate), "dd MMM", { locale: es })}</span>
                </div>
              )}
              {goal.endDate && (
                <div className="flex items-center gap-1">
                  <span>-</span>
                  <span>{format(new Date(goal.endDate), "dd MMM yyyy", { locale: es })}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {React.createElement(PRIVACY_CONFIG[goal.privacy].icon, {
                className: "h-3.5 w-3.5 text-slate-500",
              })}
              <span className="text-xs text-slate-500">
                {PRIVACY_CONFIG[goal.privacy].label}
              </span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
