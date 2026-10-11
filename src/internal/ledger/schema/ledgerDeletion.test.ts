import { describe, expect, it } from "vitest";
import { ledgerDeletionSchema } from "./ledgerDeletion";
describe("ledgerDeletionSchema", () => {
  it("保留账本名首尾空格及大小写以便严格确认", () => {
    const value = {
      ledgerId: "00000000-0000-4000-8000-000000000032",
      confirmationName: " Test ",
    };
    expect(ledgerDeletionSchema.parse(value)).toEqual(value);
  });
  it("拒绝缺失字段和非法 ID", () => {
    expect(ledgerDeletionSchema.safeParse({ ledgerId: "bad" }).success).toBe(
      false,
    );
  });
});
