import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: { default: "HawkLife", template: "%s — HawkLife" },
  description: "St. Joseph's Preparatory School student activity platform",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
    shortcut: "/icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
