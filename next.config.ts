import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: ".next-prod",
  serverExternalPackages: ["@prisma/client", "prisma", "@prisma/adapter-pg", "pg"],
};

export default nextConfig;
