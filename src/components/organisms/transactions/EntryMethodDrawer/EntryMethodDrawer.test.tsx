import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createEntryCallbacks,
  renderEntryComponent,
  clickEntryButton as click,
} from "test/transactionStepFlow";
import type { TransactionEntryMethod } from "types/transactions";
import { EntryMethodDrawer } from "./EntryMethodDrawer";
function setup(
  open = true,
  currentMethod: TransactionEntryMethod = "merchant",
) {
  const props = { ...createEntryCallbacks(), currentMethod, open };
  renderEntryComponent(<EntryMethodDrawer {...props} />);
  return props;
}
describe("EntryMethodDrawer", () => {
  it("标记当前方式与过渡入口，即将推出不可点击", () => {
    const props = setup();
    expect(screen.getByTestId("CheckRoundedIcon")).toBeInTheDocument();
    expect(screen.getByText("过渡")).toBeInTheDocument();
    for (const name of [
      "从模板记账 即将推出",
      "从拍照记账 即将推出",
      "定时记账 即将推出",
    ]) {
      const button = screen.getByRole("button", { name });
      expect(button).toHaveAttribute("aria-disabled", "true");
      fireEvent.click(button);
    }
    expect(props.onMethodChange).not.toHaveBeenCalled();
  });
  it("当前方式按传入的方式打勾，再点当前方式只关闭抽屉", () => {
    const props = setup(true, "transfer");
    expect(screen.getByRole("button", { name: "账户周转" })).toContainElement(
      screen.getByTestId("CheckRoundedIcon"),
    );
    click("账户周转");
    expect(props.onMethodChange).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalledOnce();
  });
  it.each([
    ["从商家记账", "merchant"],
    ["账户周转", "transfer"],
    ["标准记账 过渡", "standard"],
  ] as const)("选择%s时关闭抽屉并通知外部", (name, method) => {
    const props = setup(true, method === "standard" ? "merchant" : "standard");
    click(name);
    expect(props.onMethodChange).toHaveBeenCalledWith(method);
    expect(props.onClose).toHaveBeenCalledOnce();
  });
  it("关闭按钮通知外部", () => {
    const props = setup();
    click("关闭方式选择");
    expect(props.onClose).toHaveBeenCalledOnce();
  });
  it("关闭时不显示方式选项", () => {
    setup(false);
    expect(screen.queryByText("切换记账方式")).not.toBeInTheDocument();
  });
});
