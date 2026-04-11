"use client";

import * as React from "react";
import { X, Users } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { AddMemberDialog } from "./add-member-dialog";
import { ChangeLeaderDialog } from "./change-leader-dialog";
import { CreateGoalDialog } from "./create-goal-dialog";
import { UpdateGoalProgressDialog } from "./update-goal-progress-dialog";
import { ConfirmationDialog } from "./confirmation-dialog";
import {
  TeamLeaderSection,
  TeamMembersSection,
  OverallProgressSection,
  TeamGoalsSection,
  ActivityStatsSection,
} from "./team-detail-sections";
import {
  Team,
  TeamGoal,
  TeamMember,
  User,
  AddMemberForm,
  CreateGoalForm,
} from "../types";

interface TeamDetailDrawerProps {
  team: Team | null;
  open: boolean;
  onClose: () => void;
  users: User[];
  onAddMember: (data: AddMemberForm) => void;
  onRemoveMember: (memberId: string) => void;
  onCreateGoal: (data: CreateGoalForm) => void;
  onUpdateGoalProgress: (goalId: string, currentValue: number) => void;
  onDeleteGoal: (goalId: string) => void;
  onUpdateLeader: (leaderId: string) => void;
}

export function TeamDetailDrawer({
  team,
  open,
  onClose,
  users,
  onAddMember,
  onRemoveMember,
  onCreateGoal,
  onUpdateGoalProgress,
  onDeleteGoal,
  onUpdateLeader,
}: TeamDetailDrawerProps) {
  const [showAddMember, setShowAddMember] = React.useState(false);
  const [showCreateGoal, setShowCreateGoal] = React.useState(false);
  const [showChangeLeader, setShowChangeLeader] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<TeamGoal | null>(null);
  const [deletingGoal, setDeletingGoal] = React.useState<TeamGoal | null>(null);
  const [removingMember, setRemovingMember] = React.useState<TeamMember | null>(null);

  if (!team) return null;

  const averageProgress =
    team.goals.length > 0
      ? team.goals.reduce(
          (sum, g) => sum + (g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0),
          0
        ) / team.goals.length
      : 0;

  const availableUsers = users.filter(
    (u) => !team.members.some((m) => m.userId === u.id)
  );

  return (
    <>
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="w-full sm:max-w-2xl glass border-l border-white/10 bg-slate-900/95 backdrop-blur-xl">
          <DrawerHeader className="border-b border-white/10 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10">
                  <Users className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <DrawerTitle className="text-xl font-semibold text-white">
                    {team.name}
                  </DrawerTitle>
                  <p className="text-sm text-slate-400">
                    {team.description || "Sin descripción"}
                  </p>
                </div>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <TeamLeaderSection
              team={team}
              onChangeLeader={() => setShowChangeLeader(true)}
            />
            <TeamMembersSection
              team={team}
              onAddMember={() => setShowAddMember(true)}
              onRemoveMember={setRemovingMember}
            />
            <OverallProgressSection averageProgress={averageProgress} />
            <TeamGoalsSection
              team={team}
              onAddGoal={() => setShowCreateGoal(true)}
              onEditGoal={setEditingGoal}
              onDeleteGoal={setDeletingGoal}
            />
            <ActivityStatsSection team={team} />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Dialogs */}
      <AddMemberDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
        availableUsers={availableUsers}
        onSubmit={onAddMember}
      />

      <ChangeLeaderDialog
        open={showChangeLeader}
        onOpenChange={setShowChangeLeader}
        users={users}
        currentLeaderId={team.leader?.id || null}
        onSubmit={onUpdateLeader}
      />

      <CreateGoalDialog
        open={showCreateGoal}
        onOpenChange={setShowCreateGoal}
        onSubmit={onCreateGoal}
      />

      <UpdateGoalProgressDialog
        open={!!editingGoal}
        onOpenChange={() => setEditingGoal(null)}
        goal={editingGoal}
        onSubmit={onUpdateGoalProgress}
      />

      <ConfirmationDialog
        open={!!deletingGoal}
        onOpenChange={() => setDeletingGoal(null)}
        title="Eliminar Objetivo"
        description={
          deletingGoal
            ? `¿Estás seguro de que deseas eliminar el objetivo "${deletingGoal.title}"? Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={() => {
          if (deletingGoal) {
            onDeleteGoal(deletingGoal.id);
          }
        }}
      />

      <ConfirmationDialog
        open={!!removingMember}
        onOpenChange={() => setRemovingMember(null)}
        title="Remover Miembro"
        description={
          removingMember
            ? `¿Estás seguro de que deseas remover a "${removingMember.user.name}" del equipo?`
            : ""
        }
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={() => {
          if (removingMember) {
            onRemoveMember(removingMember.id);
          }
        }}
      />
    </>
  );
}
