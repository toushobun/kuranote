import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { cookies } from "next/headers";
import type { CSSProperties, ReactNode } from "react";

import { AppProviders } from "providers/AppProviders";
import {
  defaultUserThemeCssVariables,
  getUserThemeCssVariables,
} from "theme/userThemeCssVariables";
import { userThemeCookieName } from "theme/userThemeStorage";
import { defaultUserThemeKey, isUserThemeKey } from "theme/userThemeTokens";
import { statusBarScrimZIndex } from "theme/zIndex";

type RootLayoutShellProps = {
  children: ReactNode;
};

export async function RootLayoutShell({ children }: RootLayoutShellProps) {
  const cookieStore = await cookies();
  const themeCookieValue = cookieStore.get(userThemeCookieName)?.value;
  const themeKey =
    themeCookieValue && isUserThemeKey(themeCookieValue)
      ? themeCookieValue
      : null;
  const cssVariables = themeKey
    ? getUserThemeCssVariables(themeKey)
    : defaultUserThemeCssVariables;

  return (
    <html
      lang="zh-CN"
      data-user-theme={themeKey ?? defaultUserThemeKey}
      style={cssVariables as CSSProperties}
      suppressHydrationWarning
    >
      <body>
        <div
          aria-hidden="true"
          id="app-status-bar-scrim"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0, 0, 0, 0.32), rgba(0, 0, 0, 0))",
            height: "var(--app-safe-area-inset-top)",
            left: 0,
            pointerEvents: "none",
            position: "fixed",
            top: 0,
            width: "100%",
            zIndex: statusBarScrimZIndex,
          }}
        />
        <div
          id="app-root"
          style={{
            background: "var(--user-theme-page-bg)",
            paddingTop: "var(--app-safe-area-inset-top)",
          }}
        >
          <AppRouterCacheProvider>
            <AppProviders>{children}</AppProviders>
          </AppRouterCacheProvider>
        </div>
      </body>
    </html>
  );
}
