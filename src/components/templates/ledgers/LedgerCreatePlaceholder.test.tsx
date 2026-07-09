import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LedgerCreatePlaceholderTemplate } from "./LedgerCreatePlaceholder";

afterEach(() => {
  cleanup();
});

describe("LedgerCreatePlaceholderTemplate", () => {
  it("显示新增账本占位说明和返回入口", () => {
    const { container } = render(<LedgerCreatePlaceholderTemplate />);

    expect(
      within(container).getByRole("heading", { name: "新增账本" }),
    ).toBeInTheDocument();
    expect(
      within(container).getByText("新增账本功能正在准备中"),
    ).toBeInTheDocument();
    expect(
      within(container).getByRole("link", { name: "返回账本管理" }),
    ).toHaveAttribute("href", "/ledgers");
  });
});
