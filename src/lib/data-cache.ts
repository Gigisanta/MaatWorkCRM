import { unstable_cache } from "next/cache";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// Dashboard stats - cached for 5 minutes
export const getCachedDashboardStats = unstable_cache(
  async (organizationId: string) => {
    const [dealsRes, contactsRes, tasksRes, teamsRes] = await Promise.all([
      fetch(`${BASE_URL}/api/deals?organizationId=${organizationId}&limit=1000`),
      fetch(`${BASE_URL}/api/contacts?organizationId=${organizationId}&limit=1000`),
      fetch(`${BASE_URL}/api/tasks?organizationId=${organizationId}&limit=1000`),
      fetch(`${BASE_URL}/api/teams?organizationId=${organizationId}&limit=100`),
    ]);

    const [dealsData, contactsData, tasksData, teamsData] = await Promise.all([
      dealsRes.json(),
      contactsRes.json(),
      tasksRes.json(),
      teamsRes.json(),
    ]);

    return { dealsData, contactsData, tasksData, teamsData };
  },
  ["dashboard-stats"],
  { revalidate: 300, tags: ["dashboard"] }
);

// Reports data - cached for 10 minutes (historical data changes less)
export const getCachedReportsData = unstable_cache(
  async (organizationId: string) => {
    const [dealsRes, contactsRes, tasksRes, teamsRes, stagesRes] = await Promise.all([
      fetch(`${BASE_URL}/api/deals?organizationId=${organizationId}&limit=1000`),
      fetch(`${BASE_URL}/api/contacts?organizationId=${organizationId}&limit=1000`),
      fetch(`${BASE_URL}/api/tasks?organizationId=${organizationId}&limit=1000`),
      fetch(`${BASE_URL}/api/teams?organizationId=${organizationId}&limit=100`),
      fetch(`${BASE_URL}/api/pipeline-stages?organizationId=${organizationId}`),
    ]);

    const [dealsData, contactsData, tasksData, teamsData, stagesData] = await Promise.all([
      dealsRes.json(),
      contactsRes.json(),
      tasksRes.json(),
      teamsRes.json(),
      stagesRes.json(),
    ]);

    return { dealsData, contactsData, tasksData, teamsData, stagesData };
  },
  ["reports-data"],
  { revalidate: 600, tags: ["reports"] }
);

// Pipeline stages - rarely change, cache for 30 minutes
export const getCachedPipelineStages = unstable_cache(
  async (organizationId: string) => {
    const response = await fetch(
      `${BASE_URL}/api/pipeline-stages?organizationId=${organizationId}`
    );
    return response.json();
  },
  ["pipeline-stages"],
  { revalidate: 1800, tags: ["pipeline-stages"] }
);

// Tags - rarely change, cache for 30 minutes
export const getCachedTags = unstable_cache(
  async (organizationId: string) => {
    const response = await fetch(
      `${BASE_URL}/api/tags?organizationId=${organizationId}`
    );
    return response.json();
  },
  ["tags"],
  { revalidate: 1800, tags: ["tags"] }
);
