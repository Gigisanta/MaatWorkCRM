"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  User,
  Building2,
  Bell,
  Shield,
  Palette,
  Link as LinkIcon,
  Lightbulb,
  Users,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils/utils";
import { useAuth } from "@/contexts/auth-context";
import { canManageUsers } from "@/lib/auth/auth-helpers-client";

import { ProfileSettings } from "./profile-settings";
import { OrganizationSettings } from "./organization-settings";
import { NotificationSettings as NotificationSettingsComponent } from "./notification-settings";
import { SecuritySettings } from "./security-settings";
import { AppearanceSettings } from "./appearance-settings";
import { ConnectedAccountsSettings } from "./connected-accounts-settings";
import { TeamRequestsSection } from "./team-requests-section";
import { FeedbackManagement } from "./feedback-management";
import { AdminPanel } from "./admin-panel";
import type {
  ProfileForm,
  PasswordForm,
  OrganizationForm,
  InviteMemberForm,
  NotificationSettings as NotificationSettingsType,
  Session,
} from "./types";

// ============================================
// Settings Page Orchestrator
// ============================================

interface SettingsPageProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export default function SettingsPage({ collapsed, onCollapsedChange }: SettingsPageProps) {
  const { user, isLoading: authLoading, refreshSession } = useAuth();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  // UI State
  const [activeTab, setActiveTab] = React.useState("profile");

  // Check if user is admin
  const isAdmin = user ? canManageUsers(user.role) : false;

  // ============================================
  // Data Fetching
  // ============================================

  // Fetch user settings
  const { data: userSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["userSettings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await fetch(`/api/users/${user.id}/settings`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al cargar configuración");
      return res.json();
    },
    enabled: !!user?.id,
  });

  // Fetch organization
  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ["organization", user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return null;
      const res = await fetch(`/api/organizations/${user.organizationId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al cargar organización");
      return res.json();
    },
    enabled: !!user?.organizationId,
  });

  // Fetch sessions
  const { data: sessionsData, isLoading: sessionsLoading, refetch: refetchSessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await fetch("/api/sessions", { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar sesiones");
      return res.json();
    },
    enabled: activeTab === "security",
  });

  // ============================================
  // Mutations
  // ============================================

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      if (!user?.id) throw new Error("Usuario no encontrado");
      const res = await fetch(`/api/users/${user.id}`, {
        credentials: "include",
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al actualizar perfil");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Perfil actualizado correctamente");
      refreshSession();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordForm) => {
      if (!user?.id) throw new Error("Usuario no encontrado");
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al cambiar contraseña");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Contraseña actualizada correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: NotificationSettingsType) => {
      if (!user?.id) throw new Error("Usuario no encontrado");
      const res = await fetch(`/api/users/${user.id}/settings`, {
        credentials: "include",
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailNotifications: settings.emailNotifications,
          pushNotifications: settings.pushNotifications,
          taskReminders: settings.taskReminders,
          goalProgressAlerts: settings.goalProgressAlerts,
          newLeadsNotifications: settings.newLeadsNotifications,
          theme,
        }),
      });
      if (!res.ok) throw new Error("Error al guardar preferencias");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Preferencias guardadas");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update organization mutation
  const updateOrganizationMutation = useMutation({
    mutationFn: async (data: OrganizationForm) => {
      if (!user?.organizationId) throw new Error("Organización no encontrada");
      const res = await fetch(`/api/organizations/${user.organizationId}`, {
        credentials: "include",
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al actualizar organización");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Organización actualizada");
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: async (data: InviteMemberForm) => {
      if (!user?.organizationId) throw new Error("Organización no encontrada");
      const res = await fetch(`/api/organizations/${user.organizationId}/members`, {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al invitar miembro");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Miembro invitado correctamente");
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberUserId: string) => {
      if (!user?.organizationId) throw new Error("Organización no encontrada");
      const res = await fetch(
        `/api/organizations/${user.organizationId}/members?userId=${memberUserId}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al eliminar miembro");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Miembro eliminado");
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Logout other sessions mutation
  const logoutOthersMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/sessions/logout-others", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al cerrar sesiones");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || "Sesiones cerradas");
      refetchSessions();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuario no encontrado");
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al eliminar cuenta");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Cuenta eliminada");
      window.location.href = "/login";
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Role change request mutation
  const submitRoleRequestMutation = useMutation({
    mutationFn: async (data: { requestedRole: string; reason?: string }) => {
      if (!user?.organizationId) throw new Error("Organización no encontrada");
      const res = await fetch("/api/role-requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, organizationId: user.organizationId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al enviar solicitud");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Solicitud de cambio de rol enviada");
      queryClient.invalidateQueries({ queryKey: ["roleRequests"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // ============================================
  // Notification settings state
  // ============================================

  const [notificationSettings, setNotificationSettings] = React.useState<NotificationSettingsType>({
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    goalProgressAlerts: true,
    newLeadsNotifications: true,
  });

  React.useEffect(() => {
    if (userSettings?.settings) {
      setNotificationSettings({
        emailNotifications: userSettings.settings.emailNotifications ?? true,
        pushNotifications: userSettings.settings.pushNotifications ?? true,
        taskReminders: userSettings.settings.taskReminders ?? true,
        goalProgressAlerts: userSettings.settings.goalProgressAlerts ?? true,
        newLeadsNotifications: userSettings.settings.newLeadsNotifications ?? true,
      });
    }
  }, [userSettings]);

  const handleNotificationChange = (key: string, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    updateSettingsMutation.mutate(newSettings);
  };

  // ============================================
  // Loading state
  // ============================================

  if (authLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  // ============================================
  // Render
  // ============================================

  const sessions: Session[] = sessionsData?.sessions || [];

  return (
    <div className="min-h-screen gradient-bg">
      <AppSidebar collapsed={collapsed} onCollapsedChange={onCollapsedChange} />
      <div
        className={cn(
          "transition-all duration-300",
          collapsed ? "lg:pl-[80px]" : "lg:pl-[220px]"
        )}
      >
        <AppHeader />
        <main className="p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="mb-8">
              <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-1.5">
                Tu cuenta
              </p>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Configuración
              </h1>
              <p className="text-slate-500 mt-1.5 text-sm">
                Administra tu perfil, organización y preferencias
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="glass border border-white/8 bg-transparent p-1">
                <TabsTrigger
                  value="profile"
                  className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400"
                >
                  <User className="h-4 w-4" />
                  <span>Perfil</span>
                </TabsTrigger>
                <TabsTrigger
                  value="organization"
                  className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400"
                >
                  <Building2 className="h-4 w-4" />
                  <span>Organización</span>
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400"
                >
                  <Bell className="h-4 w-4" />
                  <span>Notificaciones</span>
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400"
                >
                  <Shield className="h-4 w-4" />
                  <span>Seguridad</span>
                </TabsTrigger>
                <TabsTrigger
                  value="appearance"
                  className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400"
                >
                  <Palette className="h-4 w-4" />
                  <span>Apariencia</span>
                </TabsTrigger>
                <TabsTrigger
                  value="accounts"
                  className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400"
                >
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Cuentas
                </TabsTrigger>
                <TabsTrigger
                  value="team-requests"
                  className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Equipos
                </TabsTrigger>
                {user &&
                  (user.role === "owner" ||
                    user.role === "dueno" ||
                    user.organizationRole === "owner") && (
                    <TabsTrigger
                      value="feedback"
                      className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400"
                    >
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Feedback
                    </TabsTrigger>
                  )}
                {user && canManageUsers(user.role) && (
                  <TabsTrigger
                    value="admin"
                    className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400"
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Admin
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <ProfileSettings
                  onUpdateProfile={(data) => updateProfileMutation.mutate(data)}
                  isUpdatingProfile={updateProfileMutation.isPending}
                  onChangePassword={(data) => changePasswordMutation.mutate(data)}
                  isChangingPassword={changePasswordMutation.isPending}
                  onRequestRoleChange={(requestedRole, reason) =>
                    submitRoleRequestMutation.mutate({ requestedRole, reason })
                  }
                  isRequestingRoleChange={submitRoleRequestMutation.isPending}
                />
              </TabsContent>

              {/* Organization Tab */}
              <TabsContent value="organization">
                <OrganizationSettings
                  organization={organization}
                  isLoading={orgLoading}
                  isAdmin={isAdmin}
                  currentUserId={user?.id}
                  onUpdateOrganization={(data) =>
                    updateOrganizationMutation.mutate(data)
                  }
                  isUpdatingOrganization={updateOrganizationMutation.isPending}
                  onInviteMember={(data) => inviteMemberMutation.mutate(data)}
                  isInvitingMember={inviteMemberMutation.isPending}
                  onRemoveMember={(memberUserId) =>
                    removeMemberMutation.mutate(memberUserId)
                  }
                  isRemovingMember={removeMemberMutation.isPending}
                />
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <NotificationSettingsComponent
                  settings={userSettings?.settings || null}
                  isLoading={settingsLoading}
                  onChange={handleNotificationChange}
                  isUpdating={updateSettingsMutation.isPending}
                />
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <SecuritySettings
                  sessions={sessions}
                  isLoading={sessionsLoading}
                  onLogoutOthers={() => logoutOthersMutation.mutate()}
                  isLoggingOutOthers={logoutOthersMutation.isPending}
                  onDeleteAccount={() => deleteAccountMutation.mutate()}
                  isDeletingAccount={deleteAccountMutation.isPending}
                />
              </TabsContent>

              {/* Appearance Tab */}
              <TabsContent value="appearance">
                <AppearanceSettings
                  theme={theme || "dark"}
                  onThemeChange={setTheme}
                />
              </TabsContent>

              {/* Connected Accounts Tab */}
              <TabsContent value="accounts">
                <ConnectedAccountsSettings />
              </TabsContent>

              {/* Team Requests Tab */}
              <TabsContent value="team-requests">
                <TeamRequestsSection />
              </TabsContent>

              {/* Feedback Tab (Owner only) */}
              <TabsContent value="feedback">
                <FeedbackManagement />
              </TabsContent>

              {/* Admin Tab */}
              <TabsContent value="admin">
                <AdminPanel />
              </TabsContent>
            </Tabs>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
