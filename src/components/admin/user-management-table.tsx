"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Users,
  UserX,
  UserCheck,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { getRoleDisplayName } from "@/lib/auth/auth-helpers-client";
import { type UserWithTeams } from "@/types/auth";

// UserWithTeams with createdAt (from Prisma User model)
type UserWithTeamsAndDate = UserWithTeams & { createdAt: Date };

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface UserManagementTableProps {
  onUserSelect: (user: UserWithTeams) => void;
}

interface UsersResponse {
  users: UserWithTeams[];
  total: number;
  page: number;
  limit: number;
}

const ROLE_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "admin", label: "Administrador" },
  { value: "owner", label: "Dueño" },
  { value: "manager", label: "Gerente" },
  { value: "advisor", label: "Asesor" },
  { value: "staff", label: "Personal" },
  { value: "member", label: "Miembro" },
];

const SYSTEM_ROLES = ["admin", "owner", "manager", "advisor", "staff", "member", "developer", "dueno", "asesor"];

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function UserAvatar({
  name,
  image,
  className,
}: {
  name: string | null;
  image?: string | null;
  className?: string;
}) {
  if (image) {
    return (
      <img
        src={image}
        alt={name || "User"}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 flex items-center justify-center text-[#A78BFA] font-semibold text-xs",
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}

function getSystemRoleBadgeVariant(
  role: string
): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "muted" {
  const roleLower = role.toLowerCase();
  if (roleLower === "admin" || roleLower === "developer") return "destructive";
  if (roleLower === "owner" || roleLower === "dueno") return "warning";
  if (roleLower === "manager") return "info";
  if (roleLower === "advisor" || roleLower === "asesor") return "default";
  if (roleLower === "staff") return "secondary";
  return "muted";
}

function getOrgRoleBadgeVariant(
  role: string | undefined
): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "muted" {
  if (!role) return "muted";
  const roleLower = role.toLowerCase();
  if (roleLower === "owner") return "warning";
  if (roleLower === "manager") return "info";
  if (roleLower === "member") return "secondary";
  return "muted";
}

export function UserManagementTable({ onUserSelect }: UserManagementTableProps) {
  const queryClient = useQueryClient();

  // Filters state
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);

  // Selection state
  const [selectedUsers, setSelectedUsers] = React.useState<Set<string>>(new Set());

  // Debounced search
  const debouncedSearch = useDebounce(search, 300);

  // Build query params
  const queryParams = React.useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (roleFilter !== "all") params.set("role", roleFilter);
    if (statusFilter === "active") params.set("isActive", "true");
    else if (statusFilter === "inactive") params.set("isActive", "false");
    return params.toString();
  }, [page, limit, debouncedSearch, roleFilter, statusFilter]);

  // Fetch users
  const { data, isLoading, error } = useQuery<UsersResponse>({
    queryKey: ["admin-users", queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // Bulk activate/deactivate mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({
      userIds,
      action,
    }: {
      userIds: string[];
      action: "activate" | "deactivate";
    }) => {
      const res = await fetch("/api/admin/users/bulk-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds, action }),
      });
      if (!res.ok) throw new Error("Bulk action failed");
      return res.json();
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setSelectedUsers(new Set());
      toast.success(
        action === "activate"
          ? "Usuarios activados correctamente"
          : "Usuarios desactivados correctamente"
      );
    },
    onError: () => {
      toast.error("Error al realizar la acción");
    },
  });

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, statusFilter]);

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  // Toggle all selection
  const toggleAllSelection = () => {
    if (!data?.users) return;
    if (selectedUsers.size === data.users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(data.users.map((u) => u.id)));
    }
  };

  // Handle bulk activate
  const handleBulkActivate = () => {
    bulkActionMutation.mutate({
      userIds: Array.from(selectedUsers),
      action: "activate",
    });
  };

  // Handle bulk deactivate
  const handleBulkDeactivate = () => {
    bulkActionMutation.mutate({
      userIds: Array.from(selectedUsers),
      action: "deactivate",
    });
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;
  const users = data?.users ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#666666]" />
          <Input
            type="search"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Role Filter */}
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-[#1C1D21]/80 border border-white/10 rounded-lg p-1">
          <Button
            variant={statusFilter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className={cn(
              "h-7 px-3 text-xs",
              statusFilter === "all" && "bg-[#8B5CF6] text-white"
            )}
          >
            Todos
          </Button>
          <Button
            variant={statusFilter === "active" ? "success" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("active")}
            className={cn(
              "h-7 px-3 text-xs",
              statusFilter === "active" && "bg-[#4ADE80]/20 text-[#4ADE80] border border-[#4ADE80]/30"
            )}
          >
            Activos
          </Button>
          <Button
            variant={statusFilter === "inactive" ? "destructive" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("inactive")}
            className={cn(
              "h-7 px-3 text-xs",
              statusFilter === "inactive" && "bg-[#F87171]/20 text-[#F87171] border border-[#F87171]/30"
            )}
          >
            Inactivos
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <MoreHorizontal className="size-4" />
                {selectedUsers.size} seleccionados
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Acciones masivas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleBulkActivate}
                disabled={bulkActionMutation.isPending}
                className="gap-2"
              >
                <UserCheck className="size-4 text-[#4ADE80]" />
                Activar seleccionados
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleBulkDeactivate}
                disabled={bulkActionMutation.isPending}
                className="gap-2"
              >
                <UserX className="size-4 text-[#F87171]" />
                Desactivar seleccionados
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/8 hover:bg-transparent">
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={users.length > 0 && selectedUsers.size === users.length}
                  onChange={toggleAllSelection}
                  className="rounded border-white/20 bg-transparent"
                />
              </TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol sistema</TableHead>
              <TableHead>Rol org.</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead className="text-center">Equipos</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: limit }).map((_, i) => (
                <TableRow key={i} className="border-white/5">
                  <TableCell>
                    <Skeleton className="h-4 w-4 rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex flex-col gap-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="h-4 w-8 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-[#F87171] py-8">
                  Error al cargar los usuarios
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="bg-[#8B5CF6]/10 p-4 rounded-2xl mb-4">
                      <Users className="size-8 text-[#8B5CF6]/60" />
                    </div>
                    <p className="text-white font-medium mb-1">No se encontraron usuarios</p>
                    <p className="text-sm text-[#666666]">
                      {search || roleFilter !== "all" || statusFilter !== "all"
                        ? "Intenta ajustar los filtros de búsqueda"
                        : "Aún no hay usuarios registrados"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // User rows
              users.map((user) => {
                const isSelected = selectedUsers.has(user.id);
                const orgRole = user.members?.[0]?.role;

                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "border-white/5 cursor-pointer transition-colors",
                      isSelected
                        ? "bg-[#8B5CF6]/5"
                        : "hover:bg-white/[0.02]"
                    )}
                    onClick={() => onUserSelect(user)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleUserSelection(user.id)}
                        className="rounded border-white/20 bg-transparent"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={user.name}
                          image={user.image}
                          className="size-10"
                        />
                        <div>
                          <p className="font-medium text-white">
                            {user.name || "Sin nombre"}
                          </p>
                          <p className="text-xs text-[#666666]">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getSystemRoleBadgeVariant(user.role)}
                        size="sm"
                      >
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getOrgRoleBadgeVariant(orgRole)}
                        size="sm"
                      >
                        {orgRole ? getRoleDisplayName(orgRole) : "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge variant="success" size="sm">
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="destructive" size="sm">
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.manager?.name || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-[#A78BFA] font-medium">
                        {user.teamMembers?.length ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-[#666666] text-sm">
                      {formatDate((user as UserWithTeamsAndDate).createdAt)}
                    </TableCell>
                  </motion.tr>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && users.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#666666]">
              Mostrando {users.length} de {data?.total ?? 0} usuarios
            </span>
            <Select
              value={String(limit)}
              onValueChange={(v) => {
                setLimit(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[100px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 por página</SelectItem>
                <SelectItem value="20">20 por página</SelectItem>
                <SelectItem value="50">50 por página</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-[#666666] mr-2">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="ghost"
              size="iconSm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="iconSm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
