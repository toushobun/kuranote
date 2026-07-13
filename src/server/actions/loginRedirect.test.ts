import { beforeEach, describe, expect, it, vi } from "vitest";

import { isSafeNextPath } from "lib/navigation/safeNextPath";
import {
  loginWithRedirect,
  submitRegisterOtpWithRedirect,
} from "server/actions/loginRedirect";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  signInWithPassword: vi.fn(),
  submitRegisterOtp: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("server/actions/auth", () => ({
  submitRegisterOtp: mocks.submitRegisterOtp,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createClient.mockResolvedValue({
    auth: { signInWithPassword: mocks.signInWithPassword },
  });
  mocks.signInWithPassword.mockResolvedValue({ error: null });
});

describe("isSafeNextPath", () => {
  it.each([
    ["/invite/invite-token", true],
    ["/dashboard", true],
    ["//evil.example", false],
    ["https://evil.example", false],
    ["/invite\\evil", false],
    ["/\tevil.example", false],
    ["/\nevil.example", false],
    ["/\revil.example", false],
    ["/\u0000evil.example", false],
    ["/%09/evil.example", false],
    ["/%0A/evil.example", false],
    ["/%0D/evil.example", false],
    ["", false],
  ])("%s 的安全判断为 %s", (value, expected) => {
    expect(isSafeNextPath(value)).toBe(expected);
  });
});

describe("loginWithRedirect", () => {
  function createLoginFormData() {
    const formData = new FormData();
    formData.set("email", "user@example.test");
    formData.set("password", "password-1234");
    return formData;
  }

  it("登录成功后返回邀请页", async () => {
    await expect(
      loginWithRedirect(
        "/invite/invite-token",
        {} as never,
        createLoginFormData(),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/invite/invite-token");
  });

  it("不安全回跳地址会退回首页", async () => {
    await expect(
      loginWithRedirect("//evil.example", {} as never, createLoginFormData()),
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard");
  });

  it("登录失败时返回错误且不跳转", async () => {
    mocks.signInWithPassword.mockResolvedValue({ error: new Error("invalid") });

    await expect(
      loginWithRedirect(
        "/invite/invite-token",
        {} as never,
        createLoginFormData(),
      ),
    ).resolves.toEqual({ error: "邮箱或密码不正确。" });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

describe("submitRegisterOtpWithRedirect", () => {
  it("注册成功后写入邀请页回跳地址", async () => {
    mocks.submitRegisterOtp.mockResolvedValue({ status: "success" });

    await expect(
      submitRegisterOtpWithRedirect(
        "/invite/invite-token",
        {} as never,
        new FormData(),
      ),
    ).resolves.toEqual({
      redirectTo: "/invite/invite-token",
      status: "success",
    });
  });

  it("不安全回跳地址会退回首页", async () => {
    mocks.submitRegisterOtp.mockResolvedValue({ status: "success" });

    await expect(
      submitRegisterOtpWithRedirect(
        "https://evil.example",
        {} as never,
        new FormData(),
      ),
    ).resolves.toEqual({ redirectTo: "/dashboard", status: "success" });
  });

  it("OTP 失败时原样返回错误状态", async () => {
    const failure = { error: "验证码错误", status: "error" };
    mocks.submitRegisterOtp.mockResolvedValue(failure);

    await expect(
      submitRegisterOtpWithRedirect(
        "/invite/invite-token",
        {} as never,
        new FormData(),
      ),
    ).resolves.toBe(failure);
  });
});
