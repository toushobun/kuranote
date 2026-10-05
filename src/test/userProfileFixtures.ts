import {
  formatLedgerDisplayNameConflictMessage,
  userErrorMessages,
} from "internal/user";
import {
  googleIdentityLinkMessages,
  passwordChangeMessages,
} from "internal/auth";
import type { GoogleIdentityStatus } from "internal/auth";
import {
  createErrorState,
  createSuccessState,
} from "internal/shared/adapter/next/actionState";
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
  formatLedgerDisplayNameConflictMessage([
    { code: "display_name_placeholder_conflict", ledgerName: "北海道旅行" },
  ]);

export const succeededDisplayNameAction: DisplayNameAction = async () =>
  createSuccessState("昵称已保存。");

export const failedDisplayNameAction: DisplayNameAction = async () =>
  createErrorState(displayNameConflictMessage);

export const succeededAvatarAction: AvatarAction = async () =>
  createSuccessState("头像已更换。");

export const failedAvatarAction: AvatarAction = async () =>
  createErrorState(userErrorMessages.avatarUploadFailed);

export const passwordChangeOtpSentMessage = "验证码已发送，请查收邮件。";
export const passwordChangeOtpRateLimitedMessage =
  passwordChangeMessages.otpSendRateLimited;
export const changePasswordFailureMessage = passwordChangeMessages.invalidOtp;

export const succeededPasswordChangeOtpAction: PasswordChangeOtpAction =
  async () => ({
    ...createSuccessState(passwordChangeOtpSentMessage),
    retryAfterSeconds: 60,
  });

export const rateLimitedPasswordChangeOtpAction: PasswordChangeOtpAction =
  async () => ({
    ...createErrorState(passwordChangeOtpRateLimitedMessage),
    retryAfterSeconds: 60,
  });

export const succeededChangePasswordAction: ChangePasswordAction = async () =>
  createSuccessState("密码已修改。");

export const failedChangePasswordAction: ChangePasswordAction = async () =>
  createErrorState(changePasswordFailureMessage);

export const googleIdentityEmail = "user.google@gmail.com";
export const googleOnlyLoginIdentityMessage =
  googleIdentityLinkMessages.onlyLoginIdentity;
export const googleIdentityAlreadyExistsMessage =
  googleIdentityLinkMessages.identityAlreadyExists;
export const googleIdentityStartFailedMessage =
  googleIdentityLinkMessages.startFailed;
export const googleIdentityUnlinkFailedMessage =
  googleIdentityLinkMessages.unlinkFailed;

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
  async () => createErrorState(googleIdentityStartFailedMessage);

export const succeededUnlinkGoogleIdentityAction: GoogleIdentityLinkAction =
  async () => createSuccessState("已解除 Google 绑定。");

export const failedUnlinkGoogleIdentityAction: GoogleIdentityLinkAction =
  async () => createErrorState(googleIdentityUnlinkFailedMessage);
