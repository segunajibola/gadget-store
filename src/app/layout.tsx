import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { publicEnv } from "@/lib/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fallback metadata. The storefront layout overrides title/description with
// the store name from Settings.
export const metadata: Metadata = {
  // Makes relative URLs in metadata (e.g. Open Graph images) absolute.
  metadataBase: new URL(publicEnv.siteUrl),
  title: { default: "Gadget Store", template: "%s | Gadget Store" },
  description: "Laptops, accessories, networking and power gear delivered across Lagos.",
};

export const viewport: Viewport = {
  themeColor: "#0c3f72", // brand-900; browser UI colour on mobile (must be a literal value)
};

// The root layout wraps EVERY page (storefront and admin). It must render <html> and <body>.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
