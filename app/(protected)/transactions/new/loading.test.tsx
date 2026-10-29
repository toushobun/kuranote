import { cleanup, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { coverBottomNavigationAttribute } from "organisms/navigation/bottomNavigationLayout";

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
    expect(backdrop.style.opacity).toBe("1");
    expect(backdrop.style.transition).not.toMatch(/opacity [1-9]/);
  });

  it("服务端渲染的第一帧就输出盖住底部导航的全屏层，且不淡入", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<TransactionsNewLoadingPage />);
    const overlay = container.firstElementChild as HTMLElement;

    expect(overlay).toHaveClass("MuiBackdrop-root");
    expect(overlay).toHaveAttribute(coverBottomNavigationAttribute);
    expect(overlay.style.opacity).toBe("1");
    expect(
      within(overlay).getByRole("status", { name: "页面数据加载中" }),
    ).toHaveAttribute("aria-busy", "true");
  });
});
