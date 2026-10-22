import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { StoreProvider } from "@/lib/store";
import { brand } from "@/lib/config/brand";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: `${brand.domain} | Electronics Components`, template: `%s | ${brand.domain}` },
  description: brand.description,
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: brand.themeColor, width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><AuthProvider><StoreProvider>{children}</StoreProvider></AuthProvider></body>
    </html>
  );
}
