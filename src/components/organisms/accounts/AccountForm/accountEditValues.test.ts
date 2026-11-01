import { describe, expect, it } from "vitest";

import {
  accountHolderOptionsFixture,
  accountPlaceholderHolderOptionsFixture,
  createMemberAccountHolder,
  createPlaceholderAccountHolder,
  inactiveAccountHolderOptionFixture,
} from "test/mocks/accountHolders";
import { bankAccountFixture } from "test/mocks/accounts";
import type { Account } from "types/accounts";

import {
  getAccountBalanceAdjustment,
  getAccountEditHolderDefaults,
  isAccountFormDirty,
  type AccountFormValues,
} from "./accountEditValues";

const [me] = accountHolderOptionsFixture;

function getDefaults(holders: Account["holders"]) {
  return getAccountEditHolderDefaults({
    account: { ...bankAccountFixture, holders },
    holderOptions: accountHolderOptionsFixture,
    placeholderHolderOptions: accountPlaceholderHolderOptionsFixture,
  });
}

describe("getAccountEditHolderDefaults", () => {
  it("候选里的成员持有人作为初始选择", () => {
    expect(getDefaults([createMemberAccountHolder(me!)])).toEqual({
      placeholderOptions: accountPlaceholderHolderOptionsFixture,
      preservedHolderOptions: [],
      selection: { id: me!.user_id, kind: "member" },
    });
  });

  it("候选外的成员持有人作为非活跃持有人保留，不算选择", () => {
    expect(
      getDefaults([
        createMemberAccountHolder(inactiveAccountHolderOptionFixture),
      ]),
    ).toMatchObject({
      preservedHolderOptions: [inactiveAccountHolderOptionFixture],
      selection: null,
    });
  });

  it("当前占位持有人作为初始选择", () => {
    const holder = createPlaceholderAccountHolder();

    expect(getDefaults([holder])).toMatchObject({
      placeholderOptions: accountPlaceholderHolderOptionsFixture,
      selection: { id: holder.placeholder_id, kind: "placeholder" },
    });
  });

  it("当前占位不在候选里时补进候选", () => {
    const holder = createPlaceholderAccountHolder({
      display_name: "外婆",
      placeholder_id: "p-2",
    });

    expect(getDefaults([holder])).toMatchObject({
      placeholderOptions: [
        ...accountPlaceholderHolderOptionsFixture,
        { display_name: "外婆", placeholder_id: "p-2" },
      ],
      selection: { id: "p-2", kind: "placeholder" },
    });
  });

  it("没有持有人时不选择", () => {
    expect(getDefaults([]).selection).toBeNull();
  });
});

describe("getAccountBalanceAdjustment", () => {
  it.each([
    ["85000", 85000, 0],
    ["80000", 85000, -5000],
    ["0.3", "0.1", 0.2],
    ["-12800", 0, -12800],
  ])("目标 %s、当前 %s 时差值为 %s", (target, current, delta) => {
    expect(getAccountBalanceAdjustment(target, current)).toEqual({
      delta,
      valid: true,
    });
  });

  it.each(["", "-", "12.345", "abc", "1000000000000"])(
    "%s 无效时差值按 0",
    (target) => {
      expect(getAccountBalanceAdjustment(target, 100)).toEqual({
        delta: 0,
        valid: false,
      });
    },
  );
});

describe("isAccountFormDirty", () => {
  const initial: AccountFormValues = {
    balance: "85000",
    balanceAdjustmentNote: "",
    currency: "JPY",
    holderSelection: { id: "user-a", kind: "member" },
    name: "三菱UFJ银行",
    type: "bank",
  };

  it("与初始值相同时不算修改", () => {
    expect(isAccountFormDirty(initial, { ...initial })).toBe(false);
  });

  it("余额数值相同（写法不同）时不算修改", () => {
    expect(
      isAccountFormDirty(initial, { ...initial, balance: "85000.00" }),
    ).toBe(false);
  });

  it.each<[string, Partial<AccountFormValues>]>([
    ["名称", { name: "三菱UFJ" }],
    ["类型", { type: "cash" }],
    ["货币", { currency: "USD" }],
    ["余额", { balance: "80000" }],
    ["余额输入中途", { balance: "-" }],
    ["余额调整备注", { balanceAdjustmentNote: "对账" }],
    ["持有人", { holderSelection: null }],
    [
      "持有人换成占位",
      { holderSelection: { id: "user-a", kind: "placeholder" } },
    ],
  ])("改了%s时算修改", (_, change) => {
    expect(isAccountFormDirty(initial, { ...initial, ...change })).toBe(true);
  });
});
