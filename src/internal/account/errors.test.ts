import { describe, expect, it } from "vitest";

import {
  accountErrorCodes,
  accountErrorMessages,
} from "internal/account/errors";

describe("accountErrorMessages", () => {
  it("返回账户模块的权威用户文案", () => {
    expect(accountErrorMessages[accountErrorCodes.nameRequired]).toBe(
      "请输入账户名称。",
    );
    expect(accountErrorMessages[accountErrorCodes.holderInvalid]).toBe(
      "账户持有人必须是当前账本的有效成员。",
    );
    expect(accountErrorMessages[accountErrorCodes.accountNotFound]).toBe(
      "账户不存在或已删除。",
    );
  });

  it("同名错误说明全部判重维度且普通失败不误报重名", () => {
    expect(accountErrorMessages[accountErrorCodes.nameDuplicate]).toBe(
      "同一账本中，相同账户类型、货币和持有人下已存在同名账户（不区分大小写），请修改账户名称。",
    );
    for (const code of [
      accountErrorCodes.createFailed,
      accountErrorCodes.updateFailed,
    ]) {
      expect(accountErrorMessages[code]).not.toContain("重复");
    }
  });

  it.each([
    accountErrorCodes.holderChanged,
    accountErrorCodes.holderIdentityInvalid,
    accountErrorCodes.placeholderAlreadyClaimed,
    accountErrorCodes.placeholderNotFound,
    accountErrorCodes.placeholderUnavailable,
  ])("占位持有人错误码 %s 提供表单场景文案", (code) => {
    expect(accountErrorMessages[code]).toEqual(expect.any(String));
  });
});
