import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repoName = "Reserva_Mirrinao";
// Build "portable": rutas RELATIVAS para servir el tour desde CUALQUIER
// subcarpeta (entrega ZIP al cliente). Se activa con NEXT_PUBLIC_PORTABLE_BUILD=1.
// Sin el flag, se mantiene el basePath absoluto para GitHub Pages.
const portable = process.env.NEXT_PUBLIC_PORTABLE_BUILD === "1";

const nextConfig: NextConfig = {
  output: "export",
  basePath: portable ? "" : isProd ? `/${repoName}` : "",
  assetPrefix: portable ? "./" : isProd ? `/${repoName}/` : "",
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
