import { describe, expect, it } from "vitest";

import {
  getLedgerCreateErrorMessage,
  ledgerCreateErrorCodes,
} from "./ledgerCreate";

describe("getLedgerCreateErrorMessage", () => {
  it("认证失效时返回重新登录提示", () => {
    expect(
      getLedgerCreateErrorMessage(ledgerCreateErrorCodes.authRequired),
    ).toBe("登录状态已失效，请重新登录。");
  });

  it("空值或未知错误码返回 null", () => {
    expect(getLedgerCreateErrorMessage()).toBeNull();
    expect(getLedgerCreateErrorMessage("unknown")).toBeNull();
  });
});
