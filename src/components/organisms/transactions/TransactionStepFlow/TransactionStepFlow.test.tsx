import {
  act,
  fireEvent,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  renderTransactionFlow as setup,
  renderEntryComponent,
  clickEntryButton as click,
  selectEntryAccount as selectAccount,
} from "test/transactionStepFlow";
import { itemsStepFixture, filledItems } from "test/mocks/transactionItemsStep";
import { flowFixture } from "test/mocks/transactionStepFlow";
import { TransactionStepFlow } from "./TransactionStepFlow";
import type { TransactionStepFlowProps } from "./TransactionStepFlow.types";
import { quickRouteSuggestionTimeoutMs } from "./useTransactionStepFlow";

function progress() {
  return within(
    screen.getByRole("list", { name: "记账进度", hidden: true }),
  ).getAllByRole("listitem", { hidden: true });
}
function receiptRow(label: string) {
  return screen.getByRole("button", { name: new RegExp(`^修改${label}：`) });
}
// 快速路线等待建议超时后进入账户步骤；测试中用假计时器推进。
function waitQuickRouteTimeout(ms = quickRouteSuggestionTimeoutMs) {
  act(() => vi.advanceTimersByTime(ms));
}
afterEach(() => {
  vi.useRealTimers();
});

describe("TransactionStepFlow", () => {
  it("商家选择通知外部并进入账户，账户选择后进入明细", async () => {
    const { props } = setup({
      itemsOptions: {
        categoryOptions: itemsStepFixture.categoryOptions,
        initialItems: filledItems,
      },
    });
    click("7-Eleven");
    expect(props.onMerchantSelect).toHaveBeenCalledWith(
      flowFixture.merchants[1],
    );
    expect(
      screen.getByRole("radiogroup", { name: "收支账户" }),
    ).toBeInTheDocument();
    selectAccount();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "添加明细" }),
      ).toBeInTheDocument(),
    );
    expect(props.onAccountSelect).toHaveBeenCalledWith(flowFixture.accounts[1]);
    click("去确认");
    expect(
      screen.getByRole("button", { name: "保存记账" }),
    ).toBeInTheDocument();
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
    expect(
      screen.getByRole("button", { name: "保存记账" }),
    ).toBeInTheDocument();
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
    });
    click("商家");
    click("LIFE超市");
    expect(
      screen.getByRole("radiogroup", { name: "收支账户" }),
    ).toBeInTheDocument();
    expect(progress().map((item) => item.dataset.status)).toEqual([
      "completed",
      "current",
      "upcoming",
      "upcoming",
    ]);
    click("完成，回到确认");
    expect(
      screen.getByRole("button", { name: "保存记账" }),
    ).toBeInTheDocument();
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
  it("多账户数量同步到进度条第二行，从确认返回保留明细与付款金额", async () => {
    setup({
      initialStep: 3,
      initialMerchantId: "seven",
      initialAccountId: "paypay",
      itemsOptions: {
        categoryOptions: itemsStepFixture.categoryOptions,
        initialItems: filledItems,
        initialPayments: [
          { accountId: "paypay", amount: "7000" },
          { accountId: "cash", amount: "3000" },
        ],
      },
    });
    await waitFor(() =>
      expect(progress()[1]).toHaveTextContent("PayPay 等 2 个账户"),
    );
    const amounts = screen
      .getAllByRole("textbox")
      .filter((input) => input.getAttribute("name") === "paymentAmount");
    fireEvent.change(amounts[0], { target: { value: "6000" } });
    fireEvent.change(amounts[1], { target: { value: "4000" } });
    click("去确认");
    expect(screen.queryByText("付款账户")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "保存记账" }),
    ).toBeInTheDocument();
    click("明细");
    const restoredAmounts = screen
      .getAllByRole("textbox")
      .filter((input) => input.getAttribute("name") === "paymentAmount");
    expect(restoredAmounts[0]).toHaveValue("6000");
    expect(restoredAmounts[1]).toHaveValue("4000");
    fireEvent.change(restoredAmounts[0], { target: { value: "5000" } });
    click("确认");
    expect(progress()[2]).toHaveAttribute("data-status", "upcoming");
    click("明细");
    fireEvent.change(screen.getByRole("textbox", { name: "付款金额 1" }), {
      target: { value: "6000" },
    });
    click("确认");
    expect(progress()[2]).toHaveAttribute("data-status", "completed");
    click("明细");
    expect(
      screen.getByRole("button", { name: "编辑明细 1 金额" }),
    ).toHaveTextContent("¥8,000");
    expect(screen.getByText("✓ 已对上")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "完成，回到确认" }),
    ).toBeEnabled();
    click("删除付款账户 2");
    expect(progress()[1]).not.toHaveTextContent("等 2 个账户");
    expect(progress()[1]).toHaveTextContent("PayPay");
  });

  it("从确认更换收支账户后，明细使用同一份主付款账户并保留编辑金额", async () => {
    setup({
      initialStep: 3,
      initialMerchantId: "seven",
      initialAccountId: "paypay",
      itemsOptions: {
        categoryOptions: itemsStepFixture.categoryOptions,
        initialItems: filledItems,
        multiAccountPaymentEnabled: true,
      },
    });
    click("编辑明细 1 金额");
    fireEvent.click(
      within(screen.getByLabelText("金额计算器")).getByRole("button", {
        name: "9",
      }),
    );
    fireEvent.click(
      within(screen.getByLabelText("金额计算器")).getByRole("button", {
        name: "确定",
      }),
    );
    await waitFor(() =>
      expect(screen.queryByLabelText("金额计算器")).not.toBeInTheDocument(),
    );
    click("去确认");
    click("账户");
    selectAccount("现金 JPY");
    click("完成，回到确认");
    click("明细");
    expect(
      screen.getByRole("button", { name: "编辑明细 1 金额" }),
    ).toHaveTextContent("¥80,009");
    expect(progress()[1]).toHaveTextContent("现金");
    click("添加付款账户（多个账户一起付）");
    expect(screen.getAllByRole("combobox")[0]).toHaveTextContent("现金");
  });

  it("首次进入明细才预填自动明细，离开再返回不重复添加", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setup({
      itemsOptions: {
        categoryOptions: itemsStepFixture.categoryOptions,
        prefillAutomaticItems: true,
      },
      suggestions: itemsStepFixture.suggestions,
    });
    click("7-Eleven");
    waitQuickRouteTimeout();
    selectAccount();
    expect(await screen.findAllByText("自动")).toHaveLength(2);
    click("删除明细 1");
    click("账户");
    selectAccount("现金 JPY");
    expect(await screen.findAllByText("自动")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "编辑明细 1 分类" }),
    ).toHaveTextContent("咖啡");
  });
});

describe("TransactionStepFlow 快速路线", () => {
  const quickSuggestions = {
    ...itemsStepFixture.suggestions!,
    recommendedAccountIds: ["paypay", "cash"],
  };
  function quickSetup(overrides: Partial<TransactionStepFlowProps> = {}) {
    return setup({
      suggestionsMerchantId: "seven",
      suggestions: quickSuggestions,
      itemsOptions: { categoryOptions: itemsStepFixture.categoryOptions },
      ...overrides,
    });
  }
  it("快速路线到确认时不弹出金额键盘，自动明细显示待输入，点该行后填金额", async () => {
    quickSetup();
    click("7-Eleven");
    await waitFor(() =>
      expect(progress()[3]).toHaveAttribute("data-status", "current"),
    );
    expect(progress().map((item) => item.dataset.status)).toEqual([
      "completed",
      "completed",
      "upcoming",
      "current",
    ]);
    expect(screen.queryByLabelText("金额计算器")).not.toBeInTheDocument();
    expect(receiptRow("明细 1")).toHaveTextContent("待输入");
    expect(receiptRow("明细 1")).toHaveAttribute("data-invalid", "true");
    expect(
      screen.getByText("还有 2 条明细没填金额，点一下去填写"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存记账" })).toBeDisabled();
    expect(
      within(progress()[2]).getByRole("button", { name: "明细", hidden: true }),
    ).toBeInTheDocument();
    fireEvent.click(receiptRow("明细 1"));
    expect(
      await screen.findByText("午餐 的金额", { exact: false }),
    ).toBeInTheDocument();
    click("上次 ¥498");
    click("确定");
    expect(
      await screen.findByText("咖啡 的金额", { exact: false }),
    ).toBeInTheDocument();
    click("上次 ¥250");
    click("确定");
    await waitFor(() =>
      expect(screen.queryByLabelText("金额计算器")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "保存记账" })).toBeEnabled();
    expect(progress()[2]).toHaveAttribute("data-status", "completed");
    expect(receiptRow("支付账户 1")).toHaveTextContent("PayPay");
    click("明细");
    expect(
      screen.getByRole("button", { name: "添加明细" }),
    ).toBeInTheDocument();
  });
  it("只有推荐账户时选第一个账户并停在明细", async () => {
    quickSetup({
      suggestions: { ...quickSuggestions, automaticCategoryIds: [] },
    });
    click("7-Eleven");
    expect(
      await screen.findByRole("button", { name: "添加明细" }),
    ).toBeInTheDocument();
    expect(progress()[1]).toHaveTextContent("PayPay");
    expect(
      screen.queryByRole("button", { name: "保存记账" }),
    ).not.toBeInTheDocument();
  });
  it("没有历史时停在账户，明细空状态从建议推导", async () => {
    quickSetup({
      suggestions: {
        recommendedAccountIds: [],
        automaticCategoryIds: [],
        quickAmounts: [],
      },
    });
    click("7-Eleven");
    expect(
      screen.getByRole("radiogroup", { name: "收支账户" }),
    ).toBeInTheDocument();
    selectAccount();
    expect(
      await screen.findByText("这家商家还没有常用明细"),
    ).toBeInTheDocument();
  });
  it("选完商家先停在商家步骤并显示加载，建议到达后直接跳到确认，只应用一次", async () => {
    const { props, rerender } = quickSetup({ suggestionsMerchantId: "life" });
    click("7-Eleven");
    expect(progress()[0]).toHaveAttribute("data-status", "current");
    expect(progress()[0]).toHaveTextContent("7-Eleven");
    expect(
      screen.getAllByRole("progressbar", { name: "正在读取 7-Eleven 的记录" }),
    ).toHaveLength(2);
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    const loaded = { ...props, suggestionsMerchantId: "seven" };
    rerender(<TransactionStepFlow {...loaded} />);
    await waitFor(() =>
      expect(progress()[3]).toHaveAttribute("data-status", "current"),
    );
    expect(screen.queryByLabelText("金额计算器")).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    click("明细");
    click("删除明细 1");
    rerender(
      <TransactionStepFlow {...loaded} suggestions={{ ...quickSuggestions }} />,
    );
    expect(screen.getAllByText("自动")).toHaveLength(1);
    expect(screen.queryByLabelText("金额计算器")).not.toBeInTheDocument();
  });
  it("超过等待时间仍没有建议时进入账户步骤，晚到的建议不再跳转", () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { props, rerender } = quickSetup({ suggestionsMerchantId: "life" });
    click("7-Eleven");
    waitQuickRouteTimeout(quickRouteSuggestionTimeoutMs - 1);
    expect(progress()[0]).toHaveAttribute("data-status", "current");
    waitQuickRouteTimeout(1);
    expect(
      screen.getByRole("radiogroup", { name: "收支账户" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    rerender(<TransactionStepFlow {...props} suggestionsMerchantId="seven" />);
    expect(
      screen.getByRole("radiogroup", { name: "收支账户" }),
    ).toBeInTheDocument();
  });
  it("加载中点另一个商家时改为加载新商家，只应用新商家的建议", async () => {
    const { props, rerender } = quickSetup({ suggestionsMerchantId: "coffee" });
    click("7-Eleven");
    click("LIFE超市");
    expect(props.onMerchantSelect).toHaveBeenLastCalledWith(
      flowFixture.merchants[0],
    );
    expect(progress()[0]).toHaveTextContent("LIFE超市");
    expect(
      screen.queryByRole("progressbar", { name: "正在读取 7-Eleven 的记录" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("progressbar", { name: "正在读取 LIFE超市 的记录" }),
    ).toHaveLength(2);
    // 新商家的建议到达后直接跳到确认。
    rerender(<TransactionStepFlow {...props} suggestionsMerchantId="life" />);
    await waitFor(() =>
      expect(progress()[3]).toHaveAttribute("data-status", "current"),
    );
    expect(
      screen.getByRole("button", { name: "修改商家：LIFE超市", hidden: true }),
    ).toBeInTheDocument();
  });
  it.each(["商家", "修改商家：7-Eleven"])(
    "从确认通过%s换商家时保留明细，不应用晚到的新建议",
    async (entry) => {
      const { props, rerender } = quickSetup({
        initialStep: 4,
        initialMerchantId: "seven",
        initialAccountId: "paypay",
        itemsOptions: {
          categoryOptions: itemsStepFixture.categoryOptions,
          initialItems: filledItems,
        },
      });
      click(entry);
      click("LIFE超市");
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
      click("完成，回到确认");
      expect(receiptRow("明细 1")).toHaveTextContent("午餐");
      expect(receiptRow("明细 2")).toHaveTextContent("收纳");
      expect(screen.queryByLabelText("金额计算器")).not.toBeInTheDocument();
    },
  );
});
