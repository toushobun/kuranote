import { describe, expect, it } from "vitest";
import type { TransactionRefundCandidate } from "types/transactions";
import {
  groupLinkCandidates,
  matchesLinkCandidateScope,
  reconcileLinkCandidateGroupCounts,
  sortLinkCandidates,
} from "./transactionLinkCandidateUtils";
import { candidateItems } from "./transactionLinkCandidateFixtures";

const target: TransactionRefundCandidate = candidateItems[0];
const expense = (
  id: string,
  merchantId: string,
  day: number,
): TransactionRefundCandidate => ({
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
  it("退款按照小票锁定、同商家、常退商家、时间逆序排序", () => {
    const sorted = sortLinkCandidates(
      [latest, sameMerchant, historical, locked],
      {
        kind: "refund",
        merchantId: "amazon",
        historyMerchantIds: ["history"],
        lockedAmounts: new Map([["locked", "50"]]),
        settled: false,
      },
    );
    expect(sorted.map(({ id }) => id)).toEqual([
      "locked",
      "same",
      "historical",
      "latest",
    ]);
  });

  it("报销不使用同商家优先，锁定和历史优先后按时间倒序", () => {
    const sorted = sortLinkCandidates(
      [sameMerchant, latest, locked, historical],
      {
        kind: "reimbursement",
        merchantId: "amazon",
        historyMerchantIds: ["history"],
        lockedAmounts: new Map([["locked", "50"]]),
        settled: false,
      },
    );
    expect(sorted.map(({ id }) => id)).toEqual([
      "locked",
      "historical",
      "latest",
      "same",
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

  it("草稿候选金额搜索与 RPC 一样识别千分位、货币符号及空格", () => {
    expect(matchesLinkCandidateScope(target, "¥3,280 円")).toBe(true);
    expect(matchesLinkCandidateScope(target, "3，280")).toBe(true);
    expect(matchesLinkCandidateScope(target, "¥3,281 円")).toBe(false);
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
      expect(matchesLinkCandidateScope(entry, term)).toBe(true);
    expect(matchesLinkCandidateScope(entry, "找不到")).toBe(false);
    expect(matchesLinkCandidateScope(entry, "蓝牙")).toBe(true);
  });
});

it("来源明细在锁定项后按小票顺序，优先于历史与同商家", () => {
  const first = expense("source-first", "other", 1);
  const second = expense("source-second", "other", 16);
  expect(
    sortLinkCandidates(
      [second, latest, historical, first, locked, sameMerchant],
      {
        kind: "refund",
        settled: false,
        merchantId: "amazon",
        historyMerchantIds: ["history"],
        sourceItemIds: [first.id, second.id],
        lockedAmounts: new Map([[locked.id, "30"]]),
      },
    ).map(({ id }) => id),
  ).toEqual([
    locked.id,
    first.id,
    second.id,
    sameMerchant.id,
    historical.id,
    latest.id,
  ]);
});

describe("groupLinkCandidates", () => {
  it("退款按小票、入口来源、同商家、常退商家、其他顺序分组", () => {
    const source = expense("source", "other", 5);
    const groups = groupLinkCandidates(
      [latest, sameMerchant, historical, source, locked],
      {
        kind: "refund",
        merchantId: "amazon",
        merchantName: "Amazon",
        historyMerchantIds: ["history"],
        lockedAmounts: new Map([[locked.id, "50"]]),
        sourceItemIds: [source.id],
        sourceCandidate: { ...source, merchantName: "乐天" },
      },
    );
    expect(groups.map(({ key }) => key)).toEqual([
      "locked",
      "source",
      "sameMerchant",
      "history",
      "other",
    ]);
    expect(groups.map(({ count }) => count)).toEqual([1, 1, 1, 1, 1]);
    expect(groups[1].hint).toContain("11/05");
    expect(groups[3].hint).toBe("Amazon");
    expect(groups[3].title).toBe("常退商家支出");
  });

  it("报销不显示同商家分组，没有商家时全部归其他待报销", () => {
    const result = groupLinkCandidates([historical, sameMerchant, latest], {
      kind: "reimbursement",
      merchantId: "amazon",
      merchantName: "Amazon",
      historyMerchantIds: ["history"],
    });
    expect(result.map(({ key }) => key)).toEqual(["history", "other"]);
    expect(result[0].title).toBe("常报销商家支出");
    expect(
      groupLinkCandidates([historical, sameMerchant], {
        kind: "reimbursement",
        historyMerchantIds: ["history"],
      }).map(({ key }) => key),
    ).toEqual(["other"]);
  });

  it("历史组首屏尚无明细时仍显示服务端返回的商家名称", () => {
    const groups = groupLinkCandidates([], {
      kind: "refund",
      merchantId: "amazon",
      historyMerchantNames: ["罗森", "乐天"],
      counts: { history: 2 },
    });
    expect(groups).toEqual([
      expect.objectContaining({
        key: "history",
        count: 2,
        hint: "罗森、乐天",
      }),
    ]);
  });

  it("空组不显示，但服务端有未加载笔数的组要保留标题", () => {
    expect(
      groupLinkCandidates([sameMerchant], {
        kind: "refund",
        merchantId: "amazon",
      }).map(({ key }) => key),
    ).toEqual(["sameMerchant"]);
    expect(
      groupLinkCandidates([], {
        kind: "refund",
        merchantId: "amazon",
        counts: { history: 2 },
      }),
    ).toEqual([
      expect.objectContaining({ key: "history", count: 2, candidates: [] }),
    ]);
  });

  it("锁定、来源、编辑初始选中从服务端层级中扣除且不重复计数", () => {
    const source = expense("source", "other", 5);
    const nowSettled = expense("settled", "amazon", 6);
    const nowActive = {
      ...expense("reactivated", "other", 7),
      remainingRefundableAmount: "0",
    };
    const result = reconcileLinkCandidateGroupCounts(
      { history: 1, sameMerchant: 2, other: 3, partial: 0 },
      {
        kind: "refund",
        merchantId: "amazon",
        historyMerchantIds: ["history"],
        lockedAmounts: new Map([[historical.id, "100"]]),
        sourceItemIds: [source.id],
        affectedCandidates: [historical, source, nowSettled, nowActive],
        initialSelection: sameMerchant,
        isActuallySettled: (candidate) =>
          candidate.id === nowSettled.id
            ? true
            : candidate.id === nowActive.id
              ? false
              : Number(candidate.remainingRefundableAmount) <= 0,
      },
    );
    expect(result).toEqual({
      history: 0,
      sameMerchant: 0,
      other: 3,
      partial: 0,
    });
  });
  it("部分结清排在普通组之后且默认独立成组", () => {
    const partiallySettled = {
      ...expense("partial", "amazon", 8),
      amount: "100",
      remainingRefundableAmount: "70",
    };
    const groups = groupLinkCandidates([partiallySettled, sameMerchant], {
      kind: "refund",
      merchantId: "amazon",
    });
    expect(groups.map(({ key }) => key)).toEqual(["sameMerchant", "partial"]);
    expect(groups[1].count).toBe(1);
  });

  it("草稿把普通组转为部分结清，计数不能重复", () => {
    const result = reconcileLinkCandidateGroupCounts(
      { history: 0, sameMerchant: 0, other: 1, partial: 0 },
      {
        kind: "refund",
        affectedCandidates: [expense("normal", "other", 1)],
        isActuallySettled: () => false,
        isActuallyPartiallySettled: () => true,
      },
    );
    expect(result).toEqual({
      history: 0,
      sameMerchant: 0,
      other: 0,
      partial: 1,
    });
  });

  it("草稿把部分结清变成已结清，或删除抵扣恢复到普通组", () => {
    const originalPartial = {
      ...expense("partial", "other", 2),
      amount: "100",
      remainingRefundableAmount: "60",
    };
    const originalSettled = {
      ...expense("settled", "other", 3),
      remainingRefundableAmount: "0",
    };
    const result = reconcileLinkCandidateGroupCounts(
      { history: 0, sameMerchant: 0, other: 0, partial: 1 },
      {
        kind: "refund",
        affectedCandidates: [originalPartial, originalSettled],
        isActuallySettled: (item) => item.id === "partial",
        isActuallyPartiallySettled: () => false,
      },
    );
    expect(result).toEqual({
      history: 0,
      sameMerchant: 0,
      other: 1,
      partial: 0,
    });
  });
});
