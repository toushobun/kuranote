import { describe, expect, it } from "vitest";
import { hasDuplicateLedgerSetupAccountName } from "./ledgerSetupAccountName";
describe("hasDuplicateLedgerSetupAccountName", () => {
  it("同一类型内名称忽略大小写与首尾空格重复", () => {
    expect(
      hasDuplicateLedgerSetupAccountName([
        { name: "PayPay", type: "e_money" },
        { name: " paypay ", type: "e_money" },
      ]),
    ).toBe(true);
  });

  it("不同类型可以同名", () => {
    expect(
      hasDuplicateLedgerSetupAccountName([
        { name: "PayPay", type: "e_money" },
        { name: "PayPay", type: "bank" },
      ]),
    ).toBe(false);
  });
});
