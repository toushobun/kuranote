import { describe, expect, it } from "vitest";
import { hasReceiptChanges, type ReceiptSnapshot } from "./receiptChanges";

const item = { id: 1, categoryId: "lunch", amount: "" };
const payment = { key: 1, accountId: "paypay", amount: "" };
const clearedPayment = { ...payment, accountId: "" };
const baseline: ReceiptSnapshot = {
  items: [item],
  payments: [payment],
  note: "",
  transactionAt: "2026-11-13T12:00",
};

describe("hasReceiptChanges", () => {
  it.each<[string, Partial<ReceiptSnapshot>]>([
    ["删除自动明细", { items: [] }],
    ["清空自动账户", { payments: [clearedPayment] }],
    ["同时删除自动明细和账户", { items: [], payments: [clearedPayment] }],
  ])("仅%s不算修改", (_, change) => {
    expect(
      hasReceiptChanges(baseline, { ...baseline, ...change }, [1], 1),
    ).toBe(false);
  });

  it.each<[string, Partial<ReceiptSnapshot>]>([
    ["删除后新增同分类明细", { items: [{ ...item, id: 2 }] }],
    ["改自动明细金额", { items: [{ ...item, amount: "800" }] }],
    ["清空后选其他账户", { payments: [{ ...payment, accountId: "cash" }] }],
    [
      "清空账户时改付款金额",
      { payments: [{ ...clearedPayment, amount: "800" }] },
    ],
    ["用新付款行替代原行", { payments: [{ ...clearedPayment, key: 2 }] }],
    ["新增付款行", { payments: [payment, { ...clearedPayment, key: 2 }] }],
    ["改备注", { note: "午餐" }],
    ["改时间", { transactionAt: "2026-11-13T13:00" }],
  ])("%s算修改", (_, change) => {
    expect(
      hasReceiptChanges(baseline, { ...baseline, ...change }, [1], 1),
    ).toBe(true);
  });

  it("删除非自动明细或清空非自动账户算修改", () => {
    expect(hasReceiptChanges(baseline, { ...baseline, items: [] }, [], 1)).toBe(
      true,
    );
    expect(
      hasReceiptChanges(
        baseline,
        { ...baseline, payments: [clearedPayment] },
        [1],
        null,
      ),
    ).toBe(true);
  });
});
