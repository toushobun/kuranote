import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  renderEntryComponent,
  clickEntryButton as click,
} from "test/transactionStepFlow";
import { itemsStepFixture } from "test/mocks/transactionItemsStep";
import { TransactionItemAmountDrawer } from "./TransactionItemAmountDrawer";
function setup(
  currency = "CNY",
  quickAmounts = itemsStepFixture.suggestions!.quickAmounts,
) {
  const props = {
    open: true,
    title: "餐饮 · 午餐",
    categoryId: "lunch",
    currency,
    value: "",
    quickAmounts,
    onChange: vi.fn(),
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  };
  renderEntryComponent(<TransactionItemAmountDrawer {...props} />);
  return props;
}
describe("TransactionItemAmountDrawer", () => {
  it("仅显示当前币种快捷金额并原样回调，确认和关闭通知外部", () => {
    const props = setup();
    expect(screen.getByText("餐饮 · 午餐 的金额")).toBeInTheDocument();
    expect(screen.queryByText("上次 ¥498")).not.toBeInTheDocument();
    click("上次 ¥18.5");
    expect(props.onChange).toHaveBeenCalledWith("18.50");
    expect(
      within(screen.getByLabelText("金额计算器")).getByRole("button", {
        name: ".",
      }),
    ).toBeEnabled();
    click("关闭金额键盘");
    expect(props.onClose).toHaveBeenCalledOnce();
  });
  it("不对传入快捷金额重新排序或截取", () => {
    setup("JPY", [
      {
        categoryId: "lunch",
        currency: "JPY",
        lastAmount: "1",
        frequentAmounts: ["9", "8", "7", "6", "5"],
      },
    ]);
    expect(
      within(screen.getByRole("group", { name: "快捷金额" }))
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["上次 ¥1", "¥9", "¥8", "¥7", "¥6", "¥5"]);
  });
});
