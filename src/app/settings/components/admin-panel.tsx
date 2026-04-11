"use client";

import * as React from "react";
import { Users, ShieldCheck, ScrollText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserWithTeams } from "@/types/auth";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserManagementTable } from "@/components/admin/user-management-table";
import { UserDetailDrawer } from "@/components/admin/user-detail-drawer";
import { AdminRoleRequestsTab } from "./admin-role-requests-tab";
import { AdminTeamsTab } from "./admin-teams-tab";
import { AdminActivityLogsTab } from "./admin-activity-logs-tab";

// ============================================
// Main Admin Panel
// ============================================

export function AdminPanel() {
  const queryClient = useQueryClient();

  // Tab 1: Users - drawer state
  const [selectedUser, setSelectedUser] = React.useState<UserWithTeams | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const handleUserSelect = (user: UserWithTeams) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const handleUserUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-[#1C1D21]/80 border border-white/10 rounded-lg p-1 gap-1">
          <TabsTrigger
            value="users"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400 text-sm"
          >
            <Users className="h-4 w-4 mr-1.5" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger
            value="roleRequests"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400 text-sm"
          >
            <ShieldCheck className="h-4 w-4 mr-1.5" />
            Solicitudes de Rol
          </TabsTrigger>
          <TabsTrigger
            value="teams"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400 text-sm"
          >
            <Users className="h-4 w-4 mr-1.5" />
            Equipos
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-400 text-sm"
          >
            <ScrollText className="h-4 w-4 mr-1.5" />
            Registro de Actividad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UserManagementTable onUserSelect={handleUserSelect} />
          <UserDetailDrawer
            user={selectedUser}
            open={drawerOpen}
            onClose={handleDrawerClose}
            onUserUpdated={handleUserUpdated}
          />
        </TabsContent>

        <TabsContent value="roleRequests" className="mt-6">
          <AdminRoleRequestsTab />
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          <AdminTeamsTab />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <AdminActivityLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
