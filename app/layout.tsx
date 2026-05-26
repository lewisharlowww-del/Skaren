import type { Metadata, Viewport } from "next";
import { AppFooter } from "@/components/AppFooter";
import { PwaShell } from "@/components/PwaShell";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Skaren",
  title: "Skaren",
  description: "Scan smarter. Live cleaner.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Skaren"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "mask-icon", url: "/skaren-symbol-monochrome.svg", color: "#1A5C3A" }]
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "Skaren",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "msapplication-TileColor": "#1A5C3A",
    "msapplication-tap-highlight": "no"
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1A5C3A" },
    { media: "(prefers-color-scheme: dark)", color: "#07110C" }
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <PwaShell />
        {children}
        <AppFooter />
      </body>
    </html>
  );
}
