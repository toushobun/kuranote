import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  renderEntryComponent,
  clickEntryButton as click,
} from "test/transactionStepFlow";
import { pressItemAmountKey as press } from "test/transactionConfirmStep";
import { receiptSuggestions } from "test/mocks/transactionReceipt";
import { TransactionItemAmountDrawer } from "./TransactionItemAmountDrawer";
function setup(
  currency = "CNY",
  quickAmounts = receiptSuggestions.quickAmounts,
  value = "",
) {
  const props = {
    open: true,
    title: "餐饮 · 午餐",
    categoryId: "lunch",
    currency,
    value,
    quickAmounts,
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  };
  const view = renderEntryComponent(<TransactionItemAmountDrawer {...props} />);
  return { ...props, view };
}
function display() {
  return screen.getByLabelText("计算器显示金额");
}
// 点快捷金额后确定，返回写入的金额。
function confirmQuickAmount(props: ReturnType<typeof setup>, label: string) {
  click(label);
  press("确定");
  return props.onConfirm.mock.lastCall?.[0];
}
describe("TransactionItemAmountDrawer", () => {
  it("仅显示当前币种快捷金额，确认和关闭通知外部", () => {
    const props = setup();
    expect(screen.getByText("餐饮 · 午餐 的金额")).toBeInTheDocument();
    expect(screen.queryByText("上次 ¥498")).not.toBeInTheDocument();
    click("上次 ¥18.5");
    expect(display()).toHaveTextContent("¥ 18.5");
    expect(props.onConfirm).not.toHaveBeenCalled();
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

  it("日元快捷金额去掉小数部分", () => {
    const props = setup("JPY", [
      {
        categoryId: "lunch",
        currency: "JPY",
        lastAmount: "498.00",
        frequentAmounts: ["520.00"],
      },
    ]);
    expect(confirmQuickAmount(props, "上次 ¥498")).toBe("498");
    expect(confirmQuickAmount(props, "¥520")).toBe("520");
  });
  it("人民币快捷金额按两位小数精度填入，确定后写入", () => {
    const props = setup("CNY", [
      {
        categoryId: "lunch",
        currency: "CNY",
        lastAmount: "12.5",
        frequentAmounts: ["8"],
      },
    ]);
    expect(confirmQuickAmount(props, "上次 ¥12.5")).toBe("12.5");
    expect(confirmQuickAmount(props, "¥8")).toBe("8");
  });
  it("大金额按钮显示千位分隔符，填入不带分隔符", () => {
    const props = setup("JPY", [
      {
        categoryId: "lunch",
        currency: "JPY",
        lastAmount: "85000.00",
        frequentAmounts: [],
      },
    ]);
    expect(confirmQuickAmount(props, "上次 ¥85,000")).toBe("85000");
  });
  it("格式化后与「上次」相同的常用金额不重复显示", () => {
    setup("JPY", [
      {
        categoryId: "lunch",
        currency: "JPY",
        lastAmount: "498",
        frequentAmounts: ["498.00", "520.00", "520"],
      },
    ]);
    expect(
      within(screen.getByRole("group", { name: "快捷金额" }))
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["上次 ¥498", "¥520"]);
  });

  it("每次打开都从当前金额开始，不保留上次关闭时的草稿", () => {
    const props = setup("JPY", [], "800");
    press("5");
    const closed = { ...props, open: false };
    props.view.rerender(<TransactionItemAmountDrawer {...closed} />);
    props.view.rerender(<TransactionItemAmountDrawer {...props} />);
    expect(display()).toHaveTextContent("¥ 800");
    press("确定");
    expect(props.onConfirm).toHaveBeenLastCalledWith("800");
  });
});
