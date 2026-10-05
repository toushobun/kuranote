import {
  passwordRuleMessage,
  registerValidationMessages,
} from "lib/validators/auth";

export const registerErrorMessages = {
  displayNameTooLong: registerValidationMessages.displayNameTooLong,
  duplicateEmail: "这个邮箱已经注册过了，请直接登录或换一个邮箱。",
  emailCheckRateLimited: "邮箱检查过于频繁，请稍后再试。",
  emailFormatInvalid: registerValidationMessages.emailFormatInvalid,
  emailRequired: "请输入邮箱。",
  emailTooLong: registerValidationMessages.emailTooLong,
  fallback: "注册失败，请确认邮箱和密码后再试。",
  fieldsRequired: "请输入昵称、邮箱和密码。",
  invalidEmail: "邮箱格式看起来不正确，请检查后再试。",
  passwordConfirmationMismatch:
    registerValidationMessages.passwordConfirmationMismatch,
  passwordConfirmTooLong: registerValidationMessages.passwordConfirmTooLong,
  passwordTooLong: registerValidationMessages.passwordTooLong,
  rateLimited: "注册请求太频繁了，请稍等一会儿再试。",
  serviceUnavailable: "注册服务暂时不可用，请稍后重试。",
  signupDisabled: "当前暂时无法开放新用户注册，请稍后再试。",
  weakPassword: `密码强度不足。${passwordRuleMessage}`,
} as const;

export const registerOtpMessages = {
  appUserSyncFailed: "注册资料同步异常，请稍后登录后再确认。",
  fieldsRequired: "请输入邮箱和验证码。",
  invalidOtp: "验证码不正确或已过期，请重新获取",
  otpFormatInvalid: registerValidationMessages.otpFormatInvalid,
  rateLimited: "验证码发送过于频繁，请稍后再试",
  resendFailed: "验证码发送失败，请稍后重试。",
  serviceError: "服务异常，请稍后再试",
  sessionInvalid: "登录状态无效，请重新登录。",
  success: "如果该邮箱可以注册，我们已发送验证码。请查收邮件。",
  tooManyAttempts: "验证码错误次数过多，请重新获取",
  turnstileFailed: "人机验证失败，请稍后重试",
  verifyServiceUnavailable: "验证码校验服务暂时不可用，请稍后重试。",
} as const;

/** 个人主页修改密码（邮箱验证码 + 新密码）流程的安全文案。 */
export const passwordChangeMessages = {
  emailUnavailable: "当前账号没有登录邮箱，无法发送验证码。",
  invalidOtp:
    "验证码错误或已过期（有效期 10 分钟），请检查后重新输入，或重新获取验证码。",
  otpFormatInvalid: "请输入 6 位数字验证码。",
  otpSendFailed: "验证码发送失败，请稍后再试。",
  otpSendRateLimited: "验证码发送过于频繁，请稍后再试。",
  otpVerifyRateLimited: "验证码尝试次数过多，请稍后再试。",
  passwordMismatch: "两次输入的新密码不一致。",
  passwordTooLong: registerErrorMessages.passwordTooLong,
  passwordUpdateFailed: "密码修改失败，请稍后再试。",
  samePassword: "新密码不能与当前密码相同，请重新获取验证码后再试。",
  sessionInvalid: "登录状态已失效，请重新登录。",
  userMismatch: "验证码与当前登录账号不一致，密码未修改。请重新登录后再试。",
  weakPassword: registerErrorMessages.weakPassword,
} as const;

/** 个人主页 Google 账号绑定 / 解除绑定流程的安全文案。 */
export const googleIdentityLinkMessages = {
  alreadyLinked: "当前账号已绑定 Google，请刷新页面后查看。",
  callbackFailed: "Google 账号绑定未完成，请稍后重试。",
  cancelled: "已取消 Google 授权，账号未绑定。",
  emailConflict: "解除绑定后账号邮箱会与其他账号冲突，暂时无法解除绑定。",
  identityAlreadyExists:
    "该 Google 账号已被其他 KuraNote 账号使用，无法绑定到当前账号。请换一个 Google 账号再试。",
  notLinked: "当前账号未绑定 Google，请刷新页面后查看。",
  onlyLoginIdentity:
    "Google 是当前账号唯一的登录身份，无法解除绑定。通过 Google 注册的账号即使已设置密码，也需要保留 Google 绑定。",
  sessionInvalid: passwordChangeMessages.sessionInvalid,
  startFailed: "暂时无法连接 Google，请稍后再试。",
  statusLoadFailed: "账号绑定状态读取失败，请稍后重试。",
  unavailable: "Google 账号绑定暂未开放。",
  unlinkFailed: "解除绑定失败，请稍后再试。",
} as const;

/** 邮箱密码登录流程的安全文案。 */
export const loginErrorMessages = {
  fieldsRequired: "请输入邮箱和密码。",
  invalidCredentials: "邮箱或密码不正确。",
  serviceUnavailable: "登录服务暂时不可用，请稍后重试。",
} as const;

/** 读取当前登录用户失败时的文案，登录、注册、修改密码与 Google 绑定共用。 */
export const authSessionErrorMessages = {
  loadFailed: "登录状态读取失败，请稍后重试。",
} as const;

/** 注册验证码发送、校验与邮箱检查的安全记录读写失败时的文案。 */
export const authSecurityErrorMessages = {
  attemptRecordFailed: "认证安全记录写入失败，请稍后重试。",
  attemptRowsInvalid: "认证安全记录格式异常，请稍后重试。",
  availabilityCheckLoadFailed: "邮箱检查记录读取失败，请稍后重试。",
  emailCheckFailed: "邮箱可用性检查失败，请稍后重试。",
  sendRecordInvalid: "验证码发送记录格式异常，请稍后重试。",
  sendRecordLoadFailed: "验证码发送记录读取失败，请稍后重试。",
  verifyFailureCountFailed: "验证码校验记录读取失败，请稍后重试。",
} as const;

/** Google 登录 / 注册发起与 OAuth 回调处理失败时的文案。 */
export const googleOAuthErrorMessages = {
  callbackFailed: "Google 登录回调处理失败，请稍后重试。",
  startUnavailable: "Google 登录暂时不可用，请稍后重试。",
} as const;

/** 注册人机验证（Cloudflare Turnstile）服务不可用时的文案。 */
export const turnstileErrorMessages = {
  serviceUnavailable: "安全验证服务暂时不可用，请稍后重试。",
} as const;
