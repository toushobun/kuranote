import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LedgerCreateLoadingPage from "./loading";

describe("LedgerCreateLoadingPage", () => {
  it("显示与创建表单一致的加载骨架", () => {
    render(<LedgerCreateLoadingPage />);

    expect(
      screen.getByRole("status", { name: "账本创建页面加载中" }),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("ledger-create-loading-field")).toHaveLength(
      3,
    );
    expect(screen.getAllByTestId("ledger-create-loading-color")).toHaveLength(
      6,
    );
    expect(screen.queryByText("我的账本列表")).not.toBeInTheDocument();
  });
});
