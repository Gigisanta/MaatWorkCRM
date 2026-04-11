"use client";

import * as React from "react";
import { X, Crown, Users, Target, TrendingUp, UserPlus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CircularProgress } from "./circular-progress";
import { GoalCard } from "./goal-card";
import { cn } from "@/lib/utils/utils";
import { Team, TeamGoal, TeamMember } from "../types";

interface TeamLeaderSectionProps {
  team: Team;
  onChangeLeader: () => void;
}

export function TeamLeaderSection({ team, onChangeLeader }: TeamLeaderSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-500" />
          Líder del Equipo
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-violet-400 hover:text-violet-300 h-7 px-2"
          onClick={onChangeLeader}
        >
          <Edit className="h-3.5 w-3.5 mr-1" />
          Cambiar
        </Button>
      </div>
      {team.leader ? (
        <div className="flex items-center gap-3 p-3 rounded-lg glass border border-white/10">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-violet-500/20 text-violet-400">
              {team.leader.name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "NA"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-white">{team.leader.name || "Sin nombre"}</p>
            <p className="text-xs text-slate-400">{team.leader.email}</p>
          </div>
        </div>
      ) : (
        <p className="text-slate-500">Sin líder asignado</p>
      )}
    </div>
  );
}

interface TeamMembersSectionProps {
  team: Team;
  onAddMember: () => void;
  onRemoveMember: (member: TeamMember) => void;
}

export function TeamMembersSection({ team, onAddMember, onRemoveMember }: TeamMembersSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <Users className="h-4 w-4 text-violet-400" />
          Miembros ({team.members.length})
        </h3>
        <Button
          variant="outline"
          size="sm"
          className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl text-slate-300"
          onClick={onAddMember}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invitar
        </Button>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {team.members.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No hay miembros en el equipo</p>
        ) : (
          team.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg glass border border-white/10"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs">
                    {member.user.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "NA"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-white">
                    {member.user.name || "Sin nombre"}
                  </p>
                  <p className="text-xs text-slate-400">{member.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    member.role === "leader"
                      ? "border-amber-500/30 text-amber-400"
                      : "border-slate-500/30 text-slate-400"
                  )}
                >
                  {member.role === "leader" ? "Líder" : "Miembro"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-rose-400 hover:text-rose-300"
                  onClick={() => onRemoveMember(member)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface OverallProgressSectionProps {
  averageProgress: number;
}

export function OverallProgressSection({ averageProgress }: OverallProgressSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-emerald-400" />
        Progreso General
      </h3>
      <div className="flex items-center justify-center p-6 rounded-lg glass border border-white/10">
        <CircularProgress value={averageProgress} size={120} strokeWidth={8} />
      </div>
    </div>
  );
}

interface TeamGoalsSectionProps {
  team: Team;
  onAddGoal: () => void;
  onEditGoal: (goal: TeamGoal) => void;
  onDeleteGoal: (goal: TeamGoal) => void;
}

export function TeamGoalsSection({ team, onAddGoal, onEditGoal, onDeleteGoal }: TeamGoalsSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <Target className="h-4 w-4 text-violet-400" />
          Objetivos ({team.goals.length})
        </h3>
        <Button
          variant="outline"
          size="sm"
          className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl text-slate-300"
          onClick={onAddGoal}
        >
          <Target className="h-4 w-4 mr-2" />
          Nuevo
        </Button>
      </div>
      <div className="space-y-3">
        {team.goals.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No hay objetivos para este equipo</p>
        ) : (
          team.goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => onEditGoal(goal)}
              onDelete={() => onDeleteGoal(goal)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface ActivityStatsSectionProps {
  team: Team;
}

export function ActivityStatsSection({ team }: ActivityStatsSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-emerald-400" />
        Estadísticas de Actividad
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-lg glass border border-white/10">
          <p className="text-sm text-slate-400">Miembros</p>
          <p className="text-2xl font-bold text-white">
            {team._count?.members || team.members.length}
          </p>
        </div>
        <div className="p-4 rounded-lg glass border border-white/10">
          <p className="text-sm text-slate-400">Objetivos</p>
          <p className="text-2xl font-bold text-white">
            {team._count?.goals || team.goals.length}
          </p>
        </div>
        <div className="p-4 rounded-lg glass border border-white/10">
          <p className="text-sm text-slate-400">Eventos</p>
          <p className="text-2xl font-bold text-white">
            {team._count?.calendarEvents || 0}
          </p>
        </div>
        <div className="p-4 rounded-lg glass border border-white/10">
          <p className="text-sm text-slate-400">Completados</p>
          <p className="text-2xl font-bold text-emerald-400">
            {team.goals.filter((g) => g.status === "completed").length}
          </p>
        </div>
      </div>
    </div>
  );
}
