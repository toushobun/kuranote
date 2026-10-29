import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import TransactionsNewLoadingPage from "./loading";

afterEach(() => {
  cleanup();
});

describe("TransactionsNewLoadingPage", () => {
  it("显示与从商家记账第一屏「选择商家」一致的加载骨架，不含进度条", () => {
    render(<TransactionsNewLoadingPage />);
    const status = screen.getByRole("status", { name: "页面数据加载中" });

    expect(
      within(status).getByRole("heading", { name: "记一笔" }),
    ).toBeInTheDocument();
    expect(within(status).queryByRole("list")).not.toBeInTheDocument();
  });

  it("遮罩不使用淡入动画，开头不透出底部导航", () => {
    render(<TransactionsNewLoadingPage />);
    const backdrop = screen.getByRole("status", {
      name: "页面数据加载中",
    }).parentElement!;

    expect(backdrop).toHaveClass("MuiBackdrop-root");
    expect(backdrop.style.transition).toMatch(/^opacity 0ms/);
  });

  it("与正式页面的 Dialog 一样经 Portal 渲染到 body，不留在页面主体的层叠上下文里", () => {
    const { container } = render(<TransactionsNewLoadingPage />);
    const status = screen.getByRole("status", { name: "页面数据加载中" });

    expect(container).not.toContainElement(status);
    expect(document.body).toContainElement(status);
  });
});
