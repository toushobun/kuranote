import { StrictMode } from "react";
import { setupGuardHistoryMock, backFromGuard } from "test/mockGuardHistory";
setupGuardHistoryMock();
import type { TransactionFormInitialValues } from "organisms/transactions/TransactionForm/TransactionForm.types";
import { expectInBodyPortal } from "test/bodyPortal";
import { ReceiptCreationProvider } from "organisms/transactions/ReceiptCreationProvider/ReceiptCreationProvider";
import {
  receiptCreationData,
  receiptCreationPayments,
  expectCreatedReceiptPayment,
  submitReceiptCreation,
  waitMerchantDrawerClosed,
} from "test/receiptCreation";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  renderTransactionFlow as setup,
  renderEntryComponent,
  clickEntryButton as click,
  selectEntryAccount as selectAccount,
} from "test/transactionStepFlow";
import {
  expectAutomaticItems,
  receiptLine,
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
function saveButton() {
  return screen.getByRole("button", { name: "保存记账" });
}
// 快速路线等待建议超时后进入小票；测试中用假计时器推进。
function waitQuickRouteTimeout(ms = quickRouteSuggestionTimeoutMs) {
  act(() => vi.advanceTimersByTime(ms));
}
// 小票里添加一条午餐明细，不填金额直接关闭金额键盘。
async function addLunchItem() {
  click("添加明细");
  fireEvent.click(await screen.findByRole("button", { name: "午餐" }));
  click("确定");
  await screen.findByLabelText("金额计算器");
  click("关闭金额键盘");
  await waitKeypadClosed();
}
// 编辑第 1 条明细（午餐）并保存；金额为空，关闭随后弹出的金额键盘。
async function editLunchItem(change: () => void | Promise<void>) {
  click("编辑明细 1");
  await screen.findByRole("button", { name: "保存修改" });
  await change();
  click("保存修改");
  await screen.findByLabelText("金额计算器");
  click("关闭金额键盘");
  await waitKeypadClosed();
}
function changeLunchToStorage() {
  return editLunchItem(async () => {
    fireEvent.change(
      await screen.findByRole("textbox", { name: "搜索小分类" }),
      { target: { value: "收纳" } },
    );
    fireEvent.click(await screen.findByRole("button", { name: "收纳" }));
  });
}
function waitKeypadClosed() {
  return waitFor(() =>
    expect(screen.queryByLabelText("金额计算器")).not.toBeInTheDocument(),
  );
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

  it("小票页显示关闭和标题「从商家记账」，没有返回或切换方式", () => {
    quickSetup();
    click("7-Eleven");
    expect(heading("从商家记账")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /返回/ })).toBeNull();
    expect(
      screen.getByRole("button", { name: "关闭记账" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "切换方式" })).toBeNull();
  });

  it("StrictMode 重挂载的干净首屏不压哨兵，卸载不产生历史遍历", async () => {
    const view = renderEntryComponent(
      <StrictMode>
        <TransactionStepFlow {...flowFixture} />
      </StrictMode>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(window.history.pushState).not.toHaveBeenCalled();
    view.unmount();
    await act(async () => {
      await Promise.resolve();
    });
    expect(window.history.go).not.toHaveBeenCalled();
  });
  it("快速路线仍在等待建议时关闭不弹无法保存的确认", async () => {
    const { props } = quickSetup({ suggestionsMerchantId: "life" });
    click("7-Eleven");
    expect(onMerchantScreen()).toBe(true);
    expect(screen.queryByRole("button", { name: "保存记账" })).toBeNull();
    click("关闭记账");
    await waitFor(() => expect(props.onClose).toHaveBeenCalledOnce());
    expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull();
  });

  it("首屏未修改直接关闭，搜索商家不算修改", async () => {
    const { props } = quickSetup();
    fireEvent.change(screen.getByRole("textbox", { name: "搜索商家" }), {
      target: { value: "关键词" },
    });
    click("关闭记账");
    await waitFor(() => expect(props.onClose).toHaveBeenCalledOnce());
    expect(screen.queryByText("尚未保存")).toBeNull();
  });
  it("小票修改后关闭：继续编辑保留内容，放弃只关闭本流程", async () => {
    const { props } = quickSetup();
    click("7-Eleven");
    click("关闭记账");
    expect(
      screen.getByRole("dialog", { name: "尚未保存" }),
    ).toBeInTheDocument();
    click("继续编辑");
    expect(props.onClose).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull(),
    );
    click("关闭记账");
    click("放弃修改");
    await waitFor(() => expect(props.onClose).toHaveBeenCalledOnce());
  });

  it("关闭后重新打开不保留上次内容", () => {
    const view = quickSetup();
    click("7-Eleven");
    expect(onMerchantScreen()).toBe(false);
    view.rerender(<TransactionStepFlow {...view.props} open={false} />);
    view.rerender(<TransactionStepFlow {...view.props} />);
    expect(onMerchantScreen()).toBe(true);
  });

  it("通过外框打开方式抽屉并把选择通知外部", () => {
    const { props } = setup();
    click("切换方式");
    click("账户周转");
    expect(props.onMethodChange).toHaveBeenCalledWith("transfer");
  });

  it("通过小票商家入口打开抽屉，保留已填明细并追加新商家的常用明细", async () => {
    const { props, rerender } = quickSetup({
      suggestions: { ...quickSuggestions, automaticCategoryIds: [] },
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: filledItems,
        initialPayments: [{ accountId: "paypay", amount: null }],
      },
    });
    click("7-Eleven");
    click("修改商家：7-Eleven");
    expect(screen.getByRole("heading", { name: "商家" })).toBeInTheDocument();
    click("LIFE超市");
    expect(props.onMerchantSelect).toHaveBeenLastCalledWith(
      flowFixture.merchants[0],
    );
    await waitFor(() => expect(heading("从商家记账")).toBeInTheDocument());
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
    expect(screen.getByText("饮料 · 咖啡")).toBeInTheDocument();
    expectAutomaticItems(1);
  });
});

describe("TransactionStepFlow 换商家", () => {
  it("抽屉内换商家立即关闭且不触发快速路线，超过两秒仍留在同一个小票", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const view = quickSetup({ suggestions: noHistory });
    click("7-Eleven");
    const form = saveButton().closest("form");
    click("修改商家：7-Eleven");
    click("LIFE超市");
    await waitMerchantDrawerClosed();
    expect(
      screen.getByRole("button", { name: "修改商家：LIFE超市" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(onMerchantScreen()).toBe(false);
    expect(saveButton().closest("form")).toBe(form);
    waitQuickRouteTimeout();
    expect(saveButton().closest("form")).toBe(form);
    expect(heading("从商家记账")).toBeInTheDocument();
    view.rerender(
      <TransactionStepFlow
        {...view.props}
        suggestionsMerchantId="life"
        suggestions={quickSuggestions}
      />,
    );
    expect(receiptLine("更换支付账户 1")).toHaveTextContent("PayPay");
  });

  it("用户手动选择的账户不被新商家的推荐账户覆盖", async () => {
    await switchToLife(["storage"], {
      beforeSwitch: async () => {
        click("更换支付账户 1");
        selectAccount("现金 JPY");
        await waitFor(() =>
          expect(screen.queryByRole("radio", { name: "现金 JPY" })).toBeNull(),
        );
      },
    });
    expect(receiptLine("更换支付账户 1")).toHaveTextContent("现金");
  });

  // 快速路线选 7-Eleven（自动明细：午餐、咖啡），再从小票换成 LIFE超市。
  // beforeSwitch 在换商家前操作小票，whileWaiting 在 LIFE超市 的建议到达前操作。
  async function switchToLife(
    automaticCategoryIds: string[],
    {
      beforeSwitch,
      whileWaiting,
    }: {
      beforeSwitch?: () => Promise<void>;
      whileWaiting?: () => Promise<void>;
    } = {},
  ) {
    const view = quickSetup();
    click("7-Eleven");
    expect(await screen.findByText("从商家记账")).toBeInTheDocument();
    await beforeSwitch?.();
    click("修改商家：7-Eleven");
    click("LIFE超市");
    await waitMerchantDrawerClosed();
    await whileWaiting?.();
    view.rerender(
      <TransactionStepFlow
        {...view.props}
        suggestionsMerchantId="life"
        suggestions={{ ...quickSuggestions, automaticCategoryIds }}
      />,
    );
    return view;
  }

  it("去掉上一个商家没填金额的自动明细，同一分类不重复追加并留作新商家的自动明细", async () => {
    await switchToLife(["coffee", "storage"]);
    expect(screen.queryByText("餐饮 · 午餐")).toBeNull();
    expect(screen.getAllByText("饮料 · 咖啡")).toHaveLength(1);
    expect(screen.getByText("日用品 · 收纳")).toBeInTheDocument();
    expectAutomaticItems(2);
  });

  it("保留填了金额的自动明细，不再追加同一分类的空明细", async () => {
    await switchToLife(["lunch", "storage"], {
      beforeSwitch: async () => {
        click("修改明细 1 金额：待输入");
        await screen.findByLabelText("金额计算器");
        pressItemAmountKey("8");
        pressItemAmountKey("确定");
        await waitKeypadClosed();
      },
    });
    expect(screen.getAllByText("餐饮 · 午餐")).toHaveLength(1);
    expect(screen.queryByText("饮料 · 咖啡")).toBeNull();
    expect(screen.getByText("日用品 · 收纳")).toBeInTheDocument();
    expectAutomaticItems(1);
  });

  it("保留改了分类的自动明细", async () => {
    await switchToLife([], { beforeSwitch: changeLunchToStorage });
    expect(screen.getByText("日用品 · 收纳")).toBeInTheDocument();
    expect(screen.queryByText("餐饮 · 午餐")).toBeNull();
    expect(screen.queryByText("饮料 · 咖啡")).toBeNull();
    expect(screen.queryByText(/已按你的习惯/)).toBeNull();
  });

  it("保留手动添加的空明细", async () => {
    await switchToLife(["storage"], { beforeSwitch: addLunchItem });
    expect(screen.getAllByText("餐饮 · 午餐")).toHaveLength(1);
    expect(screen.queryByText("饮料 · 咖啡")).toBeNull();
    expectAutomaticItems(1);
  });

  it.each<[string, () => Promise<void>]>([
    ["改了分类", changeLunchToStorage],
    [
      "设了待报销",
      () =>
        editLunchItem(() => {
          fireEvent.click(screen.getByRole("checkbox", { name: "待报销" }));
        }),
    ],
    [
      "改了备注",
      async () => {
        click("修改备注：添加备注");
        fireEvent.change(screen.getByRole("textbox", { name: "备注" }), {
          target: { value: "一起吃午餐" },
        });
        click("完成");
        await waitFor(() =>
          expect(screen.queryByRole("textbox", { name: "备注" })).toBeNull(),
        );
      },
    ],
  ])("建议到达前%s时，不再应用新商家的建议", async (_, touch) => {
    await switchToLife(["storage"], { whileWaiting: touch });
    expect(screen.getByText("饮料 · 咖啡")).toBeInTheDocument();
    expect(screen.queryAllByText("日用品 · 收纳").length).toBeLessThanOrEqual(
      1,
    );
  });

  it("建议到达时正在编辑明细，不删除该明细，草稿可以继续保存", async () => {
    await switchToLife(["storage"], {
      whileWaiting: async () => {
        click("编辑明细 1");
        fireEvent.change(
          await screen.findByRole("textbox", { name: "搜索小分类" }),
          { target: { value: "咖啡" } },
        );
        fireEvent.click(await screen.findByRole("button", { name: "咖啡" }));
      },
    });
    click("保存修改");
    await screen.findByLabelText("金额计算器");
    click("关闭金额键盘");
    await waitKeypadClosed();
    expect(screen.getAllByText("饮料 · 咖啡")).toHaveLength(2);
    expect(screen.queryByText("日用品 · 收纳")).toBeNull();
  });

  it("建议到达时正在输入明细金额，不删除该明细，金额可以继续确认", async () => {
    await switchToLife(["storage"], {
      whileWaiting: async () => {
        click("修改明细 1 金额：待输入");
        await screen.findByLabelText("金额计算器");
        pressItemAmountKey("8");
      },
    });
    pressItemAmountKey("确定");
    await waitKeypadClosed();
    expect(
      screen.getByRole("button", { name: "修改明细 1 金额：¥8" }),
    ).toBeInTheDocument();
    expect(screen.getByText("餐饮 · 午餐")).toBeInTheDocument();
    expect(screen.queryByText("日用品 · 收纳")).toBeNull();
  });

  it("重新选同一个商家时明细不变", async () => {
    const { props, rerender } = quickSetup();
    click("7-Eleven");
    expect(await screen.findByText("从商家记账")).toBeInTheDocument();
    click("删除明细 1");
    click("修改商家：7-Eleven");
    click("7-Eleven");
    await waitMerchantDrawerClosed();
    rerender(
      <TransactionStepFlow {...props} suggestions={{ ...quickSuggestions }} />,
    );
    expect(screen.queryByText("餐饮 · 午餐")).toBeNull();
    expectAutomaticItems(1);
  });
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

  it("超过等待时间仍没有建议时进入小票、不选账户；没动过小票时只补上当前商家晚到的建议一次", () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { props, rerender } = quickSetup({ suggestionsMerchantId: "life" });
    click("7-Eleven");
    waitQuickRouteTimeout(quickRouteSuggestionTimeoutMs - 1);
    expect(onMerchantScreen()).toBe(true);
    waitQuickRouteTimeout(1);
    expect(heading("从商家记账")).toBeInTheDocument();
    expect(receiptLine("更换支付账户 1")).toHaveTextContent("选择收支账户");
    // 其他商家的建议不应用。
    rerender(<TransactionStepFlow {...props} suggestionsMerchantId="coffee" />);
    expect(screen.queryByText(/已按你的习惯/)).toBeNull();
    rerender(<TransactionStepFlow {...props} suggestionsMerchantId="seven" />);
    expect(receiptLine("更换支付账户 1")).toHaveTextContent("PayPay");
    expectAutomaticItems(2);
    click("删除明细 1");
    rerender(
      <TransactionStepFlow
        {...props}
        suggestionsMerchantId="seven"
        suggestions={{ ...quickSuggestions }}
      />,
    );
    expectAutomaticItems(1);
  });

  it.each<[string, () => Promise<void>]>([
    [
      "选了账户",
      async () => {
        click("更换支付账户 1");
        await screen.findByRole("radio", { name: "现金 JPY" });
        selectAccount("现金 JPY");
        await waitFor(() =>
          expect(receiptLine("更换支付账户 1")).toHaveTextContent("现金"),
        );
      },
    ],
    ["加了明细", addLunchItem],
    [
      "加了又删了明细",
      async () => {
        await addLunchItem();
        click("删除明细 1");
      },
    ],
  ])("超时后%s，晚到的建议不再应用", async (_, touch) => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { props, rerender } = quickSetup({ suggestionsMerchantId: "life" });
    click("7-Eleven");
    waitQuickRouteTimeout();
    await touch();
    const account = receiptLine("更换支付账户 1").textContent;
    rerender(<TransactionStepFlow {...props} suggestionsMerchantId="seven" />);
    expect(receiptLine("更换支付账户 1").textContent).toBe(account);
    expect(screen.queryByText(/已按你的习惯/)).toBeNull();
    expect(screen.queryByText("饮料 · 咖啡")).toBeNull();
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
});

describe("TransactionStepFlow 编辑明细", () => {
  it.each([
    ["已有金额时不打开金额键盘", "800", false],
    ["金额为空时打开金额键盘", "", true],
  ])("保存修改后，%s", async (_, amount, opens) => {
    quickSetup({
      suggestions: noHistory,
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: [{ categoryId: "lunch", amount }],
      },
    });
    click("7-Eleven");
    click("编辑明细 1");
    await screen.findByRole("button", { name: "保存修改" });
    click("保存修改");
    if (opens)
      expect(await screen.findByLabelText("金额计算器")).toBeInTheDocument();
    else
      await waitFor(() =>
        expect(screen.queryByRole("button", { name: "保存修改" })).toBeNull(),
      );
    expect(!!screen.queryByLabelText("金额计算器")).toBe(opens);
  });
});

describe("TransactionStepFlow 页内新增", () => {
  function setupCreationFlow(
    initialPayments: TransactionFormInitialValues["payments"] = receiptCreationPayments,
  ) {
    const view = renderEntryComponent(
      <ReceiptCreationProvider data={receiptCreationData()}>
        <TransactionStepFlow
          {...flowFixture}
          suggestionsMerchantId="seven"
          suggestions={noHistory}
          itemsOptions={{
            ...receiptItemsOptions,
            initialItems: [{ categoryId: "lunch", amount: "800" }],
            initialPayments,
          }}
        />
      </ReceiptCreationProvider>,
    );
    click("7-Eleven");
    return { ...view, form: saveButton().closest("form")! };
  }

  it("从小票商家抽屉新增后自动选中并留在原小票，成功提示挂载到 body", async () => {
    const { container, form } = setupCreationFlow([
      { accountId: "paypay", amount: null },
    ]);
    const flowDialog = screen.getByRole("dialog");
    expectInBodyPortal(flowDialog, ".MuiDialog-root", container);
    click("修改商家：7-Eleven");
    click("新增商家");
    const feedback = await submitReceiptCreation("merchant", "新商家");
    expectInBodyPortal(feedback, ".MuiSnackbar-root", container, flowDialog);
    await screen.findByRole("button", { name: "修改商家：新商家" });
    expect(saveButton().closest("form")).toBe(form);
    expect(new FormData(form).getAll("itemAmount")).toEqual(["800"]);
    expect(new FormData(form).get("accountId")).toBe("paypay");
  });

  it.each([1, 2])(
    "在新增小票第 %i 行取消不改内容，保存后只替换发起行",
    async (row) => {
      const { form } = setupCreationFlow();
      const before = [...new FormData(form).entries()];
      click(`更换支付账户 ${row}`);
      click("新增账户");
      fireEvent.change(await screen.findByLabelText(/账户名称/), {
        target: { value: "取消的内容" },
      });
      click("取消");
      click("放弃修改");
      await screen.findByRole("button", { name: "新增账户" });
      expect([...new FormData(form).entries()]).toEqual(before);
      click("新增账户");
      await submitReceiptCreation("account", "新账户");
      await screen.findByRole("button", { name: `更换支付账户 ${row}` });
      expectCreatedReceiptPayment(form, row);
    },
  );
  it("后退先确认全屏商家自身，放弃后保留父小票和抽屉搜索，再后退只关抽屉", async () => {
    const { container, form } = setupCreationFlow();
    const before = [...new FormData(form).entries()];
    click("修改商家：7-Eleven");
    const search = screen.getByRole("textbox", { name: "搜索商家" });
    fireEvent.change(search, { target: { value: "LIFE" } });
    click("新增商家");
    const name = await screen.findByLabelText(/商家名称/);
    fireEvent.change(name, { target: { value: "子层草稿" } });
    const editor = name.closest(".MuiDialog-root")!;
    await backFromGuard();
    const confirmation = await screen.findByRole("dialog", {
      name: "尚未保存",
    });
    expectInBodyPortal(
      confirmation,
      ".MuiDialog-root",
      container,
      editor as HTMLElement,
    );
    expect(
      Number(getComputedStyle(confirmation.closest(".MuiDialog-root")!).zIndex),
    ).toBeGreaterThan(Number(getComputedStyle(editor).zIndex));
    click("继续编辑");
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull(),
    );
    expect(name).toHaveValue("子层草稿");
    await backFromGuard(2);
    await screen.findByRole("dialog", { name: "尚未保存" });
    click("放弃修改");
    await waitFor(() => expect(editor).not.toBeInTheDocument());
    expect(screen.getByRole("textbox", { name: "搜索商家" })).toBe(search);
    expect(search).toHaveValue("LIFE");
    expect([...new FormData(form).entries()]).toEqual(before);
    await backFromGuard();
    await waitMerchantDrawerClosed();
    expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull();
    expect(saveButton().closest("form")).toBe(form);
    await backFromGuard();
    await screen.findByRole("dialog", { name: "尚未保存" });
  });
  it("全屏商家预填是初值，输入还原后后退直接关闭且不改父数据", async () => {
    const { form } = setupCreationFlow();
    const before = [...new FormData(form).entries()];
    click("修改商家：7-Eleven");
    fireEvent.change(screen.getByRole("textbox", { name: "搜索商家" }), {
      target: { value: "预填名称" },
    });
    click("新增商家");
    const name = await screen.findByLabelText(/商家名称/);
    expect(name).toHaveValue("预填名称");
    fireEvent.change(name, { target: { value: "修改" } });
    fireEvent.change(name, { target: { value: "预填名称" } });
    await backFromGuard();
    await screen.findByRole("button", { name: "新增商家" });
    expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull();
    expect([...new FormData(form).entries()]).toEqual(before);
  });
  it.each(["备注", "支付账户", "金额", "明细"])(
    "后退按%s编辑层的取消语义关闭，不确认父小票",
    async (kind) => {
      const { form } = setupCreationFlow();
      if (kind === "备注") click("修改备注：添加备注");
      if (kind === "支付账户") click("更换支付账户 1");
      if (kind === "金额") {
        fireEvent.click(
          screen.getByRole("button", { name: /^修改明细 1 金额/ }),
        );
        await screen.findByLabelText("金额计算器");
      }
      if (kind === "明细") click("编辑明细 1");
      await backFromGuard();
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "关闭记账" })).toBeVisible(),
      );
      expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull();
      expect(saveButton().closest("form")).toBe(form);
    },
  );
  it("新增账户的金额键盘后退丢弃草稿，第二次后退关闭干净的账户层", async () => {
    const { form } = setupCreationFlow();
    const before = [...new FormData(form).entries()];
    click("更换支付账户 1");
    click("新增账户");
    const balance = await screen.findByLabelText("初始金额");
    fireEvent.focus(balance);
    await screen.findByLabelText("金额计算器");
    pressItemAmountKey("8");
    await backFromGuard();
    await waitKeypadClosed();
    expect(balance).toHaveValue("0");
    await backFromGuard();
    await screen.findByRole("button", { name: "新增账户" });
    expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull();
    expect([...new FormData(form).entries()]).toEqual(before);
  });
});
