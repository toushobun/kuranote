"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import type { CSSProperties, ReactNode } from "react";

import type { TransactionColorScheme, UserThemeKey } from "internal/user";
import { BottomNavigationBar } from "organisms/navigation/BottomNavigationBar/BottomNavigationBar";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { DynamicMuiThemeProvider } from "providers/DynamicMuiThemeProvider";
import { UserThemeProvider, useUserTheme } from "theme/UserThemeProvider";
import { getUserThemeCssVariables } from "theme/userThemeCssVariables";

type AppShellProps = {
  canWriteTransactions?: boolean;
  children: ReactNode;
  themeKey: UserThemeKey;
  transactionColorScheme: TransactionColorScheme;
};

export function AppShell({
  canWriteTransactions = true,
  children,
  themeKey,
  transactionColorScheme,
}: AppShellProps) {
  return (
    <UserThemeProvider
      initialThemeKey={themeKey}
      initialTransactionColorScheme={transactionColorScheme}
    >
      <DynamicMuiThemeProvider>
        <ConfirmDialogProvider>
          <AppShellContent canWriteTransactions={canWriteTransactions}>
            {children}
          </AppShellContent>
        </ConfirmDialogProvider>
      </DynamicMuiThemeProvider>
    </UserThemeProvider>
  );
}

function AppShellContent({
  canWriteTransactions,
  children,
}: Pick<AppShellProps, "canWriteTransactions" | "children">) {
  const { themeKey, transactionColorScheme } = useUserTheme();
  const cssVariables = getUserThemeCssVariables(
    themeKey,
    transactionColorScheme,
  );

  return (
    <Box
      style={cssVariables as CSSProperties}
      sx={{
        // <html> 上的主题 cookie 缓存可能缺失或过期（例如刚登录、换设备），
        // 外壳自身铺上用户主题背景，保证 SSR 首帧不露出默认主题。
        background: "var(--user-theme-page-bg)",
        minHeight: "100dvh",
        overflowX: "hidden",
        pb: bottomNavigationLayout.shellPaddingBottom,
        position: "relative",
        "&::before": {
          background:
            "radial-gradient(circle, var(--user-theme-card-bg) 0%, transparent 70%)",
          borderRadius: "50%",
          content: '""',
          height: 260,
          opacity: 0.38,
          pointerEvents: "none",
          position: "fixed",
          right: -88,
          top: -92,
          width: 260,
          zIndex: 0,
        },
        "&::after": {
          background:
            "radial-gradient(circle, var(--user-theme-card-bg) 0%, transparent 70%)",
          borderRadius: "50%",
          bottom: 96,
          content: '""',
          height: 220,
          left: -90,
          opacity: 0.25,
          pointerEvents: "none",
          position: "fixed",
          width: 220,
          zIndex: 0,
        },
      }}
    >
      <Container
        component="main"
        maxWidth="md"
        sx={{ position: "relative", py: 4, zIndex: 1 }}
      >
        {children}
      </Container>

      <BottomNavigationBar canWriteTransactions={canWriteTransactions} />
    </Box>
  );
}
