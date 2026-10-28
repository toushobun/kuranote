import { fireEvent, screen, within, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { filledItems, twoPayments } from "test/mocks/transactionItemsStep";
import {
  renderItemsStep,
  addStepItem,
  pressItemAmountKey,
} from "test/transactionItemsStep";
import { clickEntryButton as click } from "test/transactionStepFlow";

describe("TransactionItemsStep", () => {
  it("空明细沿用卡片，显示引导并禁用去确认", () => {
    renderItemsStep();
    expect(screen.getByText("选好分类后输入金额")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "去确认" })).toBeDisabled();
    expect(screen.queryByText("合计")).not.toBeInTheDocument();
  });
  it("完全没有记录时显示插画与添加入口", () => {
    renderItemsStep({ merchantHasHistory: false });
    expect(screen.getByText("这家商家还没有常用明细")).toBeInTheDocument();
    expect(screen.getByText("添加后，下次会自动帮你填好")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加明细" })).toBeEnabled();
  });
  it("按控制参数预填自动明细，删除时更新标签与提示", () => {
    renderItemsStep({ prefillAutomaticItems: true });
    expect(screen.getAllByText("自动")).toHaveLength(2);
    expect(
      screen.getByText("已按你的习惯自动添加 2 条，填金额即可"),
    ).toBeInTheDocument();
    click("删除明细 1");
    expect(screen.getAllByText("自动")).toHaveLength(1);
    expect(
      screen.getByText("已按你的习惯自动添加 1 条，填金额即可"),
    ).toBeInTheDocument();
  });
  it("未开启预填时不自动添加", () => {
    renderItemsStep({ prefillAutomaticItems: false });
    expect(screen.queryByText("自动")).not.toBeInTheDocument();
  });
  it("添加抽屉不显示常用快捷与金额输入，确认分类后打开键盘", async () => {
    renderItemsStep();
    click("添加明细");
    expect(screen.queryByText("常用快捷")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "金额" }),
    ).not.toBeInTheDocument();
    click("午餐");
    click("确定");
    expect(await screen.findByText("餐饮 · 午餐 的金额")).toBeInTheDocument();
  });
  it("键盘逐键同步明细，确定后跳到下一条空金额再关闭", async () => {
    const { props } = renderItemsStep({ prefillAutomaticItems: true });
    click("编辑明细 1 金额");
    pressItemAmountKey("4");
    pressItemAmountKey("9");
    pressItemAmountKey("8");
    expect(
      screen.getByRole("button", { name: "编辑明细 1 金额", hidden: true }),
    ).toHaveTextContent("¥498");
    pressItemAmountKey("确定");
    expect(await screen.findByText("饮料 · 咖啡 的金额")).toBeInTheDocument();
    pressItemAmountKey("2");
    pressItemAmountKey("5");
    pressItemAmountKey("0");
    pressItemAmountKey("确定");
    await waitFor(() =>
      expect(screen.queryByLabelText("金额计算器")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "去确认" })).toBeEnabled();
    click("去确认");
    expect(props.onConfirm).toHaveBeenCalledOnce();
  });
  it("快捷金额按小分类与币种显示，点击实时填入", async () => {
    renderItemsStep();
    await addStepItem();
    const quick = within(screen.getByRole("group", { name: "快捷金额" }));
    expect(
      quick.getByRole("button", { name: "上次 ¥498" }),
    ).toBeInTheDocument();
    expect(
      quick.queryByRole("button", { name: "上次 ¥250" }),
    ).not.toBeInTheDocument();
    expect(
      quick.queryByRole("button", { name: "上次 ¥18.5" }),
    ).not.toBeInTheDocument();
    fireEvent.click(quick.getByRole("button", { name: "¥450" }));
    expect(
      screen.getByRole("button", { name: "编辑明细 1 金额", hidden: true }),
    ).toHaveTextContent("¥450");
  });
  it("没有对应快捷金额时不显示快捷区块，日元禁止小数", async () => {
    renderItemsStep({ suggestions: undefined });
    await addStepItem();
    expect(
      screen.queryByRole("group", { name: "快捷金额" }),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByLabelText("金额计算器")).getByRole("button", {
        name: ".",
      }),
    ).toBeDisabled();
  });
  it("付款未对上时禁用，对上后启用，并保留同币种规则", async () => {
    renderItemsStep({
      initialItems: filledItems,
      initialPayments: [
        { accountId: "paypay", amount: "7000" },
        { accountId: "cash", amount: "0" },
      ],
    });
    expect(screen.getByText("还差 ¥3,000")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "去确认" })).toBeDisabled();
    const amounts = screen
      .getAllByRole("textbox")
      .filter((input) => input.getAttribute("name") === "paymentAmount");
    fireEvent.change(amounts[1], { target: { value: "3000" } });
    expect(await screen.findByText("✓ 已对上")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "去确认" })).toBeEnabled();
  });
  it("多账户付款删到一行时自动回到单账户", () => {
    renderItemsStep({
      initialItems: filledItems,
      initialPayments: twoPayments,
    });
    click("删除付款账户 2");
    expect(screen.queryByText("付款账户")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "去确认" })).toBeEnabled();
  });
  it("有收入或账本关闭多账户时隐藏付款入口", () => {
    renderItemsStep({ initialItems: [{ categoryId: "points", amount: "50" }] });
    expect(
      screen.queryByRole("button", { name: "添加付款账户（多个账户一起付）" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/支出.*收入/)).toBeInTheDocument();
  });
  it("关闭多账户开关不显示入口", () => {
    renderItemsStep({
      multiAccountPaymentEnabled: false,
      initialItems: filledItems,
    });
    expect(
      screen.queryByRole("button", { name: "添加付款账户（多个账户一起付）" }),
    ).not.toBeInTheDocument();
  });
  it("选好分类但金额未填不能去确认", async () => {
    renderItemsStep();
    await addStepItem();
    click("关闭金额键盘");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "去确认" })).toBeDisabled(),
    );
  });
  it("添加付款行后沿用确认首行金额时分配剩余金额的规则", () => {
    renderItemsStep({ initialItems: filledItems });
    click("添加付款账户（多个账户一起付）");
    expect(screen.getByRole("button", { name: "去确认" })).toBeDisabled();
    fireEvent.mouseDown(screen.getAllByRole("combobox")[1]);
    fireEvent.click(screen.getByRole("option", { name: "现金（JPY）" }));
    const amounts = screen
      .getAllByRole("textbox")
      .filter((input) => input.getAttribute("name") === "paymentAmount");
    fireEvent.change(amounts[0], { target: { value: "7000" } });
    fireEvent(amounts[0], new Event("kuranote:amount-input-commit"));
    expect(amounts[1]).toHaveValue("3000");
    expect(screen.getByRole("button", { name: "去确认" })).toBeEnabled();
  });
  it("分类抽屉的待报销状态保留到实时输入后的明细", async () => {
    renderItemsStep();
    click("添加明细");
    click("午餐");
    fireEvent.click(screen.getByRole("checkbox", { name: /待报销/ }));
    click("确定");
    await screen.findByLabelText("金额计算器");
    pressItemAmountKey("5");
    pressItemAmountKey("确定");
    await waitFor(() =>
      expect(screen.queryByLabelText("金额计算器")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("待报销")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "编辑明细 1 金额", hidden: true }),
    ).toHaveTextContent("¥5");
  });
});
