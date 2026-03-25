import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";

export const CACHE_TAGS = {
  PIPELINE_STAGES: "pipeline-stages",
  TAGS: "tags",
  USERS: "users",
  DEALS: "deals",
  CONTACTS: "contacts",
} as const;

export const REVALIDATION = {
  STATIC: 3600, // 1 hour - for tags
  SEMI_STATIC: 300, // 5 min - for pipeline stages, users
  DYNAMIC: 60, // 1 min - for organization
  REALTIME: 30, // 30 sec - for deals, contacts
} as const;

// Pipeline Stages - cached
export async function getCachedPipelineStages(organizationId: string) {
  return unstable_cache(
    async (orgId: string) => {
      return db.pipelineStage.findMany({
        where: { organizationId: orgId, isActive: true },
        include: { _count: { select: { contacts: true, deals: true } } },
        orderBy: { order: "asc" },
      });
    },
    [`pipeline-stages-${organizationId}`],
    { tags: [CACHE_TAGS.PIPELINE_STAGES], revalidate: REVALIDATION.SEMI_STATIC }
  )(organizationId);
}

// Tags - cached (static data)
export async function getCachedTags(organizationId: string) {
  return unstable_cache(
    async (orgId: string) =>
      db.tag.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    [`tags-${organizationId}`],
    { tags: [CACHE_TAGS.TAGS], revalidate: REVALIDATION.STATIC }
  )(organizationId);
}

// Users - cached
export async function getCachedUsers(organizationId: string) {
  return unstable_cache(
    async (orgId: string) => {
      const members = await db.member.findMany({
        where: { organizationId: orgId },
        include: { user: { select: { id: true, name: true, email: true, image: true, role: true } } },
      });
      return members.map((m) => m.user);
    },
    [`users-${organizationId}`],
    { tags: [CACHE_TAGS.USERS], revalidate: REVALIDATION.SEMI_STATIC }
  )(organizationId);
}

// Invalidate cache after mutations
export function invalidatePipelineStagesCache(organizationId: string) {
  revalidateTag(CACHE_TAGS.PIPELINE_STAGES, 'max');
  revalidateTag(`pipeline-stages-${organizationId}`, 'max');
}

export function invalidateTagsCache(organizationId: string) {
  revalidateTag(CACHE_TAGS.TAGS, 'max');
  revalidateTag(`tags-${organizationId}`, 'max');
}

export function invalidateUsersCache(organizationId: string) {
  revalidateTag(CACHE_TAGS.USERS, 'max');
  revalidateTag(`users-${organizationId}`, 'max');
}
