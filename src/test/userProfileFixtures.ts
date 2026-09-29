import type { UserLedgerDisplayName } from "internal/user";
import type { DisplayNameAction } from "types/user";

/** 个人主页相关组件的测试与 Storybook 共用数据。 */
export const familyLedgerId = "00000000-0000-4000-8000-000000000101";
export const companyLedgerId = "00000000-0000-4000-8000-000000000102";
export const tripLedgerId = "00000000-0000-4000-8000-000000000103";

export const profileLedgerDisplayNames: UserLedgerDisplayName[] = [
  { displayName: "爸爸", ledgerId: familyLedgerId, ledgerName: "家庭账本" },
  { displayName: "淞文", ledgerId: companyLedgerId, ledgerName: "公司报销" },
  { displayName: "淞文", ledgerId: tripLedgerId, ledgerName: "北海道旅行" },
];

export const profileFixture = {
  avatarUrl: null,
  displayName: "淞文",
  email: "user@example.com",
};

export const displayNameConflictMessage =
  "以下账本无法使用该昵称，昵称未修改。「北海道旅行」：账本中已有同名的待邀请成员。请更换昵称，或取消勾选这些账本。";

export const succeededDisplayNameAction: DisplayNameAction = async () => ({
  success: "昵称已保存。",
  successKey: crypto.randomUUID(),
});

export const failedDisplayNameAction: DisplayNameAction = async () => ({
  error: displayNameConflictMessage,
  errorKey: crypto.randomUUID(),
});
