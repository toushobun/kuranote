import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import Script from "next/script";
import type { CSSProperties, ReactNode } from "react";

import { AppProviders } from "providers/AppProviders";
import { defaultUserThemeCssVariables } from "theme/userThemeCssVariables";
import { createLastUserThemeInitScript } from "theme/userThemeInitScript";

type RootLayoutShellProps = {
  children: ReactNode;
};

export function RootLayoutShell({ children }: RootLayoutShellProps) {
  return (
    <html
      lang="zh-CN"
      style={defaultUserThemeCssVariables as CSSProperties}
      suppressHydrationWarning
    >
      <body>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: createLastUserThemeInitScript() }}
        />
        <AppRouterCacheProvider>
          <AppProviders>{children}</AppProviders>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
