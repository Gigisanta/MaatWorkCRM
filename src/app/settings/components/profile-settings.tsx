"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Camera,
  Save,
  Loader2,
  UserCog,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { getRoleDisplayName } from "@/lib/auth/auth-helpers-client";
import { cn } from "@/lib/utils/utils";
import type { ProfileForm, PasswordForm } from "./types";
import { profileSchema, passwordSchema } from "./types";

interface ProfileSettingsProps {
  onUpdateProfile: (data: ProfileForm) => void;
  isUpdatingProfile: boolean;
  onChangePassword: (data: PasswordForm) => void;
  isChangingPassword: boolean;
  onRequestRoleChange: (requestedRole: string, reason?: string) => void;
  isRequestingRoleChange: boolean;
}

export function ProfileSettings({
  onUpdateProfile,
  isUpdatingProfile,
  onChangePassword,
  isChangingPassword,
  onRequestRoleChange,
  isRequestingRoleChange,
}: ProfileSettingsProps) {
  const { user } = useAuth();
  const [passwordModalOpen, setPasswordModalOpen] = React.useState(false);
  const [roleRequestDialogOpen, setRoleRequestDialogOpen] = React.useState(false);
  const [changingRoleValue, setChangingRoleValue] = React.useState<string>("");
  const [roleRequestReason, setRoleRequestReason] = React.useState<string>("");

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: "",
      bio: "",
    },
    values: user ? {
      name: user.name || "",
      email: user.email || "",
      phone: "",
      bio: "",
    } : undefined,
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <>
      <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
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
              <AvatarFallback className="bg-violet-500/20 text-violet-400 text-2xl">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button
                variant="outline"
                className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl text-slate-300"
                disabled
              >
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
          <form
            onSubmit={profileForm.handleSubmit(onUpdateProfile)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Nombre completo</Label>
                <Input
                  {...profileForm.register("name")}
                  className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
                  placeholder="Tu nombre"
                />
                {profileForm.formState.errors.name && (
                  <p className="text-xs text-red-400">
                    {profileForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Email</Label>
                <Input
                  {...profileForm.register("email")}
                  type="email"
                  className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
                  placeholder="tu@email.com"
                />
                {profileForm.formState.errors.email && (
                  <p className="text-xs text-red-400">
                    {profileForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Teléfono</Label>
                <Input
                  {...profileForm.register("phone")}
                  className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
                  placeholder="+52 55 1234 5678"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Rol</Label>
                <div className="flex gap-2">
                  <Input
                    value={getRoleDisplayName(user?.role || "member")}
                    disabled
                    className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-slate-400"
                  />
                  {user && !["owner", "admin", "developer", "dueno"].includes(user.role) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRoleRequestDialogOpen(true)}
                      className="bg-[#0E0F12]/80 backdrop-blur-sm border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 flex-shrink-0"
                    >
                      <UserCog className="h-4 w-4 mr-1" />
                      Solicitar cambio
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Biografía</Label>
              <Textarea
                {...profileForm.register("bio")}
                placeholder="Cuéntanos sobre ti..."
                className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white resize-none"
                rows={3}
              />
              {profileForm.formState.errors.bio && (
                <p className="text-xs text-red-400">
                  {profileForm.formState.errors.bio.message}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordModalOpen(true)}
                className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl text-slate-300"
              >
                Cambiar contraseña
              </Button>
              <Button
                type="submit"
                className="bg-violet-500 hover:bg-violet-600"
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? (
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

      {/* Change Password Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-white">Cambiar Contraseña</DialogTitle>
            <DialogDescription className="text-slate-400">
              Ingresa tu contraseña actual y la nueva
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={passwordForm.handleSubmit(onChangePassword)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label className="text-slate-300">Contraseña actual</Label>
              <Input
                {...passwordForm.register("currentPassword")}
                type="password"
                className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-xs text-red-400">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Nueva contraseña</Label>
              <Input
                {...passwordForm.register("newPassword")}
                type="password"
                className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-red-400">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Confirmar nueva contraseña</Label>
              <Input
                {...passwordForm.register("confirmPassword")}
                type="password"
                className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-red-400">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordModalOpen(false)}
                className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl text-slate-300"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-violet-500 hover:bg-violet-600"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Actualizar contraseña
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Role Request Dialog */}
      <Dialog open={roleRequestDialogOpen} onOpenChange={setRoleRequestDialogOpen}>
        <DialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-white">Solicitar Cambio de Rol</DialogTitle>
            <DialogDescription className="text-slate-400">
              Selecciona el rol al que deseas cambiar. Un administrador deberá aprobar tu solicitud.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Nuevo rol</Label>
              <Select
                onValueChange={(value) => setChangingRoleValue(value)}
                defaultValue={changingRoleValue}
              >
                <SelectTrigger className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent className="bg-[#0E0F12] border-white/8">
                  <SelectItem value="advisor" disabled={user?.role === "advisor"}>Asesor</SelectItem>
                  <SelectItem value="manager" disabled={user?.role === "manager"}>Gerente</SelectItem>
                  <SelectItem value="staff" disabled={user?.role === "staff"}>Personal</SelectItem>
                  <SelectItem value="member" disabled={user?.role === "member"}>Miembro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Razón (opcional)</Label>
              <Textarea
                placeholder="¿Por qué necesitas este cambio de rol?"
                value={roleRequestReason}
                onChange={(e) => setRoleRequestReason(e.target.value)}
                className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRoleRequestDialogOpen(false);
                setChangingRoleValue("");
                setRoleRequestReason("");
              }}
              className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-violet-500 hover:bg-violet-600"
              onClick={() => {
                if (changingRoleValue) {
                  onRequestRoleChange(changingRoleValue, roleRequestReason);
                  setChangingRoleValue("");
                  setRoleRequestReason("");
                }
              }}
              disabled={isRequestingRoleChange || !changingRoleValue}
            >
              {isRequestingRoleChange ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Enviar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
