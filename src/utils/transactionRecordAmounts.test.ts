import { describe, expect, it } from "vitest";
import { createTransactionAmountSummary } from "utils/transactions";
import {
  addSignedAmount,
  calculateRecordNetAmount,
} from "./transactionRecordAmounts";
import {
  createMonthlyAmountItems,
  expectedMonthlyAmountSummary,
  monthlyAmountCategories,
  monthlyRecordAmountCases,
} from "./transactionRecordAmounts.testUtils";

describe("transactionRecordAmounts", () => {
  it.each(monthlyRecordAmountCases)("$name：业务净额按记录抵消", (testCase) => {
    const amount = calculateRecordNetAmount(
      createMonthlyAmountItems(testCase),
      new Map(
        monthlyAmountCategories.map((category) => [category.id, category]),
      ),
    );
    expect(amount).toBe(testCase.net);
    const summary = createTransactionAmountSummary("JPY");
    addSignedAmount(summary, amount);
    expect(summary).toEqual(expectedMonthlyAmountSummary(testCase.net));
  });
});
