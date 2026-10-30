import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  expectAutomaticItems,
  receiptLine as line,
  pressItemAmountKey,
  renderConfirmFlow,
} from "test/transactionConfirmStep";
import {
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
  click("更换支付账户 1");
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
  it("小票从上到下显示抬头、明细、合计（含支出）、支付与备注", () => {
    renderConfirmFlow();
    expect(headerRow("商家")).toHaveTextContent("7-Eleven");
    expect(headerRow("时间")).toHaveTextContent(/\d{2}:\d{2}$/);
    expect(line("编辑明细 1")).toHaveTextContent("餐饮 · 午餐¥8,000");
    expect(line("编辑明细 2")).toHaveTextContent("日用品 · 收纳¥2,000");
    const total = screen.getByText("合计").nextElementSibling!;
    expect(total).toHaveTextContent("¥10,000");
    expect(total).toHaveTextContent("支出 ¥10,000");
    expect(line("更换支付账户 1")).toHaveTextContent("PayPayJPY¥10,000");
    expect(headerRow("备注")).toHaveTextContent("添加备注");
  });

  it("合计与明细行沿用原明细卡片的字号", () => {
    renderConfirmFlow();
    expect(screen.getByText("¥10,000", { selector: "h5" })).toHaveClass(
      "MuiTypography-h5",
    );
    expect(screen.getByText("餐饮 · 午餐")).toHaveClass("MuiTypography-body2");
  });

  it("有收入时合计下方显示支出与收入", () => {
    renderConfirmFlow({
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: [
          { categoryId: "lunch", amount: "800" },
          { categoryId: "points", amount: "100" },
        ],
      },
    });
    expect(screen.getByText("支出 ¥800 · 收入 ¥100")).toBeInTheDocument();
  });

  it("明细和支付行各有一个铅笔和一个 ×，商家名与时间的铅笔紧跟文字", () => {
    renderConfirmFlow();
    for (const [edit, remove] of [
      ["编辑明细 1", "删除明细 1"],
      ["编辑明细 2", "删除明细 2"],
      ["更换支付账户 1", "删除支付账户 1"],
    ]) {
      const row = line(edit);
      expect(
        within(row).getByRole("button", { name: remove }),
      ).toBeInTheDocument();
      expect(within(row).getByTestId("EditOutlinedIcon")).toBeInTheDocument();
    }
    for (const label of ["商家", "时间"])
      expect(headerRow(label).lastElementChild).toHaveAttribute(
        "data-testid",
        "EditOutlinedIcon",
      );
  });

  it("自动明细只显示添加条数提示，不显示自动标签，删除后条数同步减少", () => {
    renderConfirmFlow({
      itemsOptions: receiptEmojiItemsOptions,
      suggestionsMerchantId: "seven",
      suggestions: receiptSuggestions,
    });
    expectAutomaticItems(2);
    click("删除明细 2");
    expectAutomaticItems(1);
  });

  it("带 emoji 的分类名只显示一次小分类图标，也不显示默认分类图标", () => {
    renderConfirmFlow({
      itemsOptions: {
        ...receiptEmojiItemsOptions,
        initialItems: filledItems,
      },
    });
    const row = line("编辑明细 1");
    expect(row).toHaveTextContent("🍽️ 饮食 · 🍙 午餐");
    expect(row.textContent?.match(/🍙/gu)).toHaveLength(1);
    expect(
      within(line("编辑明细 2")).queryByTestId("CategoryRoundedIcon"),
    ).not.toBeInTheDocument();
  });

  it("小票仍显示业务状态「待报销」标签", () => {
    renderConfirmFlow({
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

  it("有标签时标签显示在分类名下面一行，分类名完整显示", () => {
    renderConfirmFlow({
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
    const name = within(line("编辑明细 1")).getByText("餐饮 · 午餐");
    const badge = within(line("编辑明细 1")).getByText("待报销");
    // 首排包含名称、金额与操作，标签在独立的次排。
    expect(name.parentElement!.contains(badge)).toBe(false);
    expect(
      line("编辑明细 1").firstElementChild!.nextElementSibling,
    ).toContainElement(badge);
    expect(line("编辑明细 2").firstElementChild!.nextElementSibling).toBeNull();
  });

  it("点金额只打开该明细的金额键盘，不打开明细编辑", async () => {
    renderConfirmFlow({ suggestions: receiptSuggestions });
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
    renderConfirmFlow({
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

  it("金额是可用键盘操作的按钮", () => {
    renderConfirmFlow();
    const amount = screen.getByRole("button", {
      name: "修改明细 1 金额：¥8,000",
    });
    amount.focus();
    expect(amount).toHaveFocus();
    expect(amount.tagName).toBe("BUTTON");
  });

  it("明细的 × 删除这条明细，铅笔打开编辑抽屉", async () => {
    renderConfirmFlow();
    click("删除明细 2");
    expect(screen.queryByText("日用品 · 收纳")).not.toBeInTheDocument();
    click("编辑明细 1");
    expect(await screen.findByText("编辑明细")).toBeInTheDocument();
  });

  it("小票内添加明细打开选择分类抽屉", async () => {
    renderConfirmFlow();
    click("添加明细");
    expect(
      await screen.findByRole("textbox", { name: "搜索小分类" }),
    ).toBeInTheDocument();
  });

  it("支付行的铅笔打开账户选择抽屉并换账户，图标按账户类型显示", async () => {
    const { props } = renderConfirmFlow();
    expect(
      within(line("更换支付账户 1")).getByTestId(
        "AccountBalanceWalletOutlinedIcon",
      ),
    ).toBeInTheDocument();
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
    expect(
      within(line("更换支付账户 1")).getByTestId("PaymentsOutlinedIcon"),
    ).toBeInTheDocument();
  });

  it("账户类型取不到时显示默认图标", () => {
    renderConfirmFlow({
      accounts: [{ id: "paypay", name: "PayPay", currency: "JPY" }],
    });
    expect(
      within(line("更换支付账户 1")).getByTestId("MoreHorizRoundedIcon"),
    ).toBeInTheDocument();
  });

  it("删除最后一个付款账户后回到「选择收支账户」并禁用保存", () => {
    renderConfirmFlow();
    click("删除支付账户 1");
    expect(line("更换支付账户 1")).toHaveTextContent("选择收支账户");
    expect(line("更换支付账户 1")).toHaveAttribute("data-invalid", "true");
    expect(
      screen.queryByRole("button", { name: "删除支付账户 1" }),
    ).not.toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    click("请选择收支账户");
    expect(
      screen.getByRole("radiogroup", { name: "收支账户" }),
    ).toBeInTheDocument();
  });

  it("未选账户时点「选择收支账户」本身也打开账户选择抽屉", () => {
    renderConfirmFlow();
    click("删除支付账户 1");
    click("选择收支账户");
    expect(
      screen.getByRole("radiogroup", { name: "收支账户" }),
    ).toBeInTheDocument();
  });

  it("删除唯一账户后再选不同币种的账户，仍按原币种弹出换币种确认", async () => {
    renderConfirmFlow();
    click("删除支付账户 1");
    click("更换支付账户 1");
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
    renderConfirmFlow();
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
    renderConfirmFlow({
      initialAccountId: "cny",
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: [{ categoryId: "lunch", amount: "12.55" }],
      },
    });
    await openCurrencyConfirm("现金 JPY");
    click("切换");
    await waitFor(() =>
      expect(line("更换支付账户 1")).toHaveTextContent("现金"),
    );
    expect(line("编辑明细 1")).toHaveAttribute("data-invalid", "true");
    expect(
      screen.getByRole("button", { name: "修改明细 1 金额：¥12.55" }),
    ).toBeInTheDocument();
    expect(
      within(line("编辑明细 1")).getByText(
        "新币种不支持这么多位小数，请重新输入",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("合计").nextElementSibling).toHaveTextContent(
      "¥12.55",
    );
    expect(screen.queryByText("请完善明细分类和金额")).toBeNull();
    expect(saveButton()).toBeDisabled();
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

  it("多账户时刚添加、尚未选账户的行也有 ×，删除后回到单账户并可保存", () => {
    renderConfirmFlow();
    click("添加付款账户（多个账户一起付）");
    expect(line("更换支付账户 2")).toHaveTextContent("选择收支账户");
    expect(saveButton()).toBeDisabled();
    click("删除支付账户 2");
    expect(
      screen.queryByRole("button", { name: "更换支付账户 2" }),
    ).not.toBeInTheDocument();
    expect(line("更换支付账户 1")).toHaveTextContent("PayPayJPY¥10,000");
    expect(saveButton()).toBeEnabled();
  });

  it("添加付款账户后多一行待选账户；有收入或账本关闭多账户时不显示入口", () => {
    const view = renderConfirmFlow();
    click("添加付款账户（多个账户一起付）");
    expect(line("更换支付账户 2")).toHaveTextContent("选择收支账户");
    expect(
      screen.getByRole("button", { name: "添加付款账户" }),
    ).toBeInTheDocument();
    view.unmount();
    renderConfirmFlow({
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: [{ categoryId: "points", amount: "100" }],
      },
    });
    expect(screen.queryByRole("button", { name: /添加付款账户/ })).toBeNull();
  });

  it("账本关闭多账户付款时不显示添加付款账户", () => {
    renderConfirmFlow({
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: filledItems,
        multiAccountPaymentEnabled: false,
      },
    });
    expect(screen.queryByRole("button", { name: /添加付款账户/ })).toBeNull();
  });

  it("多账户已对上时显示对账行并可保存", () => {
    renderMultiAccount();
    expect(line("更换支付账户 1")).toHaveTextContent("PayPayJPY¥7,000");
    expect(line("更换支付账户 2")).toHaveTextContent("现金JPY¥3,000");
    expect(screen.getByRole("status")).toHaveTextContent(
      "✓ 付款合计 ¥10,000 = 明细合计 ¥10,000",
    );
    expect(saveButton()).toBeEnabled();
  });

  it("多账户未对上时显示差额、标红并禁用保存，在小票里调整金额后对上", async () => {
    renderMultiAccount("9000");
    expect(screen.getByRole("status")).toHaveTextContent(
      "付款合计 ¥10,000 / 明细合计 ¥9,000 · 差额 ¥1,000",
    );
    expect(screen.getByRole("status")).toHaveAttribute("data-invalid", "true");
    expect(
      screen.getByRole("button", { name: "付款账户未对上，点一下去调整" }),
    ).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
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

  it("多账户的 × 删除追加的账户，回到单账户", () => {
    renderMultiAccount();
    click("删除支付账户 2");
    expect(
      screen.queryByRole("button", { name: "更换支付账户 2" }),
    ).not.toBeInTheDocument();
    expect(line("更换支付账户 1")).toHaveTextContent("PayPayJPY¥10,000");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("多账户换账户时只能选同币种、未被其他行选中的账户", () => {
    renderMultiAccount();
    click("更换支付账户 2");
    const accounts = within(
      screen.getByRole("radiogroup", { name: "收支账户" }),
    )
      .getAllByRole("radio")
      .map((item) => item.getAttribute("aria-label"));
    expect(accounts).toEqual(["现金 JPY", "乐天银行 JPY"]);
  });

  it("空备注显示占位，抽屉计数并保留已编辑备注", async () => {
    renderConfirmFlow();
    fireEvent.click(headerRow("备注"));
    const input = screen.getByRole("textbox", { name: "备注" });
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
    renderConfirmFlow();
    fireEvent.click(headerRow("时间"));
    fireEvent.click(screen.getByRole("button", { name: /时刻/ }));
    click("选择 12 时");
    click("选择 30 分");
    click("选择 47 秒");
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
  }, 15000);

  it("缺少账户和明细时提示、标红并禁用保存，点提示打开对应入口", async () => {
    renderConfirmFlow({
      initialAccountId: undefined,
      itemsOptions: receiptItemsOptions,
    });
    expect(line("更换支付账户 1")).toHaveAttribute("data-invalid", "true");
    expect(screen.getByText("请添加明细", { selector: "p" })).toHaveAttribute(
      "data-invalid",
      "true",
    );
    expect(saveButton()).toBeDisabled();
    expect(screen.getAllByRole("alert")).toHaveLength(2);
    click("请添加明细");
    expect(
      await screen.findByRole("textbox", { name: "搜索小分类" }),
    ).toBeInTheDocument();
  });

  it("未填金额标红，点击提示打开金额键盘", async () => {
    renderConfirmFlow({
      itemsOptions: {
        ...receiptItemsOptions,
        initialItems: [{ categoryId: "lunch", amount: "" }],
      },
    });
    expect(line("编辑明细 1")).toHaveAttribute("data-invalid", "true");
    click("还有 1 条明细没填金额，点一下去填写");
    pressItemAmountKey("8");
    pressItemAmountKey("确定");
    await waitFor(() =>
      expect(screen.queryByLabelText("金额计算器")).not.toBeInTheDocument(),
    );
    expect(line("编辑明细 1")).toHaveTextContent(/¥\s*8/);
    expect(saveButton()).toBeEnabled();
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
      renderConfirmFlow({ action });
      click("保存记账");
      await waitFor(() => expect(action).toHaveBeenCalledOnce());
      expect(screen.getByRole("button", { name: /保存中/ })).toBeDisabled();
      const data = action.mock.calls[0] as unknown as [unknown, FormData];
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
});

describe("TransactionConfirmStep 金额键盘", () => {
  it("按键、快捷金额、清空时小票金额不变，点「确定」才写入", async () => {
    renderConfirmFlow({ suggestions: receiptSuggestions });
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
    renderConfirmFlow();
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
    renderConfirmFlow();
    click("修改明细 1 金额：¥8,000");
    pressItemAmountKey("清空");
    pressItemAmountKey("确定");
    await waitKeypadClosed();
    expect(
      screen.getByRole("button", { name: "修改明细 1 金额：¥0" }),
    ).toBeInTheDocument();
  });

  it("确定后只关闭键盘，不自动打开下一条未填金额的明细", async () => {
    renderConfirmFlow({
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
    renderMultiAccount();
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
    expect(saveButton()).toBeDisabled();
  });
});
