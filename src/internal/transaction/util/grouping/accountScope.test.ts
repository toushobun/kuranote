import { describe, expect, it } from "vitest";

import {
  hasAccountScopeFilters,
  listAccountHolderIds,
  resolveAccountScope,
  usesHolderDimension,
} from "./accountScope";
import {
  holderAccounts,
  holderIds,
  holderIdsByAccountId,
} from "./accountHolder.testUtils";

const allAccountIds = Object.values(holderAccounts).map(
  (account) => account.id,
);

function scopedAccountIds(
  input: Omit<
    Parameters<typeof resolveAccountScope>[0],
    "holderIdsByAccountId"
  >,
) {
  const scope = resolveAccountScope({ ...input, holderIdsByAccountId });
  return scope ? allAccountIds.filter(scope) : null;
}

describe("listAccountHolderIds", () => {
  it("返回账户的持有人，占位成员与正式成员一样", () => {
    expect(
      listAccountHolderIds(holderAccounts.myCash.id, holderIdsByAccountId),
    ).toEqual([holderIds.me]);
    expect(
      listAccountHolderIds(
        holderAccounts.grandmaWallet.id,
        holderIdsByAccountId,
      ),
    ).toEqual([holderIds.grandma]);
  });

  it("无持有人的账户归入「未指定持有人」", () => {
    expect(
      listAccountHolderIds(
        holderAccounts.sharedWallet.id,
        holderIdsByAccountId,
      ),
    ).toEqual(["none"]);
  });
});

describe("resolveAccountScope", () => {
  it("没有账户 / 持有人筛选且不按账户 / 持有人分组时不限定账户", () => {
    expect(scopedAccountIds({ filters: { recordType: "all" } })).toBeNull();
    expect(
      scopedAccountIds({
        filters: { recordType: "all" },
        group: { groupBy: "merchant", groupKey: "merchant-1" },
      }),
    ).toBeNull();
  });

  it("按单个账户筛选是只有一个账户的集合", () => {
    expect(
      scopedAccountIds({
        filters: { accountId: holderAccounts.myCash.id, recordType: "all" },
      }),
    ).toEqual([holderAccounts.myCash.id]);
  });

  it("按持有人筛选解析为其名下的所有账户", () => {
    expect(
      scopedAccountIds({
        filters: { holderId: holderIds.me, recordType: "all" },
      }),
    ).toEqual([
      holderAccounts.myBank.id,
      holderAccounts.myCash.id,
      holderAccounts.myGiftCard.id,
    ]);
    expect(
      scopedAccountIds({ filters: { holderId: "none", recordType: "all" } }),
    ).toEqual([holderAccounts.sharedWallet.id]);
  });

  it("账户筛选、持有人筛选与所在分组取交集", () => {
    expect(
      scopedAccountIds({
        filters: {
          accountId: holderAccounts.myCash.id,
          holderId: holderIds.me,
          recordType: "all",
        },
      }),
    ).toEqual([holderAccounts.myCash.id]);
    expect(
      scopedAccountIds({
        filters: { accountId: holderAccounts.myCash.id, recordType: "all" },
        group: { groupBy: "holder", groupKey: holderIds.wife },
      }),
    ).toEqual([]);
    expect(
      scopedAccountIds({
        filters: { recordType: "all" },
        group: { groupBy: "holder", groupKey: holderIds.wife },
      }),
    ).toEqual([holderAccounts.wifeCash.id]);
  });
});

describe("hasAccountScopeFilters / usesHolderDimension", () => {
  it("账户或持有人筛选都是账户集合筛选", () => {
    expect(hasAccountScopeFilters({ recordType: "all" })).toBe(false);
    expect(
      hasAccountScopeFilters({ accountId: "account-1", recordType: "all" }),
    ).toBe(true);
    expect(
      hasAccountScopeFilters({ holderId: holderIds.me, recordType: "all" }),
    ).toBe(true);
  });

  it("持有人筛选或按持有人分组属于持有人维度，按单个账户筛选不属于", () => {
    expect(
      usesHolderDimension({
        filters: { accountId: "account-1", recordType: "all" },
      }),
    ).toBe(false);
    expect(
      usesHolderDimension({
        filters: { holderId: holderIds.me, recordType: "all" },
      }),
    ).toBe(true);
    expect(
      usesHolderDimension({
        filters: { recordType: "all" },
        groupBy: "holder",
      }),
    ).toBe(true);
  });
});
