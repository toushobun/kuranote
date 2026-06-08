import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";

import { RootLayoutShell } from "templates/root/RootLayoutShell";
import { createLastUserThemeInitScript } from "theme/userThemeInitScript";

export const metadata: Metadata = {
  title: "UchiLog",
  description: "记账应用 UchiLog",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <RootLayoutShell>
      <Script
        id="theme-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: createLastUserThemeInitScript() }}
      />
      {children}
    </RootLayoutShell>
  );
}
