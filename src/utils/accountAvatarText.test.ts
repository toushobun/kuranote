import { describe, expect, it } from "vitest";

import { accountAvatarText } from "./accountAvatarText";

describe("accountAvatarText", () => {
  it.each([
    ["三井住友银行", "三井"],
    ["现金", "现金"],
    ["钱", "钱"],
    ["日元 现金", "日元"],
    ["ゆうちょ銀行", "ゆう"],
    ["PayPay", "P"],
    ["paypay", "P"],
    ["Rakuten Card", "RC"],
    ["  Apple Pay  Suica ", "AP"],
    ["三井住友 Visa", "三井"],
    ["", ""],
    ["   ", ""],
  ])("%s → %s", (name, expected) => {
    expect(accountAvatarText(name)).toBe(expected);
  });
});
