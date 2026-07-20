export const googleAuthNextPathMaxLength = 2048;
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
