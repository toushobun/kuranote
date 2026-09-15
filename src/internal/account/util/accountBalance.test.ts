import { describe, expect, it } from "vitest";
import { isAccountBalanceText, isValidTargetBalance } from "./accountBalance";

describe("accountBalance", () => {
  it.each(["0", "-12.34", "001.20", "999999999999.99"])(
    "接受余额文本 %s",
    (value) => {
      expect(isAccountBalanceText(value)).toBe(true);
      expect(isValidTargetBalance(Number(value))).toBe(true);
    },
  );
  it.each(["", " ", "1e2", "+1", "1.001", "Infinity", "9".repeat(400)])(
    "拒绝非法余额文本 %s",
    (value) => {
      expect(isAccountBalanceText(value)).toBe(false);
    },
  );
  it("文本格式校验不改变创建账户的金额上限语义", () => {
    expect(isAccountBalanceText("1000000000000")).toBe(true);
    expect(isValidTargetBalance(1e12)).toBe(false);
  });
  it.each([NaN, Infinity, -Infinity, 1e12, -1e12, 1.001])(
    "拒绝非法目标余额 %s",
    (value) => {
      expect(isValidTargetBalance(value)).toBe(false);
    },
  );
});
