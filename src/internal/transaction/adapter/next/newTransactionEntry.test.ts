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
    [{ method: "standard" }, "merchant"],
    [{ method: "standard", type: "income" }, "merchant"],
    [{ method: "merchant", type: "transfer" }, "merchant"],
    [{ method: "invalid", type: "transfer" }, "transfer"],
    [{ method: "invalid" }, "merchant"],
  ] as const)("参数 %j 进入 %s", (params, method) => {
    expect(resolveNewTransactionEntry(params)).toBe(method);
  });
});
