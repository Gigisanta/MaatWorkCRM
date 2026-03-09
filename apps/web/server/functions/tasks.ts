// ============================================================
// MaatWork CRM — Server Functions: Tasks
// ============================================================

import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, lte } from "drizzle-orm";
import { db } from "../db";
import { contacts, tasks } from "../db/schema";

export const getTasks = createServerFn({ method: "GET" })
  .inputValidator((input: { orgId: string; status?: string; assignedTo?: string }) => input)
  .handler(async ({ data }) => {
    const conditions = [eq(tasks.organizationId, data.orgId)];
    if (data.status) conditions.push(eq(tasks.status, data.status as any));
    if (data.assignedTo) conditions.push(eq(tasks.assignedTo, data.assignedTo));
    return db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt));
  });

export const getTasksWithContacts = createServerFn({ method: "GET" })
  .inputValidator((input: { orgId: string; status?: string; assignedTo?: string }) => input)
  .handler(async ({ data }) => {
    const conditions = [eq(tasks.organizationId, data.orgId)];
    if (data.status) conditions.push(eq(tasks.status, data.status as any));
    if (data.assignedTo) conditions.push(eq(tasks.assignedTo, data.assignedTo));
    
    const taskList = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt));

    const contactIds = [...new Set(taskList.map(t => t.contactId).filter(Boolean))];
    const contactMap = new Map();
    
    if (contactIds.length > 0) {
      const contactsData = await db
        .select({ id: contacts.id, name: contacts.name, updatedAt: contacts.updatedAt })
        .from(contacts)
        .where(eq(contacts.organizationId, data.orgId));
      
      contactsData.forEach(c => contactMap.set(c.id, c));
    }

    return taskList.map(task => ({
      ...task,
      contact: task.contactId ? contactMap.get(task.contactId) : null,
    }));
  });

export const createTask = createServerFn({ method: "POST" })
  .inputValidator((input: { orgId: string; data: Record<string, unknown> }) => input)
  .handler(async ({ data }) => {
    // 🛡️ Sentinel: Prevent Mass Assignment vulnerability
    // Remove sensitive fields that should never be set directly via input data.
    const { id: _id, organizationId: _orgId, ...safeData } = data.data;

    const id = crypto.randomUUID();
    await db.insert(tasks).values({
      ...safeData,
      id,
      organizationId: data.orgId,
    });
    return { id };
  });
// UI/UX REFINED BY JULES v2

export const updateTask = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string; data: Record<string, unknown> }) => input)
  .handler(async ({ data }) => {
    // 🛡️ Sentinel: Prevent Mass Assignment vulnerability
    // Remove sensitive fields that should never be updated directly via input data.
    const { id, organizationId, ...safeData } = data.data;

    const updateData: Record<string, unknown> = { ...safeData, updatedAt: new Date() };
    if (safeData.status === "completed") updateData.completedAt = new Date();

    await db
      .update(tasks)
      .set(updateData as any)
      .where(eq(tasks.id, data.id));
    return { id: data.id };
  });

export const deleteTask = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    await db.delete(tasks).where(eq(tasks.id, data.id));
    return { success: true };
  });

export const getOverdueTasks = createServerFn({ method: "GET" })
  .inputValidator((input: { orgId: string }) => input)
  .handler(async ({ data }) => {
    return db
      .select()
      .from(tasks)
      .where(and(eq(tasks.organizationId, data.orgId), eq(tasks.status, "pending"), lte(tasks.dueDate, new Date())))
      .orderBy(desc(tasks.dueDate));
  });
