import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderConfirmFlow } from "test/transactionConfirmStep";
import { clickEntryButton as click } from "test/transactionStepFlow";
import { itemsStepFixture, twoPayments } from "test/mocks/transactionItemsStep";

function row(label: string) {
  return screen.getByRole("button", { name: new RegExp(`^修改${label}：`) });
}
function transactionForm() {
  return screen.getByRole("button", { name: "保存记账" }).closest("form")!;
}

describe("TransactionConfirmStep", () => {
  it("小票从上到下显示抬头、明细、合计、支付与备注", () => {
    renderConfirmFlow();
    expect(row("商家")).toHaveTextContent("7-Eleven");
    expect(row("时间")).toHaveTextContent(/\d{2}:\d{2}$/);
    expect(row("明细 1")).toHaveTextContent("餐饮 · 午餐¥8,000");
    expect(row("明细 2")).toHaveTextContent("¥2,000");
    expect(screen.getByText("合计").nextElementSibling).toHaveTextContent(
      "¥10,000",
    );
    expect(row("支付账户 1")).toHaveTextContent("PayPayJPY¥10,000");
    expect(row("备注")).toHaveTextContent("添加备注");
  });

  it("商家、时间、每条明细、支付账户、备注各有一个铅笔，合计行没有", () => {
    renderConfirmFlow();
    expect(screen.getAllByTestId("EditOutlinedIcon")).toHaveLength(6);
    for (const label of [
      "商家",
      "时间",
      "明细 1",
      "明细 2",
      "支付账户 1",
      "备注",
    ])
      expect(
        within(row(label)).getByTestId("EditOutlinedIcon"),
      ).toBeInTheDocument();
    expect(
      screen.getByText("合计").parentElement!.querySelector("svg"),
    ).toBeNull();
  });

  it.each([
    ["商家", () => screen.getByRole("textbox", { name: "搜索商家" })],
    ["支付账户 1", () => screen.getByRole("radiogroup", { name: "收支账户" })],
  ])("点击%s回到对应步骤", (label, target) => {
    renderConfirmFlow();
    fireEvent.click(row(label));
    expect(target()).toBeInTheDocument();
  });

  it("多账户时点击支付账户回到明细步骤的付款分配", () => {
    renderConfirmFlow({
      itemsOptions: {
        ...itemsStepFixture,
        initialItems: [{ categoryId: "lunch", amount: "10000" }],
        initialPayments: twoPayments,
      },
    });
    expect(row("支付账户 1")).toHaveTextContent("PayPayJPY¥7,000");
    expect(row("支付账户 2")).toHaveTextContent("现金JPY¥3,000");
    fireEvent.click(row("支付账户 2"));
    expect(screen.getByText("付款账户")).toBeInTheDocument();
  });

  it("点击明细打开该明细的编辑，保存后弹出金额键盘", async () => {
    renderConfirmFlow();
    fireEvent.click(row("明细 1"));
    expect(await screen.findByText("编辑明细")).toBeInTheDocument();
    click("保存修改");
    expect(await screen.findByLabelText("金额计算器")).toBeInTheDocument();
  });

  it("小票内添加明细打开选择分类抽屉", async () => {
    renderConfirmFlow();
    click("添加明细");
    expect(
      await screen.findByRole("textbox", { name: "搜索小分类" }),
    ).toBeInTheDocument();
  });

  it("空备注显示占位，抽屉计数并保留已编辑备注", async () => {
    renderConfirmFlow();
    expect(row("备注")).toHaveTextContent("添加备注");
    fireEvent.click(row("备注"));
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
    expect(row("备注")).toHaveTextContent("一起吃午餐");
    expect(new FormData(transactionForm()).get("note")).toBe("一起吃午餐");
    fireEvent.click(row("备注"));
    expect(screen.getByRole("textbox", { name: "备注" })).toHaveValue(
      "一起吃午餐",
    );
    click("关闭备注编辑");
  });

  it("时间选择和提交保留秒，确认行只显示分钟且日期时刻互斥展开", async () => {
    renderConfirmFlow();
    fireEvent.click(row("时间"));
    expect(screen.getByRole("button", { name: "上个月" })).toBeInTheDocument();
    const timeRow = screen.getByRole("button", { name: /时刻/ });
    fireEvent.click(timeRow);
    expect(screen.getByRole("button", { name: "日期" })).toBeInTheDocument();
    click("选择 12 时");
    click("选择 30 分");
    click("选择 47 秒");
    click("完成");
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "选择 47 秒" }),
      ).not.toBeInTheDocument(),
    );
    expect(row("时间")).toHaveTextContent("12:30");
    expect(row("时间")).not.toHaveTextContent("12:30:47");
    expect(new FormData(transactionForm()).get("transactionAt")).toMatch(
      /T12:30:47$/,
    );
  }, 15000);

  it("缺少商家账户和明细时提示、标红并禁用保存", () => {
    renderConfirmFlow({
      initialMerchantId: undefined,
      initialAccountId: undefined,
      itemsOptions: { categoryOptions: itemsStepFixture.categoryOptions },
    });
    expect(row("商家")).toHaveAttribute("data-invalid", "true");
    expect(row("支付账户 1")).toHaveAttribute("data-invalid", "true");
    expect(screen.getByText("请添加明细", { selector: "p" })).toHaveAttribute(
      "data-invalid",
      "true",
    );
    expect(screen.getByRole("button", { name: "保存记账" })).toBeDisabled();
    expect(screen.getAllByRole("alert")).toHaveLength(3);
  });

  it("未填金额标红，点击提示打开金额键盘并实时同步", async () => {
    renderConfirmFlow({
      itemsOptions: {
        ...itemsStepFixture,
        initialItems: [{ categoryId: "lunch", amount: "" }],
      },
    });
    expect(row("明细 1")).toHaveAttribute("data-invalid", "true");
    click("还有 1 条明细没填金额，点一下去填写");
    click("8");
    click("确定");
    await waitFor(() =>
      expect(screen.queryByLabelText("金额计算器")).not.toBeInTheDocument(),
    );
    expect(row("明细 1")).toHaveTextContent(/¥\s*8/);
    expect(screen.getByRole("button", { name: "保存记账" })).toBeEnabled();
  });

  it("点击金额待输入的明细行直接打开带快捷金额的金额键盘", async () => {
    renderConfirmFlow({
      itemsOptions: {
        ...itemsStepFixture,
        initialItems: [{ categoryId: "lunch", amount: "" }],
      },
      suggestions: itemsStepFixture.suggestions,
    });
    expect(row("明细 1")).toHaveTextContent("待输入");
    fireEvent.click(row("明细 1"));
    expect(await screen.findByLabelText("金额计算器")).toBeInTheDocument();
    expect(screen.queryByText("编辑明细")).not.toBeInTheDocument();
    click("上次 ¥498");
    click("确定");
    await waitFor(() =>
      expect(screen.queryByLabelText("金额计算器")).not.toBeInTheDocument(),
    );
    expect(row("明细 1")).toHaveTextContent("¥498");
  });

  it("多账户未对上时提示跳到明细并禁用保存", () => {
    renderConfirmFlow({
      itemsOptions: {
        ...itemsStepFixture,
        initialItems: [{ categoryId: "lunch", amount: "20" }],
        initialPayments: twoPayments,
      },
    });
    expect(row("支付账户 1")).toHaveAttribute("data-invalid", "true");
    expect(row("支付账户 2")).toHaveAttribute("data-invalid", "true");
    expect(screen.getByRole("button", { name: "保存记账" })).toBeDisabled();
    click("付款账户未对上，点一下去调整");
    expect(screen.getByText("付款账户")).toBeInTheDocument();
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
      expect(screen.getByRole("button", { name: "保存记账" })).toBeEnabled();
    },
  );
});
