"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getRoleDisplayName } from "@/lib/auth/auth-helpers-client";
import type { RoleChangeRequest } from "./types";

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function AdminRoleRequestsTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["roleRequests", user?.organizationId],
    queryFn: async () => {
      const res = await fetch(
        `/api/role-requests?organizationId=${user?.organizationId}&status=pending`
      );
      if (!res.ok) throw new Error("Error al cargar solicitudes");
      return res.json();
    },
    enabled: !!user?.organizationId,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approved" | "rejected" }) => {
      const res = await fetch(`/api/role-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al procesar solicitud");
      }
      return res.json();
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["roleRequests"] });
      toast.success(
        action === "approved"
          ? "Solicitud aprobada correctamente"
          : "Solicitud rechazada correctamente"
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const requests: RoleChangeRequest[] = data?.roleChangeRequests ?? [];

  return (
    <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-violet-400" />
          Solicitudes de Cambio de Rol
        </CardTitle>
        <CardDescription className="text-slate-400">
          Revisa y aprueba las solicitudes de cambio de rol pendientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        ) : requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="p-4 rounded-lg glass border border-white/8"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.user.image || undefined} />
                      <AvatarFallback className="bg-violet-500/20 text-violet-400">
                        {getInitials(request.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-white">
                        {request.user.name || "Sin nombre"}
                      </p>
                      <p className="text-sm text-slate-400">{request.user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className="border-violet-500/30 text-violet-400"
                        >
                          {getRoleDisplayName(request.requestedRole)}
                        </Badge>
                        {request.reason && (
                          <p className="text-xs text-slate-500 italic">
                            &ldquo;{request.reason}&rdquo;
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(request.createdAt).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="success"
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                      onClick={() =>
                        reviewMutation.mutate({ id: request.id, action: "approved" })
                      }
                      disabled={reviewMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                      onClick={() =>
                        reviewMutation.mutate({ id: request.id, action: "rejected" })
                      }
                      disabled={reviewMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ShieldCheck className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No hay solicitudes pendientes</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
