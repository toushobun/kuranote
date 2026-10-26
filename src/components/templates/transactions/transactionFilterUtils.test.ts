import { describe, expect, it } from "vitest";

import type { TransactionFilterOptions } from "types/transactions";

import {
  buildActiveFilterChips,
  getGroupDisplayLabel,
  hasActiveTransactionFilters,
  resolveSharedPaymentSubject,
  serializeTransactionFilters,
} from "./transactionFilterUtils";

const filterOptions: TransactionFilterOptions = {
  accounts: [],
  categories: [],
  holders: [
    { id: "user-me", name: "我" },
    { id: "placeholder-grandma", name: "奶奶" },
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

describe("resolveSharedPaymentSubject", () => {
  it("只按持有人筛选时为持有人名称，占位成员与「未指定持有人」原样显示", () => {
    expect(
      resolveSharedPaymentSubject(
        { holderId: "user-me", recordType: "all" },
        filterOptions,
      ),
    ).toBe("我");
    expect(
      resolveSharedPaymentSubject(
        { holderId: "placeholder-grandma", recordType: "all" },
        filterOptions,
      ),
    ).toBe("奶奶");
    expect(
      resolveSharedPaymentSubject(
        { holderId: "none", recordType: "all" },
        filterOptions,
      ),
    ).toBe("未指定持有人");
  });

  it("按账户筛选时为「本账户」，同时按持有人筛选也以账户为准", () => {
    expect(
      resolveSharedPaymentSubject(
        { accountId: "account-1", recordType: "all" },
        filterOptions,
      ),
    ).toBe("本账户");
    expect(
      resolveSharedPaymentSubject(
        { accountId: "account-1", holderId: "user-me", recordType: "all" },
        filterOptions,
      ),
    ).toBe("本账户");
  });

  it("没有账户 / 持有人筛选时为「本账户」", () => {
    expect(
      resolveSharedPaymentSubject({ recordType: "all" }, filterOptions),
    ).toBe("本账户");
  });
});
