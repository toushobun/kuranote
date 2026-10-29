import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import TransactionsNewLoadingPage from "./loading";

afterEach(() => {
  cleanup();
});

describe("TransactionsNewLoadingPage", () => {
  it("显示与从商家记账第一屏一致的加载骨架", () => {
    render(<TransactionsNewLoadingPage />);
    const status = screen.getByRole("status", { name: "页面数据加载中" });

    expect(
      within(status).getByRole("heading", { name: "从商家记账" }),
    ).toBeInTheDocument();
    const steps = within(
      within(status).getByRole("list", { name: "记账进度" }),
    ).getAllByRole("listitem");
    expect(steps).toHaveLength(4);
    expect(steps[0]).toHaveAttribute("aria-current", "step");
    expect(steps.map((step) => step.textContent)).toEqual([
      "1商家",
      "2账户（未开始）",
      "3明细（未开始）",
      "4确认（未开始）",
    ]);
  });
});
