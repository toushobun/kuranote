import { describe, expect, it } from "vitest";

import { resolveNewTransactionEntry } from "./newTransactionEntry";

const options = {
  accountOptions: [{ id: "account-1" }],
  merchantOptions: [{ id: "merchant-1" }],
};

describe("resolveNewTransactionEntry", () => {
  it.each([
    [{}, "merchant"],
    [{ type: "expense" }, "merchant"],
    [{ type: "income" }, "merchant"],
    [{ type: "invalid" }, "merchant"],
    [{ type: "transfer" }, "transfer"],
    [{ method: "transfer" }, "transfer"],
    [{ method: "standard" }, "standard"],
    [{ method: "merchant", type: "transfer" }, "merchant"],
    [{ method: "invalid", type: "transfer" }, "transfer"],
    [{ method: "invalid" }, "merchant"],
  ] as const)("参数 %j 进入 %s", (params, method) => {
    expect(resolveNewTransactionEntry(params, options).method).toBe(method);
  });

  it.each([
    [undefined, "expense"],
    ["income", "income"],
    ["transfer", "transfer"],
    ["invalid", "expense"],
  ])("标准记账的 type=%s 对应页签 %s", (type, standardType) => {
    expect(
      resolveNewTransactionEntry({ method: "standard", type }, options)
        .standardType,
    ).toBe(standardType);
  });

  it("带回商家时预选商家", () => {
    expect(
      resolveNewTransactionEntry({ merchantId: "merchant-1" }, options),
    ).toMatchObject({
      initialAccountId: undefined,
      initialMerchantId: "merchant-1",
    });
  });

  it("带回商家和账户时同时预选", () => {
    expect(
      resolveNewTransactionEntry(
        { accountId: "account-1", merchantId: "merchant-1" },
        options,
      ),
    ).toMatchObject({
      initialAccountId: "account-1",
      initialMerchantId: "merchant-1",
    });
  });

  it("只带回账户时预选账户", () => {
    expect(
      resolveNewTransactionEntry({ accountId: "account-1" }, options),
    ).toMatchObject({
      initialAccountId: "account-1",
      initialMerchantId: undefined,
    });
  });

  it("不属于当前账本或已归档的商家 / 账户不采用", () => {
    expect(
      resolveNewTransactionEntry(
        { accountId: "other-account", merchantId: "other-merchant" },
        options,
      ),
    ).toMatchObject({
      initialAccountId: undefined,
      initialMerchantId: undefined,
    });
  });
});
