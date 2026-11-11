import { setupGuardHistoryMock } from "test/mockGuardHistory";
setupGuardHistoryMock();

import Button from "@mui/material/Button";
import { saveAndLeaveField } from "config/unsavedChanges";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TransactionStepFlowProps } from "../TransactionStepFlow/TransactionStepFlow.types";
import {
  expectAutomaticNotice,
  expectNoPaymentRow,
  expectSuggestionsLoadingRows,
  receiptLine as line,
  pressItemAmountKey,
  renderConfirmFlow,
  renderReadOnlyReceipt,
} from "test/transactionConfirmStep";
import {
  renderEntryComponent,
  clickEntryButton as click,
  selectEntryAccount as selectAccount,
} from "test/transactionStepFlow";
import {
  filledItems,
  receiptItemsOptions,
  receiptEmojiItemsOptions,
  receiptSuggestions,
  twoPayments,
} from "test/mocks/transactionReceipt";

function headerRow(label: string) {
  return screen.getByRole("button", { name: new RegExp(`^修改${label}：`) });
}
function saveButton() {
  return screen.getByRole("button", { name: "保存记账" });
}
function transactionForm() {
  return saveButton().closest("form")!;
}
// 换成不同币种的账户（如 "招商银行卡 CNY"）：直接换，或点 × 清空后再选；停在弹出的确认框。
async function openCurrencyConfirm(account: string, clearFirst = false) {
  if (clearFirst) click("删除支付账户 1");
  click(clearFirst ? "添加付款账户" : "更换支付账户 1");
  selectAccount(account);
  return screen.findByRole("dialog", {
    name: `切换为 ${account.split(" ")[0]} 账户？`,
  });
}
function zIndexOf(element: Element, rootSelector: string) {
  return Number(getComputedStyle(element.closest(rootSelector)!).zIndex);
}
// 金额键盘打开时背景被设为 aria-hidden，按金额按钮的 aria-label 确认小票上的金额。
function expectReceiptAmount(label: string) {
  expect(
    screen.getByRole("button", { name: label, hidden: true }),
  ).toBeInTheDocument();
}
async function waitKeypadClosed() {
  await waitFor(() =>
    expect(screen.queryByLabelText("金额计算器")).not.toBeInTheDocument(),
  );
}
function renderMultiAccount(lunchAmount = "10000") {
  return renderConfirmFlow({
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [{ categoryId: "lunch", amount: lunchAmount }],
      initialPayments: twoPayments,
    },
  });
}

describe("TransactionConfirmStep", () => {
  it("建议读取中两处按钮变为无障碍状态行，头像不显示加载", async () => {
    await renderConfirmFlow({
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: [],
        initialPayments: [{ accountId: "", amount: null }],
      },
      suggestionsMerchantId: "life",
    });
    expectSuggestionsLoadingRows(true);
    expect(
      getComputedStyle(screen.getByText("正在按习惯准备明细…").closest('[role="status"]')!)
        .minHeight,
    ).toBe("40px");
    expect(saveButton()).toBeEnabled();
  });

  it("新增小票保存按钮保留原生 MUI 样式与提交属性", async () => {
    await renderConfirmFlow();
    renderEntryComponent(
      <Button fullWidth size="large" type="submit" variant="contained">
        原生按钮参照
      </Button>,
    );
    const button = saveButton();
    const actual = getComputedStyle(button);
    const baseline = getComputedStyle(
      screen.getByRole("button", { name: "原生按钮参照" }),
    );
    for (const property of [
      "minHeight",
      "fontSize",
      "fontWeight",
      "borderRadius",
      "padding",
      "background",
      "color",
    ] as const) {
      expect(actual[property]).toBe(baseline[property]);
    }
    expect(button).toHaveClass(
      "MuiButton-contained",
      "MuiButton-fullWidth",
      "MuiButton-sizeLarge",
    );
    expect(button).toHaveAttribute("type", "submit");
  });

  it("小票从上到下显示抬头、明细、合计（含支出）、支付与备注", async () => {
    await renderConfirmFlow();
    expect(headerRow("商家")).toHaveTextContent("7-Eleven");
    expect(headerRow("时间")).toHaveTextContent(/\d{2}:\d{2}$/);
    expect(line("编辑明细 1")).toHaveTextContent("午餐¥8,000");
    expect(line("编辑明细 2")).toHaveTextContent("收纳¥2,000");
    const total = screen.getByText("合计").nextElementSibling!;
    expect(total).toHaveTextContent("¥10,000");
    expect(total).toHaveTextContent("支出 ¥10,000");
    expect(line("更换支付账户 1")).toHaveTextContent("PayPayJPY¥10,000");
    expect(headerRow("备注")).toHaveTextContent("添加备注");
  });

  it("合计与明细行沿用原明细卡片的字号", async () => {
    await renderConfirmFlow();
    expect(screen.getByText("¥10,000", { selector: "h5" })).toHaveClass(
      "MuiTypography-h5",
    );
    expect(screen.getByText("午餐")).toHaveClass("MuiTypography-body2");
  });

  it("有收入时合计下方显示支出与收入", async () => {
    await renderConfirmFlow({
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: [
          { categoryId: "lunch", amount: "800" },
          { categoryId: "points", amount: "100" },
        ],
      },
    });
    expect(screen.getByText("合计").nextElementSibling).toHaveTextContent(
      "¥700支出 ¥800 · 收入 ¥100",
    );
  });

  it("合计下方小字不显示金额为 0 的支出 / 收入", async () => {
    await renderConfirmFlow({
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: [
          { categoryId: "lunch", amount: "0" },
          { categoryId: "points", amount: "100" },
        ],
      },
    });
    expect(screen.getByText("合计").nextElementSibling).toHaveTextContent(
      "+ ¥100收入 ¥100",
    );
    expect(screen.queryByText("支出")).not.toBeInTheDocument();
  });

  it("只有金额为 0 的支出时不显示小字", async () => {
    await renderConfirmFlow({
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: [{ categoryId: "lunch", amount: "0" }],
      },
    });
    expect(screen.getByText("合计").nextElementSibling).toHaveTextContent(
      /^¥0$/,
    );
  });

  it("「支出」「收入」字样与收入明细金额按交易配色设置上色", async () => {
    await renderConfirmFlow({
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: [
          { categoryId: "lunch", amount: "800" },
          { categoryId: "points", amount: "100" },
        ],
      },
    });
    expect(screen.getByText("支出")).toHaveStyle({
      color: "var(--user-theme-negative-amount)",
    });
    expect(screen.getByText("收入")).toHaveStyle({
      color: "var(--user-theme-income-amount)",
    });
    expect(
      screen.getByRole("button", { name: "修改明细 2 金额：+ ¥100" }),
    ).toHaveStyle({ color: "var(--user-theme-income-amount)" });
  });

  it("被其他记录退款 / 报销时合计显示净额，下方列出已退款与已报销，支付金额仍为原金额", async () => {
    await renderConfirmFlow({
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: [
          {
            categoryId: "lunch",
            amount: "10000",
            businessNetAmount: "5000",
            refundedAmount: "3000",
            reimbursementAmount: "2000",
          },
        ],
      },
    });
    const total = screen.getByText("净额").nextElementSibling!;
    expect(screen.queryByText("合计")).not.toBeInTheDocument();
    expect(within(total as HTMLElement).getByText("¥5,000")).toHaveClass(
      "MuiTypography-h5",
    );
    expect(total).toHaveTextContent(
      "支出 ¥10,000 · 已退款 ¥3,000 · 已报销 ¥2,000",
    );
    expect(line("更换支付账户 1")).toHaveTextContent("¥10,000");
  });

  it("明细有两个铅笔，单账户支付只有换账户的铅笔，删除 × 保留", async () => {
    await renderConfirmFlow();
    for (const [edit, remove, pencilCount] of [
      ["编辑明细 1", "删除明细 1", 2],
      ["编辑明细 2", "删除明细 2", 2],
      ["更换支付账户 1", "删除支付账户 1", 1],
    ] as const) {
      const row = line(edit);
      expect(
        within(row).getByRole("button", { name: remove }),
      ).toBeInTheDocument();
      expect(within(row).getAllByTestId("EditOutlinedIcon")).toHaveLength(
        pencilCount,
      );
    }
    for (const label of ["商家", "时间"])
      expect(headerRow(label).lastElementChild).toHaveAttribute(
        "data-testid",
        "EditOutlinedIcon",
      );
  });

  it("自动明细使用固定提示，不显示单条自动标签", async () => {
    await renderConfirmFlow({
      itemsOptions: receiptEmojiItemsOptions,
      suggestionsMerchantId: "seven",
      suggestions: receiptSuggestions,
    });
    expectAutomaticNotice();
    expect(screen.queryByText("自动", { exact: true })).not.toBeInTheDocument();
  });

  it("按首次出现顺序分组，每组显示已填金额小计并保留原序号", async () => {
    await renderConfirmFlow({
      itemsOptions: {
        ...receiptEmojiItemsOptions,
        initialItems: [
          ...filledItems,
          { categoryId: "lunch", amount: "600" },
          { categoryId: "lunch", amount: "" },
          { categoryId: "points", amount: "100" },
        ],
      },
    });
    const groups = ["🍽️ 饮食", "🧻 日用品", "💰 其他收入"].map((name) =>
      screen.getByRole("group", { name }),
    );
    expect(groups[0].nextElementSibling).toBe(groups[1]);
    expect(groups[1].nextElementSibling).toBe(groups[2]);
    expect(groups[0].firstElementChild).toHaveTextContent("¥8,600");
    expect(groups[1].firstElementChild).toHaveTextContent("¥2,000");
    expect(groups[2].firstElementChild).toHaveTextContent("+ ¥100");
    expect(groups[0]).toContainElement(line("编辑明细 1"));
    expect(line("编辑明细 1").nextElementSibling).toBe(line("编辑明细 3"));
    expect(line("编辑明细 3").nextElementSibling).toBe(line("编辑明细 4"));
    const row = line("编辑明细 1");
    expect(row).not.toHaveTextContent("🍽️ 饮食");
    expect(within(row).getByText("🍙 午餐")).toHaveClass(
      "MuiTypography-noWrap",
    );
  });

  it("单组无小计，仅选大分类的明细同组，未选分类的明细移到末尾", async () => {
    await renderConfirmFlow({
      itemsOptions: {
        ...receiptItemsOptions,
        categoryOptions: [
          ...receiptItemsOptions.categoryOptions,
          {
            id: "food",
            name: "餐饮",
            parentId: null,
            parentName: null,
            type: "expense",
          },
        ],
        initialItems: [
          { categoryId: "", amount: "200" },
          { categoryId: "food", amount: "800" },
          { categoryId: "lunch", amount: "600" },
        ],
      },
    });
    const group = screen.getByRole("group", { name: "餐饮" });
    expect(group.firstElementChild).toHaveTextContent(/^餐饮$/);
    expect(group).toContainElement(line("编辑明细 2"));
    expect(line("编辑明细 2")).toHaveTextContent("餐饮");
    expect(group).toContainElement(line("编辑明细 3"));
    expect(group.nextElementSibling).toBe(line("编辑明细 1"));
    expect(line("编辑明细 1")).toHaveTextContent("未选择分类");
    expect(line("编辑明细 1")).not.toHaveAttribute("data-invalid");
    click("保存记账");
    expect(line("编辑明细 1")).toHaveAttribute("data-invalid", "true");
  });

  it("只读小票也按大分类显示小计", () => {
    renderReadOnlyReceipt({
      ...receiptItemsOptions,
      initialItems: filledItems,
    });
    expect(
      screen.getByRole("group", { name: "餐饮" }).firstElementChild,
    ).toHaveTextContent("¥8,000");
    expect(screen.queryByRole("button", { name: /编辑明细/ })).toBeNull();
  });

  it("小票仍显示业务状态「待报销」标签", async () => {
    await renderConfirmFlow({
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: [
          {
            categoryId: "lunch",
            amount: "800",
            specialStatus: "pendingReimbursement",
          },
        ],
      },
    });
    expect(within(line("编辑明细 1")).getByText("待报销")).toBeInTheDocument();
  });

  it("业务状态标签独立显示在明细名称下方", async () => {
    await renderConfirmFlow({
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: [
          {
            categoryId: "lunch",
            amount: "800",
            specialStatus: "pendingReimbursement",
          },
          { categoryId: "storage", amount: "200" },
        ],
      },
    });
    const name = within(line("编辑明细 1")).getByText("午餐");
    expect(name).toHaveClass("MuiTypography-noWrap");
    const badge = within(line("编辑明细 1")).getByText("待报销");
    // 名称块、金额与操作在同一行，标签在该行下方。
    expect(name.parentElement!.contains(badge)).toBe(false);
    expect(
      line("编辑明细 1").firstElementChild!.nextElementSibling,
    ).toContainElement(badge);
    expect(line("编辑明细 2").firstElementChild!.nextElementSibling).toBeNull();
  });

  it("点金额只打开该明细的金额键盘，不打开明细编辑", async () => {
    await renderConfirmFlow({ suggestions: receiptSuggestions });
    click("修改明细 1 金额：¥8,000");
    expect(await screen.findByText("餐饮 · 午餐 的金额")).toBeInTheDocument();
    expect(screen.queryByText("编辑明细")).not.toBeInTheDocument();
    pressItemAmountKey("退格");
    pressItemAmountKey("确定");
    await waitFor(() =>
      expect(screen.queryByLabelText("金额计算器")).not.toBeInTheDocument(),
    );
    expect(line("编辑明细 1")).toHaveTextContent("¥800");
  });

  it("金额待输入时带快捷金额，点「上次」后填入", async () => {
    await renderConfirmFlow({
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: [{ categoryId: "lunch", amount: "" }],
      },
      suggestions: receiptSuggestions,
    });
    click("修改明细 1 金额：待输入");
    click("上次 ¥498");
    click("确定");
    await waitFor(() =>
      expect(screen.queryByLabelText("金额计算器")).not.toBeInTheDocument(),
    );
    expect(line("编辑明细 1")).toHaveTextContent("¥498");
  });

  it("金额是可用键盘操作的按钮", async () => {
    await renderConfirmFlow();
    const amount = screen.getByRole("button", {
      name: "修改明细 1 金额：¥8,000",
    });
    amount.focus();
    expect(amount).toHaveFocus();
    expect(amount.tagName).toBe("BUTTON");
  });

  it("明细的 × 删除这条明细，铅笔打开编辑抽屉", async () => {
    await renderConfirmFlow();
    click("删除明细 2");
    expect(screen.queryByText("收纳")).not.toBeInTheDocument();
    click("编辑明细 1");
    expect(await screen.findByText("编辑明细")).toBeInTheDocument();
  });

  it.each([
    { categoryId: "lunch", groupName: "餐饮", categoryName: "午餐" },
    { categoryId: "points", groupName: "其他收入", categoryName: "积分返还" },
  ])(
    "多账户小票新增明细时默认选中 $groupName 的第一个可用小分类",
    async ({ categoryId, groupName, categoryName }) => {
      await renderConfirmFlow({
        itemsOptions: {
          ...receiptItemsOptions,
          initialItems: [{ categoryId, amount: "10000" }],
          initialPayments: twoPayments,
        },
      });
      click("添加明细");
      expect(
        screen.getByRole("button", { name: groupName, pressed: true }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: categoryName, pressed: true }),
      ).toBeInTheDocument();
    },
  );

  it("小票里手动切换大分类时选中该组第一个小分类", async () => {
    await renderConfirmFlow();
    click("添加明细");
    click("日用品");
    expect(
      screen.getByRole("button", { name: "收纳", pressed: true }),
    ).toBeInTheDocument();
  });

  it("编辑小票明细时仍选中该明细原有分类", async () => {
    await renderConfirmFlow();
    click("编辑明细 2");
    expect(
      screen.getByRole("button", { name: "日用品", pressed: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "收纳", pressed: true }),
    ).toBeInTheDocument();
  });

  it("支付行的铅笔打开账户选择抽屉并换账户，图标显示账户名的文字", async () => {
    const { props } = await renderConfirmFlow();
    expect(within(line("更换支付账户 1")).getByText("P")).toBeInTheDocument();
    click("更换支付账户 1");
    expect(
      screen.getByRole("radiogroup", { name: "收支账户" }),
    ).toBeInTheDocument();
    expect(screen.getByText("推荐账户")).toBeInTheDocument();
    selectAccount("现金 JPY");
    await waitFor(() =>
      expect(line("更换支付账户 1")).toHaveTextContent("现金"),
    );
    expect(props.onAccountSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "cash" }),
    );
    // 账户名与文字图标都是「现金」，按图标（aria-hidden）取。
    expect(
      within(line("更换支付账户 1")).getByText("现金", {
        selector: "[aria-hidden]",
      }),
    ).toBeInTheDocument();
  });

  it("删除最后一个付款账户后只剩添加按钮，点保存只显示顶部提示", async () => {
    await renderConfirmFlow();
    click("删除支付账户 1");
    expectNoPaymentRow();
    expect(
      screen.queryByRole("button", { name: "删除支付账户 1" }),
    ).not.toBeInTheDocument();
    expect(saveButton()).toBeEnabled();
    click("保存记账");
    expectNoPaymentRow();
    click("请添加付款账户");
    expect(
      screen.getByRole("radiogroup", { name: "收支账户" }),
    ).toBeInTheDocument();
  });

  it("删除账户后重开抽屉没有选中项，重新选择原账户时写入小票", async () => {
    await renderConfirmFlow();
    click("删除支付账户 1");
    click("添加付款账户");
    const accounts = within(
      screen.getByRole("radiogroup", { name: "收支账户" }),
    );
    expect(accounts.queryByRole("radio", { checked: true })).toBeNull();
    selectAccount("PayPay JPY");
    await waitFor(() =>
      expect(line("更换支付账户 1")).toHaveTextContent("PayPayJPY"),
    );
  });

  it("删除唯一账户后再选不同币种的账户，仍按原币种弹出换币种确认", async () => {
    await renderConfirmFlow();
    click("删除支付账户 1");
    click("添加付款账户");
    selectAccount("招商银行卡 CNY");
    expect(
      await screen.findByText("切换为 招商银行卡 账户？"),
    ).toBeInTheDocument();
    click("取消");
    // 取消后仍停在账户抽屉，换成同币种的账户不再确认。
    await waitFor(() =>
      expect(screen.queryByText(/切换为/)).not.toBeInTheDocument(),
    );
    selectAccount("现金 JPY");
    await waitFor(() =>
      expect(line("更换支付账户 1")).toHaveTextContent("现金"),
    );
    expect(screen.queryByText(/切换为/)).not.toBeInTheDocument();
  });

  it.each([
    ["直接换账户", false],
    ["点 × 清空后再选", true],
  ])("%s时，换币种确认框显示在账户抽屉之上", async (_, clearFirst) => {
    await renderConfirmFlow();
    const dialog = await openCurrencyConfirm("招商银行卡 CNY", clearFirst);
    const drawer = screen.getByRole("radio", {
      name: "招商银行卡 CNY",
      hidden: true,
    });
    expect(zIndexOf(dialog, ".MuiDialog-root")).toBeGreaterThan(
      zIndexOf(drawer, ".MuiDrawer-root"),
    );
  });

  it("换币种后小数位超出：显示真实金额并标红，合计与提示条正确，重新输入后可以保存", async () => {
    await renderConfirmFlow({
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: [{ categoryId: "lunch", amount: "12.55" }],
        initialPayments: [{ accountId: "cny", amount: null }],
      },
    });
    await openCurrencyConfirm("现金 JPY");
    click("切换");
    await waitFor(() =>
      expect(line("更换支付账户 1")).toHaveTextContent("现金"),
    );
    expect(
      screen.getByRole("button", { name: "修改明细 1 金额：¥12.55" }),
    ).toBeInTheDocument();
    // 点保存前不标红，也不显示小数位说明。
    expect(line("编辑明细 1")).not.toHaveAttribute("data-invalid");
    expect(
      screen.queryByText("新币种不支持这么多位小数，请重新输入"),
    ).toBeNull();
    expect(screen.getByText("合计").nextElementSibling).toHaveTextContent(
      "¥12.55",
    );
    expect(screen.queryByText("请完善明细分类和金额")).toBeNull();
    expect(saveButton()).toBeEnabled();
    click("保存记账");
    expect(line("编辑明细 1")).toHaveAttribute("data-invalid", "true");
    expect(
      within(line("编辑明细 1")).getByText(
        "新币种不支持这么多位小数，请重新输入",
      ),
    ).toBeInTheDocument();
    click("1 条明细金额的小数位超出当前币种，点一下重新输入");
    expect(await screen.findByLabelText("金额计算器")).toBeInTheDocument();
    pressItemAmountKey("1");
    pressItemAmountKey("3");
    pressItemAmountKey("确定");
    await waitFor(() =>
      expect(screen.queryByLabelText("金额计算器")).not.toBeInTheDocument(),
    );
    expect(line("编辑明细 1")).not.toHaveAttribute("data-invalid");
    expect(line("编辑明细 1")).toHaveTextContent("¥13");
    expect(saveButton()).toBeEnabled();
  });

  it("添加付款账户打开抽屉，取消不新增行，选中后才新增一行", async () => {
    await renderConfirmFlow();
    click("添加付款账户");
    const accounts = within(
      screen.getByRole("radiogroup", { name: "收支账户" }),
    );
    expect(
      accounts
        .getAllByRole("radio")
        .map((radio) => radio.getAttribute("aria-label")),
    ).toEqual(["现金 JPY", "乐天银行 JPY"]);
    click("关闭收支账户编辑");
    const addButton = await screen.findByRole("button", {
      name: "添加付款账户",
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "更换支付账户 2" })).toBeNull();
    fireEvent.click(addButton);
    selectAccount("现金 JPY");
    await waitFor(() =>
      expect(line("更换支付账户 2")).toHaveTextContent("现金JPY¥0"),
    );
    expect(line("更换支付账户 1")).toHaveTextContent("PayPayJPY¥10,000");
    expect(saveButton()).toBeEnabled();
  });

  it.each([
    { scenario: "收支混合", hasExpense: true, enabled: true, showsHint: true },
    {
      scenario: "收支混合但账本关闭多账户",
      hasExpense: true,
      enabled: false,
      showsHint: false,
    },
    {
      scenario: "纯支出但账本关闭多账户",
      hasExpense: true,
      hasIncome: false,
      enabled: false,
      showsHint: false,
    },
  ])(
    "$scenario 时隐藏添加付款账户并正确显示说明",
    async ({ hasExpense, hasIncome = true, enabled, showsHint }) => {
      await renderConfirmFlow({
        itemsOptions: {
          ...receiptItemsOptions,
          initialItems: [
            ...(hasExpense ? filledItems : []),
            ...(hasIncome ? [{ categoryId: "points", amount: "100" }] : []),
          ],
          multiAccountPaymentEnabled: enabled,
        },
      });
      expect(screen.queryByRole("button", { name: "添加付款账户" })).toBeNull();
      const hint = screen.queryByText(
        "同时记录收入和支出时，仅允许记录在一个账户上",
      );
      if (showsHint) expect(hint).toBeInTheDocument();
      else expect(hint).not.toBeInTheDocument();
    },
  );

  it("纯收入可以添加第二个收款账户，金额和对账显示为收款", async () => {
    await renderConfirmFlow({
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: [{ categoryId: "points", amount: "100" }],
        initialPayments: [{ accountId: "", amount: null }],
      },
    });
    expect(screen.queryByRole("button", { name: "更换收款账户 1" })).toBeNull();
    click("添加收款账户");
    selectAccount("现金 JPY");
    await waitFor(() =>
      expect(line("更换收款账户 1")).toHaveTextContent("现金JPY"),
    );
    click("添加收款账户");
    selectAccount("PayPay JPY");
    await waitFor(() =>
      expect(line("更换收款账户 2")).toHaveTextContent("PayPayJPY¥0"),
    );
    expect(line("编辑明细 1")).toHaveTextContent("积分返还");
    expect(
      screen.getByRole("button", { name: "修改收款账户 1 金额：¥100" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "收款合计 ¥100 = 明细合计 ¥100",
    );
    expect(saveButton()).toBeEnabled();
  });

  it("多账户已对上时显示对账行并可保存", async () => {
    await renderMultiAccount();
    expect(line("更换支付账户 1")).toHaveTextContent("PayPayJPY¥7,000");
    expect(line("更换支付账户 2")).toHaveTextContent("现金JPY¥3,000");
    expect(screen.getByRole("status")).toHaveTextContent(
      "✓ 付款合计 ¥10,000 = 明细合计 ¥10,000",
    );
    expect(saveButton()).toBeEnabled();
  });

  it("多账户未对上时显示差额、标红并禁用保存，在小票里调整金额后对上", async () => {
    await renderMultiAccount("9000");
    expect(screen.getByRole("status")).toHaveTextContent(
      "付款合计 ¥10,000 / 明细合计 ¥9,000 · 差额 ¥1,000",
    );
    expect(screen.getByRole("status")).not.toHaveAttribute("data-invalid");
    expect(
      screen.queryByRole("button", { name: "付款账户未对上，点一下去调整" }),
    ).toBeNull();
    click("保存记账");
    expect(screen.getByRole("status")).toHaveAttribute("data-invalid", "true");
    expect(
      screen.getByRole("button", { name: "付款账户未对上，点一下去调整" }),
    ).toBeInTheDocument();
    expect(saveButton()).toBeEnabled();
    click("修改支付账户 2 金额：¥3,000");
    expect(await screen.findByText("现金 的金额")).toBeInTheDocument();
    for (const key of ["退格", "退格", "退格", "退格", "2", "0", "0", "0"])
      pressItemAmountKey(key);
    pressItemAmountKey("确定");
    await waitFor(() =>
      expect(screen.queryByLabelText("金额计算器")).not.toBeInTheDocument(),
    );
    expect(line("更换支付账户 2")).toHaveTextContent("¥2,000");
    expect(screen.getByRole("status")).toHaveTextContent("✓");
    expect(saveButton()).toBeEnabled();
  });

  it("多账户的 × 删除追加的账户，回到单账户", async () => {
    await renderMultiAccount();
    click("删除支付账户 2");
    expect(
      screen.queryByRole("button", { name: "更换支付账户 2" }),
    ).not.toBeInTheDocument();
    expect(line("更换支付账户 1")).toHaveTextContent("PayPayJPY¥10,000");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("多账户换账户时只能选同币种、未被其他行选中的账户", async () => {
    await renderMultiAccount();
    click("更换支付账户 2");
    const accounts = within(
      screen.getByRole("radiogroup", { name: "收支账户" }),
    )
      .getAllByRole("radio")
      .map((item) => item.getAttribute("aria-label"));
    expect(accounts).toEqual(["现金 JPY", "乐天银行 JPY"]);
  });

  it("空备注显示占位，抽屉计数并保留已编辑备注", async () => {
    await renderConfirmFlow();
    fireEvent.click(headerRow("备注"));
    const input = screen.getByRole("textbox", { name: "备注" });
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute("aria-label", "备注");
    expect(screen.queryByText("备注", { selector: "label" })).toBeNull();
    expect(input).toHaveAttribute("maxlength", "2000");
    fireEvent.change(input, { target: { value: "一起吃午餐" } });
    expect(screen.getByText("5 / 2000")).toBeInTheDocument();
    click("完成");
    await waitFor(() =>
      expect(
        screen.queryByRole("textbox", { name: "备注" }),
      ).not.toBeInTheDocument(),
    );
    expect(headerRow("备注")).toHaveTextContent("一起吃午餐");
    expect(new FormData(transactionForm()).get("note")).toBe("一起吃午餐");
  });

  it("时间选择和提交保留秒，小票只显示分钟", async () => {
    await renderConfirmFlow();
    fireEvent.click(headerRow("时间"));
    // 时刻滚轮同时挂载上百个选项按钮，getByRole 每次都要计算全部按钮的可访问名，
    // 单次约 1 秒；选项都有 aria-label，改用 getByLabelText 直接定位。
    fireEvent.click(screen.getByLabelText("选择时刻"));
    fireEvent.click(screen.getByLabelText("选择 12 时"));
    fireEvent.click(screen.getByLabelText("选择 30 分"));
    fireEvent.click(screen.getByLabelText("选择 47 秒"));
    click("完成");
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "选择 47 秒" }),
      ).not.toBeInTheDocument(),
    );
    expect(headerRow("时间")).toHaveTextContent("12:30");
    expect(headerRow("时间")).not.toHaveTextContent("12:30:47");
    expect(new FormData(transactionForm()).get("transactionAt")).toMatch(
      /T12:30:47$/,
    );
  });

  it("缺少账户和明细时只在保存后显示顶部提示，点明细提示打开分类抽屉", async () => {
    await renderConfirmFlow({
      itemsOptions: {
        ...receiptItemsOptions,
        initialPayments: [{ accountId: "", amount: null }],
      },
      suggestions: {
        ...receiptSuggestions,
        automaticCategoryIds: [],
        recommendedAccountIds: [],
      },
    });
    expectNoPaymentRow();
    expect(screen.queryByText("请添加明细")).toBeNull();
    expect(saveButton()).toBeEnabled();
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
    click("保存记账");
    expect(screen.getAllByRole("alert")).toHaveLength(2);
    expectNoPaymentRow();
    // 明细区不再重复显示「请添加明细」，只保留顶部提示。
    expect(screen.queryByText("请添加明细", { selector: "p" })).toBeNull();
    click("请添加明细");
    expect(
      await screen.findByRole("textbox", { name: "搜索小分类" }),
    ).toBeInTheDocument();
  });

  it("未填金额标红，点击提示打开金额键盘", async () => {
    await renderConfirmFlow({
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: [{ categoryId: "lunch", amount: "" }],
      },
    });
    expect(line("编辑明细 1")).not.toHaveAttribute("data-invalid");
    expect(screen.queryByText(/还有 1 条明细没填金额/)).toBeNull();
    click("保存记账");
    expect(line("编辑明细 1")).toHaveAttribute("data-invalid", "true");
    click("还有 1 条明细没填金额，点一下去填写");
    pressItemAmountKey("8");
    pressItemAmountKey("确定");
    await waitFor(() =>
      expect(screen.queryByLabelText("金额计算器")).not.toBeInTheDocument(),
    );
    expect(line("编辑明细 1")).toHaveTextContent(/¥\s*8/);
    expect(saveButton()).toBeEnabled();
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
  });

  it.each([true, false])(
    "提交%s时显示结果并在提交中禁用保存",
    async (success) => {
      let resolve!: (state: { success?: string; error?: string }) => void;
      const action = vi.fn(
        () =>
          new Promise<{ success?: string; error?: string }>((done) => {
            resolve = done;
          }),
      );
      await renderConfirmFlow({ action });
      click("保存记账");
      await waitFor(() => expect(action).toHaveBeenCalledOnce());
      expect(screen.getByRole("button", { name: /保存中/ })).toBeDisabled();
      const data = action.mock.calls[0] as unknown as [unknown, FormData];
      expect(data[1].has(saveAndLeaveField)).toBe(false);
      expect(data[1].get("merchantId")).toBe("seven");
      expect(data[1].get("accountId")).toBe("paypay");
      expect(data[1].getAll("itemAmount")).toEqual(["8000", "2000"]);
      resolve(success ? { success: "已保存" } : { error: "保存失败，请重试" });
      expect(
        await screen.findByText(success ? "已保存" : "保存失败，请重试"),
      ).toBeInTheDocument();
      expect(saveButton()).toBeEnabled();
    },
  );

  it.each(["成功", "服务端失败", "校验失败"])(
    "新增小票保存并退出仅在保存成功时关闭（%s）",
    async (outcome) => {
      const action = vi
        .fn<TransactionStepFlowProps["action"]>()
        .mockResolvedValue(
          outcome === "成功"
            ? { success: "已保存" }
            : { error: "保存失败，请重试" },
        );
      const onClose = vi.fn();
      await renderConfirmFlow({
        action,
        onClose,
        itemsOptions:
          outcome === "校验失败"
            ? {
                ...receiptItemsOptions,
                initialItems: [{ categoryId: "lunch", amount: "" }],
              }
            : undefined,
      });
      fireEvent.click(headerRow("备注"));
      fireEvent.change(screen.getByRole("textbox", { name: "备注" }), {
        target: { value: "新增备注" },
      });
      click("完成");
      fireEvent.click(await screen.findByRole("button", { name: "关闭记账" }));
      click("保存并退出");
      if (outcome === "校验失败") {
        await screen.findByText(/还有 1 条明细没填金额/);
        expect(action).not.toHaveBeenCalled();
      } else {
        await waitFor(() => expect(action).toHaveBeenCalledOnce());
        expect(action.mock.calls[0]![1].get(saveAndLeaveField)).toBe("true");
      }
      if (outcome === "成功")
        await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
      else {
        if (outcome === "服务端失败")
          await screen.findByText("保存失败，请重试");
        expect(onClose).not.toHaveBeenCalled();
      }
    },
  );

  it("保存后新出现的问题不标红，下次保存才标红；已标红的问题解决后取消标红", async () => {
    await renderConfirmFlow({
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: [{ categoryId: "lunch", amount: "" }],
      },
    });
    click("保存记账");
    expect(line("编辑明细 1")).toHaveAttribute("data-invalid", "true");
    // 保存后才出现的问题：付款账户被删除。
    click("删除支付账户 1");
    expectNoPaymentRow();
    expect(screen.queryByText("请添加付款账户")).toBeNull();
    // 已标红的明细填好金额后取消标红。
    click("修改明细 1 金额：待输入");
    pressItemAmountKey("8");
    pressItemAmountKey("确定");
    await waitKeypadClosed();
    expect(line("编辑明细 1")).not.toHaveAttribute("data-invalid");
    click("保存记账");
    expectNoPaymentRow();
    expect(
      screen.getByRole("button", { name: "请添加付款账户" }),
    ).toBeInTheDocument();
  });

  it("已解决的问题再次出现时不显示，下次保存才显示", async () => {
    await renderConfirmFlow({
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: [{ categoryId: "lunch", amount: "" }],
      },
    });
    click("保存记账");
    click("还有 1 条明细没填金额，点一下去填写");
    pressItemAmountKey("8");
    pressItemAmountKey("确定");
    await waitKeypadClosed();
    // 再添加一条明细、不填金额：同类问题再次出现，但这是保存后新出现的。
    click("添加明细");
    click("确定");
    click("关闭金额键盘");
    await waitKeypadClosed();
    expect(screen.queryByText(/条明细没填金额/)).toBeNull();
    expect(line("编辑明细 2")).not.toHaveAttribute("data-invalid");
    click("保存记账");
    expect(
      screen.getByText("还有 1 条明细没填金额，点一下去填写"),
    ).toBeInTheDocument();
    expect(line("编辑明细 2")).toHaveAttribute("data-invalid", "true");
  });

  it("已解决的账户问题再次出现时不显示，下次保存才显示", async () => {
    await renderConfirmFlow();
    click("删除支付账户 1");
    click("保存记账");
    click("请添加付款账户");
    selectAccount();
    expect(screen.queryByText("请添加付款账户")).toBeNull();
    fireEvent.click(
      await screen.findByRole("button", { name: "删除支付账户 1" }),
    );
    expect(screen.queryByText("请添加付款账户")).toBeNull();
    click("保存记账");
    expect(
      screen.getByRole("button", { name: "请添加付款账户" }),
    ).toBeInTheDocument();
  });

  it("再次保存才重播提示动画，修改金额引起文案变化不闪烁", async () => {
    await renderConfirmFlow({
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: [
          { categoryId: "lunch", amount: "" },
          { categoryId: "storage", amount: "" },
        ],
      },
    });
    click("保存记账");
    click("保存记账");
    const issue = screen.getByRole("alert");
    const pulseBefore = issue.getAttribute("data-pulse");
    expect(pulseBefore).toBe("1");

    click("修改明细 1 金额：待输入");
    pressItemAmountKey("8");
    pressItemAmountKey("确定");
    await waitKeypadClosed();
    const updated = screen.getByRole("alert");
    expect(updated).toBe(issue);
    expect(updated).toHaveTextContent("还有 1 条明细没填金额");
    expect(updated).toHaveAttribute("data-pulse", pulseBefore);

    click("保存记账");
    expect(screen.getByRole("alert")).toHaveAttribute("data-pulse", "2");
  });
});

describe("TransactionConfirmStep 金额键盘", () => {
  it("按键、快捷金额、清空时小票金额不变，点「确定」才写入", async () => {
    await renderConfirmFlow({ suggestions: receiptSuggestions });
    click("修改明细 1 金额：¥8,000");
    pressItemAmountKey("5");
    expectReceiptAmount("修改明细 1 金额：¥8,000");
    click("上次 ¥498");
    expectReceiptAmount("修改明细 1 金额：¥8,000");
    pressItemAmountKey("清空");
    expectReceiptAmount("修改明细 1 金额：¥8,000");
    expect(screen.getByText("合计").nextElementSibling!).toHaveTextContent(
      "¥10,000",
    );
    pressItemAmountKey("1");
    pressItemAmountKey("2");
    pressItemAmountKey("确定");
    await waitKeypadClosed();
    expect(line("编辑明细 1")).toHaveTextContent("¥12");
  });

  it("点 × 关闭时放弃输入，金额保持打开前的值", async () => {
    await renderConfirmFlow();
    click("修改明细 1 金额：¥8,000");
    pressItemAmountKey("清空");
    pressItemAmountKey("3");
    click("关闭金额键盘");
    await waitKeypadClosed();
    expect(line("编辑明细 1")).toHaveTextContent("¥8,000");
    click("修改明细 1 金额：¥8,000");
    expect(screen.getByLabelText("计算器显示金额")).toHaveTextContent("8000");
  });

  it("显示 0 时点「确定」写入 0", async () => {
    await renderConfirmFlow();
    click("修改明细 1 金额：¥8,000");
    pressItemAmountKey("清空");
    pressItemAmountKey("确定");
    await waitKeypadClosed();
    expect(
      screen.getByRole("button", { name: "修改明细 1 金额：¥0" }),
    ).toBeInTheDocument();
  });

  it("确定后只关闭键盘，不自动打开下一条未填金额的明细", async () => {
    await renderConfirmFlow({
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: [
          { categoryId: "lunch", amount: "" },
          { categoryId: "storage", amount: "" },
        ],
      },
    });
    click("修改明细 1 金额：待输入");
    pressItemAmountKey("8");
    pressItemAmountKey("确定");
    await waitKeypadClosed();
    expect(line("编辑明细 1")).toHaveTextContent("¥8");
    expect(
      screen.getByRole("button", { name: "修改明细 2 金额：待输入" }),
    ).toBeInTheDocument();
  });

  it("多账户确定一个账户的金额后，不把差额补到下一个账户", async () => {
    await renderMultiAccount();
    click("修改支付账户 1 金额：¥7,000");
    pressItemAmountKey("清空");
    for (const key of ["6", "0", "0", "0"]) pressItemAmountKey(key);
    expectReceiptAmount("修改支付账户 1 金额：¥7,000");
    pressItemAmountKey("确定");
    await waitKeypadClosed();
    expect(line("更换支付账户 1")).toHaveTextContent("¥6,000");
    expect(line("更换支付账户 2")).toHaveTextContent("¥3,000");
    expect(screen.getByRole("status")).toHaveTextContent(
      "付款合计 ¥9,000 / 明细合计 ¥10,000 · 差额 ¥1,000",
    );
    expect(saveButton()).toBeEnabled();
  });
});

describe("TransactionConfirmStep 只读", () => {
  it("不显示铅笔、×、可点金额、添加入口与保存按钮", () => {
    renderReadOnlyReceipt({
      ...receiptItemsOptions,
      initialItems: [
        { categoryId: "lunch", amount: "800" },
        { categoryId: "points", amount: "100" },
      ],
      initialPayments: twoPayments,
    });
    expect(screen.getByText("7-Eleven")).toBeInTheDocument();
    expect(screen.getByText("午餐")).toBeInTheDocument();
    expect(screen.getByText("餐饮")).toHaveClass("MuiTypography-caption");
    expect(screen.getByText("PayPay")).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryByTestId("EditOutlinedIcon")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("有备注时显示备注，没有备注时不显示备注区", () => {
    const { unmount } = renderReadOnlyReceipt(
      { ...receiptItemsOptions, initialItems: filledItems },
      { note: "买了饭团" },
    );
    expect(screen.getByText("买了饭团")).toBeInTheDocument();
    unmount();
    renderReadOnlyReceipt({
      ...receiptItemsOptions,
      initialItems: filledItems,
    });
    expect(screen.queryByText("备注")).not.toBeInTheDocument();
    expect(screen.queryByText("添加备注（可选）")).not.toBeInTheDocument();
  });

  it("付款账户不在可选账户中（已归档）时显示已归档账户与金额，不标红", () => {
    renderReadOnlyReceipt({
      ...receiptItemsOptions,
      initialItems: filledItems,
      initialPayments: [{ accountId: "archived", amount: null }],
    });
    const payment = screen.getByText("已归档账户");
    expect(screen.queryByText("选择收支账户")).not.toBeInTheDocument();
    expect(payment.closest("[data-invalid]")).toBeNull();
    // 支付区：标题「支付」与付款行。
    expect(screen.getByText("支付").parentElement!).toHaveTextContent(
      /已归档账户.*10,000/,
    );
  });

  it("不显示自动添加提示", () => {
    renderReadOnlyReceipt({
      ...receiptItemsOptions,
      initialItems: filledItems,
    });
    expectAutomaticNotice(false);
  });
});
