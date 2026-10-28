import { screen, within, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createEntryCallbacks,
  renderEntryComponent,
  clickEntryButton as click,
  selectEntryAccount as selectAccount,
} from "test/transactionStepFlow";
import { flowFixture } from "test/mocks/transactionStepFlow";
import { TransactionStepFlow } from "./TransactionStepFlow";
import type { TransactionStepFlowProps } from "./TransactionStepFlow.types";

function setup(overrides: Partial<TransactionStepFlowProps> = {}) {
  const props = { ...flowFixture, ...createEntryCallbacks(), ...overrides };
  const view = renderEntryComponent(<TransactionStepFlow {...props} />);
  return { ...view, props };
}
function progress() {
  return within(screen.getByRole("list", { name: "记账进度" })).getAllByRole(
    "listitem",
  );
}
describe("TransactionStepFlow", () => {
  it("商家选择通知外部并进入账户，账户选择后进入明细", async () => {
    const { props } = setup();
    click("7-Eleven");
    expect(props.onMerchantSelect).toHaveBeenCalledWith(
      flowFixture.merchants[1],
    );
    expect(
      screen.getByRole("radiogroup", { name: "收支账户" }),
    ).toBeInTheDocument();
    selectAccount();
    await waitFor(() =>
      expect(screen.getByText("明细内容将在后续任务实现")).toBeInTheDocument(),
    );
    expect(props.onAccountSelect).toHaveBeenCalledWith(flowFixture.accounts[1]);
    click("去确认");
    expect(screen.getByText("确认内容将在后续任务实现")).toBeInTheDocument();
    click("账户");
    expect(progress().map((item) => item.dataset.status)).toEqual([
      "completed",
      "current",
      "completed",
      "upcoming",
    ]);
    expect(
      screen.getByRole("button", { name: "完成，回到确认" }),
    ).toBeInTheDocument();
    selectAccount("现金 JPY");
    await waitFor(() =>
      expect(screen.getByRole("radiogroup")).toBeInTheDocument(),
    );
    click("完成，回到确认");
    expect(screen.getByText("确认内容将在后续任务实现")).toBeInTheDocument();
  });

  it("任何步骤可查看确认，未完成步骤不可通过进度条进入", () => {
    setup();
    expect(
      screen.queryByRole("button", { name: "账户" }),
    ).not.toBeInTheDocument();
    click("确认");
    expect(progress().map((item) => item.dataset.status)).toEqual([
      "upcoming",
      "upcoming",
      "upcoming",
      "current",
    ]);
  });

  it("关闭时继续记账保留内容，放弃才关闭", async () => {
    const { props } = setup();
    click("关闭记账");
    expect(screen.getByText("已填写的内容不会保存。")).toBeInTheDocument();
    click("继续记账");
    expect(props.onClose).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        screen.queryByText("已填写的内容不会保存。"),
      ).not.toBeInTheDocument(),
    );
    click("关闭记账");
    click("放弃");
    await waitFor(() => expect(props.onClose).toHaveBeenCalledOnce());
  });

  it("从确认页更换商家后进入账户步骤并保留其他完成状态", () => {
    setup({
      initialStep: 4,
      initialMerchantId: "seven",
      initialAccountId: "paypay",
      initialCompletedSteps: [1, 2, 3],
    });
    click("商家");
    click("LIFE超市");
    expect(
      screen.getByRole("radiogroup", { name: "收支账户" }),
    ).toBeInTheDocument();
    expect(progress().map((item) => item.dataset.status)).toEqual([
      "completed",
      "current",
      "completed",
      "upcoming",
    ]);
    click("完成，回到确认");
    expect(screen.getByText("确认内容将在后续任务实现")).toBeInTheDocument();
  });

  it("关闭后重新打开不保留上次内容", () => {
    const view = renderEntryComponent(<TransactionStepFlow {...flowFixture} />);
    click("7-Eleven");
    view.rerender(<TransactionStepFlow {...flowFixture} open={false} />);
    view.rerender(<TransactionStepFlow {...flowFixture} />);
    expect(screen.getByRole("textbox", { name: "搜索商家" })).toHaveValue("");
    expect(progress()[0]).toHaveAttribute("data-status", "current");
  });

  it("通过外框打开方式抽屉并把选择通知外部", () => {
    const { props } = setup();
    click("切换方式");
    click("账户周转");
    expect(props.onMethodChange).toHaveBeenCalledWith("transfer");
  });
});
