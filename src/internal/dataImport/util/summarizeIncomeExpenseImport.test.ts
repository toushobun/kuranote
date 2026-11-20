import { describe, expect, it } from "vitest";
import { summarizeIncomeExpenseImport } from "./summarizeIncomeExpenseImport";

describe("summarizeIncomeExpenseImport", () => {
  it("混合收支为净支出时返回负净额和支出类型", () => {
    expect(
      summarizeIncomeExpenseImport([
        { amount: 1000, transactionType: "expense" },
        { amount: 200, transactionType: "income" },
      ]),
    ).toEqual({ totalAmount: -800, type: "expense" });
  });

  it("混合收支为净收入时返回正净额和收入类型", () => {
    expect(
      summarizeIncomeExpenseImport([
        { amount: 1000, transactionType: "income" },
        { amount: 200, transactionType: "expense" },
      ]),
    ).toEqual({ totalAmount: 800, type: "income" });
  });

  it("净额为零且全部为收入时归类为收入", () => {
    expect(
      summarizeIncomeExpenseImport([
        { amount: 0, transactionType: "income" },
        { amount: 0, transactionType: "income" },
      ]),
    ).toEqual({ totalAmount: 0, type: "income" });
  });

  it("净额为零但包含支出时归类为支出", () => {
    expect(
      summarizeIncomeExpenseImport([
        { amount: 20, transactionType: "income" },
        { amount: 20, transactionType: "expense" },
      ]),
    ).toEqual({ totalAmount: 0, type: "expense" });
  });

  it("按分汇总小数金额避免浮点误差", () => {
    expect(
      summarizeIncomeExpenseImport([
        { amount: 0.1, transactionType: "expense" },
        { amount: 0.2, transactionType: "expense" },
        { amount: 0.05, transactionType: "income" },
      ]),
    ).toEqual({ totalAmount: -0.25, type: "expense" });
  });
});
