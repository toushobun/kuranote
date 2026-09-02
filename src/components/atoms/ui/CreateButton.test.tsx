import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { CreateButton } from "./CreateButton";

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

describe("CreateButton", () => {
  it("使用默认强调按钮和新增图标", () => {
    render(<CreateButton>新增项目</CreateButton>);

    const button = screen.getByRole("button", { name: "新增项目" });

    expect(button).toHaveClass("MuiButton-contained");
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("传入 href 时渲染站内链接", () => {
    render(<CreateButton href="/merchants/new">新增商家</CreateButton>);

    const link = screen.getByRole("link", { name: "新增商家" });
    expect(link).toHaveAttribute("href", "/merchants/new");
    expect(link).toHaveAttribute("data-next-link", "true");
  });
});
