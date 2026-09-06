"use client";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";
import { useMemo } from "react";

import { theme as baseTheme } from "theme/theme";
import { useUserTheme } from "theme/UserThemeProvider";
import { type UserThemeKey, userThemeTokens } from "theme/userThemeTokens";

type DynamicMuiThemeProviderProps = {
  children: ReactNode;
};

export function createDynamicMuiTheme(themeKey: UserThemeKey) {
  const token = userThemeTokens[themeKey];
  const overlayPaperBackground = baseTheme.palette.background.paper;
  // 强调色实心背景固定配白字，不依赖 MUI 按对比度阈值自动判断——
  // 默认主题「琥珀暖阳」的强调色偏亮，自动判断会误选黑字（#690）。
  const primary = baseTheme.palette.augmentColor({
    color: {
      main: token.palette.accent,
      light: token.palette.accentLight,
      dark: token.palette.accentDeep,
      contrastText: "#fff",
    },
  });

  return createTheme(baseTheme, {
    palette: {
      primary,
      background: {
        default: token.palette.page,
        // 普通 MUI Paper / Card 跟随用户主题 card；浮层组件在下方单独固定为 base paper。
        paper: token.palette.card,
      },
      text: {
        primary: token.palette.text,
        secondary: token.palette.textMuted,
      },
      divider: token.palette.divider,
    },
    components: {
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: overlayPaperBackground,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: overlayPaperBackground,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: overlayPaperBackground,
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            backgroundColor: overlayPaperBackground,
          },
        },
      },
    },
  });
}

export function DynamicMuiThemeProvider({
  children,
}: DynamicMuiThemeProviderProps) {
  const { themeKey } = useUserTheme();

  const dynamicTheme = useMemo(
    () => createDynamicMuiTheme(themeKey),
    [themeKey],
  );

  return <ThemeProvider theme={dynamicTheme}>{children}</ThemeProvider>;
}
