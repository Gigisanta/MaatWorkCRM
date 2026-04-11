"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  UserPlus,
  UserCog,
  X,
  CheckCircle2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils/utils";
import type { OrganizationForm, InviteMemberForm, OrganizationMember } from "./types";
import { organizationSchema, inviteMemberSchema } from "./types";

interface OrganizationSettingsProps {
  organization: {
    organization?: {
      id: string;
      name: string;
      slug: string;
      members?: OrganizationMember[];
    };
  } | null;
  isLoading: boolean;
  isAdmin: boolean;
  currentUserId: string | undefined;
  onUpdateOrganization: (data: OrganizationForm) => void;
  isUpdatingOrganization: boolean;
  onInviteMember: (data: InviteMemberForm) => void;
  isInvitingMember: boolean;
  onRemoveMember: (memberUserId: string) => void;
  isRemovingMember: boolean;
}

export function OrganizationSettings({
  organization,
  isLoading,
  isAdmin,
  currentUserId,
  onUpdateOrganization,
  isUpdatingOrganization,
  onInviteMember,
  isInvitingMember,
  onRemoveMember,
  isRemovingMember,
}: OrganizationSettingsProps) {
  const [inviteMemberOpen, setInviteMemberOpen] = React.useState(false);
  const [removeMemberId, setRemoveMemberId] = React.useState<string | null>(null);
  const [changingRoleFor, setChangingRoleFor] = React.useState<string | null>(null);
  const [changingRoleValue, setChangingRoleValue] = React.useState<string>("");

  const organizationForm = useForm<OrganizationForm>({
    resolver: zodResolver(organizationSchema),
    values: organization?.organization
      ? { name: organization.organization.name }
      : undefined,
  });

  const inviteMemberForm = useForm<InviteMemberForm>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      name: "",
      role: "member",
    },
  });

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Organization Info Card */}
      <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
        <CardHeader>
          <CardTitle className="text-white">Organización</CardTitle>
          <CardDescription className="text-slate-400">
            Información de tu organización
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
            </div>
          ) : organization?.organization ? (
            <form
              onSubmit={organizationForm.handleSubmit(onUpdateOrganization)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-300">Nombre</Label>
                  <Input
                    {...organizationForm.register("name")}
                    disabled={!isAdmin}
                    className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
                  />
                  {organizationForm.formState.errors.name && (
                    <p className="text-xs text-red-400">
                      {organizationForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Slug</Label>
                  <Input
                    value={organization.organization.slug}
                    disabled
                    className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-slate-400"
                  />
                </div>
              </div>
              {isAdmin && (
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-violet-500 hover:bg-violet-600"
                    disabled={isUpdatingOrganization}
                  >
                    {isUpdatingOrganization ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
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

      {/* Team Members Card */}
      <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
        <CardHeader>
          <CardTitle className="text-white">Miembros del Equipo</CardTitle>
          <CardDescription className="text-slate-400">
            Gestiona los miembros de tu organización
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
            {organization?.organization?.members?.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg glass border border-white/8"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.user.image || undefined} />
                    <AvatarFallback className="bg-violet-500/20 text-violet-400">
                      {getInitials(member.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-white">
                      {member.user.name || "Sin nombre"}
                    </p>
                    <p className="text-sm text-slate-400">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isAdmin &&
                  currentUserId !== member.user.id &&
                  member.role !== "owner" &&
                  changingRoleFor === member.user.id ? (
                    <div className="flex items-center gap-2">
                      <Select
                        value={changingRoleValue}
                        onValueChange={setChangingRoleValue}
                      >
                        <SelectTrigger className="h-8 w-[140px] bg-[#0E0F12]/80 border-white/8 rounded-lg bg-white/5 text-white text-sm">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0E0F12] border-white/8">
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Gerente</SelectItem>
                          <SelectItem value="advisor">Asesor</SelectItem>
                          <SelectItem value="staff">Personal</SelectItem>
                          <SelectItem value="member">Miembro</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        className="h-8 bg-violet-500 hover:bg-violet-600 text-white"
                        disabled
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-slate-400 hover:text-slate-300"
                        onClick={() => {
                          setChangingRoleFor(null);
                          setChangingRoleValue("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Badge
                        variant="outline"
                        className={cn(
                          member.role === "owner" &&
                            "border-amber-500/30 text-amber-400",
                          member.role === "admin" &&
                            "border-violet-500/30 text-violet-400",
                          member.role === "member" &&
                            "border-slate-500/30 text-slate-400"
                        )}
                      >
                        {member.role === "owner"
                          ? "Propietario"
                          : member.role === "admin"
                            ? "Admin"
                            : "Miembro"}
                      </Badge>
                      {isAdmin &&
                        currentUserId !== member.user.id &&
                        member.role !== "owner" && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setChangingRoleFor(member.user.id);
                                setChangingRoleValue(member.role);
                              }}
                              className="text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 h-8 w-8 p-0"
                            >
                              <UserCog className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRemoveMemberId(member.user.id)}
                              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          {isAdmin && (
            <Button
              variant="outline"
              className="mt-4 bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl text-slate-300"
              onClick={() => setInviteMemberOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invitar miembro
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Invite Member Modal */}
      <Dialog open={inviteMemberOpen} onOpenChange={setInviteMemberOpen}>
        <DialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-white">Invitar Miembro</DialogTitle>
            <DialogDescription className="text-slate-400">
              Invita un nuevo miembro a la organización
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={inviteMemberForm.handleSubmit(onInviteMember)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label className="text-slate-300">Email</Label>
              <Input
                {...inviteMemberForm.register("email")}
                type="email"
                placeholder="email@ejemplo.com"
                className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
              />
              {inviteMemberForm.formState.errors.email && (
                <p className="text-xs text-red-400">
                  {inviteMemberForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Nombre (opcional)</Label>
              <Input
                {...inviteMemberForm.register("name")}
                placeholder="Nombre del invitado"
                className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Rol</Label>
              <Select
                onValueChange={(value) =>
                  inviteMemberForm.setValue("role", value as "owner" | "admin" | "member")
                }
                defaultValue={inviteMemberForm.getValues("role")}
              >
                <SelectTrigger className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent className="bg-[#0E0F12] border-white/8">
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
                className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl text-slate-300"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-violet-500 hover:bg-violet-600"
                disabled={isInvitingMember}
              >
                {isInvitingMember ? (
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

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!removeMemberId} onOpenChange={() => setRemoveMemberId(null)}>
        <AlertDialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Eliminar Miembro</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              ¿Estás seguro de que deseas eliminar este miembro de la organización?
              Perderá acceso a todos los recursos compartidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl text-slate-300">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                if (removeMemberId) {
                  onRemoveMember(removeMemberId);
                }
              }}
            >
              {isRemovingMember ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
