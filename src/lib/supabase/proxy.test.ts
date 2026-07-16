import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateSession } from "./proxy";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  next: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));

vi.mock("next/server", () => ({
  NextResponse: {
    next: mocks.next,
  },
}));

function createRequest(pathname = "/invite/secret-invite-token") {
  return {
    cookies: {
      getAll: vi.fn(() => []),
      set: vi.fn(),
    },
    nextUrl: {
      pathname,
    },
  };
}

function createResponse() {
  return {
    cookies: {
      set: vi.fn(),
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.next.mockImplementation(() => createResponse());
});

describe("updateSession", () => {
  it("认证声明刷新成功时返回 NextResponse", async () => {
    const getClaims = vi.fn().mockResolvedValue({ data: { claims: null } });
    mocks.createServerClient.mockReturnValue({ auth: { getClaims } });
    const request = createRequest();

    const response = await updateSession(request as never);

    expect(response).toEqual(
      expect.objectContaining({ cookies: expect.anything() }),
    );
    expect(getClaims).toHaveBeenCalledTimes(1);
    expect(mocks.next).toHaveBeenCalledWith({ request });
  });

  it.each([
    "/",
    "/invite",
    "/invite/secret-invite-token",
    "/invite/secret-invite-token/",
    "/login",
    "/login/",
    "/register",
    "/register/",
  ])("公开入口 %s 刷新声明失败时继续请求", async (pathname) => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.createServerClient.mockReturnValue({
      auth: {
        getClaims: vi.fn().mockRejectedValue(new Error("secret-invite-token")),
      },
    });

    await expect(
      updateSession(createRequest(pathname) as never),
    ).resolves.toEqual(expect.objectContaining({ cookies: expect.anything() }));
    expect(consoleError).toHaveBeenCalledWith(
      "[supabaseProxy] failed to refresh auth claims for public route",
    );
    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining("secret-invite-token"),
    );
    consoleError.mockRestore();
  });

  it.each(["/dashboard", "/login-evil", "/register-admin"])(
    "受保护路由 %s 刷新认证声明失败时保持原有失败行为",
    async (pathname) => {
      const error = new Error("auth failed");
      mocks.createServerClient.mockReturnValue({
        auth: {
          getClaims: vi.fn().mockRejectedValue(error),
        },
      });

      await expect(
        updateSession(createRequest(pathname) as never),
      ).rejects.toBe(error);
    },
  );

  it("公开入口初始化客户端失败时继续请求", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.createServerClient.mockImplementation(() => {
      throw new Error("client init failed");
    });

    await expect(updateSession(createRequest() as never)).resolves.toEqual(
      expect.objectContaining({ cookies: expect.anything() }),
    );
    expect(consoleError).toHaveBeenCalledWith(
      "[supabaseProxy] failed to refresh auth claims for public route",
    );
    consoleError.mockRestore();
  });
});
