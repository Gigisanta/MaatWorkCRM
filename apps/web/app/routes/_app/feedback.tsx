import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bug, CheckCircle, Clock, Filter, Lightbulb, MessageSquare, Sparkles, XCircle } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Container, Stack } from "~/components/ui/Layout";
import { SectionHeader } from "~/components/ui/LayoutCards";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/_app/feedback")({
  component: FeedbackPage,
});

type FeedbackStatus = "pending" | "in_progress" | "completed" | "rejected";
type FeedbackType = "bug" | "feature" | "improvement";

interface FeedbackItem {
  id: string;
  title: string;
  description: string;
  type: FeedbackType;
  status: FeedbackStatus;
  priority: "low" | "medium" | "high";
  userName: string;
  userEmail: string;
  createdAt: Date;
}

const mockFeedback: FeedbackItem[] = [
  {
    id: "1",
    title: "El pipeline no muestra los nombres de las etapas",
    description:
      "Las etapas del pipeline aparecen sin nombres, solo con colores. Necesitamos que muestre Prospecto, Contactado, etc.",
    type: "bug",
    status: "in_progress",
    priority: "high",
    userName: "Carlos Admin",
    userEmail: "carlos@maatwork.com",
    createdAt: new Date("2026-03-05"),
  },
  {
    id: "2",
    title: "Agregar métricas de equipos en dashboard",
    description: "Los managers necesitan ver métricas de sus asesores directamente en el dashboard.",
    type: "feature",
    status: "pending",
    priority: "medium",
    userName: "Ana García",
    userEmail: "ana@maatwork.com",
    createdAt: new Date("2026-03-07"),
  },
  {
    id: "3",
    title: "Mejora en la velocidad de carga del pipeline",
    description: "El pipeline tarda mucho en cargar cuando hay muchos contactos.",
    type: "improvement",
    status: "completed",
    priority: "medium",
    userName: "Pedro Ruiz",
    userEmail: "pedro@maatwork.com",
    createdAt: new Date("2026-03-01"),
  },
  {
    id: "4",
    title: "Botón de logout no funciona",
    description: "Al hacer click en cerrar sesión no pasa nada.",
    type: "bug",
    status: "rejected",
    priority: "low",
    userName: "María López",
    userEmail: "maria@maatwork.com",
    createdAt: new Date("2026-03-03"),
  },
];

function StatusBadge({ status }: { status: FeedbackStatus }) {
  const config = {
    pending: { icon: Clock, color: "bg-amber-500/20 text-amber-500", label: "Pendiente" },
    in_progress: { icon: Sparkles, color: "bg-primary/20 text-primary", label: "En Progreso" },
    completed: { icon: CheckCircle, color: "bg-emerald-500/20 text-emerald-500", label: "Completado" },
    rejected: { icon: XCircle, color: "bg-error/20 text-error", label: "Rechazado" },
  };
  const { icon: Icon, color, label } = config[status];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold", color)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function TypeBadge({ type }: { type: FeedbackType }) {
  const config = {
    bug: { icon: Bug, color: "bg-error/20 text-error", label: "Bug" },
    feature: { icon: Sparkles, color: "bg-primary/20 text-primary", label: "Feature" },
    improvement: { icon: Lightbulb, color: "bg-amber-500/20 text-amber-500", label: "Mejora" },
  };
  const { icon: Icon, color, label } = config[type];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold", color)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function FeedbackPage() {
  const [filter, setFilter] = useState<FeedbackStatus | "all">("all");
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);

  const filteredFeedback = filter === "all" ? mockFeedback : mockFeedback.filter((f) => f.status === filter);

  const handleUpdateStatus = (id: string, status: FeedbackStatus) => {
    console.log(`Updating feedback ${id} to ${status}`);
  };

  return (
    <Container className="space-y-12" padding="lg">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader
          title="Feedback"
          description="Gestiona los comentarios y sugerencias de los usuarios."
          icon={MessageSquare}
        />
      </motion.div>

      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-text-muted shrink-0" />
        {(["all", "pending", "in_progress", "completed", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
              filter === f ? "bg-primary text-white" : "bg-surface-100 text-text-muted hover:bg-surface-hover",
            )}
          >
            {f === "all" ? "Todos" : f === "in_progress" ? "En Progreso" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <Stack gap={4}>
        {filteredFeedback.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card
              variant="elevated"
              className="p-6 cursor-pointer hover:border-primary/30 transition-all"
              onClick={() => setSelectedFeedback(item)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <TypeBadge type={item.type} />
                    <StatusBadge status={item.status} />
                    <span
                      className={cn(
                        "px-2 py-1 rounded-full text-xs font-bold",
                        item.priority === "high"
                          ? "bg-error/20 text-error"
                          : item.priority === "medium"
                            ? "bg-amber-500/20 text-amber-500"
                            : "bg-surface-100 text-text-muted",
                      )}
                    >
                      {item.priority === "high" ? "🔴 Alta" : item.priority === "medium" ? "🟡 Media" : "🟢 Baja"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-text mb-2">{item.title}</h3>
                  <p className="text-sm text-text-muted line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-4 mt-4 text-xs text-text-muted">
                    <span>👤 {item.userName}</span>
                    <span>📧 {item.userEmail}</span>
                    <span>📅 {item.createdAt.toLocaleDateString("es-ES")}</span>
                  </div>
                </div>
              </div>

              {selectedFeedback?.id === item.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-6 pt-6 border-t border-border/30"
                >
                  <p className="text-sm text-text mb-4">{item.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Actualizar estado:
                    </span>
                    {(["pending", "in_progress", "completed", "rejected"] as FeedbackStatus[]).map((status) => (
                      <Button
                        key={status}
                        variant={item.status === status ? "primary" : "outline"}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(item.id, status);
                        }}
                      >
                        {status === "pending"
                          ? "Pendiente"
                          : status === "in_progress"
                            ? "En Progreso"
                            : status === "completed"
                              ? "Completar"
                              : "Rechazar"}
                      </Button>
                    ))}
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        ))}

        {filteredFeedback.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-lg font-bold text-text-muted">No hay feedback</p>
          </div>
        )}
      </Stack>
    </Container>
  );
}
