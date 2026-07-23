import { describe, expect, it } from "vitest";

import { getLedgerInviteErrorMessage } from "./ledgerInvite";

describe("getLedgerInviteErrorMessage", () => {
  it("映射接受邀请失败错误", () => {
    expect(getLedgerInviteErrorMessage("accept_failed")).toBe(
      "加入账本失败，请稍后重试。",
    );
  });

  it.each([undefined, "", "unknown_error"])(
    "未知错误码 %s 不展示消息",
    (code) => {
      expect(getLedgerInviteErrorMessage(code)).toBeNull();
    },
  );
});
