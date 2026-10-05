export const displayNameMaxLength = 50;
export const emailMaxLength = 255;
export const passwordMaxLength = 72;
export const passwordRuleMessage =
  "密码至少 8 位，并且需要同时包含字母和数字。";
export const passwordRuleText = "8-72 位，且包含字母和数字";

/** 注册表单校验文案，浏览器端表单与服务端注册校验共用。 */
export const registerValidationMessages = {
  displayNameTooLong: `昵称最多 ${displayNameMaxLength} 个字符。`,
  emailFormatInvalid: "邮箱格式有误",
  emailTooLong: `邮箱最多 ${emailMaxLength} 个字符。`,
  otpFormatInvalid: "请输入 6 位数字验证码",
  passwordConfirmationMismatch: "两次输入的密码不一致。",
  passwordConfirmTooLong: `确认密码最多 ${passwordMaxLength} 个字符。`,
  passwordTooLong: `密码最多 ${passwordMaxLength} 个字符。`,
} as const;

export function isValidRegisterPassword(password: string) {
  return (
    password.length >= 8 &&
    password.length <= passwordMaxLength &&
    /[A-Za-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

export function isValidEmailFormat(email: string) {
  const atIndex = email.indexOf("@");
  const dotIndex = email.lastIndexOf(".");

  return atIndex > 0 && dotIndex > atIndex + 1 && dotIndex < email.length - 1;
}
