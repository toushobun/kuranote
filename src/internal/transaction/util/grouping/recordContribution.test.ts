import { describe, expect, it } from "vitest";

import type { TransactionRecordDbRow } from "internal/db-types";
import type {
  TransactionFilters,
  TransactionGroupBy,
} from "internal/transaction/entity/transactionGrouping";

import { getTransactionGroupContextLookups } from "./contextLookups";
import { filterTransactionRecords } from "./filters";
import { recordMatchesGroup } from "./groupMatching";
import {
  getSharedPaymentAmounts,
  resolveContributionItems,
  resolveRecordAmountSource,
  resolveRecordLevelContribution,
  type TransactionListGroupContext,
} from "./recordContribution";
import {
  createHolderGroupLoaderContext,
  holderAccounts,
  holderCategories,
  holderIds,
  holderRecords,
} from "./accountHolder.testUtils";

// 与 supabase/tests/database/account_holder_group_summaries.test.sql 同一组例子：
// 按持有人分组的组合计由数据库分组函数给出，组内列表行在 TS 端按同一口径计算，二者应一致。

const windowA = [holderRecords.hospital, holderRecords.refund];

function contributionOf(
  record: TransactionRecordDbRow,
  filters: Omit<TransactionFilters, "recordType">,
  group?: TransactionListGroupContext,
) {
  const context = createHolderGroupLoaderContext();
  const lookups = getTransactionGroupContextLookups(context);
  return resolveRecordLevelContribution({
    categoryById: lookups.categoryById,
    filters: { recordType: "all", ...filters },
    group,
    holderIdsByAccountId: context.holderIdsByAccountId,
    matchedItems: lookups.itemsByRecordId.get(record.id) ?? [],
    payments: lookups.paymentsByRecordId.get(record.id) ?? [],
  });
}

/** 组内列表行（普通记录）的金额合计：组内明细经 recordMatchesGroup 取得，与组合计同口径。 */
function groupRowTotal(
  records: TransactionRecordDbRow[],
  groupBy: TransactionGroupBy,
  groupKey: string,
  filters: Omit<TransactionFilters, "recordType"> = {},
) {
  const context = createHolderGroupLoaderContext(records);
  const lookups = getTransactionGroupContextLookups(context);
  return filterTransactionRecords(context, { recordType: "all", ...filters })
    .filter(
      (record) =>
        record.type === "normal" &&
        recordMatchesGroup({
          categoryById: lookups.categoryById,
          groupBy,
          groupKey,
          holderIdsByAccountId: context.holderIdsByAccountId,
          items: lookups.itemsByRecordId.get(record.id) ?? [],
          payments: lookups.paymentsByRecordId.get(record.id) ?? [],
          record,
        }),
    )
    .reduce(
      (sum, record) =>
        sum + contributionOf(record, filters, { groupBy, groupKey }),
      0,
    );
}

describe("按持有人分组（组内列表行）", () => {
  it("医院 + 退款：我 -5 万 + 1 万 = -4 万，妻子 -7 万", () => {
    expect(groupRowTotal(windowA, "holder", holderIds.me)).toBe(-40000);
    expect(groupRowTotal(windowA, "holder", holderIds.wife)).toBe(-70000);
  });

  it("我名下两个账户共同支付记一笔，合计 = 整笔", () => {
    expect(
      groupRowTotal([holderRecords.sharedMine], "holder", holderIds.me),
    ).toBe(-3000);
  });

  it("转账与余额调整不计入", () => {
    const records = [
      holderRecords.transferMine,
      holderRecords.transferToWife,
      holderRecords.adjustment,
    ];
    expect(groupRowTotal(records, "holder", holderIds.me)).toBe(0);
    expect(groupRowTotal(records, "holder", holderIds.wife)).toBe(0);
  });

  it("无持有人账户进入「未指定持有人」组，占位成员持有的账户正常分组", () => {
    const records = [holderRecords.unassigned, holderRecords.grandma];
    expect(groupRowTotal(records, "holder", "none")).toBe(-800);
    expect(groupRowTotal(records, "holder", holderIds.grandma)).toBe(-600);
  });

  it("全月：每个持有人为名下账户的实际收付合计", () => {
    const records = Object.values(holderRecords);
    expect(groupRowTotal(records, "holder", holderIds.me)).toBe(-43000);
    expect(groupRowTotal(records, "holder", holderIds.wife)).toBe(-70000);
    expect(groupRowTotal(records, "holder", holderIds.grandma)).toBe(-600);
    expect(groupRowTotal(records, "holder", "none")).toBe(-800);
  });
});

describe("按持有人筛选（记录级维度）", () => {
  const me = { holderId: holderIds.me };

  it("医院取我的份额 -5 万，退款取实际进入礼品卡的 +1 万", () => {
    expect(contributionOf(holderRecords.hospital, me)).toBe(-50000);
    expect(contributionOf(holderRecords.refund, me)).toBe(10000);
    expect(groupRowTotal(windowA, "member", holderIds.me, me)).toBe(-40000);
  });

  it("筛选妻子只计妻子的份额 -7 万", () => {
    expect(
      contributionOf(holderRecords.hospital, { holderId: holderIds.wife }),
    ).toBe(-70000);
  });

  it("我名下两个账户共同支付：份额 = 整笔，不算共同支付", () => {
    const context = createHolderGroupLoaderContext();
    const lookups = getTransactionGroupContextLookups(context);

    expect(contributionOf(holderRecords.sharedMine, me)).toBe(-3000);
    expect(
      getSharedPaymentAmounts({
        filters: { recordType: "all", ...me },
        holderIdsByAccountId: context.holderIdsByAccountId,
        payments:
          lookups.paymentsByRecordId.get(holderRecords.sharedMine.id) ?? [],
      }),
    ).toBeNull();
  });

  it("筛选「未指定持有人」与占位成员", () => {
    expect(contributionOf(holderRecords.unassigned, { holderId: "none" })).toBe(
      -800,
    );
    expect(
      contributionOf(holderRecords.grandma, { holderId: holderIds.grandma }),
    ).toBe(-600);
  });

  it("按单个账户筛选保持 #914 方案 D：单账户退款记录仍为业务净额 0", () => {
    const giftCard = { accountId: holderAccounts.myGiftCard.id };
    const context = createHolderGroupLoaderContext();
    const lookups = getTransactionGroupContextLookups(context);

    expect(contributionOf(holderRecords.refund, giftCard)).toBe(0);
    expect(
      resolveRecordAmountSource({
        filters: { recordType: "all", ...giftCard },
        holderIdsByAccountId: context.holderIdsByAccountId,
        payments: lookups.paymentsByRecordId.get(holderRecords.refund.id) ?? [],
      }),
    ).toBe("items");
    expect(
      contributionOf(holderRecords.hospital, {
        accountId: holderAccounts.myCash.id,
      }),
    ).toBe(-50000);
  });
});

describe("按持有人筛选（明细级维度）", () => {
  const filters: TransactionFilters = {
    holderId: holderIds.me,
    recordType: "all",
  };

  it("医院在分类组内只计命中该组的明细全额，并带共同支付（我 5 万 / 整笔 12 万）", () => {
    const context = createHolderGroupLoaderContext();
    const lookups = getTransactionGroupContextLookups(context);
    const payments =
      lookups.paymentsByRecordId.get(holderRecords.hospital.id) ?? [];
    const matchedItems =
      lookups.itemsByRecordId.get(holderRecords.hospital.id) ?? [];

    for (const [category, amount] of [
      [holderCategories.treatment, -40000],
      [holderCategories.checkup, -70000],
    ] as const) {
      const group = { groupBy: "category" as const, groupKey: category.id };
      expect(
        resolveContributionItems({
          categoryById: lookups.categoryById,
          filters,
          group,
          holderIdsByAccountId: context.holderIdsByAccountId,
          matchedItems,
          payments,
        }).map((item) => item.category_id),
      ).toEqual([category.id]);
      expect(contributionOf(holderRecords.hospital, filters, group)).toBe(
        amount,
      );
    }
    expect(
      getSharedPaymentAmounts({
        filters,
        holderIdsByAccountId: context.holderIdsByAccountId,
        payments,
      }),
    ).toEqual({ recordTotalAmount: 120000 });
  });
});
