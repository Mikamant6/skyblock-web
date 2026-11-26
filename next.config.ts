import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  // Die Networth-Bibliothek bleibt ein normales Node-Paket (wird nicht gebuendelt)
  serverExternalPackages: ["skyhelper-networth"],
  partialPrefetching: true,
  // Bilder und Symbole aendern sich selten: Browser duerfen sie einen Tag behalten und danach
  // noch eine Woche anzeigen, waehrend sie im Hintergrund neu geprueft werden.
  async headers() {
    const cache = [
      { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
    ];
    return ["collections", "items", "minions", "pets", "shards", "themes"].map((folder) => ({
      source: `/${folder}/:path*`,
      headers: cache,
    }));
  },
  turbopack: {
    rules: {
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
