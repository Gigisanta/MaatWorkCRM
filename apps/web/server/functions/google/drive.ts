// ============================================================
// MaatWork CRM — Google Drive API Functions
// ============================================================

import { and, eq } from "drizzle-orm";
import { type drive_v3, google } from "googleapis";
import { db } from "../../db";
import { accounts } from "../../db/schema/auth";

/**
 * Creates an authenticated OAuth2 client for Google API calls
 * Uses the user's stored access and refresh tokens
 */
async function getOAuth2Client(userId: string) {
  const account = await db.query.accounts.findFirst({
    where: and(eq(accounts.userId, userId), eq(accounts.providerId, "google")),
  });

  if (!account?.accessToken || !account?.refreshToken) {
    throw new Error("Google account not linked. Please sign in with Google first.");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`,
  );

  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
  });

  return oauth2Client;
}

/**
 * Lists files in the user's Google Drive
 */
export async function listGoogleDriveFiles(userId: string, folderId?: string): Promise<drive_v3.Schema$File[]> {
  const oauth2Client = await getOAuth2Client(userId);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const query = folderId ? `'${folderId}' in parents and trashed = false` : "'root' in parents and trashed = false";

  const response = await drive.files.list({
    q: query,
    fields: "files(id, name, mimeType, modifiedTime, size, webViewLink, parents)",
    orderBy: "name",
    pageSize: 100,
  });

  return response.data.files || [];
}

/**
 * Gets metadata for a specific file
 */
export async function getGoogleDriveFile(userId: string, fileId: string): Promise<drive_v3.Schema$File | null> {
  const oauth2Client = await getOAuth2Client(userId);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  try {
    const response = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, modifiedTime, size, webViewLink, webContentLink, parents, description",
    });
    return response.data;
  } catch (error) {
    if ((error as any)?.code === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Downloads file content from Google Drive
 */
export async function downloadGoogleDriveFile(userId: string, fileId: string): Promise<Buffer> {
  const oauth2Client = await getOAuth2Client(userId);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const response = await drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" });

  return Buffer.from(response.data as ArrayBuffer);
}

/**
 * Uploads a file to Google Drive
 */
export async function uploadGoogleDriveFile(
  userId: string,
  file: {
    name: string;
    mimeType: string;
    content: Buffer;
    parentFolderId?: string;
  },
): Promise<drive_v3.Schema$File> {
  const oauth2Client = await getOAuth2Client(userId);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const response = await drive.files.create({
    requestBody: {
      name: file.name,
      parents: file.parentFolderId ? [file.parentFolderId] : undefined,
    },
    media: {
      mimeType: file.mimeType,
      body: Buffer.from(file.content),
    },
  });

  return response.data;
}

/**
 * Creates a new folder in Google Drive
 */
export async function createGoogleDriveFolder(
  userId: string,
  name: string,
  parentFolderId?: string,
): Promise<drive_v3.Schema$File> {
  const oauth2Client = await getOAuth2Client(userId);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const response = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentFolderId ? [parentFolderId] : undefined,
    },
  });

  return response.data;
}

/**
 * Deletes a file from Google Drive
 */
export async function deleteGoogleDriveFile(userId: string, fileId: string): Promise<void> {
  const oauth2Client = await getOAuth2Client(userId);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  await drive.files.delete({ fileId });
}

/**
 * Gets the user's Drive storage quota information
 */
export async function getGoogleDriveStorageQuota(userId: string): Promise<drive_v3.Schema$About> {
  const oauth2Client = await getOAuth2Client(userId);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const response = await drive.about.get({
    fields: "storageQuota, user",
  });

  return response.data;
}

/**
 * Searches for files in Google Drive
 */
export async function searchGoogleDriveFiles(userId: string, query: string): Promise<drive_v3.Schema$File[]> {
  const oauth2Client = await getOAuth2Client(userId);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const response = await drive.files.list({
    q: `name contains '${query}' and trashed = false`,
    fields: "files(id, name, mimeType, modifiedTime, size, webViewLink)",
    orderBy: "modifiedTime desc",
    pageSize: 50,
  });

  return response.data.files || [];
}
