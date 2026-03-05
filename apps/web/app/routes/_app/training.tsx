// ============================================================
// MaatWork CRM — Training / Capacitaciones Page
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Video, FileText, Compass, Plus, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_app/training")({
  component: TrainingPage,
});

const categoryConfig: Record<string, { icon: React.ElementType; color: string }> = {
  guide: { icon: Compass, color: "bg-brand-500/15 text-brand-400" },
  video: { icon: Video, color: "bg-violet-500/15 text-violet-400" },
  document: { icon: FileText, color: "bg-amber-500/15 text-amber-400" },
  course: { icon: BookOpen, color: "bg-emerald-500/15 text-emerald-400" },
};

const MATERIALS = [
  { id: "1", title: "Guía de Onboarding para Asesores", description: "Material inicial para nuevos asesores del equipo", category: "guide", url: "#" },
  { id: "2", title: "Técnicas de Cierre de Venta", description: "Video curso sobre técnicas avanzadas de cierre", category: "video", url: "#" },
  { id: "3", title: "Manual del Pipeline CRM", description: "Cómo gestionar el pipeline y mover deals eficientemente", category: "document", url: "#" },
  { id: "4", title: "Curso: Asesoría Financiera Básica", description: "Fundamentos de asesoría para nivel junior", category: "course", url: "#" },
];

function TrainingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Capacitación</h1>
          <p className="text-surface-400 mt-1">Materiales y cursos para el equipo</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium">
          <Plus className="w-4 h-4" />
          Agregar Material
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MATERIALS.map((mat) => {
          const config = categoryConfig[mat.category] ?? categoryConfig.document;
          const Icon = config.icon;
          return (
            <div key={mat.id} className="glass-card p-6 animate-fade-in hover:border-brand-600/30 transition-all">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${config.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{mat.title}</h3>
                  <p className="text-sm text-surface-400 mt-1">{mat.description}</p>
                  <a href={mat.url} className="inline-flex items-center gap-1 mt-3 text-sm text-brand-400 hover:text-brand-300">
                    Abrir <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
