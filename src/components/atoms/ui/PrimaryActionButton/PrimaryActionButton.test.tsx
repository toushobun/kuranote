import { render, screen } from "@testing-library/react";
import type { CSSProperties, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { getUserThemeCssVariables } from "theme/userThemeCssVariables";
import { userThemeKeys, userThemeTokens } from "theme/userThemeTokens";

import { PrimaryActionButton } from "./PrimaryActionButton";

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

describe("PrimaryActionButton", () => {
  it("使用主要操作样式且不假设图标", () => {
    render(<PrimaryActionButton type="submit">保存修改</PrimaryActionButton>);

    const button = screen.getByRole("button", { name: "保存修改" });

    expect(button).toHaveClass("MuiButton-contained");
    expect(button).toHaveAttribute("type", "submit");
    expect(button.querySelector("svg")).not.toBeInTheDocument();
  });

  it("全部用户主题下使用按钮专用文字 token", () => {
    userThemeKeys.forEach((themeKey) => {
      const cssVariables = getUserThemeCssVariables(themeKey);
      const { unmount } = render(
        <div style={cssVariables as CSSProperties}>
          <PrimaryActionButton>保存修改</PrimaryActionButton>
        </div>,
      );

      const button = screen.getByRole("button", { name: "保存修改" });

      expect(cssVariables["--user-theme-fab-text"]).toBe(
        userThemeTokens[themeKey].component.buttonPrimaryText,
      );
      expect(getComputedStyle(button).color).toBe("rgb(255, 255, 255)");

      unmount();
    });
  });

  it("禁用时保留 MUI 的 disabled 状态", () => {
    render(<PrimaryActionButton disabled>保存修改</PrimaryActionButton>);

    const button = screen.getByRole("button", { name: "保存修改" });

    expect(button).toBeDisabled();
    expect(button).toHaveClass("Mui-disabled");
  });

  it("传入 href 时渲染站内链接", () => {
    render(
      <PrimaryActionButton href="/ledgers/new">新增账本</PrimaryActionButton>,
    );

    const link = screen.getByRole("link", { name: "新增账本" });
    expect(link).toHaveAttribute("href", "/ledgers/new");
    expect(link).toHaveAttribute("data-next-link", "true");
  });
});
