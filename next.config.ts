import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: ".",
    memoryLimit: 4096,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },
  experimental: {
    optimizePackageImports: ['recharts', 'framer-motion', 'date-fns', '@dnd-kit/core', '@dnd-kit/sortable', 'lucide-react'],
  },
  transpilePackages: ['recharts', 'framer-motion', 'date-fns'],
};

export default nextConfig;
