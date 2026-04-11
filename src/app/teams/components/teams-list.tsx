"use client";

import { Building2, Crown, MoreHorizontal, Settings } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircularProgress } from "./circular-progress";
import { Team } from "../types";

interface TeamsListProps {
  teams: Team[];
  onTeamClick: (team: Team) => void;
}

export function TeamsList({ teams, onTeamClick }: TeamsListProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {teams.map((team) => {
        const teamProgress =
          team.goals.length > 0
            ? team.goals.reduce(
                (sum, g) =>
                  sum + (g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0),
                0
              ) / team.goals.length
            : 0;

        return (
          <Card
            key={team.id}
            className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl hover:border-white/20 transition-all cursor-pointer"
            onClick={() => onTeamClick(team)}
          >
            <CardHeader className="border-b border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2.5 rounded-xl bg-violet-500/10 flex-shrink-0">
                    <Building2 className="h-5 w-5 text-violet-400" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold text-white truncate">
                      {team.name}
                    </CardTitle>
                    {team.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {team.description}
                      </p>
                    )}
                    {!team.description && (
                      <p className="text-xs text-slate-600 mt-0.5">Sin descripción</p>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="icon" className="text-slate-400">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onTeamClick(team);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Team Leader */}
                <TeamLeaderCell team={team} />

                {/* Team Members */}
                <TeamMembersCell team={team} />

                {/* Progress */}
                <TeamProgressCell team={team} teamProgress={teamProgress} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function TeamLeaderCell({ team }: { team: Team }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">
        Líder del Equipo
      </p>
      {team.leader ? (
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-violet-500/20 text-violet-400">
                {team.leader.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "NA"}
              </AvatarFallback>
            </Avatar>
            <Crown className="absolute -top-1 -right-1 h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="font-medium text-white text-sm">
              {team.leader.name || "Sin nombre"}
            </p>
            <p className="text-xs text-slate-400">{team.leader.email}</p>
          </div>
        </div>
      ) : (
        <p className="text-slate-500 text-sm">Sin líder asignado</p>
      )}
    </div>
  );
}

function TeamMembersCell({ team }: { team: Team }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">
        Miembros ({team.members.length})
      </p>
      <div className="flex -space-x-2">
        {team.members.slice(0, 5).map((member) => (
          <TooltipProvider key={member.id} delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-7 w-7 border-2 border-[#08090B] -ml-2 first:ml-0 ring-0 hover:z-10 hover:ring-1 hover:ring-violet-500/40 transition-all cursor-pointer">
                  <AvatarImage src={member.user.image ?? undefined} />
                  <AvatarFallback className="bg-violet-500/10 text-violet-300 text-[9px]">
                    {member.user.name?.slice(0, 2).toUpperCase() ?? "??"}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {member.user.name ?? member.user.email ?? "Miembro"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {team.members.length > 5 && (
          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300 border-2 border-slate-900">
            +{team.members.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamProgressCell({ team, teamProgress }: { team: Team; teamProgress: number }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">
        Progreso General
      </p>
      <div className="flex items-center gap-3">
        <CircularProgress value={teamProgress} size={60} strokeWidth={5} />
        <div>
          <p className="text-lg font-bold text-white">{Math.round(teamProgress)}%</p>
          <p className="text-xs text-slate-400">{team.goals.length} objetivos</p>
        </div>
      </div>
    </div>
  );
}
