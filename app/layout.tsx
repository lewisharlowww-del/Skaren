import type { Metadata } from "next";
import { AppFooter } from "@/components/AppFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skaren",
  description: "Scan smarter. Live cleaner.",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
        <AppFooter />
      </body>
    </html>
  );
}
