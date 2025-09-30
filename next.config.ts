import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignora o ESLint durante o build (Vercel/CI), evitando falhas por regras de lint
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
