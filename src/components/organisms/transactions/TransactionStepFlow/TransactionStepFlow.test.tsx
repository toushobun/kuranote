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
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  renderTransactionFlow as setup,
  renderEntryComponent,
  clickEntryButton as click,
  selectEntryAccount as selectAccount,
  selectEntryMerchant,
} from "test/transactionStepFlow";
import {
  expectAutomaticNotice,
  expectNoPaymentRow,
  expectSuggestionsLoadingRows,
  receiptLine,
  pressItemAmountKey,
} from "test/transactionConfirmStep";
import {
  filledItems,
  receiptFlowFixture,
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
function merchantDrawerOpen() {
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
  await screen.findByRole("button", { name: "午餐", pressed: true });
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
function markLunchPendingReimbursement() {
  return editLunchItem(() => {
    fireEvent.click(screen.getByRole("checkbox", { name: "待报销" }));
  });
}
async function openLunchAmount() {
  click("修改明细 1 金额：待输入");
  await screen.findByLabelText("金额计算器");
}
async function confirmLunchAmount() {
  await openLunchAmount();
  pressItemAmountKey("8");
  pressItemAmountKey("确定");
  await waitKeypadClosed();
}
async function changeReceiptNote() {
  click("修改备注：添加备注");
  fireEvent.change(screen.getByRole("textbox", { name: "备注" }), {
    target: { value: "一起吃午餐" },
  });
  click("完成");
  await waitFor(() =>
    expect(screen.queryByRole("textbox", { name: "备注" })).toBeNull(),
  );
}
async function changeReceiptTime() {
  const hourLabel = `选择 ${(new Date().getHours() + 1) % 24} 时`;
  fireEvent.click(screen.getByRole("button", { name: /^修改时间：/ }));
  fireEvent.click(screen.getByRole("button", { name: /时刻/ }));
  fireEvent.click(screen.getByLabelText(hourLabel));
  fireEvent.click(screen.getByText("完成", { selector: "button" }));
  await waitFor(() => expect(screen.queryByLabelText(hourLabel)).toBeNull());
}
async function chooseCashPayment(firstPayment = false) {
  click(firstPayment ? "添加付款账户" : "更换支付账户 1");
  await screen.findByRole("radio", { name: "现金 JPY" });
  selectAccount("现金 JPY");
  await waitFor(() =>
    expect(receiptLine("更换支付账户 1")).toHaveTextContent("现金"),
  );
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
  it("打开直接显示空小票、关闭和切换方式，没有进度条", () => {
    setup();
    expect(heading("从商家记账")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "修改商家：请选择商家" }),
    ).toBeVisible();
    expect(merchantDrawerOpen()).toBe(false);
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

  it.each(["头像", "文字"])("点击空商家%s打开抽屉", (part) => {
    setup();
    const button = screen.getByRole("button", { name: "修改商家：请选择商家" });
    fireEvent.click(
      part === "头像"
        ? within(button).getByTestId("StorefrontOutlinedIcon")
        : within(button).getByText("请选择商家"),
    );
    expect(merchantDrawerOpen()).toBe(true);
  });

  it("自动带出后仍显示关闭和切换方式", async () => {
    quickSetup();
    await selectEntryMerchant("7-Eleven");
    expect(heading("从商家记账")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /返回/ })).toBeNull();
    expect(
      screen.getByRole("button", { name: "关闭记账" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "切换方式" })).toBeVisible();
  });

  it("StrictMode 重挂载的空小票不压哨兵，卸载不产生历史遍历", async () => {
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
    await selectEntryMerchant("7-Eleven");
    expectSuggestionsLoadingRows(true);
    expect(saveButton()).toBeVisible();
    click("关闭记账");
    await waitFor(() => expect(props.onClose).toHaveBeenCalledOnce());
    expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull();
  });

  it("添加付款账户再删除，内容虽回到原样，关闭时仍要确认", async () => {
    const { props } = quickSetup();
    await selectEntryMerchant("7-Eleven");
    await screen.findByRole("button", { name: "保存记账" });
    click("添加付款账户");
    selectAccount("现金 JPY");
    await screen.findByRole("button", { name: "删除支付账户 2" });
    click("删除支付账户 2");
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "删除支付账户 2" }),
      ).toBeNull(),
    );
    click("关闭记账");
    expect(
      await screen.findByRole("dialog", { name: "尚未保存" }),
    ).toBeInTheDocument();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("搜索商家后关闭抽屉，再关闭小票无需确认", async () => {
    const { props } = quickSetup();
    click("修改商家：请选择商家");
    fireEvent.change(screen.getByRole("textbox", { name: "搜索商家" }), {
      target: { value: "关键词" },
    });
    click("关闭商家编辑");
    await waitMerchantDrawerClosed();
    click("关闭记账");
    await waitFor(() => expect(props.onClose).toHaveBeenCalledOnce());
    expect(screen.queryByText("尚未保存")).toBeNull();
  });
  it("小票修改后关闭：继续编辑保留内容，放弃只关闭本流程", async () => {
    const { props } = quickSetup();
    await selectEntryMerchant("7-Eleven");
    click("修改备注：添加备注");
    fireEvent.change(screen.getByRole("textbox", { name: "备注" }), {
      target: { value: "手动备注" },
    });
    click("完成");
    fireEvent.click(await screen.findByRole("button", { name: "关闭记账" }));
    expect(
      screen.getByRole("dialog", { name: "尚未保存" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "保存并退出" }),
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

  it.each<[string, TransactionStepFlowProps["suggestions"]]>([
    ["有历史的商家", quickSuggestions],
    ["没有历史的商家", noHistory],
  ])("只选%s时退出不弹确认，自动填写不算修改", async (_, suggestions) => {
    const { props } = quickSetup({ suggestions });
    await selectEntryMerchant("7-Eleven");
    await screen.findByRole("button", { name: "保存记账" });
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
    click("关闭记账");
    await waitFor(() => expect(props.onClose).toHaveBeenCalledOnce());
    expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull();
  });

  it("从小票换商家后自动替换明细，未手动填写时退出也不弹确认", async () => {
    const { props, rerender } = quickSetup();
    await selectEntryMerchant("7-Eleven");
    await screen.findByRole("button", { name: "保存记账" });
    click("修改商家：7-Eleven");
    click("LIFE超市");
    await waitMerchantDrawerClosed();
    rerender(
      <TransactionStepFlow
        {...props}
        suggestionsMerchantId="life"
        suggestions={{ ...quickSuggestions, automaticCategoryIds: ["storage"] }}
      />,
    );
    await screen.findByText("收纳");
    click("关闭记账");
    await waitFor(() => expect(props.onClose).toHaveBeenCalledOnce());
    expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull();
  });

  it.each<[string, () => Promise<void>]>([
    [
      "付款账户",
      async () => {
        click("添加付款账户");
        selectAccount("现金 JPY");
        await waitFor(() =>
          expect(receiptLine("更换支付账户 1")).toHaveTextContent("现金"),
        );
      },
    ],
    [
      "备注",
      async () => {
        click("修改备注：添加备注");
        fireEvent.change(screen.getByRole("textbox", { name: "备注" }), {
          target: { value: "手动修改" },
        });
        click("完成");
        await waitFor(() =>
          expect(screen.queryByRole("textbox", { name: "备注" })).toBeNull(),
        );
      },
    ],
    [
      "明细",
      async () => {
        await addLunchItem();
      },
    ],
    ["时间", changeReceiptTime],
  ])("手动修改%s后关闭才弹未保存确认", async (_, change) => {
    quickSetup({ suggestions: noHistory });
    await selectEntryMerchant("7-Eleven");
    await screen.findByRole("button", { name: "保存记账" });
    await change();
    click("关闭记账");
    expect(
      await screen.findByRole("dialog", { name: "尚未保存" }),
    ).toBeInTheDocument();
  });

  it("退出确认保存校验失败时留在小票，修复后正常保存且无残留离开意图", async () => {
    const action = vi.fn(async () => ({}));
    const { props } = quickSetup({ suggestions: noHistory, action });
    await selectEntryMerchant("7-Eleven");
    click("修改备注：添加备注");
    fireEvent.change(screen.getByRole("textbox", { name: "备注" }), {
      target: { value: "购买日用品" },
    });
    click("完成");
    fireEvent.click(await screen.findByRole("button", { name: "关闭记账" }));
    click("保存并退出");
    expect(
      await screen.findByRole("button", { name: "请添加付款账户" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "请添加明细" }),
    ).toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
    click("请添加付款账户");
    selectAccount("现金 JPY");
    await waitFor(() =>
      expect(receiptLine("更换支付账户 1")).toHaveTextContent("现金"),
    );
    await addLunchItem();
    // 已解决的提示消失；新出现的问题等下一次保存才提示。
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
    expect(screen.queryByText(/还有 1 条明细没填金额/)).toBeNull();
    click("保存记账");
    expect(
      await screen.findByText(/还有 1 条明细没填金额/),
    ).toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
    click("修改明细 1 金额：待输入");
    pressItemAmountKey("8");
    pressItemAmountKey("确定");
    await waitKeypadClosed();
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
    click("保存记账");
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("从商家记账保存并关闭时，小票上的成功提示不会闪现", async () => {
    const action = vi.fn(async () => ({ success: "记账成功" }));
    const { props, rerender } = quickSetup({
      ...receiptFlowFixture,
      action,
      suggestions: noHistory,
    });
    await selectEntryMerchant("7-Eleven");
    await screen.findByRole("button", { name: "保存记账" });
    click("删除明细 2");

    click("关闭记账");
    click("保存并退出");
    await waitFor(() => expect(props.onClose).toHaveBeenCalledOnce());
    await waitFor(() => expect(saveButton()).toBeEnabled());
    expect(screen.queryByText("记账成功", { exact: true })).toBeNull();
    expect(screen.queryByText("保存成功", { exact: true })).toBeNull();

    rerender(<TransactionStepFlow {...props} open={false} />);
    expect(await screen.findByRole("status")).toHaveTextContent("保存成功");
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("关闭后重新打开不保留上次内容", async () => {
    const view = quickSetup();
    await selectEntryMerchant("7-Eleven");
    expect(merchantDrawerOpen()).toBe(false);
    view.rerender(<TransactionStepFlow {...view.props} open={false} />);
    view.rerender(<TransactionStepFlow {...view.props} />);
    expect(
      screen.getByRole("button", { name: "修改商家：请选择商家" }),
    ).toBeVisible();
  });

  it("通过外框打开方式抽屉，清理历史后通知外部切换方式", async () => {
    const { props } = setup();
    click("切换方式");
    click("账户周转");
    await waitFor(() =>
      expect(props.onMethodChange).toHaveBeenCalledWith("transfer"),
    );
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
    await selectEntryMerchant("7-Eleven");
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
    expect(screen.getByText("午餐")).toBeInTheDocument();
    expect(screen.getByText("收纳")).toBeInTheDocument();
    expect(screen.getByText("咖啡")).toBeInTheDocument();
    expectAutomaticNotice();
  });
});

describe("TransactionStepFlow 换商家", () => {
  it("抽屉内换商家立即关闭且不触发快速路线，超过两秒仍留在同一个小票", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const view = quickSetup({ suggestions: noHistory });
    await selectEntryMerchant("7-Eleven");
    const form = saveButton().closest("form");
    click("修改商家：7-Eleven");
    click("LIFE超市");
    await waitMerchantDrawerClosed();
    expect(
      screen.getByRole("button", { name: "修改商家：LIFE超市" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(merchantDrawerOpen()).toBe(false);
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
      beforeSwitch: chooseCashPayment,
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
    await selectEntryMerchant("7-Eleven");
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
    expect(screen.queryByText("午餐")).toBeNull();
    expect(screen.getAllByText("咖啡")).toHaveLength(1);
    expect(screen.getByText("收纳")).toBeInTheDocument();
    expectAutomaticNotice();
  });

  it("保留填了金额的自动明细，不再追加同一分类的空明细", async () => {
    await switchToLife(["lunch", "storage"], {
      beforeSwitch: async () => {
        await confirmLunchAmount();
        expectAutomaticNotice(false);
      },
    });
    expect(screen.getAllByText("午餐")).toHaveLength(1);
    expect(screen.queryByText("咖啡")).toBeNull();
    expect(screen.getByText("收纳")).toBeInTheDocument();
    expectAutomaticNotice();
  });

  it("保留改了分类的自动明细", async () => {
    await switchToLife([], { beforeSwitch: changeLunchToStorage });
    expect(screen.getByText("收纳")).toBeInTheDocument();
    expect(screen.queryByText("午餐")).toBeNull();
    expect(screen.queryByText("咖啡")).toBeNull();
    expectAutomaticNotice(false);
  });

  it.each([
    { categoryIds: ["lunch"], visible: true },
    { categoryIds: [], visible: false },
  ])(
    "换商家没有带入新内容且保留分类 $categoryIds 时，提示可见性为 $visible",
    async ({ categoryIds, visible }) => {
      await switchToLife(categoryIds);
      expectAutomaticNotice(visible);
    },
  );

  it("已隐藏的提示在换商家只保留自动明细时仍隐藏", async () => {
    await switchToLife(["lunch", "coffee"], { beforeSwitch: addLunchItem });
    expectAutomaticNotice(false);
  });

  it("保留手动添加的空明细", async () => {
    await switchToLife(["storage"], { beforeSwitch: addLunchItem });
    expect(screen.getAllByText("午餐")).toHaveLength(1);
    expect(screen.queryByText("咖啡")).toBeNull();
    expectAutomaticNotice();
  });

  it.each<[string, () => Promise<void>]>([
    ["改了分类", changeLunchToStorage],
    ["设了待报销", markLunchPendingReimbursement],
    ["改了备注", changeReceiptNote],
  ])("建议到达前%s时，不再应用新商家的建议", async (_, touch) => {
    await switchToLife(["storage"], { whileWaiting: touch });
    expect(screen.getByText("咖啡")).toBeInTheDocument();
    expect(screen.queryAllByText("收纳").length).toBeLessThanOrEqual(1);
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
    expect(screen.getAllByText("咖啡")).toHaveLength(2);
    expect(screen.queryByText("收纳")).toBeNull();
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
    expect(screen.getByText("午餐")).toBeInTheDocument();
    expect(screen.queryByText("收纳")).toBeNull();
  });

  it("重新选同一个商家时明细不变", async () => {
    const { props, rerender } = quickSetup();
    await selectEntryMerchant("7-Eleven");
    expect(await screen.findByText("从商家记账")).toBeInTheDocument();
    click("删除明细 1");
    click("修改商家：7-Eleven");
    await selectEntryMerchant("7-Eleven");
    await waitMerchantDrawerClosed();
    rerender(
      <TransactionStepFlow {...props} suggestions={{ ...quickSuggestions }} />,
    );
    expect(screen.queryByText("午餐")).toBeNull();
    expectAutomaticNotice(false);
  });
});

describe("TransactionStepFlow 进入小票", () => {
  it("快速路线有自动明细：选好推荐账户、自动明细待输入，不弹出金额键盘", async () => {
    const { props } = quickSetup();
    await selectEntryMerchant("7-Eleven");
    expect(await screen.findByText("从商家记账")).toBeInTheDocument();
    expect(props.onAccountSelect).toHaveBeenCalledWith(flowFixture.accounts[1]);
    expectAutomaticNotice();
    expect(
      screen.getByRole("button", { name: "修改明细 1 金额：待输入" }),
    ).toBeInTheDocument();
    expect(receiptLine("更换支付账户 1")).toHaveTextContent("PayPay");
    expect(screen.queryByLabelText("金额计算器")).not.toBeInTheDocument();
    expect(
      screen.queryByText("还有 2 条明细没填金额，点一下去填写"),
    ).toBeNull();
    expect(saveButton()).toBeEnabled();
    click("保存记账");
    expect(
      screen.getByText("还有 2 条明细没填金额，点一下去填写"),
    ).toBeInTheDocument();
  });

  it("快速路线只自动选好推荐账户时也显示提示", async () => {
    quickSetup({
      suggestions: { ...quickSuggestions, automaticCategoryIds: [] },
    });
    await selectEntryMerchant("7-Eleven");
    expect(await screen.findByText("从商家记账")).toBeInTheDocument();
    expect(receiptLine("更换支付账户 1")).toHaveTextContent("PayPay");
    expectAutomaticNotice();
    expect(
      screen.getByRole("button", { name: "添加明细" }),
    ).toBeInTheDocument();
  });

  it("没有历史：首次不提示，保存时提示缺项，补齐后可以保存", async () => {
    quickSetup({ suggestions: noHistory });
    await selectEntryMerchant("7-Eleven");
    await screen.findByRole("button", { name: "添加明细" });
    expectSuggestionsLoadingRows(false);
    expect(screen.queryByText("这家商家还没有记录")).toBeNull();
    expectAutomaticNotice(false);
    expectNoPaymentRow();
    expect(screen.queryByRole("button", { name: "请添加付款账户" })).toBeNull();
    expect(saveButton()).toBeEnabled();
    click("保存记账");
    expectNoPaymentRow();
    expect(
      screen.getByRole("button", { name: "请添加付款账户" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "请添加明细" }),
    ).toBeInTheDocument();
    click("添加付款账户");
    expect(
      screen.getByText("这家商家还没有记录，按账户顺序显示"),
    ).toBeInTheDocument();
    selectAccount("现金 JPY");
    await waitFor(() =>
      expect(receiptLine("更换支付账户 1")).toHaveTextContent("现金"),
    );
    click("添加明细");
    expect(
      screen.getByRole("button", { name: "午餐", pressed: true }),
    ).toBeInTheDocument();
    click("确定");
    expect(await screen.findByLabelText("金额计算器")).toBeInTheDocument();
    pressItemAmountKey("8");
    pressItemAmountKey("确定");
    await waitFor(() => expect(saveButton()).toBeEnabled());
  });

  it("选商家后头像不加载，两处显示读取建议，建议到达后只应用一次", async () => {
    const { props, rerender } = quickSetup({ suggestionsMerchantId: "life" });
    await selectEntryMerchant("7-Eleven");
    expectSuggestionsLoadingRows(true);
    expect(
      screen.getByRole("button", { name: "修改商家：7-Eleven" }),
    ).toBeVisible();
    const loaded = { ...props, suggestionsMerchantId: "seven" };
    rerender(<TransactionStepFlow {...loaded} />);
    expect(await screen.findByText("从商家记账")).toBeInTheDocument();
    expectSuggestionsLoadingRows(false);
    expect(receiptLine("更换支付账户 1")).toHaveTextContent("PayPay");
    expect(
      screen.getByRole("button", { name: "修改明细 1 金额：待输入" }),
    ).toBeInTheDocument();
    click("删除明细 1");
    rerender(
      <TransactionStepFlow {...loaded} suggestions={{ ...quickSuggestions }} />,
    );
    expectAutomaticNotice(false);
  });

  it("超过等待时间读取行换回按钮；没动过小票时只补上当前商家晚到的建议一次", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { props, rerender } = quickSetup({ suggestionsMerchantId: "life" });
    await selectEntryMerchant("7-Eleven");
    waitQuickRouteTimeout(1000);
    expectSuggestionsLoadingRows(true);
    waitQuickRouteTimeout(1000);
    expectSuggestionsLoadingRows(false);
    for (const name of ["添加明细", "添加付款账户"]) {
      const button = screen.getByRole("button", { name });
      expect(button).toBeInTheDocument();
      expect(getComputedStyle(button).minHeight).toBe("40px");
    }
    expect(heading("从商家记账")).toBeInTheDocument();
    expectNoPaymentRow();
    // 其他商家的建议不应用。
    rerender(<TransactionStepFlow {...props} suggestionsMerchantId="coffee" />);
    expectAutomaticNotice(false);
    rerender(<TransactionStepFlow {...props} suggestionsMerchantId="seven" />);
    expect(receiptLine("更换支付账户 1")).toHaveTextContent("PayPay");
    expectAutomaticNotice();
    click("删除明细 1");
    rerender(
      <TransactionStepFlow
        {...props}
        suggestionsMerchantId="seven"
        suggestions={{ ...quickSuggestions }}
      />,
    );
    expectAutomaticNotice(false);
  });

  it.each<[string, () => Promise<void>]>([
    ["选了账户", () => chooseCashPayment(true)],
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
    await selectEntryMerchant("7-Eleven");
    waitQuickRouteTimeout();
    await touch();
    const form = saveButton().closest("form")!;
    const accountId = new FormData(form).get("accountId");
    rerender(<TransactionStepFlow {...props} suggestionsMerchantId="seven" />);
    expect(new FormData(form).get("accountId")).toBe(accountId);
    if (!accountId) expectNoPaymentRow();
    expectAutomaticNotice(false);
    expect(screen.queryByText("咖啡")).toBeNull();
  });

  it("等待建议期间修改备注立即结束读取，之后晚到的建议不覆盖小票", async () => {
    const { props, rerender } = quickSetup({ suggestionsMerchantId: "life" });
    await selectEntryMerchant("7-Eleven");
    expectSuggestionsLoadingRows(true);
    await changeReceiptNote();
    expectSuggestionsLoadingRows(false);
    expect(
      screen.getByRole("button", { name: "添加明细" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "添加付款账户" }),
    ).toBeInTheDocument();
    rerender(<TransactionStepFlow {...props} suggestionsMerchantId="seven" />);
    expectNoPaymentRow();
    expectAutomaticNotice(false);
    expect(screen.queryByText("午餐")).toBeNull();
    expect(screen.getByText("一起吃午餐")).toBeInTheDocument();
  });

  it("等建议中即使没有返回建议，超时后也恢复可操作的两处按钮", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    quickSetup({ suggestions: undefined, suggestionsMerchantId: "life" });
    await selectEntryMerchant("7-Eleven");
    expectSuggestionsLoadingRows(true);
    waitQuickRouteTimeout();
    expectSuggestionsLoadingRows(false);
    expect(screen.getByRole("button", { name: "添加明细" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "添加付款账户" })).toBeEnabled();
  });

  it("加载中点另一个商家时改为加载新商家，只应用新商家的建议", async () => {
    const { props, rerender } = quickSetup({ suggestionsMerchantId: "coffee" });
    await selectEntryMerchant("7-Eleven");
    await selectEntryMerchant("LIFE超市", "7-Eleven");
    expect(props.onMerchantSelect).toHaveBeenLastCalledWith(
      flowFixture.merchants[0],
    );
    expectSuggestionsLoadingRows(true);
    expect(
      screen.getByRole("button", { name: "修改商家：LIFE超市" }),
    ).toBeVisible();
    rerender(<TransactionStepFlow {...props} suggestionsMerchantId="life" />);
    expect(
      await screen.findByRole("button", { name: "修改商家：LIFE超市" }),
    ).toBeInTheDocument();
  });

  it("加载中改点另一个商家时重新开始等待计时", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { props, rerender } = quickSetup({ suggestionsMerchantId: "coffee" });
    await selectEntryMerchant("7-Eleven");
    waitQuickRouteTimeout(quickRouteSuggestionTimeoutMs - 500);
    await selectEntryMerchant("LIFE超市", "7-Eleven");
    waitQuickRouteTimeout(1000);
    expectSuggestionsLoadingRows(true);
    rerender(<TransactionStepFlow {...props} suggestionsMerchantId="life" />);
    expectSuggestionsLoadingRows(false);
    expect(heading("从商家记账")).toBeInTheDocument();
    expect(receiptLine("更换支付账户 1")).toHaveTextContent("PayPay");
    expectAutomaticNotice();
  });
});

describe("TransactionStepFlow 自动添加提示", () => {
  async function enterWithAutomaticNotice(
    overrides: Partial<TransactionStepFlowProps> = {},
  ) {
    quickSetup(overrides);
    await selectEntryMerchant("7-Eleven");
    await screen.findByRole("button", { name: "保存记账" });
    expectAutomaticNotice();
  }

  // 对这笔账单做任意修改都收起提示（#1028）。
  it.each([
    ["确认修改金额", confirmLunchAmount],
    ["修改分类", changeLunchToStorage],
    ["新增明细", addLunchItem],
    ["删除自动明细", () => click("删除明细 1")],
    ["更换付款账户", chooseCashPayment],
    ["修改备注", changeReceiptNote],
    ["修改时间", changeReceiptTime],
    ["设为待报销", markLunchPendingReimbursement],
  ])("%s后隐藏提示", async (_, edit) => {
    await enterWithAutomaticNotice();
    await edit();
    expectAutomaticNotice(false);
  });

  it("没有推荐账户时，第一次选择付款账户也隐藏提示", async () => {
    await enterWithAutomaticNotice({
      suggestions: { ...quickSuggestions, recommendedAccountIds: [] },
    });
    await chooseCashPayment(true);
    expectAutomaticNotice(false);
  });

  it("取消金额输入后保留提示", async () => {
    await enterWithAutomaticNotice();
    await openLunchAmount();
    pressItemAmountKey("8");
    click("关闭金额键盘");
    await waitKeypadClosed();
    expectAutomaticNotice();
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
    await selectEntryMerchant("7-Eleven");
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
  async function setupCreationFlow(
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
    await selectEntryMerchant("7-Eleven");
    return { ...view, form: saveButton().closest("form")! };
  }

  it("从小票商家抽屉新增后自动选中并留在原小票，成功提示挂载到 body", async () => {
    const { container, form } = await setupCreationFlow([
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
      const { form } = await setupCreationFlow();
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
    const { container, form } = await setupCreationFlow();
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
    // 父小票只有自动初始值，不再安装未保存哨兵，普通后退即可离开。
    await act(async () => window.history.back());
    expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull();
  });
  it("全屏商家预填是初值，输入还原后后退仍要确认，放弃后不改父数据", async () => {
    const { form } = await setupCreationFlow();
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
    fireEvent.click(
      within(await screen.findByRole("dialog", { name: "尚未保存" })).getByRole(
        "button",
        { name: "放弃修改" },
      ),
    );
    await screen.findByRole("button", { name: "新增商家" });
    expect([...new FormData(form).entries()]).toEqual(before);
  });
  it.each(["备注", "支付账户", "金额", "明细"])(
    "后退按%s编辑层的取消语义关闭，不确认父小票",
    async (kind) => {
      const { form } = await setupCreationFlow();
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
    const { form } = await setupCreationFlow();
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
