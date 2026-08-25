// @vitest-environment node

import { describe, expect, it } from "vitest";

import { resolveTransactionColorScheme } from "internal/user/entity/userProfile";

describe("resolveTransactionColorScheme", () => {
  it("合法值保持不变", () => {
    expect(resolveTransactionColorScheme("expense_red_income_green")).toEqual({
      isFallback: false,
      value: "expense_red_income_green",
    });
  });

  it("非法值回退到默认配色", () => {
    expect(resolveTransactionColorScheme("unexpected")).toEqual({
      isFallback: true,
      value: "expense_green_income_red",
    });
  });
});
