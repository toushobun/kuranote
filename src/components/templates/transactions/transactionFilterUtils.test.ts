import { describe, expect, it } from "vitest";

import type { TransactionFilterOptions } from "types/transactions";

import {
  buildActiveFilterChips,
  getGroupDisplayLabel,
  hasActiveTransactionFilters,
  serializeTransactionFilters,
} from "./transactionFilterUtils";

const filterOptions: TransactionFilterOptions = {
  accounts: [],
  categories: [],
  holders: [
    { id: "user-me", name: "我" },
    { id: "none", name: "未指定持有人" },
  ],
  members: [],
  merchants: [],
};

describe("transactionFilterUtils 持有人（#909）", () => {
  it("持有人筛选视为有效筛选，并显示持有人名称", () => {
    const filters = { holderId: "none", recordType: "all" as const };

    expect(hasActiveTransactionFilters(filters)).toBe(true);
    expect(buildActiveFilterChips(filters, filterOptions)).toEqual([
      "未指定持有人",
    ]);
  });

  it("持有人筛选参与筛选条件的序列化", () => {
    expect(
      serializeTransactionFilters({ holderId: "user-me", recordType: "all" }),
    ).not.toBe(serializeTransactionFilters({ recordType: "all" }));
  });

  it("按持有人分组的显示名称", () => {
    expect(getGroupDisplayLabel("holder")).toBe("按持有人显示");
  });
});
