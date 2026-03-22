import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  serverExternalPackages: ['@prisma/client', 'prisma'],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
  },
  experimental: {
    optimizePackageImports: ['recharts', 'framer-motion', 'date-fns', '@dnd-kit/core', '@dnd-kit/sortable', 'lucide-react'],
  },
  transpilePackages: ['recharts', 'framer-motion', 'date-fns'],
};

export default nextConfig;
