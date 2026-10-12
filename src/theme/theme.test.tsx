import Dialog from "@mui/material/Dialog";
import { ThemeProvider } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createDynamicMuiTheme } from "providers/DynamicMuiThemeProvider";
import { theme } from "./theme";
import { userThemeKeys } from "./userThemeTokens";

// 把 hex / rgba 等任意写法规范化为计算后颜色的格式，便于与 getComputedStyle 比较。
function toComputedColor(color: string) {
  const element = document.createElement("span");
  element.style.color = color;
  return element.style.color;
}

describe("theme", () => {
  it("全屏弹框不保留普通弹框的圆角和阴影", () => {
    render(
      <ThemeProvider theme={theme}>
        <Dialog fullScreen open>
          全屏内容
        </Dialog>
      </ThemeProvider>,
    );

    expect(screen.getByRole("dialog")).toHaveStyle({
      borderRadius: "0px",
      boxShadow: "none",
    });
  });

  it("primary.contrastText 显式声明为白色，不依赖 MUI 按对比度阈值自动计算", () => {
    // 品牌橙色与白色的对比度约 2.44，低于 MUI 默认阈值 3，若不显式声明会被
    // 自动判定为黑色文字，导致深底配深字（#690）。
    expect(theme.palette.primary.contrastText).toBe("#fff");
  });

  it("Typography 的 color prop 在项目主题下生成对应 palette 颜色（#894）", () => {
    const cases = [
      ["textPrimary", theme.palette.text.primary],
      ["textSecondary", theme.palette.text.secondary],
      ["textDisabled", theme.palette.text.disabled],
      ["error", theme.palette.error.main],
      ["success", theme.palette.success.main],
      ["warning", theme.palette.warning.main],
    ] as const;

    render(
      <ThemeProvider theme={theme}>
        {cases.map(([color]) => (
          <Typography key={color} color={color}>
            {color}
          </Typography>
        ))}
      </ThemeProvider>,
    );

    cases.forEach(([color, expected]) => {
      expect(getComputedStyle(screen.getByText(color)).color).toBe(
        toComputedColor(expected),
      );
    });
  });

  it("Typography 的 textSecondary 跟随用户主题的 text.secondary（#894）", () => {
    userThemeKeys.forEach((themeKey) => {
      const dynamicTheme = createDynamicMuiTheme(themeKey);
      const { unmount } = render(
        <ThemeProvider theme={dynamicTheme}>
          <Typography color="textSecondary">{themeKey}</Typography>
        </ThemeProvider>,
      );

      expect(getComputedStyle(screen.getByText(themeKey)).color).toBe(
        toComputedColor(dynamicTheme.palette.text.secondary),
      );
      unmount();
    });
  });
});
