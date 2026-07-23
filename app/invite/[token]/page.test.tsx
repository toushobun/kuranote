import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LedgerInviteRoute, { probeAuthentication } from "./page";

const validToken = "a".repeat(64);

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  loadLedgerInvitePreview: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("internal/ledger/adapter/next/loadLedgerInvitePreview", () => ({
  loadLedgerInvitePreview: mocks.loadLedgerInvitePreview,
}));

vi.mock("templates/ledgers/LedgerInvite", () => ({
  LedgerInviteTemplate: ({
    exitHref,
    preview,
    token,
  }: {
    exitHref?: string;
    preview: { status: string };
    token: string;
  }) => (
    <div data-testid="invite-template" data-token={token} data-exit={exitHref}>
      {preview.status}
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createClient.mockResolvedValue({
    auth: { getUser: mocks.getUser },
  });
  mocks.loadLedgerInvitePreview.mockResolvedValue({
    inviteRole: "member",
    inviterName: "管理员",
    ledgerName: "家庭账本",
    status: "valid",
  });
});

function createRouteProps(token = validToken) {
  return {
    params: Promise.resolve({ token }),
    searchParams: Promise.resolve({}),
  };
}

describe("LedgerInviteRoute", () => {
  it("畸形 token 直接显示失效状态并返回公开首页", async () => {
    render(await LedgerInviteRoute(createRouteProps("x".repeat(300))));

    expect(screen.getByTestId("invite-template")).toHaveTextContent("invalid");
    expect(screen.getByTestId("invite-template")).toHaveAttribute(
      "data-token",
      "",
    );
    expect(screen.getByTestId("invite-template")).toHaveAttribute(
      "data-exit",
      "/",
    );
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.loadLedgerInvitePreview).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("未登录时自动跳转登录并保留邀请回跳地址", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(LedgerInviteRoute(createRouteProps())).rejects.toThrow(
      `NEXT_REDIRECT:/login?next=${encodeURIComponent(`/invite/${validToken}`)}`,
    );
    expect(mocks.loadLedgerInvitePreview).not.toHaveBeenCalled();
  });

  it("认证探测抛出异常时整条路由仍跳转登录", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.createClient.mockRejectedValue(new Error("secret invite token"));

    await expect(LedgerInviteRoute(createRouteProps())).rejects.toThrow(
      `NEXT_REDIRECT:/login?next=${encodeURIComponent(`/invite/${validToken}`)}`,
    );
    expect(mocks.loadLedgerInvitePreview).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      "[ledgerInvite] failed to probe authentication",
    );
    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining("secret invite token"),
    );
    consoleError.mockRestore();
  });

  it("已登录时加载邀请预览并渲染接受页面", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-id" } },
      error: null,
    });

    render(await LedgerInviteRoute(createRouteProps()));

    expect(screen.getByTestId("invite-template")).toHaveTextContent("valid");
    expect(screen.getByTestId("invite-template")).toHaveAttribute(
      "data-token",
      validToken,
    );
    expect(mocks.loadLedgerInvitePreview).toHaveBeenCalledWith(validToken);
  });
});

describe("probeAuthentication", () => {
  it("认证用户存在时返回 true", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-id" } },
      error: null,
    });

    await expect(probeAuthentication()).resolves.toBe(true);
  });

  it("认证探测返回错误时降级为未登录", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("auth failed"),
    });

    await expect(probeAuthentication()).resolves.toBe(false);
  });

  it("认证探测抛出异常时降级且不记录邀请内容", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.createClient.mockRejectedValue(new Error("secret invite token"));

    await expect(probeAuthentication()).resolves.toBe(false);
    expect(consoleError).toHaveBeenCalledWith(
      "[ledgerInvite] failed to probe authentication",
    );
    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining("secret invite token"),
    );
    consoleError.mockRestore();
  });
});
