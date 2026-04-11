"use client";

import { Target, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import { CircularProgress } from "./circular-progress";
import { TeamGoal, getGoalStatus, statusColors, getTypeLabel, formatValue } from "../types";

interface GoalCardProps {
  goal: TeamGoal;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const progress =
    goal.targetValue > 0
      ? Math.min(100, (goal.currentValue / goal.targetValue) * 100)
      : 0;

  const getProgressColor = (p: number): string => {
    if (p >= 100) return "#22c55e";
    if (p >= 80) return "#10b981";
    if (p >= 50) return "#f59e0b";
    return "#8B5CF6";
  };

  const getStatusBadge = (status: string): string => {
    const styles: Record<string, string> = {
      active: "bg-violet-500/20 text-violet-400",
      completed: "bg-emerald-500/20 text-emerald-400",
      missed: "bg-rose-500/20 text-rose-400",
      cancelled: "bg-slate-500/20 text-slate-400",
    };
    return styles[status] || styles.active;
  };

  return (
    <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl hover:border-white/20 transition-all">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-violet-400" />
              <span className="text-sm text-slate-400">{getTypeLabel(goal.type)}</span>
              <Badge className={cn("text-xs", getStatusBadge(goal.status))}>
                {goal.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{goal.title}</h3>
              {(() => {
                const { label, variant } = getGoalStatus(goal.currentValue, goal.targetValue);
                return (
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ml-2",
                      statusColors[variant]
                    )}
                  >
                    {label}
                  </span>
                );
              })()}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Progreso</span>
                <span className="text-white font-medium">
                  {formatValue(goal.currentValue, goal.unit)} /{" "}
                  {formatValue(goal.targetValue, goal.unit)}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                <span>
                  {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()}{" "}
                  {goal.unit}
                </span>
                <span>
                  {goal.targetValue > 0
                    ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
                    : 0}
                  %
                </span>
              </div>
              <p className="text-xs text-slate-500">Período: {goal.period}</p>
            </div>
          </div>
          <div className="ml-6 flex flex-col items-center gap-2">
            <CircularProgress
              value={progress}
              size={80}
              strokeWidth={6}
              color={getProgressColor(progress)}
            />
            <div className="flex gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-400 hover:text-white"
                  onClick={onEdit}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-rose-400 hover:text-rose-300"
                  onClick={onDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
