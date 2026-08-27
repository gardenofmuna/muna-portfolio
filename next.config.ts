import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Default includes 2048 and 3840 — Safari will pick those and decode
    // enough pixels to kill an iPhone tab.
    deviceSizes: [640, 750, 828, 1080, 1280],
  },
};

export default nextConfig;
