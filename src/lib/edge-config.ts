import { EdgeConfig } from '@vercel/edge-config';

let edgeConfig: EdgeConfig | null = null;

export function getEdgeConfig() {
  if (!edgeConfig) {
    edgeConfig = new EdgeConfig({
      url: process.env.EDGE_CONFIG_URL,
      token: process.env.EDGE_CONFIG_TOKEN,
    });
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
