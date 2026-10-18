import { describe, expect, it } from "vitest";
import {
  makeIncomeExpenseUnit,
  makeImportPayment,
} from "test/mocks/dataImport";
import { validateImportPayments } from "./validateImportPayments";

function items() {
  const unit = makeIncomeExpenseUnit({
    amount: 3500,
    payments: [
      makeImportPayment({ amount: "2000" }),
      makeImportPayment({ accountName: "卡", amount: "1500" }),
    ],
  });
  if (unit.kind !== "incomeExpense") throw new Error("测试数据不正确");
  return unit.group.items;
}

describe("validateImportPayments", () => {
  it("合法多账户付款通过", () => {
    expect(validateImportPayments(items())).toBeNull();
  });
  it.each(["total", "currency", "income", "duplicate"])(
    "拒绝多账户规则违反：%s",
    (kind) => {
      const rows = items();
      if (kind === "total") rows[0].amount = 3501;
      if (kind === "currency") rows[0].payments[1].accountCurrency = "CNY";
      if (kind === "income") rows[0].transactionType = "income";
      if (kind === "duplicate") rows[0].payments[1].accountName = "钱包";
      expect(validateImportPayments(rows)).toEqual(expect.any(String));
    },
  );
});
