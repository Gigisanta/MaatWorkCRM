// ============================================================
// MaatWork CRM — Server Functions: Teams & Goals
// ============================================================

import { createServerFn } from "@tanstack/react-start";
import { db } from "../db";
import { teams, teamMembers, teamGoals, users } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export const getTeams = createServerFn({ method: "GET" })
  .validator((input: { orgId: string }) => input)
  .handler(async ({ data }) => {
    return db.select().from(teams).where(eq(teams.organizationId, data.orgId));
  });

export const getTeamWithMembers = createServerFn({ method: "GET" })
  .validator((input: { teamId: string }) => input)
  .handler(async ({ data }) => {
    const team = await db.select().from(teams).where(eq(teams.id, data.teamId));
    const members = await db
      .select({ member: teamMembers, user: users })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, data.teamId));
    return { team: team[0], members };
  });

export const getTeamGoals = createServerFn({ method: "GET" })
  .validator((input: { teamId: string }) => input)
  .handler(async ({ data }) => {
    return db
      .select()
      .from(teamGoals)
      .where(eq(teamGoals.teamId, data.teamId))
      .orderBy(desc(teamGoals.createdAt));
  });

export const updateGoalProgress = createServerFn({ method: "POST" })
  .validator((input: { goalId: string; currentValue: number }) => input)
  .handler(async ({ data }) => {
    const [goal] = await db.select().from(teamGoals).where(eq(teamGoals.id, data.goalId));
    const newStatus = data.currentValue >= (goal?.targetValue ?? 0) ? "completed" : "active";
    await db
      .update(teamGoals)
      .set({ currentValue: data.currentValue, status: newStatus as any, updatedAt: new Date() })
      .where(eq(teamGoals.id, data.goalId));
    return { id: data.goalId, status: newStatus };
  });

export const createTeam = createServerFn({ method: "POST" })
  .validator((input: { orgId: string; name: string; description?: string; leaderId?: string }) => input)
  .handler(async ({ data }) => {
    const id = crypto.randomUUID();
    await db.insert(teams).values({
      id,
      organizationId: data.orgId,
      name: data.name,
      description: data.description,
      leaderId: data.leaderId,
    });
    return { id };
  });
