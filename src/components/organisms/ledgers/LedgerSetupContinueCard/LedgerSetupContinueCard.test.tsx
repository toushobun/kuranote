import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LedgerSetupContinueCard } from "./LedgerSetupContinueCard";

describe("LedgerSetupContinueCard", () => {
  it("显示账本名、当前步骤与进度", () => {
    render(
      <LedgerSetupContinueCard
        onContinue={vi.fn()}
        setup={{ name: "我们家", step: 3 }}
      />,
    );

    const card = screen.getByRole("region", { name: "「我们家」还没创建完" });
    expect(
      within(card).getByRole("heading", { name: "「我们家」还没创建完" }),
    ).toBeInTheDocument();
    expect(within(card).getByText("进行到第 3 步 · 商家")).toBeInTheDocument();
    expect(within(card).getByText("第 3 / 6 步")).toBeInTheDocument();
    // 进度按已完成步数（3 − 1）/ 6 显示。
    expect(
      within(card).getByRole("progressbar", { name: "创建进度" }),
    ).toHaveAttribute("aria-valuenow", "33");
  });

  it("点击「继续创建」调用 onContinue", () => {
    const onContinue = vi.fn();
    render(
      <LedgerSetupContinueCard
        onContinue={onContinue}
        setup={{ name: "我们家", step: 1 }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "继续创建" }));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
