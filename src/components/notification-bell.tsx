"use client";

import * as React from "react";
import { Bell, CheckSquare, Target, Users, Info, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";

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
}

// Fetch notifications for the bell dropdown (limited to 10)
async function fetchNotifications(userId: string, organizationId: string): Promise<NotificationsResponse> {
  const response = await fetch(
    `/api/notifications?userId=${userId}&organizationId=${organizationId}&limit=10`,
    { credentials: 'include' }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }
  return response.json();
}

// Mark notification as read
async function markAsRead(notificationId: string): Promise<void> {
  const response = await fetch(`/api/notifications/${notificationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isRead: true }),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error("Failed to mark notification as read");
  }
}

// Mark all notifications as read
async function markAllAsRead(userId: string, organizationId: string): Promise<void> {
  const response = await fetch("/api/notifications/read-all", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, organizationId }),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error("Failed to mark all notifications as read");
  }
}

export function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = React.useState(false);

  // Fetch notifications
  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications", user?.id, user?.organizationId],
    queryFn: () => fetchNotifications(user!.id, user!.organizationId!),
    enabled: !!user?.id && !!user?.organizationId,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => {
      toast.error("Error al marcar notificación como leída");
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

  const unreadCount = data?.unreadCount || 0;
  const notifications = data?.notifications || [];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task":
        return <CheckSquare className="h-4 w-4 text-amber-500" />;
      case "goal":
        return <Target className="h-4 w-4 text-emerald-500" />;
      case "contact":
        return <Users className="h-4 w-4 text-violet-500" />;
      case "system":
        return <Info className="h-4 w-4 text-slate-400" />;
      default:
        return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (unreadCount > 0) {
      markAllAsReadMutation.mutate();
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-xl bg-white/4 border border-white/8 hover:bg-white/8 hover:border-white/15 text-slate-400 hover:text-white transition-all duration-200"
        >
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                key={unreadCount}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border border-[#08090B] shadow-sm shadow-rose-500/30"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 bg-[#0E0F12] border border-white/8 shadow-2xl shadow-black/40 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-3 border-b border-white/8 bg-white/2">
          <span className="text-sm font-semibold text-white">Notificaciones</span>
          {unreadCount > 0 && (
            <span className="text-xs text-violet-400 font-medium">{unreadCount} sin leer</span>
          )}
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full bg-white/5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-white/5" />
                  <Skeleton className="h-3 w-1/2 bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-center text-sm text-slate-400">
            Error al cargar notificaciones
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-8 w-8 mx-auto text-slate-500 mb-2" />
            <p className="text-sm text-slate-400">No hay notificaciones</p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-80">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 cursor-pointer border-b border-white/5 last:border-0 ${
                    !notification.isRead ? "bg-violet-500/4 border-l-2 border-l-violet-500/40" : "hover:bg-white/4"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  onSelect={(e) => {
                    // Prevent dropdown from closing if we have an action URL
                    if (notification.actionUrl) {
                      e.preventDefault();
                    }
                  }}
                >
                  {notification.actionUrl ? (
                    <Link
                      href={notification.actionUrl}
                      className="flex items-start gap-3 w-full"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-violet-500" />
                        )}
                        <ExternalLink className="h-3 w-3 text-slate-500" />
                      </div>
                    </Link>
                  ) : (
                    <>
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="h-2 w-2 rounded-full bg-violet-500" />
                      )}
                    </>
                  )}
                </DropdownMenuItem>
              ))}
            </ScrollArea>

            {/* Footer with actions */}
            <div className="flex items-center justify-between p-2 border-t border-white/8 bg-white/5">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-slate-400 hover:text-white"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
              >
                <Check className="h-3 w-3 mr-1" />
                Marcar todas leídas
              </Button>
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-xs text-violet-400 hover:text-violet-300 px-2 py-1"
              >
                Ver todas
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
