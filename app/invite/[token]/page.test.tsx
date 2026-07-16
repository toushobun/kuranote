import { beforeEach, describe, expect, it, vi } from "vitest";

import { probeAuthentication } from "./page";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
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
