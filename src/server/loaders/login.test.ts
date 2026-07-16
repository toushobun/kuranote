import { beforeEach, describe, expect, it, vi } from "vitest";

import { redirectIfAuthenticated } from "./login";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
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

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createClient.mockResolvedValue({
    auth: { getUser: mocks.getUser },
  });
});

describe("redirectIfAuthenticated", () => {
  it("未登录时继续显示登录或注册页面", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(
      redirectIfAuthenticated("/invite/invite-token"),
    ).resolves.toBeUndefined();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("认证服务返回错误时按未登录处理", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("auth failed"),
    });

    await expect(
      redirectIfAuthenticated("/invite/invite-token"),
    ).resolves.toBeUndefined();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("已登录时默认跳转首页", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-id" } },
      error: null,
    });

    await expect(redirectIfAuthenticated()).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard",
    );
  });

  it("已登录时优先跳转安全邀请地址", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-id" } },
      error: null,
    });

    await expect(
      redirectIfAuthenticated("/invite/invite-token"),
    ).rejects.toThrow("NEXT_REDIRECT:/invite/invite-token");
  });

  it("已登录时拒绝不安全回跳地址并退回首页", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-id" } },
      error: null,
    });

    await expect(
      redirectIfAuthenticated("https://evil.example"),
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard");
  });

  it("认证探测抛出异常时继续显示且不记录异常内容", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.getUser.mockRejectedValue(new Error("secret session content"));

    await expect(
      redirectIfAuthenticated("/invite/invite-token"),
    ).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(
      "[login] failed to probe existing authentication",
    );
    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining("secret session content"),
    );
    expect(mocks.redirect).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
