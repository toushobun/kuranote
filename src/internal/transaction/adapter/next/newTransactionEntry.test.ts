import { describe, expect, it } from "vitest";

import { resolveNewTransactionEntry } from "./newTransactionEntry";

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
    expect(resolveNewTransactionEntry(params).method).toBe(method);
  });

  it.each([
    [undefined, "expense"],
    ["income", "income"],
    ["transfer", "transfer"],
    ["invalid", "expense"],
  ])("标准记账的 type=%s 对应页签 %s", (type, standardType) => {
    expect(
      resolveNewTransactionEntry({ method: "standard", type }).standardType,
    ).toBe(standardType);
  });
});
