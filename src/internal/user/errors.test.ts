import { describe, expect, it } from "vitest";

import {
  formatLedgerDisplayNameConflictMessage,
  isLedgerDisplayNameConflictCode,
  userErrorMessages,
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

  it("由上限常量拼出的文案与实际显示内容一致", () => {
    expect(userErrorMessages.displayNameTooLong).toBe("昵称最多 100 个字符。");
    expect(userErrorMessages.avatarFileTooLarge).toBe(
      "头像图片不能超过 1MB，请换一张图片后重试。",
    );
  });
});
