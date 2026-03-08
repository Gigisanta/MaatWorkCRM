# Google Integration Design - MaatWork CRM

**Date:** 2026-03-07
**Status:** Approved
**Author:** Sisyphus AI

## Overview

This document describes the design for integrating Google services into MaatWork CRM:
1. Google OAuth for authentication
2. Google Calendar bidirectional sync
3. Full Google Drive access
4. Google Cloud Console configuration

---

## 1. Google OAuth Authentication

### 1.1 OAuth Scopes

**Base scopes (required for login):**
- `openid`
- `https://www.googleapis.com/auth/userinfo.profile`
- `https://www.googleapis.com/auth**Calendar scopes:**
/userinfo.email`

- `https://www.googleapis.com/auth/calendar` - Full calendar access
- `https://www.googleapis.com/auth/calendar.events` - Read/write events

**Drive scopes:**
- `https://www.googleapis.com/auth/drive` - Full Drive access
- `https://www.googleapis.com/auth/drive.file` - Access to files created by app

### 1.2 Configuration

```typescript
// apps/web/server/auth/index.ts
socialProviders: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    prompt: "consent",
    accessType: "offline",  // Required for refresh tokens
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
}
```

### 1.3 Token Storage

- Tokens stored in `accounts` table via better-auth
- Refresh token enables offline access to Google APIs
- Token refresh handled automatically by better-auth

---

## 2. Google Calendar Integration

### 2.1 Features

- **Read:** Fetch events from user's primary calendar
- **Write:** Create, update, delete events
- **Sync:** Bidirectional sync between CRM and Google Calendar

### 2.2 API Layer

```typescript
// apps/web/server/functions/google/calendar.ts
- getEvents(calendarId?: string, timeMin?: Date, timeMax?: Date): Promise<CalendarEvent[]>
- createEvent(event: CalendarEventInput): Promise<CalendarEvent>
- updateEvent(eventId: string, event: CalendarEventInput): Promise<CalendarEvent>
- deleteEvent(eventId: string): Promise<void>
- syncEvents(): Promise<SyncResult>
```

### 2.3 Data Model

```typescript
interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: Array<{ email: string; displayName?: string }>;
  conferenceData?: ConferenceData;
}
```

---

## 3. Google Drive Integration

### 3.1 Features

- **Browse:** List files and folders from user's Drive
- **Read:** Download file contents
- **Write:** Upload new files, create folders
- **Share:** Manage file permissions

### 3.2 API Layer

```typescript
// apps/web/server/functions/google/drive.ts
- listFiles(folderId?: string, pageToken?: string): Promise<FileList>
- getFile(fileId: string): Promise<DriveFile>
- downloadFile(fileId: string): Promise<Blob>
- uploadFile(folderId: string, file: FileInput): Promise<DriveFile>
- createFolder(name: string, parentId?: string): Promise<DriveFile>
- deleteFile(fileId: string): Promise<void>
```

---

## 4. Google Cloud Console Configuration

### 4.1 Required Steps

1. **Create Project**
   - Go to Google Cloud Console
   - Create new project: "MaatWork CRM"

2. **Enable APIs**
   - Google Calendar API
   - Google Drive API

3. **Configure OAuth Consent Screen**
   - Type: External
   - Scopes: Add all required scopes
   - Add test users (for development)
   - Publish app (for production)

4. **Create Credentials**
   - OAuth 2.0 Client ID
   - Authorized JavaScript origins:
     - `http://localhost:3000` (dev)
     - `https://your-domain.com` (prod)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`

5. **Verification**
   - Submit for verification (required for public access)
   - Until verified, users see "app not verified" warning

### 4.2 Redirect URIs

```
Development:  http://localhost:3000/api/auth/callback/google
Production:   https://your-domain.com/api/auth/callback/google
```

---

## 5. Implementation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                           │
│  - Login with Google button                                 │
│  - Calendar page with Google events                         │
│  - Drive browser component                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Server Functions                         │
│  - google/calendar.ts (CRUD operations)                      │
│  - google/drive.ts (file operations)                        │
│  - google/tokens.ts (token management)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    better-auth                              │
│  - OAuth flow                                               │
│  - Token storage                                            │
│  - Session management                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Google APIs                              │
│  - OAuth 2.0                                                │
│  - Calendar API v3                                          │
│  - Drive API v3                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Dependencies

```json
{
  "dependencies": {
    "googleapis": "^140.0.0"
  }
}
```

---

## 7. Acceptance Criteria

- [ ] User can sign in with Google
- [ ] User can view Google Calendar events in CRM
- [ ] User can create/edit/delete events (syncs to Google)
- [ ] User can browse Google Drive files
- [ ] User can upload files to Google Drive
- [ ] Google Console configured with OAuth credentials
- [ ] App ready for production use (verification submitted)
