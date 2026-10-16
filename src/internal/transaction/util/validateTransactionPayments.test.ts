import { describe, expect, it } from "vitest";
import { transactionErrorCodes } from "internal/transaction/errors";
import { validateTransactionPayments } from "internal/transaction/util/validateTransactionPayments";

const accountId1 = "00000000-0000-4000-8000-000000000101";
const accountId2 = "00000000-0000-4000-8000-000000000102";
const archivedAccountId = "00000000-0000-4000-8000-000000000103";

const accountOptions = [
  { currency: "JPY", id: accountId1 },
  { currency: "JPY", id: accountId2 },
];

const expenseItem = (amount: number | string) => ({
  amount,
  categoryType: "expense" as const,
});
const incomeItem = (amount: number | string) => ({
  amount,
  categoryType: "income" as const,
});

describe("validateTransactionPayments", () => {
  it("单账户且金额为 null 时通过，不需要校验合计", () => {
    const result = validateTransactionPayments({
      accountOptions,
      items: [expenseItem(100), incomeItem(50)],
      payments: [{ accountId: accountId1, amount: null }],
    });
    expect(result).toEqual({ ok: true });
  });

  it("多账户金额为 0 的行保留，不视为异常", () => {
    const result = validateTransactionPayments({
      accountOptions,
      items: [expenseItem("120")],
      payments: [
        { accountId: accountId1, amount: "0" },
        { accountId: accountId2, amount: "120" },
      ],
    });
    expect(result).toEqual({ ok: true });
  });

  it("重复账户返回 paymentAccountDuplicate", () => {
    const result = validateTransactionPayments({
      accountOptions,
      items: [expenseItem("60"), expenseItem("60")],
      payments: [
        { accountId: accountId1, amount: "60" },
        { accountId: accountId1, amount: "60" },
      ],
    });
    expect(result).toEqual({
      error: transactionErrorCodes.paymentAccountDuplicate,
      ok: false,
    });
  });

  it("账户已归档（不在可选账户列表中）返回 accountInvalid", () => {
    const result = validateTransactionPayments({
      accountOptions,
      items: [expenseItem("100")],
      payments: [{ accountId: archivedAccountId, amount: null }],
    });
    expect(result).toEqual({
      error: transactionErrorCodes.accountInvalid,
      ok: false,
    });
  });

  it("付款合计与支出明细合计不一致返回 paymentTotalMismatch", () => {
    const result = validateTransactionPayments({
      accountOptions,
      items: [expenseItem("120")],
      payments: [
        { accountId: accountId1, amount: "50" },
        { accountId: accountId2, amount: "60" },
      ],
    });
    expect(result).toEqual({
      error: transactionErrorCodes.paymentTotalMismatch,
      ok: false,
    });
  });

  it("含收入明细时多账户返回 paymentMultiAccountNotAllowed", () => {
    const result = validateTransactionPayments({
      accountOptions,
      items: [expenseItem("40"), incomeItem("40")],
      payments: [
        { accountId: accountId1, amount: "20" },
        { accountId: accountId2, amount: "20" },
      ],
    });
    expect(result).toEqual({
      error: transactionErrorCodes.paymentMultiAccountNotAllowed,
      ok: false,
    });
  });

  it("付款账户币种不一致返回 paymentCurrencyMismatch", () => {
    const result = validateTransactionPayments({
      accountOptions: [
        { currency: "JPY", id: accountId1 },
        { currency: "USD", id: accountId2 },
      ],
      items: [expenseItem("120")],
      payments: [
        { accountId: accountId1, amount: "60" },
        { accountId: accountId2, amount: "60" },
      ],
    });
    expect(result).toEqual({
      error: transactionErrorCodes.paymentCurrencyMismatch,
      ok: false,
    });
  });

  it("多账户缺少金额返回 paymentAmountRequired", () => {
    const result = validateTransactionPayments({
      accountOptions,
      items: [expenseItem("120")],
      payments: [
        { accountId: accountId1, amount: "60" },
        { accountId: accountId2, amount: null },
      ],
    });
    expect(result).toEqual({
      error: transactionErrorCodes.paymentAmountRequired,
      ok: false,
    });
  });

  it("金额超过两位小数返回 amountInvalid", () => {
    const result = validateTransactionPayments({
      accountOptions,
      items: [expenseItem("120")],
      payments: [
        { accountId: accountId1, amount: "60.001" },
        { accountId: accountId2, amount: "59.999" },
      ],
    });
    expect(result).toEqual({
      error: transactionErrorCodes.amountInvalid,
      ok: false,
    });
  });
});
