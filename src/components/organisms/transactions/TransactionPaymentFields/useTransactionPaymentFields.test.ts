import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TransactionAccountOption } from "types/transactions";

import {
  canAddPaymentRow,
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

function getAmounts(payments: readonly TransactionPaymentRow[]) {
  return payments.map((payment) => payment.amount);
}

function jpyTotal(itemTotal: string) {
  return { currency: "JPY", itemTotal };
}

/** 依次使用 现金 / 信用卡 / 美元卡 作为付款账户。 */
function renderPayments(amounts: string[]) {
  const accounts = [jpyCash, jpyCard, usdCard];
  return renderHook(() =>
    useTransactionPaymentFields(
      amounts.map((amount, index) => ({
        accountId: accounts[index]!.id,
        amount,
      })),
    ),
  );
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

  it("展开时首行预填传入金额，新增行为 0，已是多账户时不改动已有行", () => {
    const { result } = renderHook(() =>
      useTransactionPaymentFields([{ accountId: jpyCash.id, amount: null }]),
    );

    act(() => result.current.addPayment("1000"));

    expect(result.current.isMultiAccount).toBe(true);
    expect(result.current.payments).toEqual([
      { accountId: jpyCash.id, amount: "1000", key: 1 },
      { accountId: "", amount: "0", key: 2 },
    ]);

    act(() => result.current.addPayment("999"));

    expect(getAmounts(result.current.payments)).toEqual(["1000", "0", "0"]);
  });

  describe("确定金额时的自动分配", () => {
    /** 依次修改并确定多行金额，模拟输入后失焦。 */
    function changeAndCommit(
      result: ReturnType<typeof renderPayments>["result"],
      key: number,
      amount: string,
      total: Parameters<typeof result.current.commitAmount>[1],
    ) {
      act(() => result.current.changeAmount(key, amount));
      act(() => result.current.commitAmount(key, total));
    }

    it("输入过程中只更新本行，不联动下一行", () => {
      const { result } = renderPayments(["1000", "0", "0"]);

      act(() => result.current.changeAmount(1, "6"));
      act(() => result.current.changeAmount(1, "60"));
      act(() => result.current.changeAmount(1, "600"));

      expect(getAmounts(result.current.payments)).toEqual(["600", "0", "0"]);
    });

    it("下一行 = 明细合计 − 其他所有行合计，其他行不变", () => {
      const { result } = renderPayments(["1000", "0", "0"]);

      changeAndCommit(result, 1, "600", jpyTotal("1000"));
      expect(getAmounts(result.current.payments)).toEqual(["600", "400", "0"]);

      changeAndCommit(result, 2, "200", jpyTotal("1000"));
      expect(getAmounts(result.current.payments)).toEqual([
        "600",
        "200",
        "200",
      ]);
    });

    it("金额未变化时也按当前明细合计重新计算下一行", () => {
      const { result } = renderPayments(["500", "700"]);

      act(() => result.current.commitAmount(1, jpyTotal("1500")));

      expect(getAmounts(result.current.payments)).toEqual(["500", "1000"]);
    });

    it("计算结果为负数时下一行设为 0", () => {
      const { result } = renderPayments(["600", "400", "300"]);

      changeAndCommit(result, 1, "900", jpyTotal("1000"));

      expect(getAmounts(result.current.payments)).toEqual(["900", "0", "300"]);
    });

    it("确定最后一行时不联动其他行", () => {
      const { result } = renderPayments(["600", "400"]);

      changeAndCommit(result, 2, "100", jpyTotal("1000"));

      expect(getAmounts(result.current.payments)).toEqual(["600", "100"]);
    });

    it("金额无效或留空的行按 0 计", () => {
      const { result } = renderPayments(["1000", "0", "abc"]);

      changeAndCommit(result, 1, "", jpyTotal("1000"));
      expect(getAmounts(result.current.payments)).toEqual(["", "1000", "abc"]);

      changeAndCommit(result, 1, "1.5", jpyTotal("1000"));
      expect(getAmounts(result.current.payments)).toEqual([
        "1.5",
        "1000",
        "abc",
      ]);
    });

    it("小数金额按最小单位计算，不受浮点误差影响", () => {
      const { result } = renderPayments(["0.3", "0"]);

      changeAndCommit(result, 1, "0.1", { currency: "USD", itemTotal: "0.3" });

      expect(getAmounts(result.current.payments)).toEqual(["0.1", "0.2"]);
    });
  });

  describe("删除行时的金额归还", () => {
    it("被删行的金额加到上一行", () => {
      const { result } = renderPayments(["500", "300", "200"]);

      act(() => result.current.removePayment(3, "JPY"));
      expect(getAmounts(result.current.payments)).toEqual(["500", "500"]);
    });

    it("删除首行时加到新的首行", () => {
      const { result } = renderPayments(["500", "300", "200"]);

      act(() => result.current.removePayment(1, "JPY"));

      expect(result.current.payments).toEqual([
        { accountId: jpyCard.id, amount: "800", key: 2 },
        { accountId: usdCard.id, amount: "200", key: 3 },
      ]);
    });

    it("金额无效的行按 0 计", () => {
      const { result } = renderPayments(["abc", "300", "x"]);

      act(() => result.current.removePayment(2, "JPY"));

      expect(getAmounts(result.current.payments)).toEqual(["300", "x"]);
    });

    it("删到只剩 1 行时回到单账户并丢弃该行金额", () => {
      const { result } = renderPayments(["500", "700"]);

      act(() => result.current.removePayment(1, "JPY"));

      expect(result.current.isMultiAccount).toBe(false);
      expect(result.current.payments).toEqual([
        { accountId: jpyCard.id, amount: "", key: 2 },
      ]);
      expect(result.current.primaryAccountId).toBe(jpyCard.id);
    });
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

describe("canAddPaymentRow", () => {
  const accountOptions = [jpyCash, jpyCard, usdCard];

  it("没有其他同币种账户时不能添加", () => {
    expect(
      canAddPaymentRow({
        accountOptions: [jpyCash, usdCard],
        payments: createRows([{ accountId: jpyCash.id, amount: "" }]),
        primaryCurrency: "JPY",
      }),
    ).toBe(false);
  });

  it("有其他同币种账户时可以添加", () => {
    expect(
      canAddPaymentRow({
        accountOptions,
        payments: createRows([{ accountId: jpyCash.id, amount: "" }]),
        primaryCurrency: "JPY",
      }),
    ).toBe(true);
  });

  it("行数达到同币种账户数量后不能添加，未选账户的行也计入", () => {
    expect(
      canAddPaymentRow({
        accountOptions,
        payments: createRows([
          { accountId: jpyCash.id, amount: "" },
          { accountId: "", amount: "" },
        ]),
        primaryCurrency: "JPY",
      }),
    ).toBe(false);
    expect(
      canAddPaymentRow({
        accountOptions,
        payments: createRows([
          { accountId: jpyCash.id, amount: "" },
          { accountId: jpyCard.id, amount: "" },
        ]),
        primaryCurrency: "JPY",
      }),
    ).toBe(false);
  });

  it("没有账户时不能添加", () => {
    expect(
      canAddPaymentRow({
        accountOptions: [],
        payments: createRows([{ accountId: "", amount: "" }]),
        primaryCurrency: undefined,
      }),
    ).toBe(false);
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
