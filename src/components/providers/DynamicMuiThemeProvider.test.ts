import { describe, expect, it } from "vitest";

import { theme as baseTheme } from "theme/theme";
import { userThemeKeys, userThemeTokens } from "theme/userThemeTokens";
import { createDynamicMuiTheme } from "./DynamicMuiThemeProvider";

function expectOverlayPaperBackground(override: unknown) {
  expect(override).toMatchObject({
    backgroundColor: baseTheme.palette.background.paper,
  });
}

describe("createDynamicMuiTheme", () => {
  it("会将用户卡片色写入 MUI background.paper", () => {
    userThemeKeys.forEach((themeKey) => {
      const token = userThemeTokens[themeKey];
      const dynamicTheme = createDynamicMuiTheme(themeKey);

      // card 由 surface 派生，保留两条断言用于固定 MUI paper 的语义契约。
      expect(dynamicTheme.palette.background.paper).toBe(token.palette.card);
      expect(dynamicTheme.palette.background.paper).toBe(token.palette.surface);
    });
  });

  it("只让确认过的基础 palette 跟随用户主题", () => {
    userThemeKeys.forEach((themeKey) => {
      const token = userThemeTokens[themeKey];
      const dynamicTheme = createDynamicMuiTheme(themeKey);

      expect(dynamicTheme.palette.primary.main).toBe(token.palette.accent);
      expect(dynamicTheme.palette.primary.light).toBe(
        token.palette.accentLight,
      );
      expect(dynamicTheme.palette.primary.dark).toBe(token.palette.accentDeep);
      expect(dynamicTheme.palette.primary.contrastText).toBe(
        token.component.buttonPrimaryText,
      );
      expect(dynamicTheme.palette.background.default).toBe(token.palette.page);
      expect(dynamicTheme.palette.text.primary).toBe(token.palette.text);
      expect(dynamicTheme.palette.text.secondary).toBe(token.palette.textMuted);
      expect(dynamicTheme.palette.divider).toBe(token.palette.divider);
    });
  });

  it("基础主题的 primary.contrastText 固定为白色", () => {
    expect(baseTheme.palette.primary.contrastText).toBe("#FFFFFF");
  });

  it("会将 overlay 组件背景固定为基础 paper", () => {
    const dynamicTheme = createDynamicMuiTheme(userThemeKeys[0]);

    expectOverlayPaperBackground(
      dynamicTheme.components?.MuiDialog?.styleOverrides?.paper,
    );
    expectOverlayPaperBackground(
      dynamicTheme.components?.MuiDrawer?.styleOverrides?.paper,
    );
    expectOverlayPaperBackground(
      dynamicTheme.components?.MuiMenu?.styleOverrides?.paper,
    );
    expectOverlayPaperBackground(
      dynamicTheme.components?.MuiPopover?.styleOverrides?.paper,
    );
  });

  it("全屏弹框内容避开顶部与底部安全区", () => {
    expect(
      baseTheme.components?.MuiDialog?.styleOverrides?.paperFullScreen,
    ).toMatchObject({
      paddingBottom: "var(--app-safe-area-inset-bottom)",
      paddingTop: "var(--app-safe-area-inset-top)",
    });
  });

  it("CssBaseline 不会用固定颜色覆盖用户主题画布", () => {
    expect(baseTheme.components?.MuiCssBaseline?.styleOverrides).toMatchObject({
      body: { background: "var(--user-theme-page-bg)" },
      html: { background: "var(--user-theme-page-bg)" },
    });
  });
});
