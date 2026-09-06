import Dialog from "@mui/material/Dialog";
import { ThemeProvider } from "@mui/material/styles";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { theme } from "./theme";

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
});
