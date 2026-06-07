import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CategoriesTemplate } from "./Categories";

afterEach(() => {
  cleanup();
});

describe("CategoriesTemplate", () => {
  it("显示分类页面标题", () => {
    const { container } = render(<CategoriesTemplate ledgerName="家庭账本" />);

    expect(
      within(container).getByRole("heading", { name: "分类" }),
    ).toBeTruthy();
  });

  it("显示当前账本名称", () => {
    const { container } = render(<CategoriesTemplate ledgerName="家庭账本" />);

    expect(within(container).getByText("当前账本：家庭账本")).toBeTruthy();
  });

  it("显示功能待实现提示文字", () => {
    const { container } = render(<CategoriesTemplate ledgerName="家庭账本" />);

    expect(
      within(container).getByText(
        "分类列表和新增功能将在后续 Issue 中实现。",
      ),
    ).toBeTruthy();
  });
});
