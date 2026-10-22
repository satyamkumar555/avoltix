import type { MetadataRoute } from "next";
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
// Product and category URLs are added in the catalogue phase.
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/products", "/request"].map((p) => ({ url: `${site}${p}` }));
}
