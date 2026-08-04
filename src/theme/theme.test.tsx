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
});
