import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MerchantEntrySuggestions } from "internal/transaction";
import type { TransactionFormInitialValues } from "organisms/transactions/TransactionForm/TransactionForm.types";
import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import {
  receiptItemsOptions,
  receiptSuggestions,
} from "test/mocks/transactionReceipt";
import { flowFixture } from "test/mocks/transactionStepFlow";

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
    { wrapper: ConfirmDialogTestProviders },
  );
}

function click(name: string | RegExp) {
  fireEvent.click(screen.getByRole("button", { name }));
}

function receiptForm() {
  const form = document.getElementById("edit-transaction-receipt-form");
  if (!(form instanceof HTMLFormElement)) throw new Error("小票表单不存在");
  return form;
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

  it("改过小票后返回时提示尚未保存", async () => {
    renderReceipt();
    click("修改备注：编辑前备注");
    fireEvent.change(await screen.findByRole("textbox", { name: "备注" }), {
      target: { value: "修改后的备注" },
    });
    click("完成");
    // 抽屉关闭动画结束前背景会被 aria-hidden。
    fireEvent.click(await screen.findByRole("button", { name: "关闭" }));

    expect(
      await screen.findByText("修正的内容尚未保存，是否保存？"),
    ).toBeInTheDocument();
  });
});
