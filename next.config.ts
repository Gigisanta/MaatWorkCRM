import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? ["log", "debug", "info"]
      : [],
  },
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
