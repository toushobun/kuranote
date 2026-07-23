// @vitest-environment node

import { describe, expect, it } from "vitest";

import { turnstileTokenMaxLength } from "internal/auth/entity/auth";
import {
  loginRequestSchema,
  registerRouteRequestSchema,
  requestRegisterOtpRequestSchema,
  sessionResponseSchema,
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
});
