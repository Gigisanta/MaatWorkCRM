import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "~/lib/auth-client";
import { getDashboardMetrics, getPipelineByStage, getRecentActivity } from "../../../server/functions/analytics";
import { createContact, deleteContact, getContacts, updateContact } from "../../../server/functions/contacts";
import { createDeal, createStage, getDealsWithContacts, getStages, moveDeal } from "../../../server/functions/pipeline";
import { createTask, deleteTask, getTasks, updateTask } from "../../../server/functions/tasks";
import {
  createTeam,
  getTeamGoals,
  getTeamWithMembers,
  getTeams,
  updateGoalProgress,
  updateTeam,
} from "../../../server/functions/teams";
import {
  createFinancialProfile,
  deleteFinancialProfile,
  getFinancialProfile,
  updateFinancialProfile,
} from "../../../server/functions/financial-profiles";

// AI_DECISION: Centralized CRM hooks for live data integration
// Justificación: Synchronizes frontend state with backend server functions using TanStack Query
// Impacto: High performance, cached results, and automatic invalidation patterns

/**
 * Dashboard & Analytics
 */
export function useDashboardMetrics() {
  const { data: session } = useSession();
  const orgId = session?.session?.activeOrganizationId || "org_maatwork_demo";

  return useQuery({
    queryKey: ["dashboard-metrics", orgId],
    queryFn: () => getDashboardMetrics({ data: { orgId: orgId! } }),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePipelineSummary() {
  const { data: session } = useSession();
  const orgId = session?.session?.activeOrganizationId || "org_maatwork_demo";

  return useQuery({
    queryKey: ["pipeline-summary", orgId],
    queryFn: () => getPipelineByStage({ data: { orgId: orgId! } }),
    enabled: !!orgId,
  });
}

export function useRecentActivity(limit = 10) {
  const { data: session } = useSession();
  const orgId = session?.session?.activeOrganizationId || "org_maatwork_demo";

  return useQuery({
    queryKey: ["recent-activity", orgId, limit],
    queryFn: () => getRecentActivity({ data: { orgId: orgId!, limit } }),
    enabled: !!orgId,
  });
}

/**
 * Tasks logic
 */
export function useTasks(filters?: any) {
  const { data: session } = useSession();
  const orgId = session?.session?.activeOrganizationId || "org_maatwork_demo";

  return useQuery({
    queryKey: ["tasks", orgId, filters],
    queryFn: () => getTasks({ data: { ...filters, orgId: orgId! } }),
    enabled: !!orgId,
  });
}

export { useTasks as useUserTasks };

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const orgId = session?.session?.activeOrganizationId || "org_maatwork_demo";

  return useMutation({
    mutationFn: (data: any) => createTask({ data: { orgId: orgId!, data } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activity"] });
    },
  });
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateTask({ data: { id, data } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTask({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

/**
 * Contacts
 */
export function useContacts(filters?: any) {
  const { data: session } = useSession();
  const orgId = session?.session?.activeOrganizationId || "org_maatwork_demo";

  return useQuery({
    queryKey: ["contacts", orgId, filters],
    queryFn: () => getContacts({ data: { ...filters, orgId: orgId! } }),
    enabled: !!orgId,
  });
}

export function useCreateContactMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const orgId = session?.session?.activeOrganizationId || "org_maatwork_demo";

  return useMutation({
    mutationFn: (data: any) => createContact({ data: { orgId: orgId!, data } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activity"] });
    },
  });
}

export function useUpdateContactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateContact({ data: { id, data } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useDeleteContactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteContact({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

/**
 * Pipeline & Deals
 */
export function usePipelineBoard() {
  const { data: session, isLoading: sessionLoading } = useSession();
  const orgId = (!sessionLoading && session?.session?.activeOrganizationId) || "org_maatwork_demo";

  return useQuery({
    queryKey: ["pipeline-board", orgId],
    queryFn: async () => {
      try {
        const [stages, deals] = await Promise.all([
          getStages({ data: { orgId: orgId! } }),
          getDealsWithContacts({ data: { orgId: orgId! } }),
        ]);

        return stages.map((stage) => ({
          ...stage,
          deals: deals.filter((d) => d.deal.stageId === stage.id),
        }));
      } catch (error) {
        console.error("Pipeline Board Fetch Error:", error);
        throw error;
      }
    },
    enabled: true, // Always enabled, fallback to orgId logic
  });
}

export function useMoveDealMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const orgId = session?.session?.activeOrganizationId || "org_maatwork_demo";

  return useMutation({
    mutationFn: (params: { dealId: string; stageId: string }) => moveDeal({ data: params }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-board", orgId] });
      queryClient.invalidateQueries({ queryKey: ["pipeline-summary", orgId] });
    },
  });
}

export function useCreateDealMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const orgId = session?.session?.activeOrganizationId || "org_maatwork_demo";

  return useMutation({
    mutationFn: (data: any) => createDeal({ data: { orgId: orgId!, data } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-board", orgId] });
      queryClient.invalidateQueries({ queryKey: ["pipeline-summary", orgId] });
    },
  });
}

export function useCreateStageMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const orgId = session?.session?.activeOrganizationId || "org_maatwork_demo";

  return useMutation({
    mutationFn: (data: { name: string; color: string; order: number }) =>
      createStage({ data: { ...data, orgId: orgId! } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-board", orgId] });
    },
  });
}

/**
 * Teams & Collaboration
 */
export function useTeams() {
  const { data: session } = useSession();
  const orgId = session?.session?.activeOrganizationId || "org_maatwork_demo";

  return useQuery({
    queryKey: ["teams", orgId],
    queryFn: () => getTeams({ data: { orgId: orgId! } }),
    enabled: !!orgId,
  });
}

export function useTeamDetails(teamId: string) {
  return useQuery({
    queryKey: ["team", teamId],
    queryFn: () => getTeamWithMembers({ data: { teamId } }),
    enabled: !!teamId,
  });
}

export function useTeamGoals(teamId: string) {
  return useQuery({
    queryKey: ["team-goals", teamId],
    queryFn: () => getTeamGoals({ data: { teamId } }),
    enabled: !!teamId,
  });
}

export function useUpdateGoalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { goalId: string; currentValue: number }) => updateGoalProgress({ data: params }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team-goals"] });
    },
  });
}

export function useCreateTeamMutation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const orgId = session?.session?.activeOrganizationId || "org_maatwork_demo";

  return useMutation({
    mutationFn: (data: { name: string; description?: string; leaderId?: string }) =>
      createTeam({ data: { ...data, orgId: orgId! } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useUpdateTeamMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { teamId: string; name: string; description?: string }) => updateTeam({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team-details"] });
    },
  });
}

/**
 * Financial Profiles
 */
export function useFinancialProfile(contactId: string) {
  return useQuery({
    queryKey: ["financial-profile", contactId],
    queryFn: () => getFinancialProfile({ data: { contactId } }),
    enabled: !!contactId,
  });
}

export function useCreateFinancialProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => createFinancialProfile({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["financial-profile", variables.data?.contactId] });
    },
  });
}

export function useUpdateFinancialProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { contactId: string; data: any }) => updateFinancialProfile({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["financial-profile", variables.contactId] });
    },
  });
}

export function useDeleteFinancialProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contactId: string) => deleteFinancialProfile({ data: { contactId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-profile"] });
    },
  });
}
