# Google Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete Google OAuth login, Google Calendar bidirectional sync, and full Google Drive access for MaatWork CRM.

**Architecture:** Use better-auth for OAuth flow with custom scopes for Calendar/Drive access. Create server functions for Google API interactions using googleapis library. Store tokens in existing accounts table.

**Tech Stack:** TanStack Start, better-auth, googleapis, Drizzle ORM

---

## Phase 1: Environment Setup

### Task 1: Add googleapis dependency

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Add googleapis to dependencies**

Run: `cd apps/web && pnpm add googleapis`

**Step 2: Verify installation**

Run: `pnpm list googleapis`
Expected: googleapis version displayed

---

## Phase 2: Google OAuth Configuration

### Task 2: Update better-auth Google provider configuration

**Files:**
- Modify: `apps/web/server/auth/index.ts:22-27`

**Step 1: Update Google provider config with scopes**

```typescript
socialProviders: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    prompt: "consent",
    accessType: "offline",
    scopes: [
      "openid",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.file",
    ],
  },
},
```

**Step 2: Add environment variables to .env.example**

Add:
```
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

### Task 3: Implement Google login button

**Files:**
- Modify: `apps/web/app/routes/_auth/login.tsx:45-46`

**Step 1: Implement handleGoogleLogin function**

```typescript
const handleGoogleLogin = async () => {
  // Redirect to Google OAuth flow
  window.location.href = "/api/auth/signin/google";
};
```

**Step 2: Test login flow**

Run: `pnpm dev`
Navigate to `/login`
Click "Continue with Google" button
Expected: Redirect to Google sign-in

---

## Phase 3: Google Calendar API Layer

### Task 4: Create Google Calendar server functions

**Files:**
- Create: `apps/web/server/functions/google/calendar.ts`

**Step 1: Create calendar.ts with Google Calendar API functions**

```typescript
import { google, calendar_v3 } from "googleapis";
import { auth } from "../../auth";

const getOAuth2Client = async (userId: string) => {
  // Get user's stored tokens from database
  const account = await db.query.accounts.findFirst({
    where: (accounts, { eq }) => eq(accounts.userId, userId),
  });
  
  if (!account?.accessToken || !account?.refreshToken) {
    throw new Error("Google account not linked");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`
  );

  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
  });

  return oauth2Client;
};

export async function getGoogleCalendarEvents(
  userId: string,
  timeMin?: string,
  timeMax?: string
): Promise<calendar_v3.Schema$Event[]> {
  const auth = await getOAuth2Client(userId);
  const calendar = google.calendar({ version: "v3", auth });

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin || new Date().toISOString(),
    timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items || [];
}

export async function createGoogleCalendarEvent(
  userId: string,
  event: {
    summary: string;
    description?: string;
    start: string;
    end: string;
  }
): Promise<calendar_v3.Schema$Event> {
  const oauth2Client = await getOAuth2Client(userId);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: event.summary,
      description: event.description,
      start: { dateTime: event.start },
      end: { dateTime: event.end },
    },
  });

  return response.data;
}

export async function updateGoogleCalendarEvent(
  userId: string,
  eventId: string,
  event: {
    summary?: string;
    description?: string;
    start?: string;
    end?: string;
  }
): Promise<calendar_v3.Schema$Event> {
  const oauth2Client = await getOAuth2Client(userId);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const response = await calendar.events.patch({
    calendarId: "primary",
    eventId,
    requestBody: {
      summary: event.summary,
      description: event.description,
      start: event.start ? { dateTime: event.start } : undefined,
      end: event.end ? { dateTime: event.end } : undefined,
    },
  });

  return response.data;
}

export async function deleteGoogleCalendarEvent(
  userId: string,
  eventId: string
): Promise<void> {
  const oauth2Client = await getOAuth2Client(userId);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  await calendar.events.delete({
    calendarId: "primary",
    eventId,
  });
}
```

**Step 2: Verify no TypeScript errors**

Run: `cd apps/web && pnpm lint`
Expected: No errors in calendar.ts

---

### Task 5: Register Calendar server functions

**Files:**
- Modify: `apps/web/server/functions/index.ts` (or create if not exists)

**Step 1: Create functions index**

```typescript
export * from "./google/calendar";
export * from "./google/drive";
```

---

## Phase 4: Google Drive API Layer

### Task 6: Create Google Drive server functions

**Files:**
- Create: `apps/web/server/functions/google/drive.ts`

**Step 1: Create drive.ts with Google Drive API functions**

```typescript
import { google, drive_v3 } from "googleapis";

const getOAuth2Client = async (userId: string) => {
  const account = await db.query.accounts.findFirst({
    where: (accounts, { eq }) => eq(accounts.userId, userId),
  });

  if (!account?.accessToken || !account?.refreshToken) {
    throw new Error("Google account not linked");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`
  );

  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
  });

  return oauth2Client;
};

export async function listGoogleDriveFiles(
  userId: string,
  folderId?: string
): Promise<drive_v3.Schema$File[]> {
  const oauth2Client = await getOAuth2Client(userId);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const query = folderId
    ? `'${folderId}' in parents and trashed = false`
    : "'root' in parents and trashed = false";

  const response = await drive.files.list({
    q: query,
    fields: "files(id, name, mimeType, modifiedTime, size, webViewLink)",
    orderBy: "name",
  });

  return response.data.files || [];
}

export async function getGoogleDriveFile(
  userId: string,
  fileId: string
): Promise<drive_v3.Schema$File> {
  const oauth2Client = await getOAuth2Client(userId);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const response = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, modifiedTime, size, webViewLink, webContentLink",
  });

  return response.data;
}

export async function downloadGoogleDriveFile(
  userId: string,
  fileId: string
): Promise<Buffer> {
  const oauth2Client = await getOAuth2Client(userId);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );

  return Buffer.from(response.data as ArrayBuffer);
}

export async function uploadGoogleDriveFile(
  userId: string,
  folderId: string | null,
  file: {
    name: string;
    mimeType: string;
    content: Buffer;
  }
): Promise<drive_v3.Schema$File> {
  const oauth2Client = await getOAuth2Client(userId);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const response = await drive.files.create({
    requestBody: {
      name: file.name,
      parents: folderId ? [folderId] : undefined,
    },
    media: {
      mimeType: file.mimeType,
      body: file.content,
    },
  });

  return response.data;
}

export async function createGoogleDriveFolder(
  userId: string,
  name: string,
  parentId?: string
): Promise<drive_v3.Schema$File> {
  const oauth2Client = await getOAuth2Client(userId);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const response = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
  });

  return response.data;
}

export async function deleteGoogleDriveFile(
  userId: string,
  fileId: string
): Promise<void> {
  const oauth2Client = await getOAuth2Client(userId);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  await drive.files.delete({ fileId });
}
```

---

## Phase 5: UI Integration

### Task 7: Create Calendar integration UI

**Files:**
- Modify: `apps/web/app/routes/_app/calendar.tsx`

**Step 1: Add TanStack Query for Google Calendar**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
```

**Step 2: Add Google Calendar state and effects**

```typescript
const queryClient = useQueryClient();
const { data: session } = useSession();

// Fetch Google Calendar events
const { data: googleEvents, isLoading: loadingGoogleEvents } = useQuery({
  queryKey: ["google-calendar-events"],
  queryFn: async () => {
    const response = await fetch("/api/google/calendar/events");
    return response.json();
  },
  enabled: !!session?.user,
});

// Create event mutation
const createEventMutation = useMutation({
  mutationFn: async (event: CalendarEventInput) => {
    const response = await fetch("/api/google/calendar/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["google-calendar-events"] });
  },
});
```

**Step 3: Add Google Calendar toggle button**

```typescript
<Button
  variant="outline"
  onClick={() => setShowGoogleCalendar(!showGoogleCalendar)}
>
  <Calendar className="w-4 h-4 mr-2" />
  {showGoogleCalendar ? "Hide" : "Show"} Google Calendar
</Button>
```

---

### Task 8: Create Drive browser component

**Files:**
- Create: `apps/web/app/components/google/DriveBrowser.tsx`

**Step 1: Create Drive browser component**

```typescript
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Folder, FileText, Download, Upload, Plus } from "lucide-react";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
}

export function DriveBrowser() {
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  const { data: files, isLoading } = useQuery({
    queryKey: ["google-drive-files", currentFolder],
    queryFn: async () => {
      const response = await fetch(
        `/api/google/drive/files${currentFolder ? `?folderId=${currentFolder}` : ""}`
      );
      return response.json();
    },
  });

  const navigateToFolder = (folderId: string) => {
    setCurrentFolder(folderId);
  };

  const goBack = () => {
    setCurrentFolder(null);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={goBack}>
          Back
        </Button>
        <Button variant="primary" size="sm">
          <Upload className="w-4 h-4 mr-2" /> Upload
        </Button>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" /> New Folder
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {files?.map((file: DriveFile) => (
          <div
            key={file.id}
            className="p-4 border border-border rounded-lg hover:bg-surface-hover cursor-pointer"
            onClick={() =>
              file.mimeType === "application/vnd.google-apps.folder"
                ? navigateToFolder(file.id)
                : null
            }
          >
            {file.mimeType === "application/vnd.google-apps.folder" ? (
              <Folder className="w-8 h-8 text-primary" />
            ) : (
              <FileText className="w-8 h-8 text-text-muted" />
            )}
            <p className="mt-2 text-sm font-medium truncate">{file.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### Task 9: Create API routes for Google endpoints

**Files:**
- Create: `apps/web/app/routes/api.google.calendar.events.ts`
- Create: `apps/web/app/routes/api.google.drive.files.ts`

**Step 1: Create calendar API routes**

```typescript
import { createFileRoute } from "@tanstack/react-router";
import {
  getGoogleCalendarEvents,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from "../../../server/functions/google/calendar";

export const Route = createFileRoute("/api/google/calendar/events")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const timeMin = url.searchParams.get("timeMin") || undefined;
    const timeMax = url.searchParams.get("timeMax") || undefined;
    
    // Get user from session
    const session = await getSession();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const events = await getGoogleCalendarEvents(session.user.id, timeMin, timeMax);
    return Response.json(events);
  },
  POST: async ({ request }) => {
    const body = await request.json();
    const session = await getSession();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const event = await createGoogleCalendarEvent(session.user.id, body);
    return Response.json(event);
  },
});
```

---

## Phase 6: Google Cloud Console Configuration

### Task 10: Configure Google Cloud Console

**Step 1: Navigate to Google Cloud Console**

Open: https://console.cloud.google.com/

**Step 2: Create new project**

- Click "Select a project" → "New Project"
- Name: "MaatWork CRM"
- Click "Create"

**Step 3: Enable APIs**

- Navigate to "APIs & Services" → "Library"
- Search and enable:
  - Google Calendar API
  - Google Drive API

**Step 4: Configure OAuth consent screen**

- Navigate to "APIs & Services" → "OAuth consent screen"
- User Type: External
- Fill in:
  - App name: "MaatWork CRM"
  - User support email: your email
  - Developer contact: your email
- Add scopes:
  - .../auth/userinfo.email
  - .../auth/userinfo.profile
  - .../auth/calendar
  - .../auth/calendar.events
  - .../auth/drive
  - .../auth/drive.file
- Add test users (your email)
- Click "Save and continue"

**Step 5: Create OAuth credentials**

- Navigate to "APIs & Services" → "Credentials"
- Click "Create credentials" → "OAuth client ID"
- Application type: Web application
- Name: "MaatWork CRM"
- Authorized JavaScript origins:
  - http://localhost:3000
- Authorized redirect URIs:
  - http://localhost:3000/api/auth/callback/google
- Click "Create"
- Copy Client ID and Client Secret

**Step 6: Update environment variables**

```bash
# Add to apps/web/.env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

---

## Phase 7: App Verification

### Task 11: Submit for Google verification

**Step 1: Prepare for verification**

- Complete OAuth consent screen (add privacy policy URL, terms of service)
- Add verified domain (if deploying to production)
- Ensure all scopes are necessary

**Step 2: Submit for verification**

- Go to OAuth consent screen
- Click "Submit for verification"
- Fill out verification form

**Step 3: For immediate testing (development)**

- Add test users in OAuth consent screen
- Test users can bypass "unverified app" warning

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1 | Add googleapis dependency |
| 2 | 2-3 | Configure OAuth + login button |
| 3 | 4-5 | Calendar API layer |
| 4 | 6 | Drive API layer |
| 5 | 7-9 | UI integration |
| 6 | 10 | GCP Console setup |
| 7 | 11 | App verification |

**Total Tasks:** 11

**Estimated Time:** 4-6 hours
