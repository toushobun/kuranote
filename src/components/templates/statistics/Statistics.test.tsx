import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StatisticsTemplate } from "./Statistics";

afterEach(() => {
  cleanup();
});

describe("StatisticsTemplate", () => {
  it("显示统计页面标题", () => {
    const { container } = render(<StatisticsTemplate ledgerName="家庭账本" />);

    expect(
      within(container).getByRole("heading", { name: "统计" }),
    ).toBeTruthy();
  });

  it("显示当前账本名称", () => {
    const { container } = render(<StatisticsTemplate ledgerName="家庭账本" />);

    expect(within(container).getByText("当前账本：家庭账本")).toBeTruthy();
  });

  it("显示功能待实现提示文字", () => {
    const { container } = render(<StatisticsTemplate ledgerName="家庭账本" />);

    expect(
      within(container).getByText("收支统计将在后续 Issue 中实现。"),
    ).toBeTruthy();
  });
});
