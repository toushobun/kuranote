export const displayNameMaxLength = 50;
export const emailMaxLength = 255;
export const passwordMaxLength = 72;
export const passwordRuleMessage =
  "密码至少 8 位，并且需要同时包含字母和数字。";
export const passwordRuleText = "8-72 位，且包含字母和数字";

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
