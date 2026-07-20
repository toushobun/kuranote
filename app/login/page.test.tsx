import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginRoute from "./page";

const mocks = vi.hoisted(() => ({
  getGoogleAuthErrorMessage: vi.fn(),
  isGoogleAuthEnabled: vi.fn(),
  loginWithRedirect: vi.fn(),
  redirectIfAuthenticated: vi.fn(),
  startGoogleAuth: vi.fn(),
}));

vi.mock("lib/auth/googleOAuth", () => ({
  getGoogleAuthErrorMessage: mocks.getGoogleAuthErrorMessage,
}));

vi.mock("server/auth/adapter/next/actions", () => ({
  loginWithRedirect: mocks.loginWithRedirect,
  startGoogleAuth: mocks.startGoogleAuth,
}));

vi.mock("server/auth/googleAuthConfig", () => ({
  isGoogleAuthEnabled: mocks.isGoogleAuthEnabled,
}));

vi.mock("server/auth/adapter/next/session", () => ({
  redirectIfAuthenticated: mocks.redirectIfAuthenticated,
}));

vi.mock("templates/login/Login", () => ({
  LoginTemplate: ({
    defaultEmail,
    googleAction,
    googleErrorMessage,
    registerHref,
  }: {
    defaultEmail: string;
    googleAction?: unknown;
    googleErrorMessage?: string;
    registerHref: string;
  }) => (
    <div>
      <span data-testid="default-email">{defaultEmail}</span>
      <span data-testid="google-action">{typeof googleAction}</span>
      <span data-testid="google-error">{googleErrorMessage}</span>
      <a href={registerHref}>注册账号</a>
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isGoogleAuthEnabled.mockReturnValue(true);
  mocks.getGoogleAuthErrorMessage.mockReturnValue("Google 登录失败");
});

describe("LoginRoute", () => {
  it("将安全邀请地址传给已登录检查、Google 登录和注册链接", async () => {
    render(
      await LoginRoute({
        searchParams: Promise.resolve({
          authError: "callback_failed",
          email: "user@example.test",
          next: "/invite/invite-token",
        }),
      }),
    );

    expect(mocks.redirectIfAuthenticated).toHaveBeenCalledWith(
      "/invite/invite-token",
    );
    expect(screen.getByTestId("default-email")).toHaveTextContent(
      "user@example.test",
    );
    expect(screen.getByTestId("google-action")).toHaveTextContent("function");
    expect(screen.getByTestId("google-error")).toHaveTextContent(
      "Google 登录失败",
    );
    expect(mocks.getGoogleAuthErrorMessage).toHaveBeenCalledWith(
      "callback_failed",
    );
    expect(screen.getByRole("link", { name: "注册账号" })).toHaveAttribute(
      "href",
      "/register?next=%2Finvite%2Finvite-token",
    );
  });

  it("Google 登录未启用时不传入 Google action", async () => {
    mocks.isGoogleAuthEnabled.mockReturnValue(false);

    render(await LoginRoute({ searchParams: Promise.resolve({}) }));

    expect(screen.getByTestId("google-action")).toHaveTextContent("undefined");
  });

  it("不安全回跳地址退回首页", async () => {
    render(
      await LoginRoute({
        searchParams: Promise.resolve({ next: "https://evil.example" }),
      }),
    );

    expect(mocks.redirectIfAuthenticated).toHaveBeenCalledWith("/dashboard");
    expect(screen.getByRole("link", { name: "注册账号" })).toHaveAttribute(
      "href",
      "/register?next=%2Fdashboard",
    );
  });
});
