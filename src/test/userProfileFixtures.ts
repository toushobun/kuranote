import type { GoogleIdentityStatus } from "internal/auth";
import type { UserLedgerDisplayName } from "internal/user";
import type {
  ChangePasswordAction,
  GoogleIdentityLinkAction,
  PasswordChangeOtpAction,
} from "types/auth";
import type { AvatarAction, DisplayNameAction } from "types/user";

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

export const succeededAvatarAction: AvatarAction = async () => ({
  success: "头像已更换。",
  successKey: crypto.randomUUID(),
});

export const failedAvatarAction: AvatarAction = async () => ({
  error: "头像上传失败，请稍后重试。",
  errorKey: crypto.randomUUID(),
});

export const passwordChangeOtpSentMessage = "验证码已发送，请查收邮件。";
export const passwordChangeOtpRateLimitedMessage =
  "验证码发送过于频繁，请稍后再试。";
export const changePasswordFailureMessage =
  "验证码错误或已过期（有效期 10 分钟），请检查后重新输入，或重新获取验证码。";

export const succeededPasswordChangeOtpAction: PasswordChangeOtpAction =
  async () => ({
    retryAfterSeconds: 60,
    success: passwordChangeOtpSentMessage,
    successKey: crypto.randomUUID(),
  });

export const rateLimitedPasswordChangeOtpAction: PasswordChangeOtpAction =
  async () => ({
    error: passwordChangeOtpRateLimitedMessage,
    errorKey: crypto.randomUUID(),
    retryAfterSeconds: 60,
  });

export const succeededChangePasswordAction: ChangePasswordAction =
  async () => ({
    success: "密码已修改。",
    successKey: crypto.randomUUID(),
  });

export const failedChangePasswordAction: ChangePasswordAction = async () => ({
  error: changePasswordFailureMessage,
  errorKey: crypto.randomUUID(),
});

export const googleIdentityEmail = "user.google@gmail.com";
export const googleOnlyLoginIdentityMessage =
  "Google 是当前账号唯一的登录身份，无法解除绑定。通过 Google 注册的账号即使已设置密码，也需要保留 Google 绑定。";
export const googleIdentityAlreadyExistsMessage =
  "该 Google 账号已被其他 KuraNote 账号使用，无法绑定到当前账号。请换一个 Google 账号再试。";
export const googleIdentityStartFailedMessage =
  "暂时无法连接 Google，请稍后再试。";
export const googleIdentityUnlinkFailedMessage = "解除绑定失败，请稍后再试。";

export const unlinkedGoogleIdentity: GoogleIdentityStatus = { linked: false };

export const unlinkableGoogleIdentity: GoogleIdentityStatus = {
  email: googleIdentityEmail,
  linked: true,
  unlinkDisabledReason: null,
};

export const googleOnlyIdentity: GoogleIdentityStatus = {
  email: googleIdentityEmail,
  linked: true,
  unlinkDisabledReason: googleOnlyLoginIdentityMessage,
};

/** Storybook 中模拟跳转前的等待：成功时实际会跳转到 Google 授权页。 */
export const pendingLinkGoogleIdentityAction: GoogleIdentityLinkAction = () =>
  new Promise(() => undefined);

export const failedLinkGoogleIdentityAction: GoogleIdentityLinkAction =
  async () => ({
    error: googleIdentityStartFailedMessage,
    errorKey: crypto.randomUUID(),
  });

export const succeededUnlinkGoogleIdentityAction: GoogleIdentityLinkAction =
  async () => ({
    success: "已解除 Google 绑定。",
    successKey: crypto.randomUUID(),
  });

export const failedUnlinkGoogleIdentityAction: GoogleIdentityLinkAction =
  async () => ({
    error: googleIdentityUnlinkFailedMessage,
    errorKey: crypto.randomUUID(),
  });
