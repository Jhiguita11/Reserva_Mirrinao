import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repoName = "reserva_mirrinao";

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
