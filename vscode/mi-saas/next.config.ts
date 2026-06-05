import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fija la raíz del proyecto en mi-saas. Sin esto, Next detecta el lockfile de
  // `saas-multitenant/` (afuera) y toma esa carpeta como raíz → Turbopack procesa
  // un árbol enorme y la compilación se cuelga.
  turbopack: {
    root: __dirname,
  },
  images: {
    // Permite servir con next/image las imágenes alojadas en el store de Vercel Blob.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
