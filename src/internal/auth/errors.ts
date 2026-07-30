import { passwordRuleMessage } from "lib/validators/auth";

export const registerErrorMessages = {
  duplicateEmail: "这个邮箱已经注册过了，请直接登录或换一个邮箱。",
  invalidEmail: "邮箱格式看起来不正确，请检查后再试。",
  weakPassword: `密码强度不足。${passwordRuleMessage}`,
  signupDisabled: "当前暂时无法开放新用户注册，请稍后再试。",
  rateLimited: "注册请求太频繁了，请稍等一会儿再试。",
  fallback: "注册失败，请确认邮箱和密码后再试。",
  emailCheckRateLimited: "邮箱检查过于频繁，请稍后再试。",
} as const;

export const registerOtpMessages = {
  appUserSyncFailed: "注册资料同步异常，请稍后登录后再确认。",
  invalidOtp: "验证码不正确或已过期，请重新获取",
  rateLimited: "验证码发送过于频繁，请稍后再试",
  serviceError: "服务异常，请稍后再试",
  success: "如果该邮箱可以注册，我们已发送验证码。请查收邮件。",
  tooManyAttempts: "验证码错误次数过多，请重新获取",
  turnstileFailed: "人机验证失败，请稍后重试",
} as const;
