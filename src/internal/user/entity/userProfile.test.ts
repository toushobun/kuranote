// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  resolveTransactionColorScheme,
  resolveUserThemeKey,
} from "internal/user/entity/userProfile";

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

describe("resolveUserThemeKey", () => {
  it("合法值保持不变", () => {
    expect(resolveUserThemeKey("sakuraStory")).toEqual({
      isFallback: false,
      value: "sakuraStory",
    });
  });

  it("非法值回退到默认主题", () => {
    expect(resolveUserThemeKey("sakura_story")).toEqual({
      isFallback: true,
      value: "amberWarmth",
    });
  });
});
