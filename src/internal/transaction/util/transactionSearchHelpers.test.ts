import { describe, expect, it } from "vitest";

import { normalizeTransactionSearchQuery } from "./transactionSearchHelpers";

describe("transactionSearchHelpers", () => {
  it("规范化关键词时会 trim 并限制长度", () => {
    expect(normalizeTransactionSearchQuery(`  ${"A".repeat(90)}  `)).toBe(
      "A".repeat(80),
    );
  });
});
