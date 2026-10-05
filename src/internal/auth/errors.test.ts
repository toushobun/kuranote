import { describe, expect, it } from "vitest";

import {
  passwordChangeMessages,
  registerErrorMessages,
} from "internal/auth/errors";

describe("auth errors", () => {
  it("由上限常量拼出的文案与实际显示内容一致", () => {
    expect(registerErrorMessages.displayNameTooLong).toBe(
      "昵称最多 50 个字符。",
    );
    expect(registerErrorMessages.emailTooLong).toBe("邮箱最多 255 个字符。");
    expect(registerErrorMessages.passwordConfirmTooLong).toBe(
      "确认密码最多 72 个字符。",
    );
    expect(registerErrorMessages.passwordTooLong).toBe("密码最多 72 个字符。");
    expect(passwordChangeMessages.passwordTooLong).toBe("密码最多 72 个字符。");
  });

  it("由密码规则常量拼出的弱密码文案与实际显示内容一致", () => {
    expect(registerErrorMessages.weakPassword).toBe(
      "密码强度不足。密码至少 8 位，并且需要同时包含字母和数字。",
    );
    expect(passwordChangeMessages.weakPassword).toBe(
      "密码强度不足。密码至少 8 位，并且需要同时包含字母和数字。",
    );
  });
});
