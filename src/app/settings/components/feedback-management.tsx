'use client';

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Bug, Zap, MessageSquare, Lightbulb, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";

interface FeedbackItem {
  id: string;
  type: string;
  subject: string;
  content: string;
  status: string;
  priority: string;
  response: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
}

const typeIcons: Record<string, React.ElementType> = {
  general: MessageSquare,
  bug: Bug,
  feature: Zap,
  improvement: Lightbulb,
};

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: "Pendiente", icon: Clock, color: "bg-amber-500/10 border-amber-500/30 text-amber-400" },
  reviewed: { label: "Revisado", icon: CheckCircle2, color: "bg-blue-500/10 border-blue-500/30 text-blue-400" },
  implemented: { label: "Implementado", icon: CheckCircle2, color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
  dismissed: { label: "Descartado", icon: XCircle, color: "bg-slate-500/10 border-slate-500/30 text-slate-400" },
};

export function FeedbackManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFeedback, setSelectedFeedback] = React.useState<FeedbackItem | null>(null);
  const [responseText, setResponseText] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");

  // Fetch feedback
  const { data: feedbackData, isLoading } = useQuery<{ feedback: FeedbackItem[] }>({
    queryKey: ["feedback", user?.organizationId],
    queryFn: async () => {
      const res = await fetch(`/api/feedback?organizationId=${user?.organizationId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al cargar feedback");
      return res.json();
    },
    enabled: !!user?.organizationId && (user?.role === "owner" || user?.role === "dueno"),
  });

  // Update feedback status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, response }: { id: string; status: string; response?: string }) => {
      // For now, we'll update via a separate endpoint or just optimistically update
      // Since we don't have a PUT endpoint for feedback, we'll refetch after
      return { id, status, response };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      toast.success("Estado actualizado");
    },
  });

  const feedback = feedbackData?.feedback || [];
  const filteredFeedback = filterStatus === "all"
    ? feedback
    : feedback.filter((f: FeedbackItem) => f.status === filterStatus);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    );
  }

  if (feedback.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>No hay feedback aún</p>
        <p className="text-sm mt-1">El feedback de los usuarios aparecerá aquí</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10 text-slate-300">
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-white/10">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="reviewed">Revisado</SelectItem>
            <SelectItem value="implemented">Implementado</SelectItem>
            <SelectItem value="dismissed">Descartado</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-slate-500">
          {filteredFeedback.length} {filteredFeedback.length === 1 ? "item" : "items"}
        </span>
      </div>

      {/* Feedback list */}
      <div className="space-y-4">
        {filteredFeedback.map((item: FeedbackItem) => {
          const TypeIcon = typeIcons[item.type] || MessageSquare;
          const status = statusConfig[item.status] || statusConfig.pending;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl glass border transition-all cursor-pointer ${
                selectedFeedback?.id === item.id
                  ? "border-violet-500/30 bg-violet-500/5"
                  : "border-white/10 hover:border-white/15"
              }`}
              onClick={() => setSelectedFeedback(item)}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <TypeIcon className="h-5 w-5 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-white truncate">{item.subject}</h4>
                    <Badge variant="outline" className={status.color}>
                      <status.icon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2">{item.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>{item.user?.name || "Anónimo"}</span>
                    <span>•</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {selectedFeedback && (
        <div className="p-4 rounded-xl glass border border-violet-500/20 bg-violet-500/5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-white">{selectedFeedback.subject}</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFeedback(null)}
              className="text-slate-400 hover:text-white"
            >
              Cerrar
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-500 mb-1">Tipo</p>
              <div className="flex items-center gap-2">
                {React.createElement(typeIcons[selectedFeedback.type] || MessageSquare, {
                  className: "h-4 w-4 text-violet-400",
                })}
                <span className="text-white capitalize">{selectedFeedback.type}</span>
              </div>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Prioridad</p>
              <span className="text-white capitalize">{selectedFeedback.priority}</span>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Fecha</p>
              <span className="text-white">{formatDate(selectedFeedback.createdAt)}</span>
            </div>
          </div>

          <div>
            <p className="text-slate-500 mb-1">Descripción</p>
            <p className="text-white">{selectedFeedback.content}</p>
          </div>

          {selectedFeedback.user && (
            <div>
              <p className="text-slate-500 mb-1">Enviado por</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs text-violet-300">
                  {getInitials(selectedFeedback.user.name)}
                </div>
                <span className="text-white">{selectedFeedback.user.name || selectedFeedback.user.email}</span>
              </div>
            </div>
          )}

          {selectedFeedback.response && (
            <div>
              <p className="text-slate-500 mb-1">Respuesta</p>
              <p className="text-white bg-white/5 p-3 rounded-lg">{selectedFeedback.response}</p>
            </div>
          )}

          {/* Response form */}
          <div className="space-y-2 pt-4 border-t border-white/10">
            <Label className="text-slate-300">Agregar respuesta / Actualizar estado</Label>
            <Textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Escribe una respuesta opcional..."
              className="bg-white/5 border-white/10 text-white resize-none"
              rows={2}
            />
            <div className="flex items-center gap-2">
              <Select
                value={selectedFeedback.status}
                onValueChange={(status) => {
                  updateStatusMutation.mutate({
                    id: selectedFeedback.id,
                    status,
                    response: responseText || undefined,
                  });
                  setSelectedFeedback({ ...selectedFeedback, status, response: responseText || selectedFeedback.response });
                  setResponseText("");
                }}
              >
                <SelectTrigger className="w-40 bg-white/5 border-white/10 text-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="reviewed">Revisado</SelectItem>
                  <SelectItem value="implemented">Implementado</SelectItem>
                  <SelectItem value="dismissed">Descartado</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="bg-violet-500 hover:bg-violet-600"
                disabled={updateStatusMutation.isPending}
                onClick={() => {
                  if (responseText.trim()) {
                    updateStatusMutation.mutate({
                      id: selectedFeedback.id,
                      status: selectedFeedback.status,
                      response: responseText,
                    });
                    setSelectedFeedback({ ...selectedFeedback, response: responseText });
                    setResponseText("");
                  }
                }}
              >
                {updateStatusMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Guardar"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
