import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["149.36.1.94"],
  // Native + node-canvas-based packages must be loaded via Node's require, not bundled.
  serverExternalPackages: ["pdf-to-png-converter", "@napi-rs/canvas"],
};

export default nextConfig;
