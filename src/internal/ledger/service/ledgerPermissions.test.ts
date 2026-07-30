import { describe, expect, it } from "vitest";

import {
  canManageLedger,
  canManageMasterData,
  canManageMembers,
  canModifyTransaction,
  canViewLedger,
  canWriteTransaction,
} from "./ledgerPermissions";

describe("账本成员权限判断", () => {
  it.each(["owner", "admin"] as const)(
    "%s 可以管理账本、成员和基础数据",
    (role) => {
      expect(canManageLedger(role)).toBe(true);
      expect(canManageMembers(role)).toBe(true);
      expect(canManageMasterData(role)).toBe(true);
      expect(canWriteTransaction(role)).toBe(true);
      expect(canViewLedger(role)).toBe(true);
    },
  );

  it("member 只能维护自己创建的记账", () => {
    expect(canManageLedger("member")).toBe(false);
    expect(canManageMembers("member")).toBe(false);
    expect(canManageMasterData("member")).toBe(false);
    expect(canWriteTransaction("member")).toBe(true);
    expect(
      canModifyTransaction({
        createdBy: "user-1",
        role: "member",
        userId: "user-1",
      }),
    ).toBe(true);
    expect(
      canModifyTransaction({
        createdBy: "user-2",
        role: "member",
        userId: "user-1",
      }),
    ).toBe(false);
  });

  it("viewer 只能查看账本", () => {
    expect(canViewLedger("viewer")).toBe(true);
    expect(canWriteTransaction("viewer")).toBe(false);
    expect(canManageMasterData("viewer")).toBe(false);
    expect(
      canModifyTransaction({
        createdBy: "user-1",
        role: "viewer",
        userId: "user-1",
      }),
    ).toBe(false);
  });
});
