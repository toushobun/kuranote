// @vitest-environment node

import { describe, expect, it } from "vitest";

import { googleAuthNextPathMaxLength } from "lib/auth/googleOAuth";
import { passwordMaxLength } from "lib/validators/auth";
import { turnstileTokenMaxLength } from "internal/auth/entity/auth";
import { passwordChangeMessages } from "internal/auth/errors";
import {
  changePasswordRequestSchema,
  loginRequestSchema,
  registerRouteRequestSchema,
  requestRegisterOtpRequestSchema,
  sessionResponseSchema,
  startGoogleAuthRequestSchema,
  submitRegisterOtpRequestSchema,
} from "internal/auth/schema";

describe("auth schema", () => {
  it("登录邮箱会 trim，但密码保持原值", () => {
    expect(
      loginRequestSchema.parse({
        email: "  user@example.test  ",
        password: " password-1234 ",
      }),
    ).toEqual({
      email: "user@example.test",
      password: " password-1234 ",
    });
  });

  it("直接注册契约必须携带 Turnstile token", () => {
    expect(
      registerRouteRequestSchema.safeParse({
        displayName: "山田太郎",
        email: "user@example.test",
        password: "password-1234",
        passwordConfirm: "password-1234",
      }).success,
    ).toBe(false);
  });

  it("Turnstile token 超过官方长度上限时拒绝请求", () => {
    const oversizedToken = "x".repeat(turnstileTokenMaxLength + 1);

    expect(
      registerRouteRequestSchema.safeParse({
        displayName: "山田太郎",
        email: "user@example.test",
        password: "password-1234",
        passwordConfirm: "password-1234",
        turnstileToken: oversizedToken,
      }).success,
    ).toBe(false);
    expect(
      requestRegisterOtpRequestSchema.safeParse({
        email: "user@example.test",
        turnstileToken: oversizedToken,
      }).success,
    ).toBe(false);
  });

  it("OTP 重发契约只要求邮箱和 Turnstile token", () => {
    expect(
      requestRegisterOtpRequestSchema.parse({
        email: "user@example.test",
        turnstileToken: "token",
      }),
    ).toEqual({
      email: "user@example.test",
      turnstileToken: "token",
    });
  });

  it("OTP 校验只接受 6 位数字", () => {
    expect(
      submitRegisterOtpRequestSchema.safeParse({
        email: "user@example.test",
        token: "12345a",
      }).success,
    ).toBe(false);
  });

  it("Session 响应保持 authenticated 与 user 一致", () => {
    expect(
      sessionResponseSchema.safeParse({ authenticated: false, user: null })
        .success,
    ).toBe(true);
    expect(
      sessionResponseSchema.safeParse({
        authenticated: false,
        user: { displayName: null, email: null, id: crypto.randomUUID() },
      }).success,
    ).toBe(false);
  });

  it("Google OAuth nextPath 接受上限长度并拒绝超长路径", () => {
    const maxLengthNextPath = `/${"x".repeat(googleAuthNextPathMaxLength - 1)}`;
    const oversizedNextPath = `/${"x".repeat(googleAuthNextPathMaxLength)}`;

    expect(
      startGoogleAuthRequestSchema.safeParse({
        nextPath: maxLengthNextPath,
        source: "login",
      }).success,
    ).toBe(true);
    expect(
      startGoogleAuthRequestSchema.safeParse({
        nextPath: oversizedNextPath,
        source: "login",
      }).success,
    ).toBe(false);
  });

  describe("changePasswordRequestSchema", () => {
    const validInput = {
      password: "newpass123",
      passwordConfirm: "newpass123",
      token: " 123456 ",
    };

    function firstIssueMessage(input: Record<string, string>) {
      const result = changePasswordRequestSchema.safeParse({
        ...validInput,
        ...input,
      });
      return result.success ? null : result.error.issues[0]?.message;
    }

    it("验证码 trim 后通过，密码保持原值", () => {
      expect(changePasswordRequestSchema.parse(validInput)).toEqual({
        password: "newpass123",
        passwordConfirm: "newpass123",
        token: "123456",
      });
    });

    it("验证码不是 6 位数字时返回中文提示", () => {
      expect(firstIssueMessage({ token: "12345a" })).toBe(
        passwordChangeMessages.otpFormatInvalid,
      );
    });

    it("新密码沿用注册时的密码规则", () => {
      expect(
        firstIssueMessage({
          password: "abcdefgh",
          passwordConfirm: "abcdefgh",
        }),
      ).toBe(passwordChangeMessages.weakPassword);
      expect(
        firstIssueMessage({ password: "abc1234", passwordConfirm: "abc1234" }),
      ).toBe(passwordChangeMessages.weakPassword);
    });

    it("新密码超过上限时提示长度", () => {
      const tooLong = `a1${"x".repeat(passwordMaxLength - 1)}`;

      expect(
        firstIssueMessage({ password: tooLong, passwordConfirm: tooLong }),
      ).toBe(passwordChangeMessages.passwordTooLong);
    });

    it("两次输入的新密码不一致时提示", () => {
      expect(firstIssueMessage({ passwordConfirm: "newpass124" })).toBe(
        passwordChangeMessages.passwordMismatch,
      );
    });
  });
});
