import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  hashAuthOtpEmail,
  hashAuthOtpIp,
  hashAuthOtpValue,
  normalizeAuthOtpEmail,
  normalizeAuthOtpIp,
} from "./otpHash";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

describe("auth OTP hash", () => {
  it("邮箱 hash 前会去除首尾空白并转成小写", () => {
    expect(normalizeAuthOtpEmail("  USER@Example.COM  ")).toBe(
      "user@example.com",
    );
    expect(hashAuthOtpEmail("  USER@Example.COM  ")).toBe(
      sha256("user@example.com"),
    );
  });

  it("相同标准化输入每次生成一致的 hash", () => {
    expect(hashAuthOtpValue("same-value")).toBe(hashAuthOtpValue("same-value"));
  });

  it("IP 优先使用 Vercel 转发头", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10",
      "x-real-ip": "198.51.100.20",
      "x-vercel-forwarded-for": "192.0.2.30",
    });

    expect(normalizeAuthOtpIp(headers)).toBe("192.0.2.30");
    expect(hashAuthOtpIp(headers)).toBe(sha256("192.0.2.30"));
  });

  it("IP 优先使用 x-forwarded-for 的最后一个非空值", () => {
    const headers = new Headers({
      "x-forwarded-for": " , 203.0.113.10, 203.0.113.11",
      "x-real-ip": "198.51.100.20",
    });

    expect(normalizeAuthOtpIp(headers)).toBe("203.0.113.11");
    expect(hashAuthOtpIp(headers)).toBe(sha256("203.0.113.11"));
  });

  it("没有 x-forwarded-for 时使用 x-real-ip", () => {
    const headers = new Headers({
      "x-real-ip": " 198.51.100.20 ",
    });

    expect(normalizeAuthOtpIp(headers)).toBe("198.51.100.20");
  });

  it("没有可用 IP 时返回 null", () => {
    const headers = new Headers({
      "x-forwarded-for": " , ",
      "x-real-ip": " ",
    });

    expect(normalizeAuthOtpIp(headers)).toBeNull();
    expect(hashAuthOtpIp(headers)).toBeNull();
  });
});
