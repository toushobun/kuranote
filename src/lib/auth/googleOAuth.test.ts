import { describe, expect, it } from "vitest";

import {
  getGoogleAuthErrorMessage,
  getGoogleAuthSource,
  getSafeGoogleAuthNextPath,
  googleAuthErrorCodes,
  googleAuthFailureHref,
  googleAuthSources,
} from "lib/auth/googleOAuth";

describe("googleOAuth", () => {
  it("注册来源会保持为注册页", () => {
    expect(getGoogleAuthSource("register")).toBe(googleAuthSources.register);
  });

  it("未知来源会回退到登录页", () => {
    expect(getGoogleAuthSource("unknown")).toBe(googleAuthSources.login);
  });

  it("只返回已知错误文案", () => {
    expect(getGoogleAuthErrorMessage("cancelled")).toContain("已取消");
    expect(getGoogleAuthErrorMessage("raw-provider-error")).toBeUndefined();
  });

  it.each(["toString", "constructor", "__proto__"])(
    "原型链属性 %s 不会被当作错误码",
    (errorCode) => {
      expect(getGoogleAuthErrorMessage(errorCode)).toBeUndefined();
    },
  );

  it("安全的邀请地址会被保留", () => {
    expect(getSafeGoogleAuthNextPath("/invite/token-123")).toBe(
      "/invite/token-123",
    );
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/invite\\evil.example",
    "",
  ])("不安全回跳地址 %s 会退回首页", (nextPath) => {
    expect(getSafeGoogleAuthNextPath(nextPath)).toBe("/dashboard");
  });

  it("失败地址会保留安全回跳目标", () => {
    expect(
      googleAuthFailureHref(
        googleAuthSources.register,
        googleAuthErrorCodes.callbackFailed,
        "/invite/token-123",
      ),
    ).toBe("/register?authError=callback_failed&next=%2Finvite%2Ftoken-123");
  });
});
