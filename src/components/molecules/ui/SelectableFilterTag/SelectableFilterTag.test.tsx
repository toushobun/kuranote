import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { createDynamicMuiTheme } from "providers/DynamicMuiThemeProvider";
import { userThemeKeys, userThemeTokens } from "theme/userThemeTokens";

import { SelectableFilterTag } from "./SelectableFilterTag";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a data-next-link="true" href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("SelectableFilterTag", () => {
  it("显示图标、文字和数量并作为筛选链接导航", () => {
    render(
      <SelectableFilterTag
        ariaLabel="超市，6 个商家"
        count={6}
        href="/merchants?tagId=tag-1"
        icon="🛒"
        label="超市"
      />,
    );

    const link = screen.getByRole("link", { name: "超市，6 个商家" });

    expect(link).toHaveAttribute("href", "/merchants?tagId=tag-1");
    expect(link).toHaveAttribute("data-next-link", "true");
    expect(link).not.toHaveAttribute("aria-current");
    expect(screen.getByText("超市")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("全部用户主题下选中态使用白色文字", () => {
    userThemeKeys.forEach((themeKey) => {
      const theme = createDynamicMuiTheme(themeKey);
      const { unmount } = render(
        <ThemeProvider theme={theme}>
          <SelectableFilterTag
            ariaLabel="超市，6 个商家"
            count={6}
            href="/merchants?tagId=tag-1"
            icon="🛒"
            label="超市"
            selected
          />
        </ThemeProvider>,
      );

      const link = screen.getByRole("link", { name: "超市，6 个商家" });

      expect(theme.palette.primary.main).toBe(
        userThemeTokens[themeKey].palette.accent,
      );
      expect(getComputedStyle(link).color).toBe("rgb(255, 255, 255)");
      expect(link).toHaveAttribute("aria-current", "page");

      unmount();
    });
  });
});
