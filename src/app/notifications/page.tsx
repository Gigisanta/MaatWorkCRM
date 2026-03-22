"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  CheckSquare,
  Target,
  Users,
  Info,
  Check,
  ExternalLink,
  Loader2,
  Filter,
  X,
} from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { useSidebar } from "@/lib/sidebar-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

// Types
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Notification type config
const notificationTypeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  task: {
    icon: <CheckSquare className="h-4 w-4" />,
    label: "Tarea",
    color: "text-amber-500 bg-amber-500/10",
  },
  goal: {
    icon: <Target className="h-4 w-4" />,
    label: "Objetivo",
    color: "text-emerald-500 bg-emerald-500/10",
  },
  contact: {
    icon: <Users className="h-4 w-4" />,
    label: "Contacto",
    color: "text-violet-500 bg-violet-500/10",
  },
  system: {
    icon: <Info className="h-4 w-4" />,
    label: "Sistema",
    color: "text-slate-400 bg-slate-500/10",
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    label: "Info",
    color: "text-blue-500 bg-blue-500/10",
  },
  success: {
    icon: <Check className="h-4 w-4" />,
    label: "Éxito",
    color: "text-emerald-500 bg-emerald-500/10",
  },
  warning: {
    icon: <Bell className="h-4 w-4" />,
    label: "Advertencia",
    color: "text-amber-500 bg-amber-500/10",
  },
  error: {
    icon: <X className="h-4 w-4" />,
    label: "Error",
    color: "text-rose-500 bg-rose-500/10",
  },
};

// Fetch notifications
async function fetchNotifications(params: {
  userId: string;
  organizationId: string;
  isRead?: string;
  type?: string;
  page?: number;
}): Promise<NotificationsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("userId", params.userId);
  searchParams.set("organizationId", params.organizationId);
  
  if (params.isRead && params.isRead !== "all") {
    searchParams.set("isRead", params.isRead);
  }
  if (params.type && params.type !== "all") {
    searchParams.set("type", params.type);
  }
  if (params.page) {
    searchParams.set("page", params.page.toString());
  }

  const response = await fetch(`/api/notifications?${searchParams.toString()}`, { credentials: 'include' });
  if (!response.ok) {
    throw new Error("Error al cargar notificaciones");
  }
  return response.json();
}

// Mark notification as read
async function markAsRead(notificationId: string): Promise<void> {
  const response = await fetch(`/api/notifications/${notificationId}/read`, {
    method: "POST",
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error("Error al marcar notificación como leída");
  }
}

// Mark all notifications as read
async function markAllAsRead(userId: string, organizationId: string): Promise<void> {
  const response = await fetch("/api/notifications/read-all", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: 'include',
    body: JSON.stringify({ userId, organizationId }),
  });
  if (!response.ok) {
    throw new Error("Error al marcar notificaciones como leídas");
  }
}

// Notification Card Component
function NotificationCard({
  notification,
  onMarkAsRead,
  isMarkingAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  isMarkingAsRead: boolean;
}) {
  const typeConfig = notificationTypeConfig[notification.type] || notificationTypeConfig.system;
  const formattedDate = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });
  const fullDate = format(new Date(notification.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm");

  const content = (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "group p-4 rounded-lg bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8",
        "hover:border-white/20 transition-all duration-200 cursor-pointer",
        !notification.isRead && "bg-violet-500/5 border-violet-500/20"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn("p-2 rounded-lg", typeConfig.color)}>
          {typeConfig.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-medium text-white">{notification.title}</p>
              <p className="text-sm text-slate-400 mt-1">{notification.message}</p>
            </div>
            {!notification.isRead && (
              <div className="h-2 w-2 rounded-full bg-violet-500 flex-shrink-0 mt-2" />
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-slate-500" title={fullDate}>
              {formattedDate}
            </span>
            <Badge variant="outline" className={cn("text-xs", typeConfig.color, "border-current")}>
              {typeConfig.label}
            </Badge>
            {notification.actionUrl && (
              <ExternalLink className="h-3 w-3 text-slate-500" />
            )}
          </div>
        </div>

        {/* Mark as read button */}
        {!notification.isRead && (
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            disabled={isMarkingAsRead}
          >
            {isMarkingAsRead ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );

  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl}>
        {content}
      </Link>
    );
  }

  return content;
}

// Notification Skeleton
function NotificationSkeleton() {
  return (
    <div className="p-4 rounded-lg bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8">
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 rounded-lg bg-white/5" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 bg-white/5" />
          <Skeleton className="h-3 w-1/2 bg-white/5" />
          <Skeleton className="h-3 w-1/4 bg-white/5" />
        </div>
      </div>
    </div>
  );
}

// Main Page
export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [filterRead, setFilterRead] = React.useState<string>("all");
  const [filterType, setFilterType] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);

  // Marking state
  const [markingAsRead, setMarkingAsRead] = React.useState<Set<string>>(new Set());
  const { collapsed, setCollapsed } = useSidebar();

  // Fetch notifications
  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications", user?.id, user?.organizationId, filterRead, filterType, page],
    queryFn: () => fetchNotifications({
      userId: user!.id,
      organizationId: user!.organizationId!,
      isRead: filterRead,
      type: filterType,
      page,
    }),
    enabled: !!user?.id && !!user?.organizationId,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onMutate: (id) => {
      setMarkingAsRead(prev => new Set(prev).add(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => {
      toast.error("Error al marcar notificación como leída");
    },
    onSettled: (_, __, id) => {
      setMarkingAsRead(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllAsRead(user!.id, user!.organizationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Todas las notificaciones marcadas como leídas");
    },
    onError: () => {
      toast.error("Error al marcar notificaciones como leídas");
    },
  });

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [filterRead, filterType]);

  // Handle error
  if (error) {
    return (
      <div className="min-h-screen gradient-bg">
        <AppSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
        <div className={cn("transition-all duration-300", collapsed ? "lg:pl-[80px]" : "lg:pl-[220px]")}>
          <AppHeader />
          <main className="p-4 lg:p-6">
            <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
              <CardContent className="p-8 text-center">
                <X className="h-12 w-12 text-rose-500 mx-auto mb-3" />
                <p className="text-white mb-2">Error al cargar notificaciones</p>
                <p className="text-slate-400 text-sm mb-4">{(error as Error).message}</p>
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["notifications"] })}>
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen gradient-bg">
      <AppSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-[80px]" : "lg:pl-[220px]")}>
        <AppHeader />
        <main className="p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-1">Sistema</p>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Bell className="h-6 w-6" />
                  Notificaciones
                </h1>
                <p className="text-slate-400 mt-1">
                  {unreadCount > 0 ? (
                    <>
                      Tienes <span className="text-violet-400">{unreadCount}</span> notificacion{unreadCount !== 1 ? "es" : ""} sin leer
                    </>
                  ) : (
                    "No tienes notificaciones nuevas"
                  )}
                </p>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  className="bg-white/4 border border-white/10 text-slate-400 hover:text-white"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                >
                  {markAllAsReadMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Marcar todas como leídas
                </Button>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                      <Bell className="h-5 w-5 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{pagination?.total || 0}</p>
                      <p className="text-xs text-slate-400">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Bell className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{unreadCount}</p>
                      <p className="text-xs text-slate-400">Sin leer</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <CheckSquare className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{notifications.filter(n => n.type === "task").length}</p>
                      <p className="text-xs text-slate-400">Tareas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                      <Target className="h-5 w-5 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{notifications.filter(n => n.type === "goal").length}</p>
                      <p className="text-xs text-slate-400">Objetivos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <Select value={filterRead} onValueChange={setFilterRead}>
                    <SelectTrigger className="w-[160px] bg-white/5 border border-white/10 text-white">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="false">Sin leer</SelectItem>
                      <SelectItem value="true">Leídas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[160px] bg-white/5 border border-white/10 text-white">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="task">Tareas</SelectItem>
                      <SelectItem value="goal">Objetivos</SelectItem>
                      <SelectItem value="contact">Contactos</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Notifications List */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <NotificationSkeleton key={i} />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl border-dashed">
                <CardContent className="p-12 text-center">
                  <Bell className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                  <p className="text-xl text-white mb-2">No hay notificaciones</p>
                  <p className="text-slate-400">
                    {filterRead !== "all" || filterType !== "all"
                      ? "Prueba con otros filtros"
                      : "Las notificaciones aparecerán aquí cuando tengas actualizaciones"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="space-y-3 pr-4">
                  <AnimatePresence mode="popLayout">
                    {notifications.map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        isMarkingAsRead={markingAsRead.has(notification.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  className="bg-white/4 border border-white/10 text-slate-400 hover:text-white"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-slate-400">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  className="bg-white/4 border border-white/10 text-slate-400 hover:text-white"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
