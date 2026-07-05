import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import TransactionsSearchLoadingPage from "./loading";

afterEach(() => {
  cleanup();
});

describe("TransactionsSearchLoadingPage", () => {
  it("显示明细搜索页的加载状态", () => {
    const { container } = render(<TransactionsSearchLoadingPage />);

    expect(within(container).getByLabelText("搜索关键词")).toBeInTheDocument();
    expect(
      within(container).getByRole("status", { name: "搜索结果加载中" }),
    ).toBeInTheDocument();
    expect(within(container).getByText("搜索中...")).toBeInTheDocument();
  });
});
