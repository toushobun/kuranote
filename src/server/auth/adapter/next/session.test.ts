import { beforeEach, describe, expect, it, vi } from "vitest";

import { redirectIfAuthenticated } from "server/auth/adapter/next/session";

const mocks = vi.hoisted(() => ({
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  getSession: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("server/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));
vi.mock("server/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createServerRequestDependencies.mockResolvedValue({});
  mocks.createRequestContainer.mockReturnValue({
    auth: { service: { getSession: mocks.getSession } },
  });
});

describe("redirectIfAuthenticated", () => {
  it("未登录时继续显示公开页面", async () => {
    mocks.getSession.mockResolvedValue({ authenticated: false, user: null });

    await expect(
      redirectIfAuthenticated("/invite/token"),
    ).resolves.toBeUndefined();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("已登录时跳转安全 nextPath，不安全地址退回首页", async () => {
    mocks.getSession.mockResolvedValue({
      authenticated: true,
      user: { displayName: null, email: null, id: "user-1" },
    });

    await expect(redirectIfAuthenticated("/invite/token")).rejects.toThrow(
      "NEXT_REDIRECT:/invite/token",
    );
    await expect(
      redirectIfAuthenticated("https://evil.example"),
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard");
  });

  it("Session 探测异常时只记录固定日志并继续显示", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.getSession.mockRejectedValue(new Error("sensitive session details"));

    await expect(
      redirectIfAuthenticated("/invite/token"),
    ).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(
      "[login] failed to probe existing authentication",
    );
    expect(consoleError.mock.calls.flat().join(" ")).not.toContain("sensitive");
    consoleError.mockRestore();
  });
});
