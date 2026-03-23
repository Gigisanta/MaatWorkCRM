import { createClient } from '@vercel/edge-config';

let edgeConfig: ReturnType<typeof createClient> | null = null;

export function getEdgeConfig() {
  if (!edgeConfig) {
    edgeConfig = createClient(process.env.EDGE_CONFIG_URL!);
  }
  return edgeConfig;
}

export async function getFeatureFlag(flag: string): Promise<boolean> {
  try {
    const config = getEdgeConfig();
    const value = await config.get(flag);
    return value === 'true' || value === true;
  } catch {
    return false; // Default to false if Edge Config unavailable
  }
}
