import { describe, expect, it } from "vitest";

import { getDashboardTransactionCanEdit } from "./dashboardTransactionPermissions";

describe("getDashboardTransactionCanEdit", () => {
  it.each(["owner", "admin"] as const)(
    "%s 可以编辑其他成员创建的记账",
    (role) => {
      expect(
        getDashboardTransactionCanEdit({
          createdBy: "user-b",
          role,
          userId: "user-a",
        }),
      ).toBe(true);
    },
  );

  it("member 可以编辑自己创建的记账", () => {
    expect(
      getDashboardTransactionCanEdit({
        createdBy: "user-a",
        role: "member",
        userId: "user-a",
      }),
    ).toBe(true);
  });

  it("member 不可以编辑其他成员创建的记账", () => {
    expect(
      getDashboardTransactionCanEdit({
        createdBy: "user-b",
        role: "member",
        userId: "user-a",
      }),
    ).toBe(false);
  });

  it("viewer 不可以编辑记账", () => {
    expect(
      getDashboardTransactionCanEdit({
        createdBy: "user-a",
        role: "viewer",
        userId: "user-a",
      }),
    ).toBe(false);
  });

  it("缺少当前用户 ID 时采用 fail-closed", () => {
    expect(
      getDashboardTransactionCanEdit({
        createdBy: "user-a",
        role: "owner",
      }),
    ).toBe(false);
  });
});
