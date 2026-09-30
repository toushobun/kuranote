import { describe, expect, it } from "vitest";

import {
  formatLedgerDisplayNameConflictMessage,
  isLedgerDisplayNameConflictCode,
} from "internal/user/errors";

describe("user errors", () => {
  it("只识别已定义的账本昵称冲突码", () => {
    expect(
      isLedgerDisplayNameConflictCode("display_name_placeholder_conflict"),
    ).toBe(true);
    expect(isLedgerDisplayNameConflictCode("toString")).toBe(false);
    expect(isLedgerDisplayNameConflictCode(null)).toBe(false);
  });

  it("列出每个失败账本的名称与原因", () => {
    expect(
      formatLedgerDisplayNameConflictMessage([
        { code: "display_name_placeholder_conflict", ledgerName: "家庭" },
        { code: "display_name_placeholder_conflict", ledgerName: "旅行" },
      ]),
    ).toBe(
      "以下账本无法使用该昵称，昵称未修改。「家庭」：账本中已有同名的待邀请成员；「旅行」：账本中已有同名的待邀请成员。请更换昵称，或取消勾选这些账本。",
    );
  });
});
