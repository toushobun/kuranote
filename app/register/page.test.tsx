import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RegisterRoute from "./page";

const mocks = vi.hoisted(() => ({
  checkRegisterEmailAvailability: vi.fn(),
  getGoogleAuthErrorMessage: vi.fn(),
  getTurnstileSiteKey: vi.fn(() => "test-site-key"),
  isGoogleAuthEnabled: vi.fn(),
  redirectIfAuthenticated: vi.fn(),
  requestRegisterOtp: vi.fn(),
  startGoogleAuth: vi.fn(),
  submitRegisterOtpWithRedirect: vi.fn(),
}));

vi.mock("lib/auth/googleOAuth", () => ({
  getGoogleAuthErrorMessage: mocks.getGoogleAuthErrorMessage,
}));

vi.mock("server/auth/adapter/next/actions", () => ({
  checkRegisterEmailAvailability: mocks.checkRegisterEmailAvailability,
  requestRegisterOtp: mocks.requestRegisterOtp,
  startGoogleAuth: mocks.startGoogleAuth,
  submitRegisterOtpWithRedirect: mocks.submitRegisterOtpWithRedirect,
}));

vi.mock("server/auth/googleAuthConfig", () => ({
  isGoogleAuthEnabled: mocks.isGoogleAuthEnabled,
}));

vi.mock("server/auth/turnstileKeys", () => ({
  getTurnstileSiteKey: mocks.getTurnstileSiteKey,
}));

vi.mock("server/auth/adapter/next/session", () => ({
  redirectIfAuthenticated: mocks.redirectIfAuthenticated,
}));

vi.mock("templates/register/Register", () => ({
  RegisterTemplate: ({
    googleAction,
    googleErrorMessage,
    loginHref,
    turnstileSiteKey,
  }: {
    googleAction?: unknown;
    googleErrorMessage?: string;
    loginHref: string;
    turnstileSiteKey: string;
  }) => (
    <div>
      <span data-testid="google-action">{typeof googleAction}</span>
      <span data-testid="google-error">{googleErrorMessage}</span>
      <a href={loginHref}>返回登录</a>
      <span data-testid="turnstile-site-key">{turnstileSiteKey}</span>
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isGoogleAuthEnabled.mockReturnValue(true);
  mocks.getGoogleAuthErrorMessage.mockReturnValue("Google 注册失败");
});

describe("RegisterRoute", () => {
  it("将安全邀请地址传给已登录检查、Google 注册和登录链接", async () => {
    render(
      await RegisterRoute({
        searchParams: Promise.resolve({
          authError: "callback_failed",
          next: "/invite/invite-token",
        }),
      }),
    );

    expect(mocks.redirectIfAuthenticated).toHaveBeenCalledWith(
      "/invite/invite-token",
    );
    expect(screen.getByTestId("google-action")).toHaveTextContent("function");
    expect(screen.getByTestId("google-error")).toHaveTextContent(
      "Google 注册失败",
    );
    expect(mocks.getGoogleAuthErrorMessage).toHaveBeenCalledWith(
      "callback_failed",
    );
    expect(screen.getByRole("link", { name: "返回登录" })).toHaveAttribute(
      "href",
      "/login?next=%2Finvite%2Finvite-token",
    );
    expect(screen.getByTestId("turnstile-site-key")).toHaveTextContent(
      "test-site-key",
    );
  });

  it("Google 登录未启用时不传入 Google action", async () => {
    mocks.isGoogleAuthEnabled.mockReturnValue(false);

    render(await RegisterRoute({ searchParams: Promise.resolve({}) }));

    expect(screen.getByTestId("google-action")).toHaveTextContent("undefined");
  });

  it("不安全回跳地址退回首页", async () => {
    render(
      await RegisterRoute({
        searchParams: Promise.resolve({ next: "//evil.example" }),
      }),
    );

    expect(mocks.redirectIfAuthenticated).toHaveBeenCalledWith("/dashboard");
    expect(screen.getByRole("link", { name: "返回登录" })).toHaveAttribute(
      "href",
      "/login?next=%2Fdashboard",
    );
  });
});
