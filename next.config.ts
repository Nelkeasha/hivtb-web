import type { NextConfig } from "next";
import path from "path";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://hivtb-rw-api.onrender.com";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },

  /**
   * Proxy all /api/* calls through the Next.js server so the browser never
   * makes a cross-origin request. Eliminates CORS issues in every environment.
   * The actual backend URL is kept server-side only.
   */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
