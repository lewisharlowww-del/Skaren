import type { Metadata, Viewport } from "next";
import { AppFooter } from "@/components/AppFooter";
import { PwaShell } from "@/components/PwaShell";
import { colors } from "@/styles/tokens";
import "./globals.css";
import "@/styles/globals.css";

export const metadata: Metadata = {
  applicationName: "Skaren",
  title: "Skaren",
  description: "Scan smarter. Live cleaner.",
  manifest: "/manifest.webmanifest?v=4",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Skaren"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [
      { url: "/icons/favicon.ico?v=4", sizes: "any" },
      { url: "/icons/icon-32.png?v=4", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png?v=4", sizes: "192x192", type: "image/png" }
    ],
    apple: [{ url: "/icons/apple-touch-icon.png?v=4", sizes: "180x180", type: "image/png" }]
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "Skaren",
    "apple-mobile-web-app-status-bar-style": "default",
    "msapplication-TileColor": colors.brand.forest,
    "msapplication-tap-highlight": "no"
  }
};

export const viewport: Viewport = {
  themeColor: colors.brand.forest
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <body className="min-h-screen antialiased">
        <PwaShell />
        {children}
        <AppFooter />
      </body>
    </html>
  );
}
