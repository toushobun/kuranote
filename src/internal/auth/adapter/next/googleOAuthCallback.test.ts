// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { googleAuthNextPathMaxLength } from "lib/auth/googleOAuth";
import { handleGoogleOAuthCallback } from "internal/auth/adapter/next/googleOAuthCallback";
import { RepositoryError } from "internal/shared/errors/appError";

const mocks = vi.hoisted(() => ({
  completeGoogleAuth: vi.fn(),
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
}));

vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));
vi.mock("internal/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createServerRequestDependencies.mockResolvedValue({});
  mocks.createRequestContainer.mockReturnValue({
    auth: { service: { completeGoogleAuth: mocks.completeGoogleAuth } },
  });
  mocks.completeGoogleAuth.mockResolvedValue("/invite/token-123");
});

describe("handleGoogleOAuthCallback", () => {
  it("把 callback 参数交给 Auth Service 并按返回路径重定向", async () => {
    const response = await handleGoogleOAuthCallback(
      new Request(
        "https://kuranote.test/auth/callback?code=code-123&source=register&next=%2Finvite%2Ftoken-123",
      ),
    );

    expect(mocks.completeGoogleAuth).toHaveBeenCalledWith({
      code: "code-123",
      nextPath: "/invite/token-123",
      providerError: null,
      source: "register",
    });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://kuranote.test/invite/token-123",
    );
  });

  it("不安全 nextPath 在进入 Service 前规范化为首页", async () => {
    await handleGoogleOAuthCallback(
      new Request(
        "https://kuranote.test/auth/callback?code=code-123&next=https%3A%2F%2Fevil.example",
      ),
    );

    expect(mocks.completeGoogleAuth).toHaveBeenCalledWith(
      expect.objectContaining({ nextPath: "/dashboard" }),
    );
  });

  it("超长 nextPath 在进入 Service 前规范化为首页", async () => {
    const callbackUrl = new URL("https://kuranote.test/auth/callback");
    callbackUrl.searchParams.set("code", "code-123");
    callbackUrl.searchParams.set(
      "next",
      `/${"x".repeat(googleAuthNextPathMaxLength)}`,
    );

    await handleGoogleOAuthCallback(new Request(callbackUrl));

    expect(mocks.completeGoogleAuth).toHaveBeenCalledWith(
      expect.objectContaining({ nextPath: "/dashboard" }),
    );
  });

  it("Service 应用错误时返回固定 callback_failed 页面且不暴露异常", async () => {
    mocks.completeGoogleAuth.mockRejectedValue(
      new RepositoryError("oauth_exchange_failed", "private provider details"),
    );

    const response = await handleGoogleOAuthCallback(
      new Request(
        "https://kuranote.test/auth/callback?code=sensitive-code&source=login&next=%2Fdashboard",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://kuranote.test/login?authError=callback_failed&next=%2Fdashboard",
    );
  });

  it("普通异常也返回固定失败页且不记录原始消息", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.createServerRequestDependencies.mockRejectedValue(
      new Error("private dependency details"),
    );

    const response = await handleGoogleOAuthCallback(
      new Request(
        "https://kuranote.test/auth/callback?code=sensitive-code&source=login&next=%2Fdashboard",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://kuranote.test/login?authError=callback_failed&next=%2Fdashboard",
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "private dependency details",
    );
    consoleError.mockRestore();
  });
});
