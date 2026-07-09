import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LedgerSettingsPlaceholderTemplate } from "./LedgerSettingsPlaceholder";

afterEach(() => {
  cleanup();
});

describe("LedgerSettingsPlaceholderTemplate", () => {
  it("显示账本编辑占位说明和返回入口", () => {
    const { container } = render(
      <LedgerSettingsPlaceholderTemplate ledgerName="家庭账本" />,
    );

    expect(
      within(container).getByRole("heading", { name: "账本编辑" }),
    ).toBeInTheDocument();
    expect(within(container).getByText("家庭账本")).toBeInTheDocument();
    expect(
      within(container).getByText("账本设置页正在准备中"),
    ).toBeInTheDocument();
    expect(
      within(container).getByRole("link", { name: "返回账本管理" }),
    ).toHaveAttribute("href", "/ledgers");
  });
});
