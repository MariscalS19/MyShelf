import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // La app es una SPA del lado del cliente (la sesión vive en localStorage),
    // así que solo validamos navegación instantánea en segmentos que lo pidan con `instant`.
    instantInsights: {
      validationLevel: "manual-warning",
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
