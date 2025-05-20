import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    appDir: true,
    viewTransitions: true,
  },
};

export default nextConfig;
