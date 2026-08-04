import type { Metadata, Viewport } from "next";
import { Familjen_Grotesk, DM_Sans, JetBrains_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CapacitorDeepLink } from "@/components/CapacitorDeepLink";
import { PwaShell } from "@/components/PwaShell";
import { RevenueCatInitializer } from "@/components/RevenueCatInitializer";
import { ThemeScript } from "@/components/ThemeScript";
import { LanguageProvider } from "@/lib/language-context";
import { ThemeProvider } from "@/lib/theme-context";
import { colors } from "@/styles/tokens";
import "./globals.css";
import "@/styles/globals.css";

// D1 "The Shelf" typography — three roles, no exceptions.
// Familjen Grotesk: display headings only (weight 600, never 700+).
// DM Sans: all body and UI text.
// JetBrains Mono: uppercase tracked labels, E-numbers, tabular figures.
const familjen = Familjen_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-familjen",
  display: "swap",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-dm-sans",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.skaren.app"),
  applicationName: "Skaren",
  title: {
    default: "Skaren",
    template: "%s | Skaren",
  },
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
  themeColor: colors.brand.forest,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no" className={`${familjen.variable} ${dmSans.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen antialiased bg-[#F6F3EC] dark:bg-[#14120C]" suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>
            <CapacitorDeepLink />
            <RevenueCatInitializer />
            <PwaShell />
            {children}
            <SpeedInsights />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
