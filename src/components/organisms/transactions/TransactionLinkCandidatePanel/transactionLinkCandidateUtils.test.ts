import { describe, expect, it } from "vitest";
import type { TransactionRefundCandidate } from "types/transactions";
import {
  matchesLinkCandidateScope,
  sortLinkCandidates,
} from "./transactionLinkCandidateUtils";
import { candidateItems } from "./transactionLinkCandidateFixtures";

const target: TransactionRefundCandidate = candidateItems[0];
const expense = (id: string, merchantId: string, day: number): TransactionRefundCandidate => ({
  ...target,
  id,
  merchantId,
  transactionAt: `2026-11-${String(day).padStart(2, "0")}T00:00:00Z`,
});
const locked = expense("locked", "other", 1);
const historical = expense("historical", "history", 2);
const sameMerchant = expense("same", "amazon", 3);
const latest = expense("latest", "other", 4);

describe("transactionLinkCandidateUtils", () => {
  it("退款按照小票锁定、历史商家、同商家、时间逆序排序", () => {
    const sorted = sortLinkCandidates([latest, sameMerchant, historical, locked], {
      kind: "refund",
      merchantId: "amazon",
      historyMerchantIds: ["history"],
      lockedAmounts: new Map([["locked", "50"]]),
      settled: false,
    });
    expect(sorted.map(({ id }) => id)).toEqual([
      "locked", "historical", "same", "latest",
    ]);
  });

  it("报销不使用同商家优先，锁定和历史优先后按时间倒序", () => {
    const sorted = sortLinkCandidates([sameMerchant, latest, locked, historical], {
      kind: "reimbursement",
      merchantId: "amazon",
      historyMerchantIds: ["history"],
      lockedAmounts: new Map([["locked", "50"]]),
      settled: false,
    });
    expect(sorted.map(({ id }) => id)).toEqual([
      "locked", "historical", "latest", "same",
    ]);
  });

  it("已结清的排序不受历史商家与锁定分组变化影响", () => {
    const sorted = sortLinkCandidates([locked, historical, sameMerchant], {
      kind: "refund",
      merchantId: "amazon",
      historyMerchantIds: ["history"],
      lockedAmounts: new Map([["locked", "50"]]),
      settled: true,
    });
    expect(sorted[0].id).toBe("same");
  });

  it("搜索草稿候选匹配备注、账户和大小分类，同时过滤币种", () => {
    const entry = {
      ...target,
      note: "给朋友的蓝牙音箱",
      accountName: "家庭信用卡",
      categoryName: "数码配件",
      parentCategoryName: "居家购物",
    };
    for (const term of ["蓝牙", "家庭", "数码", "居家"])
      expect(matchesLinkCandidateScope(entry, "JPY", term)).toBe(true);
    expect(matchesLinkCandidateScope(entry, "JPY", "找不到")).toBe(false);
    expect(matchesLinkCandidateScope(entry, "USD", "蓝牙")).toBe(false);
  });
});
