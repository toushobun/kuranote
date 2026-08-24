import "./globals.css";

import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { RootLayoutShell } from "templates/root/RootLayoutShell";
import { userThemeCookieName } from "theme/userThemeStorage";
import {
  defaultUserThemeKey,
  isUserThemeKey,
  userThemeTokens,
} from "theme/userThemeTokens";

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

export async function generateViewport(): Promise<Viewport> {
  const cookieStore = await cookies();
  const themeCookieValue = cookieStore.get(userThemeCookieName)?.value;
  const themeKey =
    themeCookieValue && isUserThemeKey(themeCookieValue)
      ? themeCookieValue
      : defaultUserThemeKey;

  return {
    colorScheme: "light",
    initialScale: 1,
    themeColor: userThemeTokens[themeKey].palette.pageGradientFrom,
    viewportFit: "cover",
    width: "device-width",
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return <RootLayoutShell>{children}</RootLayoutShell>;
}
