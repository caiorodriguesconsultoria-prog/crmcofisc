import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CRM-COFISC",
    short_name: "COFISC",
    description: "Gestão de processos de fiscalização de contratos — COFISC",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#EFF3FB",
    theme_color: "#2F5FDB",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
    ],
  };
}
