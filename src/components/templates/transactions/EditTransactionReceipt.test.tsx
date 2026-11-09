import { expectEditTransactionActionButton } from "test/editTransactionActionButton";
import { saveAndLeaveField } from "config/unsavedChanges";
import { routerMock } from "test/mocks/navigation";
import { setupGuardHistoryMock, backFromGuard } from "test/mockGuardHistory";
const guardHistory = setupGuardHistoryMock();

vi.mock("next/navigation", () => import("test/mocks/navigation"));
import {
  ReceiptCreationTestProviders,
  receiptCreationData,
  receiptCreationPayments,
  expectCreatedReceiptPayment,
  submitReceiptCreationForm,
  submitReceiptCreation,
} from "test/receiptCreation";
import type { ReceiptCreationData } from "organisms/transactions/ReceiptCreationProvider/ReceiptCreationProvider";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  transactionErrorCodes,
  type MerchantEntrySuggestions,
} from "internal/transaction";
import type { TransactionStateAction } from "types/transactions";
import type { TransactionFormInitialValues } from "organisms/transactions/TransactionForm/TransactionForm.types";
import {
  receiptItemsOptions,
  receiptSuggestions,
} from "test/mocks/transactionReceipt";
import { flowFixture } from "test/mocks/transactionStepFlow";
import {
  expectNoPaymentRow,
  pressItemAmountKey,
} from "test/transactionConfirmStep";
import { selectEntryAccount } from "test/transactionStepFlow";

import { EditTransactionReceiptTemplate } from "./EditTransactionReceipt";

const fetchClientJson = vi.hoisted(() => vi.fn());
vi.mock("lib/api/clientQuery", () => ({ fetchClientJson }));

const transactionRecordId = "00000000-0000-4000-8000-000000009001";
const expectedRecordUpdatedAt = "2026-10-30T01:00:00.000Z";

// 7-Eleven 的午餐 ¥800，用 PayPay 支付。
const initialValues: TransactionFormInitialValues = {
  expectedRecordUpdatedAt,
  items: [{ amount: "800", categoryId: "lunch", specialStatus: null }],
  merchantId: "seven",
  note: "编辑前备注",
  payments: [{ accountId: "paypay", amount: null }],
  transactionAt: "2026-10-29T03:20:10.000Z",
  transactionRecordId,
  type: "expense",
};

const noHistory: MerchantEntrySuggestions = {
  automaticCategoryIds: [],
  quickAmounts: [],
  recommendedAccountIds: [],
};

function renderReceipt(
  overrides: Partial<Parameters<typeof EditTransactionReceiptTemplate>[0]> = {},
  creation: ReceiptCreationData = null,
) {
  return render(
    <EditTransactionReceiptTemplate
      accountOptions={flowFixture.accounts}
      action={vi.fn(async () => ({}))}
      canDelete
      categoryOptions={receiptItemsOptions.categoryOptions}
      deleteAction={vi.fn(async () => ({}))}
      editRestriction={null}
      frequentMerchants={flowFixture.frequentMerchants}
      initialValues={initialValues}
      ledgerId="ledger-1"
      merchantOptions={flowFixture.merchants}
      merchantTags={flowFixture.merchantTags}
      multiAccountPaymentEnabled
      transactionItemSpecialStatusEnabled={false}
      {...overrides}
    />,
    {
      wrapper: ({ children }) => (
        <ReceiptCreationTestProviders data={creation}>
          {children}
        </ReceiptCreationTestProviders>
      ),
    },
  );
}

function click(name: string | RegExp) {
  fireEvent.click(
    screen.getByRole(name === "关闭" ? "link" : "button", { name }),
  );
}

function receiptForm() {
  const form = document.getElementById("edit-transaction-receipt-form");
  if (!(form instanceof HTMLFormElement)) throw new Error("小票表单不存在");
  return form;
}

async function openMerchantPicker() {
  fireEvent.click(await screen.findByRole("button", { name: /^修改商家：/ }));
  return (
    await screen.findByRole("group", { name: "常用商家" })
  ).closest<HTMLElement>(".MuiDrawer-paper")!;
}

// 没有未保存修改时，顶栏的关闭是直接回到明细的链接。
function findCloseLink() {
  return screen.findByRole("link", { name: "关闭" });
}

async function requestLeaveFromDirtyReceipt() {
  render(<a href="/settings">我的</a>);
  click("修改备注：编辑前备注");
  fireEvent.change(screen.getByRole("textbox", { name: "备注" }), {
    target: { value: "修改后" },
  });
  click("完成");
  await findCloseLink();
  fireEvent.click(await screen.findByRole("link", { name: "我的" }));
  click("保存并退出");
}

describe("EditTransactionReceiptTemplate", () => {
  beforeEach(() => {
    fetchClientJson.mockImplementation(async (url: string) =>
      url.includes("merchantId=seven") ? receiptSuggestions : noHistory,
    );
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("编辑小票保存与删除复用相同的底部按钮尺寸", () => {
    renderReceipt();
    for (const name of ["保存修改", "删除"]) {
      expectEditTransactionActionButton(screen.getByRole("button", { name }));
    }
    expect(screen.getByRole("button", { name: "保存修改" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("编辑时删除唯一付款账户后可从添加按钮重新选择", async () => {
    renderReceipt();
    click("删除支付账户 1");
    expectNoPaymentRow();
    click("添加付款账户");
    selectEntryAccount("现金 JPY");
    await waitFor(() =>
      expect(new FormData(receiptForm()).get("accountId")).toBe("cash"),
    );
    expect(
      await screen.findByRole("button", { name: "更换支付账户 1" }),
    ).toBeInTheDocument();
  });

  it.each(["merchant", "account"] as const)(
    "打开并取消新增 %s 不改变小票也不触发未保存",
    async (kind) => {
      renderReceipt({}, receiptCreationData());
      const before = [...new FormData(receiptForm()).entries()];
      if (kind === "merchant") await openMerchantPicker();
      else click("更换支付账户 1");
      click(kind === "merchant" ? "新增商家" : "新增账户");
      const field = await screen.findByLabelText(
        kind === "merchant" ? /商家名称/ : /账户名称/,
      );
      fireEvent.change(field, { target: { value: "取消的内容" } });
      click("取消");
      await waitFor(() =>
        expect(
          screen.queryByRole("button", { name: "取消" }),
        ).not.toBeInTheDocument(),
      );
      expect([...new FormData(receiptForm()).entries()]).toEqual(before);
      // 弹层输入不进入编辑小票的 dirty provider，关闭小票仍为普通链接。
      expect(document.querySelector('a[aria-label="关闭"]')).not.toBeNull();
    },
  );

  it.each([true, false])(
    "新增异币种账户复用确认，确认结果为 %s",
    async (accept) => {
      renderReceipt({}, receiptCreationData({ currency: "CNY" }));
      click("更换支付账户 1");
      click("新增账户");
      await submitReceiptCreationForm("account", "新账户");
      await screen.findByRole("heading", { name: "切换为 新账户 账户？" });
      click(accept ? "切换" : "取消");
      await waitFor(() =>
        expect(new FormData(receiptForm()).get("accountId")).toBe(
          accept ? "new-account" : "paypay",
        ),
      );
      if (accept)
        expect(
          await screen.findByText("已新增账户「新账户」并选中"),
        ).toBeInTheDocument();
      else expect(screen.queryByText("已新增账户「新账户」并选中")).toBeNull();
      expect(new FormData(receiptForm()).getAll("itemAmount")).toEqual(["800"]);
    },
  );

  it("新增商家替换商家但保留金额、备注和付款", async () => {
    renderReceipt({}, receiptCreationData());
    await openMerchantPicker();
    click("新增商家");
    await submitReceiptCreation("merchant", "新商家");
    await screen.findByRole("button", { name: "修改商家：新商家" });
    const data = new FormData(receiptForm());
    expect(data.get("merchantId")).toBe("new-merchant");
    expect(data.getAll("itemAmount")).toEqual(["800"]);
    expect(data.get("note")).toBe(initialValues.note);
    expect(data.get("accountId")).toBe("paypay");
  });

  it.each([1, 2])("新增账户替换发起的第 %i 行付款并保留其他行", async (row) => {
    renderReceipt(
      {
        initialValues: {
          ...initialValues,
          payments: receiptCreationPayments,
        },
      },
      receiptCreationData(),
    );
    click(`更换支付账户 ${row}`);
    click("新增账户");
    await submitReceiptCreation("account", "新账户");
    await screen.findByRole("button", { name: `更换支付账户 ${row}` });
    const data = new FormData(receiptForm());
    expectCreatedReceiptPayment(receiptForm(), row);
    expect(data.get("note")).toBe(initialValues.note);
  });

  it("显示预填的小票，保存修改下方是删除", () => {
    renderReceipt();

    expect(
      screen.getByRole("heading", { name: "编辑记账" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "修改商家：7-Eleven" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "修改明细 1 金额：¥800" }),
    ).toBeInTheDocument();
    expect(screen.getByText("PayPay")).toBeInTheDocument();
    expect(screen.getByText("编辑前备注")).toBeInTheDocument();
    const save = screen.getByRole("button", { name: "保存修改" });
    const remove = screen.getByRole("button", { name: "删除" });
    expect(
      save.compareDocumentPosition(remove) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // 编辑页不切换支出 / 收入 / 转账。
    expect(screen.queryByRole("button", { name: "转账" })).toBeNull();
  });

  it("提交记录标识、记录版本与编辑前类型", () => {
    renderReceipt();
    const formData = new FormData(receiptForm());

    expect(formData.get("transactionRecordId")).toBe(transactionRecordId);
    expect(formData.get("expectedRecordUpdatedAt")).toBe(
      expectedRecordUpdatedAt,
    );
    expect(formData.get("sourceType")).toBe("expense");
    expect(formData.get("type")).toBe("expense");
    expect(formData.get("merchantId")).toBe("seven");
    expect(formData.getAll("itemAmount")).toEqual(["800"]);
  });

  it("有限制时显示只读小票：没有铅笔与保存，无删除权限时不显示删除", () => {
    renderReceipt({ canDelete: false, editRestriction: "permission" });

    expect(
      screen.getByRole("heading", { name: "记账详情" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^修改商家/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "保存修改" })).toBeNull();
    expect(screen.queryByRole("button", { name: "删除" })).toBeNull();
    // 只读时不读取快捷金额。
    expect(fetchClientJson).not.toHaveBeenCalled();
  });

  it("付款账户已归档时只读小票按账户实际币种显示，不用账本默认币种", () => {
    // 账本默认 JPY，美元卡已归档：USD 12.50 不能显示成 ¥13。
    renderReceipt({
      archivedAccountOptions: [
        { currency: "USD", id: "usd-card", name: "美元卡" },
      ],
      editRestriction: "archivedAccount",
      initialValues: {
        ...initialValues,
        items: [{ amount: "12.5", categoryId: "lunch", specialStatus: null }],
        payments: [{ accountId: "usd-card", amount: null }],
      },
    });

    const receipt = receiptForm();
    expect(within(receipt).getByText("美元卡")).toBeInTheDocument();
    expect(receipt.textContent).toContain("合计$12.5");
    expect(receipt.textContent).toContain("USD$12.5");
    expect(receipt.textContent).not.toContain("¥");
    expect(receipt.textContent).not.toContain("已归档账户");
  });

  it("点商家打开商家列表，没有新增商家入口；换商家只换商家本身", async () => {
    renderReceipt();
    click("修改商家：7-Eleven");
    const drawer = (
      await screen.findByRole("group", { name: "常用商家" })
    ).closest<HTMLElement>(".MuiDrawer-paper")!;

    fireEvent.change(within(drawer).getByLabelText("搜索商家"), {
      target: { value: "不存在的商家" },
    });
    expect(
      within(drawer).getByText("没有找到“不存在的商家”"),
    ).toBeInTheDocument();
    expect(
      within(drawer).queryByRole("button", { name: /新增商家/ }),
    ).toBeNull();
    fireEvent.change(within(drawer).getByLabelText("搜索商家"), {
      target: { value: "星巴克" },
    });
    fireEvent.click(within(drawer).getByRole("button", { name: /^星巴克/ }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "修改商家：星巴克" }),
      ).toBeInTheDocument(),
    );
    // 不自动加明细、不换账户。
    expect(
      screen.getByRole("button", { name: "修改明细 1 金额：¥800" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^修改明细 2 金额/ }),
    ).toBeNull();
    expect(screen.getByText("PayPay")).toBeInTheDocument();
    expect(fetchClientJson).toHaveBeenLastCalledWith(
      expect.stringContaining("merchantId=coffee"),
      expect.anything(),
    );
  });

  it("搜索商家后不选择、或重新选同一个商家，返回时不提示尚未保存", async () => {
    renderReceipt();
    const drawer = await openMerchantPicker();
    fireEvent.change(within(drawer).getByLabelText("搜索商家"), {
      target: { value: "星巴" },
    });
    fireEvent.keyDown(drawer, { key: "Escape" });
    expect(await findCloseLink()).toBeInTheDocument();

    const reopened = await openMerchantPicker();
    fireEvent.click(
      within(reopened).getAllByRole("button", { name: /^7-Eleven/ })[0]!,
    );
    expect(await findCloseLink()).toBeInTheDocument();
  });

  it("选了另一个商家后返回时提示尚未保存", async () => {
    renderReceipt();
    const drawer = await openMerchantPicker();
    fireEvent.click(
      within(drawer).getAllByRole("button", { name: /^星巴克/ })[0]!,
    );
    fireEvent.click(await screen.findByRole("link", { name: "关闭" }));

    expect(
      await screen.findByText("修正的内容尚未保存，是否保存？"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "保存并退出" }),
    ).toBeInTheDocument();
  });

  it("金额键盘显示当前商家的快捷金额", async () => {
    renderReceipt();
    await waitFor(() =>
      expect(fetchClientJson).toHaveBeenCalledWith(
        "/api/transactions/merchant-entry-suggestions?ledgerId=ledger-1&merchantId=seven",
        expect.anything(),
      ),
    );

    click("修改明细 1 金额：¥800");

    expect(
      await screen.findByRole("button", { name: "上次 ¥498" }),
    ).toBeInTheDocument();
  });

  it("编辑小票首次不显示校验，弹窗保存失败后修正可再次保存", async () => {
    const action = vi.fn<TransactionStateAction>().mockResolvedValue({
      success: "已保存",
    });
    renderReceipt({
      action,
      initialValues: {
        ...initialValues,
        items: [{ categoryId: "lunch", amount: "" }],
      },
    });
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "保存修改" })).toBeEnabled();
    await requestLeaveFromDirtyReceipt();
    expect(
      await screen.findByText(/还有 1 条明细没填金额/),
    ).toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
    expect(routerMock.push).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull(),
    );
    click("修改明细 1 金额：待输入");
    pressItemAmountKey("8");
    pressItemAmountKey("确定");
    await waitFor(() =>
      expect(screen.queryByLabelText("金额计算器")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(screen.queryAllByRole("alert")).toHaveLength(0));
    fireEvent.click(await screen.findByRole("button", { name: "保存修改" }));
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    expect(action.mock.calls[0]![1].has(saveAndLeaveField)).toBe(false);
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it.each([true, false])(
    "小票在底部导航保存后仅成功时离开（成功：%s）",
    async (success) => {
      const action = vi
        .fn<TransactionStateAction>()
        .mockResolvedValue(
          success ? { success: "已保存" } : { error: "记录已被其他成员更新" },
        );
      renderReceipt({ action });
      await requestLeaveFromDirtyReceipt();
      await waitFor(() => expect(action).toHaveBeenCalledOnce());
      expect(action.mock.calls[0]![1].get(saveAndLeaveField)).toBe("true");
      if (success) {
        await waitFor(() =>
          expect(routerMock.push).toHaveBeenCalledExactlyOnceWith("/settings"),
        );
      } else {
        await screen.findByText("记录已被其他成员更新");
        expect(routerMock.push).not.toHaveBeenCalled();
      }
    },
  );

  it.each([true, false])(
    "保存并退出需要联动确认时，仅确认并成功才离开（确认：%s）",
    async (confirm) => {
      const action = vi
        .fn<TransactionStateAction>()
        .mockResolvedValueOnce({
          error: "需要确认同步",
          errorCode: transactionErrorCodes.linkedSyncConfirmationRequired,
        })
        .mockResolvedValue({ success: "已保存" });
      renderReceipt({ action });
      await requestLeaveFromDirtyReceipt();
      const confirmation = await screen.findByRole("dialog", {
        name: "同步修改关联数据？",
      });
      expect(routerMock.push).not.toHaveBeenCalled();
      fireEvent.click(
        within(confirmation).getByRole("button", {
          name: confirm ? "同步修改" : "取消",
        }),
      );
      if (confirm) {
        await waitFor(() =>
          expect(routerMock.push).toHaveBeenCalledExactlyOnceWith("/settings"),
        );
        expect(action.mock.calls[1]![1].get("confirmSync")).toBe("true");
        expect(action.mock.calls[1]![1].get(saveAndLeaveField)).toBe("true");
      } else {
        fireEvent.click(
          await screen.findByRole("button", { name: "保存修改" }),
        );
        await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
        expect(action.mock.calls[1]![1].has(saveAndLeaveField)).toBe(false);
        expect(routerMock.push).not.toHaveBeenCalled();
      }
    },
  );

  it("改过小票后返回时提示尚未保存", async () => {
    renderReceipt();
    click("修改备注：编辑前备注");
    fireEvent.change(await screen.findByRole("textbox", { name: "备注" }), {
      target: { value: "修改后的备注" },
    });
    click("完成");
    // 抽屉关闭动画结束前背景会被 aria-hidden。
    fireEvent.click(await screen.findByRole("link", { name: "关闭" }));

    expect(
      await screen.findByText("修正的内容尚未保存，是否保存？"),
    ).toBeInTheDocument();
  });
  it.each(["商家", "账户", "金额", "新增账户"])(
    "编辑小票打开%s层后逐层返回，父表单与滚动保留",
    async (kind) => {
      routerMock.push.mockClear();
      renderReceipt({}, receiptCreationData());
      click("修改备注：编辑前备注");
      fireEvent.change(await screen.findByRole("textbox", { name: "备注" }), {
        target: { value: "父小票修改" },
      });
      click("完成");
      await findCloseLink();
      const form = receiptForm();
      const before = [...new FormData(form).entries()];
      if (kind === "商家") await openMerchantPicker();
      if (kind === "金额") click("修改明细 1 金额：¥800");
      if (kind === "账户" || kind === "新增账户") click("更换支付账户 1");
      if (kind === "新增账户") {
        click("新增账户");
        fireEvent.change(await screen.findByLabelText(/账户名称/), {
          target: { value: "子层修改" },
        });
      }
      window.scrollTo(0, 2000);
      await backFromGuard();
      if (kind === "新增账户") {
        click("继续编辑");
        expect(screen.getByLabelText(/账户名称/)).toHaveValue("子层修改");
        await backFromGuard();
        click("放弃修改");
        await screen.findByRole("button", { name: "新增账户" });
        await backFromGuard();
      }
      await findCloseLink();
      expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull();
      expect(receiptForm()).toBe(form);
      expect([...new FormData(form).entries()]).toEqual(before);
      expect(window.scrollY).toBe(2000);
      expect(window.history.pushState).toHaveBeenCalledOnce();
      await backFromGuard();
      click("继续编辑");
      await findCloseLink();
      await backFromGuard();
      click("放弃修改");
      await waitFor(() => expect(guardHistory().index()).toBe(0));
      expect(routerMock.push).not.toHaveBeenCalled();
    },
  );
});
