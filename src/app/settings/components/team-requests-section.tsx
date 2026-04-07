"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, CheckCircle2, XCircle, Clock, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

interface TeamJoinRequest {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  status: string;
  createdAt: string;
  team: {
    id: string;
    name: string;
  };
  inviter: {
    id: string;
    name: string | null;
  };
}

export function TeamRequestsSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch pending team invitations for current user
  const { data, isLoading } = useQuery({
    queryKey: ["teamJoinRequests", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await fetch(`/api/team-join-requests?userId=${user.id}&status=pending`, { credentials: 'include' });
      if (!res.ok) throw new Error("Error al cargar invitaciones");
      return res.json();
    },
    enabled: !!user?.id,
  });

  // Accept/reject mutation
  const reviewRequestMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "accepted" | "rejected" }) => {
      const res = await fetch(`/api/team-join-requests/${id}`, {
        method: "PUT",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al procesar solicitud");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast.success(variables.action === "accepted" ? "Invitación aceptada" : "Invitación rechazada");
      queryClient.invalidateQueries({ queryKey: ["teamJoinRequests"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const requests: TeamJoinRequest[] = data?.requests || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-violet-400" />
            Invitaciones de Equipo
          </CardTitle>
          <CardDescription className="text-slate-400">
            Acepta o rechaza invitaciones para unirte a equipos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No tienes invitaciones pendientes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-violet-400" />
          Invitaciones de Equipo
        </CardTitle>
        <CardDescription className="text-slate-400">
          Acepta o rechaza invitaciones para unirte a equipos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-4 rounded-lg glass border border-white/8"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-violet-500/10">
                <Building2 className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="font-medium text-white">{request.team.name}</p>
                <p className="text-sm text-slate-400">
                  Invitado por {request.inviter.name || "Usuario"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className={
                      request.role === "leader"
                        ? "border-amber-500/30 text-amber-400"
                        : "border-slate-500/30 text-slate-400"
                    }
                  >
                    {request.role === "leader" ? "Líder" : "Miembro"}
                  </Badge>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(request.createdAt).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                onClick={() =>
                  reviewRequestMutation.mutate({ id: request.id, action: "accepted" })
                }
                disabled={reviewRequestMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Aceptar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                onClick={() =>
                  reviewRequestMutation.mutate({ id: request.id, action: "rejected" })
                }
                disabled={reviewRequestMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Rechazar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
