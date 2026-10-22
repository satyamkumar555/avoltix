import type { MetadataRoute } from "next";
import { brand } from "@/lib/config/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.domain, short_name: brand.name, description: brand.description,
    start_url: "/", display: "standalone", background_color: brand.themeColor, theme_color: brand.themeColor,
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
