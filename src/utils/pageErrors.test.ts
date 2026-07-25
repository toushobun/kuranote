import { describe, expect, it } from "vitest";

import { accountErrorCodes } from "internal/account";

import { getAccountErrorMessage } from "./pageErrors";

describe("pageErrors", () => {
  it("使用统一错误码映射账户错误提示", () => {
    expect(getAccountErrorMessage(accountErrorCodes.nameRequired)).toBe(
      "请输入账户名称。",
    );
    expect(getAccountErrorMessage(accountErrorCodes.createFailed)).toBe(
      "账户新增失败。请确认账户名称是否重复，或稍后重试。",
    );
  });

  it("空值或未知错误码返回 null", () => {
    expect(getAccountErrorMessage()).toBeNull();
    expect(getAccountErrorMessage("unknown")).toBeNull();
  });
});
