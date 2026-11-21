import { describe, expect, it } from "vitest";
import { convertLedgerAmount } from "./exchangeRate";
describe("convertLedgerAmount", () => {
  it("先将记录净额换算再四舍五入两位小数", () => {
    expect(convertLedgerAmount(10.05, 1.235)).toBe(12.41);
    expect(convertLedgerAmount(-10.05, 1.235)).toBe(-12.41);
    expect(convertLedgerAmount("100", "150.12345")).toBe(15012.35);
  });
  it("无汇率跳过，同币种使用倍率 1", () => {
    expect(convertLedgerAmount(100, null)).toBeNull();
    expect(convertLedgerAmount(100, 1)).toBe(100);
  });
});
