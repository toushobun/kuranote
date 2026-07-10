import { describe, expect, it } from "vitest";

import {
  getLedgerCreateErrorMessage,
  ledgerCreateErrorCodes,
} from "./ledgerCreate";

describe("getLedgerCreateErrorMessage", () => {
  it("认证失效或账号不可用时返回明确提示", () => {
    expect(
      getLedgerCreateErrorMessage(ledgerCreateErrorCodes.authRequired),
    ).toBe("登录状态已失效，请重新登录。");
    expect(
      getLedgerCreateErrorMessage(ledgerCreateErrorCodes.userInactive),
    ).toBe("当前账号不可用，请联系管理员。");
  });

  it("空值或未知错误码返回 null", () => {
    expect(getLedgerCreateErrorMessage()).toBeNull();
    expect(getLedgerCreateErrorMessage("unknown")).toBeNull();
  });
});
