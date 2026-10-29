import { act, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  renderTransactionFlow as setup,
  renderEntryComponent,
  clickEntryButton as click,
  selectEntryAccount as selectAccount,
} from "test/transactionStepFlow";
import {
  expectAutomaticItems,
  pressItemAmountKey,
} from "test/transactionConfirmStep";
import {
  filledItems,
  receiptItemsOptions,
  receiptSuggestions,
} from "test/mocks/transactionReceipt";
import { flowFixture } from "test/mocks/transactionStepFlow";
import { TransactionStepFlow } from "./TransactionStepFlow";
import type { TransactionStepFlowProps } from "./TransactionStepFlow.types";
import { quickRouteSuggestionTimeoutMs } from "./useTransactionStepFlow";

const quickSuggestions = {
  ...receiptSuggestions,
  recommendedAccountIds: ["paypay", "cash"],
};
const noHistory = {
  recommendedAccountIds: [],
  automaticCategoryIds: [],
  quickAmounts: [],
};
function quickSetup(overrides: Partial<TransactionStepFlowProps> = {}) {
  return setup({
    suggestionsMerchantId: "seven",
    suggestions: quickSuggestions,
    itemsOptions: receiptItemsOptions,
    ...overrides,
  });
}
function heading(name: string) {
  return screen.queryByRole("heading", { name });
}
function onMerchantScreen() {
  return !!screen.queryByRole("textbox", { name: "搜索商家" });
}
function receiptLine(name: string) {
  return screen.getByRole("button", { name }).parentElement!;
}
function saveButton() {
  return screen.getByRole("button", { name: "保存记账" });
}
// 快速路线等待建议超时后进入小票；测试中用假计时器推进。
function waitQuickRouteTimeout(ms = quickRouteSuggestionTimeoutMs) {
  act(() => vi.advanceTimersByTime(ms));
}
afterEach(() => {
  vi.useRealTimers();
});

describe("TransactionStepFlow", () => {
  it("第 1 屏是选择商家：关闭在左、标题「记一笔」、右侧切换方式，没有进度条", () => {
    setup();
    expect(heading("记一笔")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "关闭记账" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "切换方式" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: /进度/ })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /下一步|去确认|回到确认/ }),
    ).toBeNull();
  });

  it("小票页左上角返回、标题「从商家记账」、右上角关闭，不显示切换方式", () => {
    setup({ initialMerchantId: "seven" });
    expect(heading("从商家记账")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "返回选择商家" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "关闭记账" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "切换方式" })).toBeNull();
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

  it("关闭后重新打开不保留上次内容", () => {
    const view = renderEntryComponent(
      <TransactionStepFlow {...flowFixture} initialMerchantId="seven" />,
    );
    view.rerender(<TransactionStepFlow {...flowFixture} open={false} />);
    view.rerender(<TransactionStepFlow {...flowFixture} />);
    expect(onMerchantScreen()).toBe(true);
  });

  it("通过外框打开方式抽屉并把选择通知外部", () => {
    const { props } = setup();
    click("切换方式");
    click("账户周转");
    expect(props.onMethodChange).toHaveBeenCalledWith("transfer");
  });

  it.each(["返回选择商家", "修改商家：7-Eleven"])(
    "通过%s回到选择商家，换商家后直接回到小票并保留明细",
    async (entry) => {
      const { props, rerender } = quickSetup({
        initialMerchantId: "seven",
        initialAccountId: "paypay",
        itemsOptions: { ...receiptItemsOptions, initialItems: filledItems },
      });
      click(entry);
      expect(heading("记一笔")).toBeInTheDocument();
      click("LIFE超市");
      expect(props.onMerchantSelect).toHaveBeenLastCalledWith(
        flowFixture.merchants[0],
      );
      expect(heading("从商家记账")).toBeInTheDocument();
      // 晚到的新商家建议不覆盖已填内容。
      rerender(
        <TransactionStepFlow
          {...props}
          suggestionsMerchantId="life"
          suggestions={{
            ...quickSuggestions,
            automaticCategoryIds: ["coffee"],
          }}
        />,
      );
      expect(
        screen.getByRole("button", { name: "修改商家：LIFE超市" }),
      ).toBeInTheDocument();
      expect(screen.getByText("餐饮 · 午餐")).toBeInTheDocument();
      expect(screen.getByText("日用品 · 收纳")).toBeInTheDocument();
      expect(screen.queryByText("饮料 · 咖啡")).toBeNull();
      expect(screen.queryByText("自动")).toBeNull();
    },
  );
});

describe("TransactionStepFlow 进入小票", () => {
  it("快速路线有自动明细：选好推荐账户、自动明细待输入，不弹出金额键盘", async () => {
    const { props } = quickSetup();
    click("7-Eleven");
    expect(await screen.findByText("从商家记账")).toBeInTheDocument();
    expect(props.onAccountSelect).toHaveBeenCalledWith(flowFixture.accounts[1]);
    expectAutomaticItems(2);
    expect(
      screen.getByRole("button", { name: "修改明细 1 金额：待输入" }),
    ).toBeInTheDocument();
    expect(receiptLine("更换支付账户 1")).toHaveTextContent("PayPay");
    expect(screen.queryByLabelText("金额计算器")).not.toBeInTheDocument();
    expect(
      screen.getByText("还有 2 条明细没填金额，点一下去填写"),
    ).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it("快速路线没有自动明细：选好推荐账户，明细区只有添加明细", async () => {
    quickSetup({
      suggestions: { ...quickSuggestions, automaticCategoryIds: [] },
    });
    click("7-Eleven");
    expect(await screen.findByText("从商家记账")).toBeInTheDocument();
    expect(receiptLine("更换支付账户 1")).toHaveTextContent("PayPay");
    expect(screen.queryByText(/已按你的习惯/)).toBeNull();
    expect(
      screen.getByRole("button", { name: "添加明细" }),
    ).toBeInTheDocument();
  });

  it("没有历史：显示还没有记录、选择收支账户并禁用保存，选好账户与明细后可以保存", async () => {
    quickSetup({ suggestions: noHistory });
    click("7-Eleven");
    expect(await screen.findByText("这家商家还没有记录")).toBeInTheDocument();
    expect(receiptLine("更换支付账户 1")).toHaveTextContent("选择收支账户");
    expect(receiptLine("更换支付账户 1")).toHaveAttribute(
      "data-invalid",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "请选择收支账户" }),
    ).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    click("更换支付账户 1");
    expect(
      screen.getByText("这家商家还没有记录，按账户顺序显示"),
    ).toBeInTheDocument();
    selectAccount("现金 JPY");
    await waitFor(() =>
      expect(receiptLine("更换支付账户 1")).toHaveTextContent("现金"),
    );
    click("添加明细");
    click("午餐");
    click("确定");
    expect(await screen.findByLabelText("金额计算器")).toBeInTheDocument();
    pressItemAmountKey("8");
    pressItemAmountKey("确定");
    await waitFor(() => expect(saveButton()).toBeEnabled());
  });

  it("选完商家先停在选择商家并显示加载，建议到达后进入小票，只应用一次", async () => {
    const { props, rerender } = quickSetup({ suggestionsMerchantId: "life" });
    click("7-Eleven");
    expect(onMerchantScreen()).toBe(true);
    expect(
      screen.getAllByRole("progressbar", { name: "正在读取 7-Eleven 的记录" }),
    ).toHaveLength(2);
    const loaded = { ...props, suggestionsMerchantId: "seven" };
    rerender(<TransactionStepFlow {...loaded} />);
    expect(await screen.findByText("从商家记账")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    click("删除明细 1");
    rerender(
      <TransactionStepFlow {...loaded} suggestions={{ ...quickSuggestions }} />,
    );
    expectAutomaticItems(1);
  });

  it("超过等待时间仍没有建议时进入小票、不选账户，晚到的建议不再应用", () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { props, rerender } = quickSetup({ suggestionsMerchantId: "life" });
    click("7-Eleven");
    waitQuickRouteTimeout(quickRouteSuggestionTimeoutMs - 1);
    expect(onMerchantScreen()).toBe(true);
    waitQuickRouteTimeout(1);
    expect(heading("从商家记账")).toBeInTheDocument();
    expect(receiptLine("更换支付账户 1")).toHaveTextContent("选择收支账户");
    rerender(<TransactionStepFlow {...props} suggestionsMerchantId="seven" />);
    expect(receiptLine("更换支付账户 1")).toHaveTextContent("选择收支账户");
    expect(screen.queryByText("自动")).toBeNull();
  });

  it("加载中点另一个商家时改为加载新商家，只应用新商家的建议", async () => {
    const { props, rerender } = quickSetup({ suggestionsMerchantId: "coffee" });
    click("7-Eleven");
    click("LIFE超市");
    expect(props.onMerchantSelect).toHaveBeenLastCalledWith(
      flowFixture.merchants[0],
    );
    expect(
      screen.queryByRole("progressbar", { name: "正在读取 7-Eleven 的记录" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("progressbar", { name: "正在读取 LIFE超市 的记录" }),
    ).toHaveLength(2);
    rerender(<TransactionStepFlow {...props} suggestionsMerchantId="life" />);
    expect(
      await screen.findByRole("button", { name: "修改商家：LIFE超市" }),
    ).toBeInTheDocument();
  });

  it("加载中改点另一个商家时重新开始等待计时", () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { props, rerender } = quickSetup({ suggestionsMerchantId: "coffee" });
    click("7-Eleven");
    waitQuickRouteTimeout(quickRouteSuggestionTimeoutMs - 500);
    click("LIFE超市");
    waitQuickRouteTimeout(quickRouteSuggestionTimeoutMs - 1);
    expect(onMerchantScreen()).toBe(true);
    rerender(<TransactionStepFlow {...props} suggestionsMerchantId="life" />);
    expect(heading("从商家记账")).toBeInTheDocument();
    expect(receiptLine("更换支付账户 1")).toHaveTextContent("PayPay");
    expectAutomaticItems(2);
  });

  it("URL 预选商家时直接进入小票并应用建议", () => {
    quickSetup({ initialMerchantId: "seven" });
    expect(heading("从商家记账")).toBeInTheDocument();
    expect(receiptLine("更换支付账户 1")).toHaveTextContent("PayPay");
    expectAutomaticItems(2);
  });

  it("URL 同时带账户时保留该账户，不换成推荐账户", () => {
    quickSetup({ initialMerchantId: "seven", initialAccountId: "cash" });
    expect(receiptLine("更换支付账户 1")).toHaveTextContent("现金");
    expectAutomaticItems(2);
  });
});
