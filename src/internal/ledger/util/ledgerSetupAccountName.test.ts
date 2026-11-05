import { describe, expect, it } from "vitest";
import {
  hasDuplicateLedgerSetupAccountName,
  isLedgerSetupAccountNameTaken,
} from "./ledgerSetupAccountName";
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

describe("isLedgerSetupAccountNameTaken", () => {
  const accounts = [
    { name: "PayPay", type: "e_money" as const },
    { name: "現金", type: "cash" as const },
  ];

  it("同一类型下名称忽略大小写与首尾空格相同时视为已有", () => {
    expect(
      isLedgerSetupAccountNameTaken(accounts, {
        name: " paypay ",
        type: "e_money",
      }),
    ).toBe(true);
  });

  it("不同类型的同名账户不视为已有", () => {
    expect(
      isLedgerSetupAccountNameTaken(accounts, { name: "PayPay", type: "bank" }),
    ).toBe(false);
  });
});
