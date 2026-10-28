import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { TransactionStepFlow } from "./TransactionStepFlow";
import type { TransactionStepFlowProps } from "./TransactionStepFlow.types";
import { flowFixture } from "./transactionStepFlowFixtures";
function flowView(props: TransactionStepFlowProps) {
  return (
    <ConfirmDialogProvider>
      <TransactionStepFlow {...props} />
    </ConfirmDialogProvider>
  );
}
function setup(overrides: Partial<TransactionStepFlowProps> = {}) {
  const props = {
    ...flowFixture,
    onClose: vi.fn(),
    onMethodChange: vi.fn(),
    onMerchantSelect: vi.fn(),
    onAccountSelect: vi.fn(),
    onAddMerchant: vi.fn(),
    onAddAccount: vi.fn(),
    onAddPresets: vi.fn(),
    ...overrides,
  };
  render(flowView(props));
  return props;
}
function click(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}
function selectAccount(name = "PayPay JPY") {
  fireEvent.click(screen.getByRole("radio", { name }));
}
function progress() {
  return within(screen.getByRole("list", { name: "记账进度" })).getAllByRole(
    "listitem",
  );
}
function setupAccount(overrides: Partial<TransactionStepFlowProps> = {}) {
  return setup({
    initialStep: 2,
    initialMerchantId: "seven",
    initialCompletedSteps: [1],
    ...overrides,
  });
}
function returnToAccount(overrides: Partial<TransactionStepFlowProps> = {}) {
  const props = setup({
    initialStep: 4,
    initialMerchantId: "seven",
    initialAccountId: "paypay",
    initialCompletedSteps: [1, 2, 3],
    ...overrides,
  });
  click("账户");
  return props;
}
describe("TransactionStepFlow", () => {
  it("商家选择通知外部并进入账户，账户选择后进入明细", async () => {
    const props = setup();
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
    expect(screen.getByRole("button", { name: "账户" })).toBeDisabled();
    click("确认");
    expect(progress().map((item) => item.dataset.status)).toEqual([
      "upcoming",
      "upcoming",
      "upcoming",
      "current",
    ]);
  });
  it("关闭时继续记账保留内容，放弃才关闭", async () => {
    const props = setup();
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
  it("方式抽屉标记当前方式和过渡入口，即将推出不可点击", () => {
    const props = setup();
    click("切换方式");
    const drawer =
      screen.getByText("切换记账方式").parentElement!.parentElement!;
    expect(within(drawer).getByTestId("CheckRoundedIcon")).toBeInTheDocument();
    expect(within(drawer).getByText("过渡")).toBeInTheDocument();
    for (const name of [
      "从模板记账 即将推出",
      "从拍照记账 即将推出",
      "定时记账 即将推出",
    ]) {
      const button = within(drawer).getByRole("button", { name });
      expect(button).toHaveAttribute("aria-disabled", "true");
      fireEvent.click(button);
    }
    expect(props.onMethodChange).not.toHaveBeenCalled();
    click("账户周转");
    expect(props.onMethodChange).toHaveBeenCalledWith("transfer");
  });
  it("常用商家按传入顺序排列，不足八个不补占位", () => {
    setup();
    const buttons = screen
      .getAllByRole("button")
      .filter((item) =>
        ["7-Eleven", "LIFE超市", "星巴克"].includes(item.textContent ?? ""),
      );
    expect(buttons.map((item) => item.textContent)).toEqual([
      "7-Eleven",
      "LIFE超市",
      "星巴克",
    ]);
  });
  it("分类筛选和搜索隐藏常用商家，只显示匹配列表", () => {
    setup();
    click("🍴 餐饮");
    expect(screen.queryByText("常用商家")).not.toBeInTheDocument();
    expect(screen.queryByText("LIFE超市")).not.toBeInTheDocument();
    click("全部");
    fireEvent.change(screen.getByRole("textbox", { name: "搜索商家" }), {
      target: { value: "life" },
    });
    expect(screen.queryByText("常用商家")).not.toBeInTheDocument();
    expect(screen.getByText("LIFE超市")).toBeInTheDocument();
    expect(screen.queryByText("星巴克")).not.toBeInTheDocument();
  });
  it("搜索不到时可通知外部新增指定商家", () => {
    const props = setup();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "星野咖啡" },
    });
    expect(screen.getByText("没有找到“星野咖啡”")).toBeInTheDocument();
    click("新增商家“星野咖啡”");
    expect(props.onAddMerchant).toHaveBeenCalledWith("星野咖啡");
  });
  it("没有商家时提供预设和新增入口", () => {
    const props = setup({ merchants: [], frequentMerchants: [] });
    click("从预设添加");
    expect(props.onAddPresets).toHaveBeenCalledOnce();
    click("新增商家");
    expect(props.onAddMerchant).toHaveBeenCalledWith();
  });
  it("推荐账户最多三个且按推荐顺序，其他账户按原顺序", () => {
    setupAccount({
      suggestions: {
        ...flowFixture.suggestions!,
        recommendedAccountIds: ["paypay", "cash", "cny", "bank"],
      },
    });
    expect(screen.getByText("按这家商家最近 20 笔记录")).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("radio")
        .filter((item) => item.hasAttribute("aria-checked"))
        .map((item) => item.getAttribute("aria-label")),
    ).toEqual(["PayPay JPY", "现金 JPY", "招商银行卡 CNY", "乐天银行 JPY"]);
    expect(screen.getByText("其他账户")).toBeInTheDocument();
  });
  it("没有推荐时显示提示并保留账户顺序", () => {
    setupAccount({ suggestions: undefined });
    expect(screen.queryByText("推荐账户")).not.toBeInTheDocument();
    expect(
      screen.getByText("这家商家还没有记录，按账户顺序显示"),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("radio")
        .filter((item) => item.hasAttribute("aria-checked"))[0],
    ).toHaveAttribute("aria-label", "现金 JPY");
  });
  it("没有账户时显示新增入口", () => {
    const props = setupAccount({ accounts: [] });
    click("新增账户");
    expect(props.onAddAccount).toHaveBeenCalledOnce();
  });
  it("换币种取消不切换，确认后才切换并停留修改步骤", async () => {
    const props = returnToAccount({ hasDetails: true });
    selectAccount("招商银行卡 CNY");
    expect(
      screen.getByText(
        "币种将从 JPY 变为 CNY，已填写的金额不会换算，数字保持不变。已关联的退款 / 报销会被取消。",
      ),
    ).toBeInTheDocument();
    expect(props.onAccountSelect).not.toHaveBeenCalled();
    click("取消");
    await waitFor(() =>
      expect(
        screen.queryByText("切换为 招商银行卡 账户？"),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("radio", { name: "PayPay JPY" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    selectAccount("招商银行卡 CNY");
    click("切换");
    await waitFor(() =>
      expect(props.onAccountSelect).toHaveBeenCalledWith(
        flowFixture.accounts[2],
      ),
    );
    expect(
      screen.getByRole("radio", { name: "招商银行卡 CNY" }),
    ).toHaveAttribute("aria-checked", "true");
    click("完成，回到确认");
    expect(screen.getByText("确认内容将在后续任务实现")).toBeInTheDocument();
  });
  it("没有明细时换币种无需确认", async () => {
    const props = setupAccount({ initialAccountId: "paypay" });
    selectAccount("招商银行卡 CNY");
    await waitFor(() => expect(props.onAccountSelect).toHaveBeenCalledOnce());
    expect(
      screen.queryByText("切换为 招商银行卡 账户？"),
    ).not.toBeInTheDocument();
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
    const view = render(flowView(flowFixture));
    click("7-Eleven");
    view.rerender(flowView({ ...flowFixture, open: false }));
    view.rerender(flowView(flowFixture));
    expect(screen.getByRole("textbox", { name: "搜索商家" })).toHaveValue("");
    expect(progress()[0]).toHaveAttribute("data-status", "current");
  });
  it("常用商家最多显示八个", () => {
    const merchants = Array.from({ length: 10 }, (_, index) => ({
      ...flowFixture.merchants[0],
      id: `merchant-${index}`,
      name: `商家${index}`,
    }));
    setup({
      merchants,
      frequentMerchants: merchants.map((merchant) => ({
        merchantId: merchant.id,
        recordCount: 1,
      })),
    });
    expect(
      within(screen.getByRole("group", { name: "常用商家" })).getAllByRole(
        "button",
      ),
    ).toHaveLength(8);
  });
});
