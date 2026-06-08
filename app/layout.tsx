import type { Metadata, Viewport } from "next";
import { PwaShell } from "@/components/PwaShell";
import { ThemeScript } from "@/components/ThemeScript";
import { LanguageProvider } from "@/lib/language-context";
import { ThemeProvider } from "@/lib/theme-context";
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
    <html lang="no" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen antialiased bg-[#f7f2ea] dark:bg-[#0e1509]">
        <ThemeProvider>
          <LanguageProvider>
            <PwaShell />
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
