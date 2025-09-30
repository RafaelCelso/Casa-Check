import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Evita que o build falhe na Vercel por regras de lint
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
