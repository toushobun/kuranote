// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  createAccountRequestSchema,
  updateAccountRequestSchema,
} from "internal/account/schema";

const holderUserId = "00000000-0000-4000-8000-000000000041";

describe("Account Schema", () => {
  it("创建请求接受合法账户字段", () => {
    expect(
      createAccountRequestSchema.safeParse({
        currency: "JPY",
        holderUserIds: [holderUserId],
        initialBalance: 1000,
        name: "现金",
        type: "cash",
      }).success,
    ).toBe(true);
  });

  it("接受空持有人数组", () => {
    expect(
      createAccountRequestSchema.safeParse({
        currency: "JPY",
        holderUserIds: [],
        initialBalance: 1000,
        name: "现金",
        type: "cash",
      }).success,
    ).toBe(true);
  });

  it("拒绝超过 1 个持有人", () => {
    expect(
      createAccountRequestSchema.safeParse({
        currency: "JPY",
        holderUserIds: [
          holderUserId,
          "00000000-0000-4000-8000-000000000042",
        ],
        initialBalance: 1000,
        name: "现金",
        type: "cash",
      }).success,
    ).toBe(false);
  });

  it("拒绝非法货币和非法账户类型", () => {
    expect(
      updateAccountRequestSchema.safeParse({
        currency: "jpy",
        holderUserIds: [holderUserId],
        name: "现金",
        type: "unknown",
      }).success,
    ).toBe(false);
  });
});

import { accountBalanceAdjustmentSchema } from "./schema";
describe("目标余额校验", () => {
  it.each([0, -100, 12.34, 999999999999.99])(
    "接受合法余额 %s",
    (targetBalance) => {
      expect(
        accountBalanceAdjustmentSchema.safeParse({ targetBalance }).success,
      ).toBe(true);
    },
  );
  it.each([NaN, Infinity, -Infinity, 0.001, 1.00001, 1e12])(
    "拒绝非法余额 %s",
    (targetBalance) => {
      expect(
        accountBalanceAdjustmentSchema.safeParse({ targetBalance }).success,
      ).toBe(false);
    },
  );
  it("备注可空但不得超过长度限制", () => {
    expect(
      accountBalanceAdjustmentSchema.safeParse({ balanceAdjustmentNote: null })
        .success,
    ).toBe(true);
    expect(
      accountBalanceAdjustmentSchema.safeParse({
        balanceAdjustmentNote: "a".repeat(2001),
      }).success,
    ).toBe(false);
  });
});
