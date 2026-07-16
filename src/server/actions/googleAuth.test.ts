import { beforeEach, describe, expect, it, vi } from "vitest";

import { startGoogleAuth } from "server/actions/googleAuth";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  headers: vi.fn(),
  isGoogleAuthEnabled: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  signInWithOAuth: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("server/auth/googleAuthConfig", () => ({
  isGoogleAuthEnabled: mocks.isGoogleAuthEnabled,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isGoogleAuthEnabled.mockReturnValue(true);
  mocks.headers.mockResolvedValue(
    new Headers({ origin: "https://kuranote.test" }),
  );
  mocks.createClient.mockResolvedValue({
    auth: { signInWithOAuth: mocks.signInWithOAuth },
  });
  mocks.signInWithOAuth.mockResolvedValue({
    data: { url: "https://accounts.google.test/oauth" },
    error: null,
  });
});

describe("startGoogleAuth", () => {
  it("使用安全回跳地址发起 Google OAuth", async () => {
    await expect(startGoogleAuth("login", "/invite/token-123")).rejects.toThrow(
      "NEXT_REDIRECT:https://accounts.google.test/oauth",
    );

    expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo:
          "https://kuranote.test/auth/callback?source=login&next=%2Finvite%2Ftoken-123",
      },
    });
  });

  it("未启用 Google OAuth 时不调用 Supabase", async () => {
    mocks.isGoogleAuthEnabled.mockReturnValue(false);

    await expect(startGoogleAuth("login", "/dashboard")).rejects.toThrow(
      "NEXT_REDIRECT:/login?authError=start_failed&next=%2Fdashboard",
    );
    expect(mocks.headers).not.toHaveBeenCalled();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("不安全回跳地址会改为首页", async () => {
    await expect(
      startGoogleAuth("register", "https://evil.example"),
    ).rejects.toThrow("NEXT_REDIRECT:https://accounts.google.test/oauth");

    expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo:
          "https://kuranote.test/auth/callback?source=register&next=%2Fdashboard",
      },
    });
  });

  it("provider 返回错误时返回原认证页面", async () => {
    mocks.signInWithOAuth.mockResolvedValue({
      data: { url: null },
      error: new Error("provider unavailable"),
    });

    await expect(
      startGoogleAuth("register", "/invite/token-123"),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/register?authError=start_failed&next=%2Finvite%2Ftoken-123",
    );
  });

  it("provider 调用抛异常时记录日志并返回固定错误页", async () => {
    const error = new Error("service unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.signInWithOAuth.mockRejectedValue(error);

    await expect(startGoogleAuth("login", "/dashboard")).rejects.toThrow(
      "NEXT_REDIRECT:/login?authError=start_failed&next=%2Fdashboard",
    );
    expect(consoleError).toHaveBeenCalledWith("startGoogleAuth failed", error);

    consoleError.mockRestore();
  });

  it.each([
    ["缺少 Origin", new Headers()],
    [
      "包含路径的 Origin",
      new Headers({ origin: "https://kuranote.test/forged" }),
    ],
    [
      "包含凭据的 Origin",
      new Headers({ origin: "https://user:password@kuranote.test" }),
    ],
  ])("%s 时不调用 Supabase", async (_name, requestHeaders) => {
    mocks.headers.mockResolvedValue(requestHeaders);

    await expect(startGoogleAuth("login", "/dashboard")).rejects.toThrow(
      "NEXT_REDIRECT:/login?authError=start_failed&next=%2Fdashboard",
    );
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
