// ============================================================
// MaatWork CRM — Google Drive API Routes
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@server/auth";
import {
  listGoogleDriveFiles,
  getGoogleDriveFile,
  downloadGoogleDriveFile,
  uploadGoogleDriveFile,
  createGoogleDriveFolder,
  deleteGoogleDriveFile,
  searchGoogleDriveFiles,
} from "@server/functions/google/drive";

export const Route = createFileRoute("/api/google/drive/files")({
  server: {
    GET: async ({ request }: { request: Request }) => {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const url = new URL(request.url);
      const folderId = url.searchParams.get("folderId") || undefined;
      const search = url.searchParams.get("search") || undefined;

      try {
        let files;
        if (search) {
          files = await searchGoogleDriveFiles(session.user.id, search);
        } else {
          files = await listGoogleDriveFiles(session.user.id, folderId);
        }
        return new Response(JSON.stringify(files), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error instanceof Error ? error.message : "Failed to fetch files" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    },
    POST: async ({ request }: { request: Request }) => {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      try {
        const body = await request.json();
        
        if (body.type === "folder") {
          const folder = await createGoogleDriveFolder(
            session.user.id,
            body.name,
            body.parentFolderId
          );
          return new Response(JSON.stringify(folder), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          });
        } else {
          const file = await uploadGoogleDriveFile(session.user.id, {
            name: body.name,
            mimeType: body.mimeType,
            content: Buffer.from(body.content, "base64"),
            parentFolderId: body.parentFolderId,
          });
          return new Response(JSON.stringify(file), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          });
        }
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error instanceof Error ? error.message : "Failed to create file/folder" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    },
    DELETE: async ({ request }: { request: Request }) => {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const url = new URL(request.url);
      const fileId = url.searchParams.get("fileId");

      if (!fileId) {
        return new Response(JSON.stringify({ error: "fileId required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      try {
        await deleteGoogleDriveFile(session.user.id, fileId);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error instanceof Error ? error.message : "Failed to delete file" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    },
  },
});
