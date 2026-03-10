import { randomUUID } from "crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { instagramAccounts, instagramConversations, instagramMessages } from "../db/schema/instagram";

const INSTAGRAM_GRAPH_API_BASE = "https://graph.instagram.com";

export interface InstagramConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

export interface InstagramConversation {
  id: string;
  participants: {
    username: string;
    profile_picture: string;
  }[];
  updated_time: string;
}

export interface InstagramMessage {
  id: string;
  from: {
    username: string;
    id: string;
  };
  to: {
    data: { username: string; id: string }[];
  };
  message: string;
  created_at: number;
}

export class InstagramClient {
  private accessToken: string;
  private pageId: string;

  constructor(accessToken: string, pageId: string) {
    this.accessToken = accessToken;
    this.pageId = pageId;
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${INSTAGRAM_GRAPH_API_BASE}${endpoint}`);
    url.searchParams.set("access_token", this.accessToken);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Instagram API Error: ${JSON.stringify(error)}`);
    }
    return response.json();
  }

  async getConversations(): Promise<InstagramConversation[]> {
    const data = await this.request<{ data: InstagramConversation[] }>(`/${this.pageId}/conversations`, {
      fields: "id,participants,updated_time",
    });
    return data.data;
  }

  async getMessages(conversationId: string): Promise<InstagramMessage[]> {
    const data = await this.request<{ data: InstagramMessage[] }>(`/${conversationId}/messages`, {
      fields: "id,from,to,message,created_at",
      limit: "50",
    });
    return data.data;
  }

  async refreshLongLivedToken(appId: string, appSecret: string): Promise<string> {
    const url = new URL("https://graph.instagram.com/access_token");
    url.searchParams.set("grant_type", "ig_exchange_token");
    url.searchParams.set("client_secret", appSecret);
    url.searchParams.set("access_token", this.accessToken);

    const response = await fetch(url.toString());
    const data = await response.json();
    return data.access_token;
  }
}

export async function getInstagramAccountByOrg(orgId: string) {
  return db
    .select()
    .from(instagramAccounts)
    .where(eq(instagramAccounts.organizationId, orgId))
    .then((rows) => rows[0]);
}

export async function syncInstagramConversations(
  accountId: string,
  config?: InstagramConfig,
): Promise<{ synced: number; errors: string[] }> {
  const account = await db
    .select()
    .from(instagramAccounts)
    .where(eq(instagramAccounts.id, accountId))
    .then((rows) => rows[0]);

  if (!account || !account.isActive) {
    throw new Error("Instagram account not found or inactive");
  }

  const effectiveConfig = config || {
    appId: process.env.INSTAGRAM_APP_ID || "",
    appSecret: process.env.INSTAGRAM_APP_SECRET || "",
    redirectUri: process.env.INSTAGRAM_REDIRECT_URI || "",
  };
  void effectiveConfig;

  const client = new InstagramClient(account.accessToken, account.pageId);
  const errors: string[] = [];
  let synced = 0;

  try {
    const conversations = await client.getConversations();

    for (const conv of conversations) {
      try {
        const participant = conv.participants[0];
        const existingConv = await db
          .select()
          .from(instagramConversations)
          .where(eq(instagramConversations.igConversationId, conv.id))
          .then((rows) => rows[0]);

        if (existingConv) {
          const messages = await client.getMessages(conv.id);
          const lastMsg = messages[0];

          await db
            .update(instagramConversations)
            .set({
              lastMessageAt: new Date(conv.updated_time) as any,
              lastMessagePreview: lastMsg?.message?.substring(0, 200) || null,
              updatedAt: new Date() as any,
            } as any)
            .where(eq(instagramConversations.id, existingConv.id));

          for (const msg of messages.slice(0, 10)) {
            const existingMsg = await db
              .select()
              .from(instagramMessages)
              .where(eq(instagramMessages.igMessageId, msg.id))
              .then((rows) => rows[0]);

            if (!existingMsg) {
              await db.insert(instagramMessages).values({
                id: randomUUID(),
                conversationId: existingConv.id,
                igMessageId: msg.id,
                content: msg.message,
                fromIgUserId: msg.from.id,
                fromMe: msg.from.id === account.instagramUserId,
                timestamp: new Date(msg.created_at * 1000) as any,
                createdAt: new Date() as any,
              } as any);
            }
          }
        } else {
          const newConvId = randomUUID();
          await db.insert(instagramConversations).values({
            id: newConvId,
            accountId: account.id,
            igConversationId: conv.id,
            participantIgId: (participant as any)?.id || "",
            participantUsername: participant?.username || "",
            participantProfileUrl: participant?.profile_picture || "",
            lastMessageAt: new Date(conv.updated_time) as any,
            createdAt: new Date() as any,
            updatedAt: new Date() as any,
          } as any);
        }
        synced++;
      } catch (err) {
        errors.push(`Conversation ${conv.id}: ${err}`);
      }
    }

    await db
      .update(instagramAccounts)
      .set({ lastSyncedAt: new Date() as any } as any)
      .where(eq(instagramAccounts.id, accountId));

    return { synced, errors };
  } catch (err) {
    errors.push(`Sync failed: ${err}`);
    return { synced, errors };
  }
}

export async function linkConversationToContact(conversationId: string, contactId: string) {
  return db
    .update(instagramConversations)
    .set({ contactId, updatedAt: new Date() as any } as any)
    .where(eq(instagramConversations.id, conversationId));
}
