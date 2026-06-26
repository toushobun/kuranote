import "./globals.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { RootLayoutShell } from "templates/root/RootLayoutShell";

export const metadata: Metadata = {
  applicationName: "KuraNote",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KuraNote",
  },
  description: "KuraNote 家庭生活记录工具",
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  title: "KuraNote",
};

export const viewport: Viewport = {
  colorScheme: "light",
  initialScale: 1,
  themeColor: "#FDF8F0",
  viewportFit: "cover",
  width: "device-width",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <RootLayoutShell>{children}</RootLayoutShell>;
}
