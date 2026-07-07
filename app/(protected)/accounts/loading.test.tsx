import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import AccountsLoadingPage from "./loading";

afterEach(() => {
  cleanup();
});

describe("AccountsLoadingPage", () => {
  it("显示账户管理页的加载状态", () => {
    const { container } = render(<AccountsLoadingPage />);

    expect(
      within(container).getByRole("status", { name: "账户数据加载中" }),
    ).toHaveAttribute("aria-busy", "true");
  });
});
