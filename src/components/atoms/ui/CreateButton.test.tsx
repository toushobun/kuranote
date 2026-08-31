import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CreateButton } from "./CreateButton";

describe("CreateButton", () => {
  it("使用默认强调按钮和新增图标", () => {
    render(<CreateButton>新增项目</CreateButton>);

    const button = screen.getByRole("button", { name: "新增项目" });

    expect(button).toHaveClass("MuiButton-contained");
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("传入 href 时渲染站内链接", () => {
    render(<CreateButton href="/merchants/new">新增商家</CreateButton>);

    expect(screen.getByRole("link", { name: "新增商家" })).toHaveAttribute(
      "href",
      "/merchants/new",
    );
  });
});
