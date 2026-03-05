// ============================================================
// MaatWork CRM — Teams Page
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { Users, Target, TrendingUp, Plus, Crown } from "lucide-react";

export const Route = createFileRoute("/_app/teams/")({
  component: TeamsPage,
});

function TeamsPage() {
  const team = {
    name: "Equipo Alfa",
    members: [
      { name: "Ana García", role: "leader", level: "senior", avatar: "A" },
      { name: "Pedro Ruiz", role: "member", level: "junior", avatar: "P" },
    ],
    goals: [
      { title: "$50k nuevos clientes", target: 50000, current: 30000, unit: "currency", period: "Marzo 2026" },
      { title: "15 reuniones agendadas", target: 15, current: 9, unit: "count", period: "Marzo 2026" },
    ],
  };

  const formatProgress = (current: number, target: number) => Math.round((current / target) * 100);
  const formatValue = (v: number, unit: string) =>
    unit === "currency" ? `$${(v / 1000).toFixed(0)}k` : String(v);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Equipos</h1>
          <p className="text-surface-400 mt-1">Gestiona tus equipos y objetivos</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Nuevo Equipo
        </button>
      </div>

      {/* Team Card */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{team.name}</h2>
            <p className="text-sm text-surface-400">{team.members.length} miembros</p>
          </div>
        </div>

        {/* Members */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-surface-300 mb-3 uppercase tracking-wider">Miembros</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {team.members.map((m) => (
              <div key={m.name} className="flex items-center gap-3 p-3 rounded-lg bg-surface-800/50 border border-surface-700/30">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold">
                  {m.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{m.name}</span>
                    {m.role === "leader" && <Crown className="w-4 h-4 text-amber-400" />}
                  </div>
                  <span className="text-xs text-surface-400 capitalize">{m.level}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div>
          <h3 className="text-sm font-semibold text-surface-300 mb-3 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4" /> Objetivos — Marzo 2026
          </h3>
          <div className="space-y-4">
            {team.goals.map((goal) => {
              const progress = formatProgress(goal.current, goal.target);
              return (
                <div key={goal.title} className="p-4 rounded-lg bg-surface-800/50 border border-surface-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{goal.title}</h4>
                    <span className={`text-sm font-bold ${progress >= 80 ? "text-emerald-400" : progress >= 50 ? "text-amber-400" : "text-red-400"}`}>
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-700 overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        progress >= 80 ? "bg-emerald-500" : progress >= 50 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-surface-400">
                    {formatValue(goal.current, goal.unit)} / {formatValue(goal.target, goal.unit)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
