import { describe, expect, it } from "vitest";

import {
  transactionAccentColor,
  transactionAvatarBackgroundColor,
  transactionBorderColor,
  transactionExpenseColor,
  transactionIncomeColor,
  transactionMonthNavigationBackgroundColor,
  transactionSummaryBackgroundColor,
} from "./transactionColors";

describe("transactionColors", () => {
  it("收入和支出语义色保持固定", () => {
    expect(transactionIncomeColor).toBe("#d64b4b");
    expect(transactionExpenseColor).toBe("#3f7f46");
  });

  it("交易主题色通过用户主题 CSS 变量取得", () => {
    expect(transactionAccentColor).toBe("var(--user-theme-tx-accent)");
    expect(transactionSummaryBackgroundColor).toBe(
      "var(--user-theme-tx-summary-bg)",
    );
    expect(transactionAvatarBackgroundColor).toBe(
      "var(--user-theme-tx-avatar-bg)",
    );
    expect(transactionMonthNavigationBackgroundColor).toBe(
      "var(--user-theme-tx-nav-bg)",
    );
    expect(transactionBorderColor).toBe("var(--user-theme-tx-border)");
  });
});
