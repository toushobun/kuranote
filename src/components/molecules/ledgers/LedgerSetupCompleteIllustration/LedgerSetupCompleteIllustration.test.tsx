import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UserThemeProvider } from "theme/UserThemeProvider";
import { userThemeTokens } from "theme/userThemeTokens";

import { LedgerSetupCompleteIllustration } from "./LedgerSetupCompleteIllustration";

describe("LedgerSetupCompleteIllustration", () => {
  it("以代码内 SVG 渲染，账本颜色跟随用户主题", () => {
    render(
      <UserThemeProvider initialThemeKey="lavenderDream">
        <LedgerSetupCompleteIllustration label="账本已准备好的插画" />
      </UserThemeProvider>,
    );

    const illustration = screen.getByRole("img", {
      name: "账本已准备好的插画",
    });
    expect(illustration.tagName.toLowerCase()).toBe("svg");
    expect(illustration.querySelector("image")).toBeNull();
    expect(
      illustration.querySelector(
        `[fill="${userThemeTokens.lavenderDream.palette.accentDeep}"]`,
      ),
    ).not.toBeNull();
  });
});
