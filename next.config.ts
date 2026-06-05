import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repoName = "Reserva_Mirrinao";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? `/${repoName}` : "",
  assetPrefix: isProd ? `/${repoName}/` : "",
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  devIndicators: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
