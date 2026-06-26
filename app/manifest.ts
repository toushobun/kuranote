import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#FDF8F0",
    categories: ["finance", "lifestyle", "productivity"],
    description: "KuraNote 家庭生活记录工具",
    display: "standalone",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        purpose: "maskable",
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    name: "KuraNote",
    orientation: "portrait",
    scope: "/",
    short_name: "KuraNote",
    start_url: "/",
    theme_color: "#FDF8F0",
  };
}
