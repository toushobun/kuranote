import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  isGoogleAuthEnabled: vi.fn(),
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
  mocks.createClient.mockResolvedValue({
    auth: { exchangeCodeForSession: mocks.exchangeCodeForSession },
  });
  mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
});

describe("Google OAuth callback", () => {
  it("授权成功后返回邀请页面", async () => {
    const response = await GET(
      new Request(
        "https://kuranote.test/auth/callback?code=code-123&source=login&next=%2Finvite%2Ftoken-123",
      ),
    );

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("code-123");
    expect(response.headers.get("location")).toBe(
      "https://kuranote.test/invite/token-123",
    );
  });

  it("未启用 Google OAuth 时拒绝 callback", async () => {
    mocks.isGoogleAuthEnabled.mockReturnValue(false);

    const response = await GET(
      new Request(
        "https://kuranote.test/auth/callback?code=code-123&source=login&next=%2Fdashboard",
      ),
    );

    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://kuranote.test/login?authError=start_failed&next=%2Fdashboard",
    );
  });

  it("不安全回跳地址会退回首页", async () => {
    const response = await GET(
      new Request(
        "https://kuranote.test/auth/callback?code=code-123&next=https%3A%2F%2Fevil.example",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://kuranote.test/dashboard",
    );
  });

  it("用户取消授权时返回原登录页并显示固定错误码", async () => {
    const response = await GET(
      new Request(
        "https://kuranote.test/auth/callback?error=access_denied&source=login&next=%2Finvite%2Ftoken-123",
      ),
    );

    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://kuranote.test/login?authError=cancelled&next=%2Finvite%2Ftoken-123",
    );
  });

  it("未知 provider 错误不会暴露原始内容", async () => {
    const response = await GET(
      new Request(
        "https://kuranote.test/auth/callback?error=provider_internal_details&source=login&next=%2Fdashboard",
      ),
    );

    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://kuranote.test/login?authError=callback_failed&next=%2Fdashboard",
    );
  });

  it("缺少授权 code 时返回固定错误页", async () => {
    const response = await GET(
      new Request(
        "https://kuranote.test/auth/callback?source=register&next=%2Fdashboard",
      ),
    );

    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://kuranote.test/register?authError=callback_failed&next=%2Fdashboard",
    );
  });

  it("code 换取 session 失败时返回注册页", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      error: new Error("invalid code"),
    });

    const response = await GET(
      new Request(
        "https://kuranote.test/auth/callback?code=invalid&source=register&next=%2Fdashboard",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://kuranote.test/register?authError=callback_failed&next=%2Fdashboard",
    );
  });

  it("Supabase 客户端异常时记录日志并返回固定错误页", async () => {
    const error = new Error("service unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.createClient.mockRejectedValue(error);

    const response = await GET(
      new Request(
        "https://kuranote.test/auth/callback?code=code-123&source=login&next=%2Fdashboard",
      ),
    );

    expect(consoleError).toHaveBeenCalledWith(
      "googleOAuthCallback failed",
      error,
    );
    expect(response.headers.get("location")).toBe(
      "https://kuranote.test/login?authError=callback_failed&next=%2Fdashboard",
    );

    consoleError.mockRestore();
  });

  it("session 兑换抛异常时记录日志且不输出授权 code", async () => {
    const error = new Error("exchange unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.exchangeCodeForSession.mockRejectedValue(error);

    const response = await GET(
      new Request(
        "https://kuranote.test/auth/callback?code=sensitive-code&source=login&next=%2Fdashboard",
      ),
    );

    expect(consoleError).toHaveBeenCalledWith(
      "googleOAuthCallback failed",
      error,
    );
    expect(consoleError.mock.calls.flat().map(String).join(" ")).not.toContain(
      "sensitive-code",
    );
    expect(response.headers.get("location")).toBe(
      "https://kuranote.test/login?authError=callback_failed&next=%2Fdashboard",
    );

    consoleError.mockRestore();
  });
});
