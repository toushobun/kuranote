export const turnstileTokenMaxLength = 2048;

export type AuthUser = {
  displayName: string | null;
  email: string | null;
  id: string;
};

export type RegisterFailureReason =
  | "duplicate_email"
  | "invalid_email"
  | "weak_password"
  | "signup_disabled"
  | "rate_limited"
  | "failed";

export type AuthOtpPurpose = "signup";

export type AuthOtpAttemptType =
  | "send"
  | "verify_failure"
  | "availability_check";

export type AuthOtpAttemptResult = "success" | "blocked" | "failed";

export type AuthOtpAttempt = {
  attemptType: AuthOtpAttemptType;
  emailHash: string;
  ipHash: string;
  purpose: AuthOtpPurpose;
  result: AuthOtpAttemptResult;
};

export type AuthSession =
  | { authenticated: false; user: null }
  | { authenticated: true; user: AuthUser };

/**
 * 个人主页的 Google 绑定状态。unlinkDisabledReason 为 null 时允许解除绑定，
 * 否则是可直接展示的禁用原因。
 */
export type GoogleIdentityStatus =
  | { linked: false }
  | { email: string | null; linked: true; unlinkDisabledReason: string | null };

/** Google 绑定 OAuth 回跳到个人主页后需要展示的结果反馈。 */
export type GoogleIdentityLinkFeedback =
  | { kind: "success" }
  | { kind: "failure"; message: string };
