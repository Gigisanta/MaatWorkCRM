"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  Building,
  Bell,
  Shield,
  Camera,
  Save,
  Loader2,
  Trash2,
  LogOut,
  UserPlus,
  X,
  AlertTriangle,
  Palette,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { canManageUsers, getRoleDisplayName, isManagerOrAdmin } from "@/lib/auth-helpers";
import { ThemeToggle, ThemePreviewCard } from "@/components/theme-toggle";

// ============================================
// Validation Schemas
// ============================================

const profileSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  bio: z.string().max(500, "La biografía no puede exceder 500 caracteres").optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  confirmPassword: z.string().min(1, "Confirma la nueva contraseña"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const organizationSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
});

const inviteMemberSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().optional(),
  role: z.enum(["owner", "admin", "member"]),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type OrganizationForm = z.infer<typeof organizationSchema>;
type InviteMemberForm = z.infer<typeof inviteMemberSchema>;

// ============================================
// Settings Page Component
// ============================================

export default function SettingsPage() {
  const { user, isLoading: authLoading, refreshSession } = useAuth();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  
  // UI State
  const [activeTab, setActiveTab] = React.useState("profile");
  const [passwordModalOpen, setPasswordModalOpen] = React.useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = React.useState(false);
  const [inviteMemberOpen, setInviteMemberOpen] = React.useState(false);
  const [removeMemberId, setRemoveMemberId] = React.useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  // Check if user is admin
  const isAdmin = user ? canManageUsers(user.role) : false;
  const isManagerOrAdminRole = user ? isManagerOrAdmin(user.role) : false;

  // ============================================
  // Data Fetching
  // ============================================

  // Fetch user settings
  const { data: userSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['userSettings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await fetch(`/api/users/${user.id}/settings`);
      if (!res.ok) throw new Error('Error al cargar configuración');
      return res.json();
    },
    enabled: !!user?.id,
  });

  // Fetch organization
  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ['organization', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return null;
      const res = await fetch(`/api/organizations/${user.organizationId}`);
      if (!res.ok) throw new Error('Error al cargar organización');
      return res.json();
    },
    enabled: !!user?.organizationId,
  });

  // Fetch sessions
  const { data: sessionsData, isLoading: sessionsLoading, refetch: refetchSessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await fetch('/api/sessions');
      if (!res.ok) throw new Error('Error al cargar sesiones');
      return res.json();
    },
    enabled: activeTab === 'security',
  });

  // ============================================
  // Mutations
  // ============================================

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      if (!user?.id) throw new Error('Usuario no encontrado');
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al actualizar perfil');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Perfil actualizado correctamente');
      refreshSession();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordForm) => {
      if (!user?.id) throw new Error('Usuario no encontrado');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al cambiar contraseña');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Contraseña actualizada correctamente');
      setPasswordModalOpen(false);
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Record<string, boolean>) => {
      if (!user?.id) throw new Error('Usuario no encontrado');
      const res = await fetch(`/api/users/${user.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailNotifications: settings.emailNotifications,
          pushNotifications: settings.pushNotifications,
          taskReminders: settings.taskReminders,
          goalProgressAlerts: settings.goalProgressAlerts,
          newLeadsNotifications: settings.newLeadsNotifications,
          theme,
        }),
      });
      if (!res.ok) throw new Error('Error al guardar preferencias');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Preferencias guardadas');
    },
  });

  // Update organization mutation
  const updateOrganizationMutation = useMutation({
    mutationFn: async (data: OrganizationForm) => {
      if (!user?.organizationId) throw new Error('Organización no encontrada');
      const res = await fetch(`/api/organizations/${user.organizationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Error al actualizar organización');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Organización actualizada');
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
  });

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: async (data: InviteMemberForm) => {
      if (!user?.organizationId) throw new Error('Organización no encontrada');
      const res = await fetch(`/api/organizations/${user.organizationId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al invitar miembro');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Miembro invitado correctamente');
      setInviteMemberOpen(false);
      inviteMemberForm.reset();
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberUserId: string) => {
      if (!user?.organizationId) throw new Error('Organización no encontrada');
      const res = await fetch(
        `/api/organizations/${user.organizationId}/members?userId=${memberUserId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al eliminar miembro');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Miembro eliminado');
      setRemoveMemberId(null);
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Logout other sessions mutation
  const logoutOthersMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/sessions/logout-others', { method: 'POST' });
      if (!res.ok) throw new Error('Error al cerrar sesiones');
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Sesiones cerradas');
      refetchSessions();
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuario no encontrado');
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar cuenta');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Cuenta eliminada');
      window.location.href = '/login';
    },
  });

  // ============================================
  // Forms
  // ============================================

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      bio: '',
    },
    values: user ? {
      name: user.name || '',
      email: user.email || '',
      phone: '',
      bio: '',
    } : undefined,
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const organizationForm = useForm<OrganizationForm>({
    resolver: zodResolver(organizationSchema),
    values: organization?.organization ? {
      name: organization.organization.name,
    } : undefined,
  });

  const inviteMemberForm = useForm<InviteMemberForm>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: '',
      name: '',
      role: 'member',
    },
  });

  // ============================================
  // Notification settings state
  // ============================================

  const [notificationSettings, setNotificationSettings] = React.useState({
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
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // ============================================
  // Helper Functions
  // ============================================

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const parseUserAgent = (userAgent: string | null) => {
    if (!userAgent) return { browser: 'Desconocido', os: 'Desconocido' };
    
    let browser = 'Desconocido';
    let os = 'Desconocido';
    
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    
    return { browser, os };
  };

  // ============================================
  // Render
  // ============================================

  return (
    <div className="min-h-screen gradient-bg">
      <AppSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      <div className={cn("transition-all duration-300", sidebarCollapsed ? "lg:pl-[80px]" : "lg:pl-[280px]")}>
        <AppHeader />
        <main className="p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Configuración</h1>
                <p className="text-slate-400 mt-1">
                  Gestiona tu cuenta y preferencias
                </p>
              </div>

              {/* Theme Selector */}
              <ThemeToggle variant="segmented" />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="glass border border-white/10 bg-transparent p-1">
                <TabsTrigger 
                  value="profile" 
                  className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400"
                >
                  <User className="h-4 w-4 mr-2" />
                  Perfil
                </TabsTrigger>
                <TabsTrigger 
                  value="organization"
                  className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400"
                >
                  <Building className="h-4 w-4 mr-2" />
                  Organización
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications"
                  className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notificaciones
                </TabsTrigger>
                <TabsTrigger 
                  value="security"
                  className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Seguridad
                </TabsTrigger>
                <TabsTrigger 
                  value="appearance"
                  className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400"
                >
                  <Palette className="h-4 w-4 mr-2" />
                  Apariencia
                </TabsTrigger>
              </TabsList>

              {/* ============================================ */}
              {/* Profile Tab */}
              {/* ============================================ */}
              <TabsContent value="profile">
                <Card className="glass border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Información Personal</CardTitle>
                    <CardDescription className="text-slate-400">
                      Actualiza tu información de perfil
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-6">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={user?.image || undefined} />
                        <AvatarFallback className="bg-indigo-500/20 text-indigo-400 text-2xl">
                          {getInitials(user?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Button variant="outline" className="glass border-white/10 text-slate-300" disabled>
                          <Camera className="h-4 w-4 mr-2" />
                          Cambiar foto
                        </Button>
                        <p className="text-xs text-slate-500 mt-2">
                          JPG, PNG o GIF. Máximo 2MB.
                        </p>
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Profile Form */}
                    <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-slate-300">Nombre completo</Label>
                          <Input 
                            {...profileForm.register('name')}
                            className="glass border-white/10 bg-white/5 text-white"
                            placeholder="Tu nombre"
                          />
                          {profileForm.formState.errors.name && (
                            <p className="text-xs text-red-400">{profileForm.formState.errors.name.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-300">Email</Label>
                          <Input 
                            {...profileForm.register('email')}
                            type="email"
                            className="glass border-white/10 bg-white/5 text-white"
                            placeholder="tu@email.com"
                          />
                          {profileForm.formState.errors.email && (
                            <p className="text-xs text-red-400">{profileForm.formState.errors.email.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-300">Teléfono</Label>
                          <Input 
                            {...profileForm.register('phone')}
                            className="glass border-white/10 bg-white/5 text-white"
                            placeholder="+52 55 1234 5678"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-300">Rol</Label>
                          <Input 
                            value={getRoleDisplayName(user?.role || 'member')}
                            disabled
                            className="glass border-white/10 bg-white/5 text-slate-400"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300">Biografía</Label>
                        <Textarea 
                          {...profileForm.register('bio')}
                          placeholder="Cuéntanos sobre ti..."
                          className="glass border-white/10 bg-white/5 text-white resize-none"
                          rows={3}
                        />
                        {profileForm.formState.errors.bio && (
                          <p className="text-xs text-red-400">{profileForm.formState.errors.bio.message}</p>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setPasswordModalOpen(true)}
                          className="glass border-white/10 text-slate-300"
                        >
                          Cambiar contraseña
                        </Button>
                        <Button 
                          type="submit"
                          className="bg-indigo-500 hover:bg-indigo-600"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Guardar cambios
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ============================================ */}
              {/* Organization Tab */}
              {/* ============================================ */}
              <TabsContent value="organization">
                <div className="space-y-6">
                  <Card className="glass border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Organización</CardTitle>
                      <CardDescription className="text-slate-400">
                        Información de tu organización
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {orgLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                        </div>
                      ) : organization?.organization ? (
                        <form 
                          onSubmit={organizationForm.handleSubmit((data) => updateOrganizationMutation.mutate(data))} 
                          className="space-y-6"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-slate-300">Nombre</Label>
                              <Input 
                                {...organizationForm.register('name')}
                                disabled={!isAdmin}
                                className="glass border-white/10 bg-white/5 text-white"
                              />
                              {organizationForm.formState.errors.name && (
                                <p className="text-xs text-red-400">{organizationForm.formState.errors.name.message}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">Slug</Label>
                              <Input 
                                value={organization.organization.slug}
                                disabled
                                className="glass border-white/10 bg-white/5 text-slate-400"
                              />
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="flex justify-end">
                              <Button 
                                type="submit"
                                className="bg-indigo-500 hover:bg-indigo-600"
                                disabled={updateOrganizationMutation.isPending}
                              >
                                {updateOrganizationMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4 mr-2" />
                                )}
                                Guardar cambios
                              </Button>
                            </div>
                          )}
                        </form>
                      ) : (
                        <p className="text-slate-400">No hay organización configurada</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="glass border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Miembros del Equipo</CardTitle>
                      <CardDescription className="text-slate-400">
                        Gestiona los miembros de tu organización
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                        {organization?.organization?.members?.map((member: {
                          id: string;
                          role: string;
                          createdAt: string;
                          user: {
                            id: string;
                            name: string | null;
                            email: string;
                            image: string | null;
                            role: string;
                            isActive: boolean;
                          };
                        }) => (
                          <div key={member.id} className="flex items-center justify-between p-3 rounded-lg glass border border-white/10">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={member.user.image || undefined} />
                                <AvatarFallback className="bg-indigo-500/20 text-indigo-400">
                                  {getInitials(member.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-white">{member.user.name || 'Sin nombre'}</p>
                                <p className="text-sm text-slate-400">{member.user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge 
                                variant="outline"
                                className={cn(
                                  member.role === "owner" && "border-amber-500/30 text-amber-400",
                                  member.role === "admin" && "border-violet-500/30 text-violet-400",
                                  member.role === "member" && "border-slate-500/30 text-slate-400"
                                )}
                              >
                                {member.role === "owner" ? "Propietario" : 
                                 member.role === "admin" ? "Admin" : "Miembro"}
                              </Badge>
                              {isAdmin && member.user.id !== user?.id && member.role !== 'owner' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setRemoveMemberId(member.user.id)}
                                  className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {isAdmin && (
                        <Button 
                          variant="outline" 
                          className="mt-4 glass border-white/10 text-slate-300"
                          onClick={() => setInviteMemberOpen(true)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invitar miembro
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ============================================ */}
              {/* Notifications Tab */}
              {/* ============================================ */}
              <TabsContent value="notifications">
                <Card className="glass border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Preferencias de Notificación</CardTitle>
                    <CardDescription className="text-slate-400">
                      Elige qué notificaciones quieres recibir
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {settingsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {[
                          { key: "emailNotifications", label: "Notificaciones por email", description: "Recibe actualizaciones importantes por correo" },
                          { key: "pushNotifications", label: "Notificaciones push", description: "Recibe alertas en tiempo real" },
                          { key: "taskReminders", label: "Recordatorios de tareas", description: "Alertas de tareas vencidas y próximas" },
                          { key: "goalProgressAlerts", label: "Alertas de objetivos", description: "Actualizaciones de progreso de objetivos" },
                          { key: "newLeadsNotifications", label: "Nuevos leads", description: "Cuando se asignan nuevos contactos" },
                        ].map((item) => (
                          <div key={item.key} className="flex items-center justify-between p-4 rounded-lg glass border border-white/10">
                            <div>
                              <p className="font-medium text-white">{item.label}</p>
                              <p className="text-sm text-slate-400">{item.description}</p>
                            </div>
                            <Switch
                              checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                              onCheckedChange={(checked) => handleNotificationChange(item.key, checked)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ============================================ */}
              {/* Security Tab */}
              {/* ============================================ */}
              <TabsContent value="security">
                <div className="space-y-6">
                  <Card className="glass border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Sesiones Activas</CardTitle>
                      <CardDescription className="text-slate-400">
                        Dispositivos donde has iniciado sesión
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {sessionsLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sessionsData?.sessions?.length > 0 ? (
                            <>
                              {sessionsData.sessions.map((session: {
                                id: string;
                                ipAddress?: string | null;
                                userAgent?: string | null;
                                createdAt: string;
                                isCurrent: boolean;
                              }) => {
                                const { browser, os } = parseUserAgent(session.userAgent);
                                return (
                                  <div 
                                    key={session.id} 
                                    className={cn(
                                      "flex items-center justify-between p-3 rounded-lg glass border",
                                      session.isCurrent 
                                        ? "border-emerald-500/30" 
                                        : "border-white/10"
                                    )}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        session.isCurrent ? "bg-emerald-500" : "bg-slate-400"
                                      )} />
                                      <div>
                                        <p className="text-sm font-medium text-white">
                                          {browser} en {os}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                          {session.ipAddress || 'IP desconocida'} • 
                                          {' '}{new Date(session.createdAt).toLocaleDateString('es-MX', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                    {session.isCurrent && (
                                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                                        Sesión actual
                                      </Badge>
                                    )}
                                  </div>
                                );
                              })}
                              {sessionsData.sessions.length > 1 && (
                                <Button
                                  variant="outline"
                                  className="mt-4 glass border-white/10 text-slate-300"
                                  onClick={() => logoutOthersMutation.mutate()}
                                  disabled={logoutOthersMutation.isPending}
                                >
                                  {logoutOthersMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <LogOut className="h-4 w-4 mr-2" />
                                  )}
                                  Cerrar otras sesiones
                                </Button>
                              )}
                            </>
                          ) : (
                            <p className="text-slate-400 text-center py-4">No hay sesiones activas</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="glass border-white/10 border-rose-500/30">
                    <CardHeader>
                      <CardTitle className="text-rose-400 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Zona de Peligro
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Acciones irreversibles
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg bg-rose-500/5 border border-rose-500/20">
                        <div>
                          <p className="text-white font-medium">Eliminar cuenta</p>
                          <p className="text-sm text-slate-400">
                            Esta acción es permanente y no se puede deshacer
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          className="glass border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                          onClick={() => setDeleteAccountOpen(true)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar mi cuenta
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ============================================ */}
              {/* Appearance Tab */}
              {/* ============================================ */}
              <TabsContent value="appearance">
                <div className="space-y-6">
                  <Card className="glass border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Tema de la Interfaz</CardTitle>
                      <CardDescription className="text-slate-400">
                        Elige cómo quieres que se vea MaatWork CRM
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Theme Preview Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <ThemePreviewCard
                          themeMode="light"
                          isActive={theme === 'light'}
                          onClick={() => setTheme('light')}
                        />
                        <ThemePreviewCard
                          themeMode="dark"
                          isActive={theme === 'dark'}
                          onClick={() => setTheme('dark')}
                        />
                        <ThemePreviewCard
                          themeMode="system"
                          isActive={theme === 'system'}
                          onClick={() => setTheme('system')}
                        />
                      </div>

                      <Separator className="bg-white/10" />

                      {/* Theme Info */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-white">Información del tema</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="p-3 rounded-lg glass border border-white/10">
                            <p className="text-slate-400">Tema seleccionado</p>
                            <p className="text-white font-medium capitalize">
                              {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Sistema'}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg glass border border-white/10">
                            <p className="text-slate-400">Tema activo</p>
                            <p className="text-white font-medium">
                              {theme === 'system' 
                                ? 'Según preferencia del sistema' 
                                : theme === 'light' 
                                  ? 'Modo claro' 
                                  : 'Modo oscuro'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-white/10" />

                      {/* Tips */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-white">Consejos</h4>
                        <ul className="text-sm text-slate-400 space-y-2">
                          <li className="flex items-start gap-2">
                            <span className="text-indigo-400 mt-0.5">•</span>
                            El modo oscuro es ideal para trabajar en ambientes con poca luz
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-indigo-400 mt-0.5">•</span>
                            El modo claro ofrece mejor legibilidad en ambientes luminosos
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-indigo-400 mt-0.5">•</span>
                            La opción "Sistema" adapta automáticamente el tema según la configuración de tu dispositivo
                          </li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Accent Color Card */}
                  <Card className="glass border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Color de Acento</CardTitle>
                      <CardDescription className="text-slate-400">
                        Personaliza el color principal de la interfaz
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { name: 'Indigo', color: '#6366f1', active: true },
                          { name: 'Violet', color: '#8b5cf6', active: false },
                          { name: 'Blue', color: '#3b82f6', active: false },
                          { name: 'Emerald', color: '#10b981', active: false },
                          { name: 'Rose', color: '#f43f5e', active: false },
                        ].map((accent) => (
                          <button
                            key={accent.name}
                            className={cn(
                              "w-10 h-10 rounded-full border-2 transition-all hover:scale-110",
                              accent.active ? "border-white ring-2 ring-white/30" : "border-transparent"
                            )}
                            style={{ backgroundColor: accent.color }}
                            title={accent.name}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-3">
                        * Los colores de acento personalizados estarán disponibles próximamente
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </main>
      </div>

      {/* ============================================ */}
      {/* Change Password Modal */}
      {/* ============================================ */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="glass border-white/10 bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-white">Cambiar Contraseña</DialogTitle>
            <DialogDescription className="text-slate-400">
              Ingresa tu contraseña actual y la nueva
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={passwordForm.handleSubmit((data) => changePasswordMutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Contraseña actual</Label>
              <Input 
                {...passwordForm.register('currentPassword')}
                type="password"
                className="glass border-white/10 bg-white/5 text-white"
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-xs text-red-400">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Nueva contraseña</Label>
              <Input 
                {...passwordForm.register('newPassword')}
                type="password"
                className="glass border-white/10 bg-white/5 text-white"
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-red-400">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Confirmar nueva contraseña</Label>
              <Input 
                {...passwordForm.register('confirmPassword')}
                type="password"
                className="glass border-white/10 bg-white/5 text-white"
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-red-400">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordModalOpen(false)}
                className="glass border-white/10 text-slate-300"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                className="bg-indigo-500 hover:bg-indigo-600"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Actualizar contraseña
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* Invite Member Modal */}
      {/* ============================================ */}
      <Dialog open={inviteMemberOpen} onOpenChange={setInviteMemberOpen}>
        <DialogContent className="glass border-white/10 bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-white">Invitar Miembro</DialogTitle>
            <DialogDescription className="text-slate-400">
              Invita un nuevo miembro a la organización
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={inviteMemberForm.handleSubmit((data) => inviteMemberMutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Email</Label>
              <Input 
                {...inviteMemberForm.register('email')}
                type="email"
                placeholder="email@ejemplo.com"
                className="glass border-white/10 bg-white/5 text-white"
              />
              {inviteMemberForm.formState.errors.email && (
                <p className="text-xs text-red-400">{inviteMemberForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Nombre (opcional)</Label>
              <Input 
                {...inviteMemberForm.register('name')}
                placeholder="Nombre del invitado"
                className="glass border-white/10 bg-white/5 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Rol</Label>
              <Select 
                onValueChange={(value) => inviteMemberForm.setValue('role', value as 'owner' | 'admin' | 'member')}
                defaultValue={inviteMemberForm.getValues('role')}
              >
                <SelectTrigger className="glass border-white/10 bg-white/5 text-white">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  <SelectItem value="member">Miembro</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Propietario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteMemberOpen(false)}
                className="glass border-white/10 text-slate-300"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                className="bg-indigo-500 hover:bg-indigo-600"
                disabled={inviteMemberMutation.isPending}
              >
                {inviteMemberMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Invitar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* Remove Member Confirmation */}
      {/* ============================================ */}
      <AlertDialog open={!!removeMemberId} onOpenChange={() => setRemoveMemberId(null)}>
        <AlertDialogContent className="glass border-white/10 bg-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Eliminar Miembro</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              ¿Estás seguro de que deseas eliminar este miembro de la organización? 
              Perderá acceso a todos los recursos compartidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass border-white/10 text-slate-300">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => removeMemberId && removeMemberMutation.mutate(removeMemberId)}
            >
              {removeMemberMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============================================ */}
      {/* Delete Account Confirmation */}
      {/* ============================================ */}
      <AlertDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <AlertDialogContent className="glass border-rose-500/30 bg-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-400">Eliminar Cuenta</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Esta acción es permanente y no se puede deshacer. Se eliminarán todos tus datos,
              incluyendo contactos, tareas y notas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass border-white/10 text-slate-300">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => deleteAccountMutation.mutate()}
            >
              {deleteAccountMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Eliminar mi cuenta'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
