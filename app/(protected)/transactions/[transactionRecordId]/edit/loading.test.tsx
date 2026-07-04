import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import TransactionEditLoadingPage from "./loading";

afterEach(() => {
  cleanup();
});

describe("TransactionEditLoadingPage", () => {
  it("显示编辑记账页面的加载状态", () => {
    const { container } = render(<TransactionEditLoadingPage />);

    expect(
      within(container).getByRole("heading", { name: "编辑记账" }),
    ).toBeInTheDocument();
    expect(within(container).getByRole("status")).toBeInTheDocument();
  });
});
