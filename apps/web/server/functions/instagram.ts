// MaatWork CRM — Server Functions: Instagram

import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { instagramAccounts, instagramConversations, instagramMessages } from "../db/schema";
import { getInstagramAccountByOrg, syncInstagramConversations } from "../instagram/client";

export const getInstagramAccounts = createServerFn({ method: "GET" })
  .inputValidator((input: { orgId: string }) => input)
  .handler(async ({ data }) => {
    return db
      .select()
      .from(instagramAccounts)
      .where(eq(instagramAccounts.organizationId, data.orgId))
      .orderBy(desc(instagramAccounts.createdAt));
  });

export const connectInstagramAccount = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      orgId: string;
      userId: string;
      pageId: string;
      pageName: string;
      accessToken: string;
      instagramUserId: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const [account] = await db
      .insert(instagramAccounts)
      .values({
        id: crypto.randomUUID(),
        organizationId: data.orgId,
        userId: data.userId,
        pageId: data.pageId,
        pageName: data.pageName,
        accessToken: data.accessToken,
        instagramUserId: data.instagramUserId,
        accessTokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) as any,
        isActive: true,
      } as any)
      .onConflictDoUpdate({
        target: [instagramAccounts.organizationId, instagramAccounts.pageId],
        set: {
          accessToken: data.accessToken,
          pageName: data.pageName,
          accessTokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) as any,
          updatedAt: new Date() as any,
        } as any,
      })
      .returning();

    await syncInstagramConversations(account.id);

    return account;
  });

export const disconnectInstagramAccount = createServerFn({ method: "POST" })
  .inputValidator((input: { accountId: string }) => input)
  .handler(async ({ data }) => {
    await db.delete(instagramAccounts).where(eq(instagramAccounts.id, data.accountId));
    return { success: true };
  });

export const getInstagramConversations = createServerFn({ method: "GET" })
  .inputValidator((input: { accountId: string; limit?: number }) => input)
  .handler(async ({ data }) => {
    const limit = data.limit || 50;
    return db
      .select()
      .from(instagramConversations)
      .where(eq(instagramConversations.accountId, data.accountId))
      .orderBy(desc(instagramConversations.updatedAt))
      .limit(limit);
  });

export const getInstagramMessages = createServerFn({ method: "GET" })
  .inputValidator((input: { conversationId: string; limit?: number }) => input)
  .handler(async ({ data }) => {
    const limit = data.limit || 50;
    return db
      .select()
      .from(instagramMessages)
      .where(eq(instagramMessages.conversationId, data.conversationId))
      .orderBy(desc(instagramMessages.createdAt))
      .limit(limit);
  });

export const syncInstagramAccount = createServerFn({ method: "POST" })
  .inputValidator((input: { accountId: string }) => input)
  .handler(async ({ data }) => {
    const [account] = await db
      .select()
      .from(instagramAccounts)
      .where(eq(instagramAccounts.id, data.accountId))
      .limit(1);

    if (!account) {
      throw new Error("Instagram account not found");
    }

    await syncInstagramConversations(account.id);
    return { success: true };
  });

export const getInstagramAccountWithConversations = createServerFn({ method: "GET" })
  .inputValidator((input: { orgId: string }) => input)
  .handler(async ({ data }) => {
    const account = await getInstagramAccountByOrg(data.orgId);
    if (!account) return null;

    const conversations = await db
      .select()
      .from(instagramConversations)
      .where(eq(instagramConversations.accountId, account.id))
      .orderBy(desc(instagramConversations.updatedAt))
      .limit(20);

    return { account, conversations };
  });
