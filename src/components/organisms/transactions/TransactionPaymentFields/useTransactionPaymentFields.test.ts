import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TransactionAccountOption } from "types/transactions";

import {
  isPaymentAccountSelectable,
  reconcileTransactionPayments,
  useTransactionPaymentFields,
  type TransactionPaymentRow,
} from "./useTransactionPaymentFields";

const jpyCash: TransactionAccountOption = {
  currency: "JPY",
  id: "account-1",
  name: "现金",
};
const jpyCard: TransactionAccountOption = {
  currency: "JPY",
  id: "account-2",
  name: "信用卡",
};
const usdCard: TransactionAccountOption = {
  currency: "USD",
  id: "account-3",
  name: "美元卡",
};

function createRows(
  rows: Array<Pick<TransactionPaymentRow, "accountId" | "amount">>,
): TransactionPaymentRow[] {
  return rows.map((row, index) => ({ ...row, key: index + 1 }));
}

describe("useTransactionPaymentFields", () => {
  it("没有初始值时是 1 行空的单账户", () => {
    const { result } = renderHook(() => useTransactionPaymentFields(undefined));

    expect(result.current.isMultiAccount).toBe(false);
    expect(result.current.primaryAccountId).toBe("");
    expect(result.current.payments).toEqual([
      { accountId: "", amount: "", key: 1 },
    ]);
  });

  it("单账户初始值不回填金额，提交时金额为 null", () => {
    const { result } = renderHook(() =>
      useTransactionPaymentFields([{ accountId: jpyCash.id, amount: "1200" }]),
    );

    expect(result.current.payments[0]?.amount).toBe("");
    expect(result.current.submittedPayments).toEqual([
      { accountId: jpyCash.id, amount: null },
    ]);
  });

  it("多账户初始值按顺序回填账户与金额，提交时原样保留", () => {
    const initialPayments = [
      { accountId: jpyCash.id, amount: "500" },
      { accountId: jpyCard.id, amount: "0" },
    ];
    const { result } = renderHook(() =>
      useTransactionPaymentFields(initialPayments),
    );

    expect(result.current.isMultiAccount).toBe(true);
    expect(result.current.submittedPayments).toEqual(initialPayments);
  });

  it("展开时首行预填传入金额，新增行金额留空", () => {
    const { result } = renderHook(() =>
      useTransactionPaymentFields([{ accountId: jpyCash.id, amount: null }]),
    );

    act(() => result.current.addPayment("1200"));

    expect(result.current.isMultiAccount).toBe(true);
    expect(result.current.payments).toEqual([
      { accountId: jpyCash.id, amount: "1200", key: 1 },
      { accountId: "", amount: "", key: 2 },
    ]);

    act(() => result.current.addPayment("999"));

    // 已是多账户时不再改动已有行的金额。
    expect(result.current.payments.map((payment) => payment.amount)).toEqual([
      "1200",
      "",
      "",
    ]);
  });

  it("删到只剩 1 行时回到单账户并丢弃该行金额", () => {
    const { result } = renderHook(() =>
      useTransactionPaymentFields([
        { accountId: jpyCash.id, amount: "500" },
        { accountId: jpyCard.id, amount: "700" },
      ]),
    );

    act(() => result.current.removePayment(1));

    expect(result.current.isMultiAccount).toBe(false);
    expect(result.current.payments).toEqual([
      { accountId: jpyCard.id, amount: "", key: 2 },
    ]);
    expect(result.current.primaryAccountId).toBe(jpyCard.id);
  });

  it("修改账户与金额只影响对应行", () => {
    const { result } = renderHook(() =>
      useTransactionPaymentFields([
        { accountId: jpyCash.id, amount: "500" },
        { accountId: "", amount: "" },
      ]),
    );

    act(() => {
      result.current.changeAccount(2, jpyCard.id);
      result.current.changeAmount(2, " 700 ");
    });

    expect(result.current.submittedPayments).toEqual([
      { accountId: jpyCash.id, amount: "500" },
      { accountId: jpyCard.id, amount: "700" },
    ]);
  });
});

describe("isPaymentAccountSelectable", () => {
  const payments = createRows([
    { accountId: jpyCash.id, amount: "" },
    { accountId: "", amount: "" },
  ]);

  it("已被其他行选中的账户不可选，本行已选的账户可选", () => {
    expect(
      isPaymentAccountSelectable({
        account: jpyCash,
        payments,
        primaryCurrency: "JPY",
        rowKey: 2,
      }),
    ).toBe(false);
    expect(
      isPaymentAccountSelectable({
        account: jpyCash,
        payments,
        primaryCurrency: "JPY",
        rowKey: 1,
      }),
    ).toBe(true);
  });

  it("与首行币种不同的账户在其他行不可选，首行本身不限币种", () => {
    expect(
      isPaymentAccountSelectable({
        account: usdCard,
        payments,
        primaryCurrency: "JPY",
        rowKey: 2,
      }),
    ).toBe(false);
    expect(
      isPaymentAccountSelectable({
        account: usdCard,
        payments,
        primaryCurrency: "JPY",
        rowKey: 1,
      }),
    ).toBe(true);
  });

  it("省略行时按新增一行判断", () => {
    expect(
      isPaymentAccountSelectable({
        account: jpyCard,
        payments,
        primaryCurrency: "JPY",
      }),
    ).toBe(true);
    expect(
      isPaymentAccountSelectable({
        account: usdCard,
        payments,
        primaryCurrency: "JPY",
      }),
    ).toBe(false);
  });
});

describe("reconcileTransactionPayments", () => {
  it("付款合计等于明细合计时平衡，金额为 0 的行照常计入", () => {
    expect(
      reconcileTransactionPayments({
        currency: "JPY",
        itemAmounts: ["400", "800"],
        payments: createRows([
          { accountId: jpyCash.id, amount: "1200" },
          { accountId: jpyCard.id, amount: "0" },
        ]),
      }),
    ).toEqual({
      difference: "0",
      isBalanced: true,
      itemTotal: "1200",
      paymentTotal: "1200",
    });
  });

  it("不平衡时给出明细合计减付款合计的差额，空行按 0 计", () => {
    expect(
      reconcileTransactionPayments({
        currency: "JPY",
        itemAmounts: ["1200"],
        payments: createRows([
          { accountId: jpyCash.id, amount: "500" },
          { accountId: jpyCard.id, amount: "" },
        ]),
      }),
    ).toMatchObject({ difference: "700", isBalanced: false });
    expect(
      reconcileTransactionPayments({
        currency: "JPY",
        itemAmounts: ["1200"],
        payments: createRows([
          { accountId: jpyCash.id, amount: "500" },
          { accountId: jpyCard.id, amount: "800" },
        ]),
      }),
    ).toMatchObject({ difference: "-100", isBalanced: false });
  });

  it("小数金额按最小单位求和，不受浮点误差影响", () => {
    expect(
      reconcileTransactionPayments({
        currency: "USD",
        itemAmounts: ["0.3"],
        payments: createRows([
          { accountId: usdCard.id, amount: "0.1" },
          { accountId: "account-4", amount: "0.2" },
        ]),
      }),
    ).toMatchObject({ isBalanced: true, paymentTotal: "0.3" });
  });
});
