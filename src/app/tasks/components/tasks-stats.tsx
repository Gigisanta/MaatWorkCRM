"use client";

import { Circle, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TasksStatsProps {
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
  overdueCount: number;
}

export function TasksStats({
  pendingCount,
  inProgressCount,
  completedCount,
  overdueCount,
}: TasksStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Circle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-2xl font-bold text-white">{pendingCount}</p>
              <p className="text-xs text-slate-400">Pendientes</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-white">{inProgressCount}</p>
              <p className="text-xs text-slate-400">En Progreso</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold text-white">{completedCount}</p>
              <p className="text-xs text-slate-400">Completadas</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-500" />
            <div>
              <p className="text-2xl font-bold text-white">{overdueCount}</p>
              <p className="text-xs text-slate-400">Vencidas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
