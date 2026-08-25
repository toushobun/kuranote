// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  parseTransactionColorSchemeForm,
  updateUserProfileRequestSchema,
} from "internal/user/schema";

describe("user schema", () => {
  it("接受收支配色方案作为单一资料更新字段", () => {
    expect(
      updateUserProfileRequestSchema.safeParse({
        transactionColorScheme: "expense_green_income_red",
      }).success,
    ).toBe(true);
  });

  it("拒绝非法收支配色方案", () => {
    const formData = new FormData();
    formData.set("transactionColorScheme", "invalid");

    expect(parseTransactionColorSchemeForm(formData)).toEqual({
      error: "请选择有效的收支配色方案。",
      ok: false,
    });
  });

  it("解析有效收支配色方案表单", () => {
    const formData = new FormData();
    formData.set("transactionColorScheme", "expense_red_income_green");

    expect(parseTransactionColorSchemeForm(formData)).toEqual({
      ok: true,
      value: { transactionColorScheme: "expense_red_income_green" },
    });
  });
});
