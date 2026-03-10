// MaatWork CRM — Instagram OAuth Handler
// Handles Instagram Graph API OAuth flow for business accounts

import { eq } from "drizzle-orm";
import { db } from "../db";
import { instagramAccounts } from "../db/schema";

const INSTAGRAM_GRAPH_API_BASE = "https://graph.instagram.com";

export interface InstagramOAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

/**
 * Generate Instagram OAuth authorization URL
 */
export function getInstagramAuthUrl(config: InstagramOAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    scope: "instagram_business_manage_messages,instagram_business_basic",
    response_type: "code",
    state,
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  config: InstagramOAuthConfig,
  code: string,
): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const params = new URLSearchParams({
    client_id: config.appId,
    client_secret: config.appSecret,
    redirect_uri: config.redirectUri,
    code,
  });

  const response = await fetch(`https://api.facebook.com/v18.0/oauth/access_token?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to exchange code: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Exchange short-lived token for long-lived token
 */
export async function getLongLivedToken(
  config: InstagramOAuthConfig,
  shortLivedToken: string,
): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_secret: config.appSecret,
    fb_exchange_token: shortLivedToken,
  });

  const response = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get long-lived token: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Get Instagram Business Account info
 */
export async function getInstagramBusinessAccount(accessToken: string): Promise<{
  id: string;
  username: string;
  name: string;
  accountType: string;
}> {
  const params = new URLSearchParams({
    access_token: accessToken,
    fields: "id,username,name,account_type",
  });

  const response = await fetch(`${INSTAGRAM_GRAPH_API_BASE}/me?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get IG business account: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Get associated Instagram Page (for messages)
 */
export async function getInstagramPage(
  accessToken: string,
  userId: string,
): Promise<{
  id: string;
  name: string;
}> {
  const params = new URLSearchParams({
    access_token: accessToken,
    fields: "connected_instagram_account",
  });

  // Get pages the user has access to
  const response = await fetch(`https://graph.facebook.com/v18.0/${userId}/accounts?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get pages: ${JSON.stringify(error)}`);
  }

  const data = await response.json();

  // Find page with connected Instagram account
  for (const page of data.data || []) {
    const pageParams = new URLSearchParams({
      access_token: page.access_token,
      fields: "id,name,connected_instagram_account",
    });

    const pageResponse = await fetch(`https://graph.facebook.com/v18.0/${page.id}?${pageParams.toString()}`);

    if (pageResponse.ok) {
      const pageData = await pageResponse.json();
      if (pageData.connected_instagram_account) {
        return {
          id: page.id,
          name: pageData.name,
        };
      }
    }
  }

  throw new Error("No Instagram-connected page found");
}

/**
 * Complete Instagram OAuth flow
 */
export async function completeInstagramOAuth(
  config: InstagramOAuthConfig,
  orgId: string,
  userId: string,
  code: string,
): Promise<{
  accountId: string;
  pageName: string;
  username: string;
}> {
  // 1. Exchange code for short-lived token
  const { accessToken: shortLivedToken } = await exchangeCodeForToken(config, code);

  // 2. Get long-lived token
  const { accessToken, expiresIn } = await getLongLivedToken(config, shortLivedToken);

  // 3. Get Instagram Business Account
  const igAccount = await getInstagramBusinessAccount(accessToken);

  // 4. Get the Facebook Page (needed for conversations API)
  const page = await getInstagramPage(accessToken, igAccount.id);

  // 5. Store in database
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  const [account] = await db
    .insert(instagramAccounts)
    .values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId,
      pageId: page.id,
      pageName: page.name,
      instagramUserId: igAccount.id,
      accessToken,
      accessTokenExpiresAt: expiresAt as any,
      isActive: true,
    } as any)
    .onConflictDoUpdate({
      target: [instagramAccounts.organizationId, instagramAccounts.pageId],
      set: {
        accessToken,
        accessTokenExpiresAt: expiresAt as any,
        pageName: page.name,
        updatedAt: new Date() as any,
      } as any,
    })
    .returning();

  return {
    accountId: account.id,
    pageName: page.name,
    username: igAccount.username,
  };
}

/**
 * Refresh Instagram token (should be called before expiration)
 */
export async function refreshInstagramToken(accountId: string, config: InstagramOAuthConfig): Promise<boolean> {
  const [account] = await db.select().from(instagramAccounts).where(eq(instagramAccounts.id, accountId)).limit(1);

  if (!account) {
    throw new Error("Instagram account not found");
  }

  try {
    const { accessToken, expiresIn } = await getLongLivedToken(config, account.accessToken);

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await db
      .update(instagramAccounts)
      .set({
        accessToken,
        accessTokenExpiresAt: expiresAt as any,
        updatedAt: new Date() as any,
      } as any)
      .where(eq(instagramAccounts.id, accountId));

    return true;
  } catch (error) {
    console.error("Failed to refresh Instagram token:", error);

    // Mark account as inactive if refresh fails
    await db
      .update(instagramAccounts)
      .set({ isActive: false, updatedAt: new Date() as any } as any)
      .where(eq(instagramAccounts.id, accountId));

    return false;
  }
}
