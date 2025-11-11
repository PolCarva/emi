import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    domains: ['youtube.com', 'www.youtube.com', 'youtu.be'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // Configuración de Turbopack (Next.js 16 usa Turbopack por defecto)
  turbopack: {},
};

export default nextConfig;
