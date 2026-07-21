// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  createAccountRequestSchema,
  updateAccountRequestSchema,
} from "server/account/schema";

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

  it("拒绝空持有人、非法货币和非法账户类型", () => {
    expect(
      updateAccountRequestSchema.safeParse({
        currency: "jpy",
        holderUserIds: [],
        name: "现金",
        type: "unknown",
      }).success,
    ).toBe(false);
  });
});
