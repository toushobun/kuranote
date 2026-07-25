import { describe, expect, it } from "vitest";

import {
  accountErrorCodes,
  getAccountErrorMessage,
} from "internal/account/errors";

describe("getAccountErrorMessage", () => {
  it("返回账户模块的权威用户文案", () => {
    expect(getAccountErrorMessage(accountErrorCodes.nameRequired)).toBe(
      "请输入账户名称。",
    );
    expect(getAccountErrorMessage(accountErrorCodes.holderInvalid)).toBe(
      "账户持有人必须是当前账本的有效成员。",
    );
    expect(getAccountErrorMessage(accountErrorCodes.accountNotFound)).toBe(
      "账户不存在或已删除。",
    );
  });

  it("未知错误码不返回文案", () => {
    expect(getAccountErrorMessage()).toBeNull();
    expect(getAccountErrorMessage("unknown")).toBeNull();
  });
});
