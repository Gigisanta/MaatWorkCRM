"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  User,
  Mail,
  Phone,
  Shield,
  Briefcase,
  Users,
  Calendar,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { UserWithTeams } from "@/types/auth"

interface Manager {
  id: string
  name: string | null
  email: string
}

interface ManagersResponse {
  managers: Manager[]
}

interface UserDetailDrawerProps {
  user: UserWithTeams | null
  open: boolean
  onClose: () => void
  onUserUpdated: () => void
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Administrador" },
  { value: "manager", label: "Gestor" },
  { value: "advisor", label: "Asesor" },
  { value: "staff", label: "Staff" },
  { value: "member", label: "Miembro" },
]

const CAREER_LEVEL_OPTIONS = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
]

export function UserDetailDrawer({
  user,
  open,
  onClose,
  onUserUpdated,
}: UserDetailDrawerProps) {
  const queryClient = useQueryClient()

  // Form state for editable fields
  const [role, setRole] = React.useState("")
  const [careerLevel, setCareerLevel] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [managerId, setManagerId] = React.useState<string>("")
  const [isDirty, setIsDirty] = React.useState(false)

  // Toggle active state
  const [isToggleActive, setIsToggleActive] = React.useState(false)

  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Fetch managers for dropdown
  const { data: managersData } = useQuery<ManagersResponse>({
    queryKey: ["managers"],
    queryFn: async () => {
      const res = await fetch("/api/auth/managers")
      if (!res.ok) throw new Error("Failed to fetch managers")
      return res.json()
    },
  })

  // Sync form state when user changes
  React.useEffect(() => {
    if (user) {
      setRole(user.role || "")
      setCareerLevel(user.careerLevel || "")
      setPhone(user.phone || "")
      setManagerId(user.manager?.id || "")
      setIsDirty(false)
    }
  }, [user])

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      if (!user) return
      const res = await fetch(`/api/admin/users/${user.id}/activate`, {
        method: "PUT",
      })
      if (!res.ok) throw new Error("Failed to toggle active status")
      return res.json()
    },
    onSuccess: () => {
      onUserUpdated()
    },
  })

  // Update user mutation (general fields)
  const updateUserMutation = useMutation({
    mutationFn: async (data: { role?: string; careerLevel?: string; phone?: string }) => {
      if (!user) return
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update user")
      return res.json()
    },
    onSuccess: () => {
      onUserUpdated()
      setIsDirty(false)
    },
  })

  // Update manager mutation
  const updateManagerMutation = useMutation({
    mutationFn: async (newManagerId: string) => {
      if (!user) return
      const res = await fetch(`/api/admin/users/${user.id}/manager`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId: newManagerId || null }),
      })
      if (!res.ok) throw new Error("Failed to update manager")
      return res.json()
    },
    onSuccess: () => {
      onUserUpdated()
    },
  })

  // Remove from team mutation
  const removeFromTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      if (!user) return
      const res = await fetch(
        `/api/admin/teams/${teamId}/members?userId=${user.id}`,
        { method: "DELETE" }
      )
      if (!res.ok) throw new Error("Failed to remove from team")
      return res.json()
    },
    onSuccess: () => {
      onUserUpdated()
    },
  })

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      if (!user) return
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete user")
      return res.json()
    },
    onSuccess: () => {
      setShowDeleteDialog(false)
      setIsDeleting(false)
      onUserUpdated()
      onClose()
    },
  })

  const handleFieldChange = (
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => (value: string) => {
    setter(value)
    setIsDirty(true)
  }

  const handleSaveChanges = () => {
    updateUserMutation.mutate({
      role,
      careerLevel,
      phone,
    })
  }

  const handleManagerChange = (newManagerId: string) => {
    setManagerId(newManagerId)
    updateManagerMutation.mutate(newManagerId === "none" ? "" : newManagerId)
  }

  const handleToggleActive = () => {
    setIsToggleActive(true)
    toggleActiveMutation.mutate()
  }

  const handleRemoveFromTeam = (teamId: string) => {
    removeFromTeamMutation.mutate(teamId)
  }

  const handleDelete = () => {
    setIsDeleting(true)
    deleteUserMutation.mutate()
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (!user) return null

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-sm bg-[#0E0F12] border-white/8 overflow-y-auto"
      >
        <SheetHeader className="space-y-0 pb-6">
          {/* Avatar + Name + Email + Created */}
          <div className="flex flex-col items-center text-center py-6">
            <div className="relative mb-4">
              <div className="size-20 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-violet-500/20">
                {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
              </div>
              <div
                className={`absolute bottom-0 right-0 size-4 rounded-full border-2 border-[#0E0F12] ${
                  user.isActive ? "bg-[#4ADE80]" : "bg-[#F87171]"
                }`}
              />
            </div>
            <h2 className="text-xl font-bold text-white">{user.name || "Sin nombre"}</h2>
            <p className="text-sm text-slate-400 mt-1">{user.email}</p>
            <p className="text-xs text-slate-500 mt-2">
              Creado el {formatDate(user.createdAt)}
            </p>
            <div className="mt-3">
              {user.isActive ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4ADE80]/10 text-[#4ADE80] text-xs font-medium border border-[#4ADE80]/20">
                  <CheckCircle2 className="size-3" />
                  Activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F87171]/10 text-[#F87171] text-xs font-medium border border-[#F87171]/20">
                  <XCircle className="size-3" />
                  Inactivo
                </span>
              )}
            </div>
          </div>
          <SheetTitle className="sr-only">Detalle de usuario</SheetTitle>
          <SheetDescription className="sr-only">
            Ver y editar detalles del usuario
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-1">
          {/* Toggle Active/Inactive */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Shield className="size-4" />
              Estado de cuenta
            </h3>
            <Button
              variant={user.isActive ? "outline" : "success"}
              size="sm"
              className="w-full"
              onClick={handleToggleActive}
              disabled={toggleActiveMutation.isPending}
            >
              {toggleActiveMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Procesando...
                </>
              ) : user.isActive ? (
                "Desactivar cuenta"
              ) : (
                "Activar cuenta"
              )}
            </Button>
          </section>

          {/* Editable Fields */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="size-4" />
              Informacion personal
            </h3>

            {/* Rol del sistema */}
            <div className="space-y-2">
              <label className="text-xs text-slate-500">Rol del sistema</label>
              <Select value={role} onValueChange={handleFieldChange(setRole)}>
                <SelectTrigger className="w-full bg-[#0E0F12] border-white/10">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent className="bg-[#1C1D21] border-white/10">
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nivel de carrera */}
            <div className="space-y-2">
              <label className="text-xs text-slate-500">Nivel de carrera</label>
              <Select
                value={careerLevel}
                onValueChange={handleFieldChange(setCareerLevel)}
              >
                <SelectTrigger className="w-full bg-[#0E0F12] border-white/10">
                  <SelectValue placeholder="Seleccionar nivel" />
                </SelectTrigger>
                <SelectContent className="bg-[#1C1D21] border-white/10">
                  {CAREER_LEVEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Telefono */}
            <div className="space-y-2">
              <label className="text-xs text-slate-500">Telefono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => handleFieldChange(setPhone)(e.target.value)}
                  placeholder="+34 600 000 000"
                  className="pl-10 bg-[#0E0F12] border-white/10"
                />
              </div>
            </div>

            {/* Manager */}
            <div className="space-y-2">
              <label className="text-xs text-slate-500">Manager</label>
              <Select value={managerId} onValueChange={handleManagerChange}>
                <SelectTrigger className="w-full bg-[#0E0F12] border-white/10">
                  <SelectValue placeholder="Sin manager" />
                </SelectTrigger>
                <SelectContent className="bg-[#1C1D21] border-white/10">
                  <SelectItem value="none">Sin manager</SelectItem>
                  {managersData?.managers.map((mgr) => (
                    <SelectItem key={mgr.id} value={mgr.id}>
                      {mgr.name || mgr.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Save button */}
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={handleSaveChanges}
              disabled={!isDirty || updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </section>

          {/* Team Memberships */}
          {user.teamMembers && user.teamMembers.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="size-4" />
                Equipos
              </h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {user.teamMembers.map((tm) => (
                    <motion.div
                      key={tm.team.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/8"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {tm.team.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-xs border border-violet-500/20">
                            {tm.role}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="size-3" />
                            {formatDate(tm.joinedAt)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        className="text-slate-400 hover:text-rose-400 shrink-0"
                        onClick={() => handleRemoveFromTeam(tm.team.id)}
                        disabled={removeFromTeamMutation.isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* Danger Zone */}
          <section
            className="space-y-3 p-4 rounded-xl border border-rose-500/30 bg-rose-500/5"
          >
            <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <Trash2 className="size-4" />
              Zona de peligro
            </h3>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full">
                  Eliminar usuario
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#1C1D21] border-white/10">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">
                    Eliminar usuario
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    Esta accion no se puede deshacer. El usuario{" "}
                    <span className="text-white font-medium">{user.name || user.email}</span>{" "}
                    sera eliminado permanentemente junto con todos sus datos
                    asociados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting || deleteUserMutation.isPending}
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    {isDeleting || deleteUserMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      "Eliminar definitivamente"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/8">
          <p className="text-xs text-slate-500 text-center">
            ID: {user.id}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}