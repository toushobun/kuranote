import { describe, expect, it } from "vitest";

import {
  getLedgerInviteErrorMessage,
  ledgerInviteErrorCodes,
} from "./ledgerInvite";

describe("getLedgerInviteErrorMessage", () => {
  it("映射接受邀请失败错误", () => {
    expect(getLedgerInviteErrorMessage("accept_failed")).toBe(
      "加入账本失败，请稍后重试。",
    );
  });

  it.each([
    [
      "placeholder_invite_pending",
      "该待邀请成员已有一条有效邀请，请先撤销后再重新生成。",
    ],
    ["placeholder_not_found", "待邀请成员不存在或已删除。"],
    ["placeholder_already_claimed", "该待邀请成员已被认领。"],
    [
      "placeholder_claim_existing_member",
      "您已经是该账本的成员，不能通过此邀请接管待邀请成员的账户。",
    ],
    [
      "placeholder_claim_account_name_conflict",
      "要接管的账户与您名下已有账户同名（相同账户类型和货币），请联系账本管理员修改其中一个账户名称后再接受邀请。",
    ],
  ])("映射占位邀请错误 %s", (code, message) => {
    expect(getLedgerInviteErrorMessage(code)).toBe(message);
  });

  it("所有错误码都定义了安全文案", () => {
    for (const code of Object.values(ledgerInviteErrorCodes)) {
      expect(getLedgerInviteErrorMessage(code)).toEqual(expect.any(String));
    }
  });

  it.each([undefined, "", "unknown_error"])(
    "未知错误码 %s 不展示消息",
    (code) => {
      expect(getLedgerInviteErrorMessage(code)).toBeNull();
    },
  );
});
