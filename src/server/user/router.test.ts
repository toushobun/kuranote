// @vitest-environment node

import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { revalidatePath } from "next/cache";

import { routePaths } from "config/paths";
import type { AppEnv } from "server/appEnv";
import type { RequestContainer } from "server/container";
import type { RequestDependencies } from "server/shared/context/requestDependencies";
import { AuthorizationError } from "server/shared/errors/appError";
import { errorHandlingMiddleware } from "server/shared/http/errorResponse";
import { userRouter } from "server/user/router";

const userId = "00000000-0000-4000-8000-000000000031";
const profile = {
  avatarUrl: "https://example.com/avatar.png",
  displayName: "淞文",
  email: "user@example.com",
  id: userId,
  status: "active" as const,
};
const authenticated: RequestDependencies["auth"] = {
  email: "user@example.com",
  isAuthenticated: true,
  userId,
};
const sameOriginHeaders = {
  "content-type": "application/json",
  origin: "https://kuranote.example",
};

function createContainer(
  overrides: Partial<RequestContainer["user"]["service"]> = {},
): RequestContainer {
  return {
    auth: {} as RequestContainer["auth"],
    category: {} as RequestContainer["category"],
    ledger: {} as RequestContainer["ledger"],
    user: {
      service: {
        getCurrentProfile: vi.fn(),
        syncDisplayName: vi.fn(),
        updateCurrentProfile: vi.fn(),
        ...overrides,
      },
    },
  };
}

function createApp(
  container: RequestContainer,
  auth: RequestDependencies["auth"] = authenticated,
) {
  const app = new OpenAPIHono<AppEnv>();
  app.use("*", async (c, next) => {
    c.set("container", container);
    c.set("requestId", "request-1");
    c.set("requestDependencies", {
      auth,
      logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
      requestId: "request-1",
      supabase: {} as never,
    });
    await next();
  });
  app.onError(errorHandlingMiddleware);
  app.route("/users", userRouter);
  return app;
}

describe("user router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("读取当前用户资料时返回 200 且不触发缓存失效", async () => {
    const getCurrentProfile = vi.fn().mockResolvedValue(profile);
    const app = createApp(createContainer({ getCurrentProfile }));

    const response = await app.request("https://kuranote.example/users/me");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(profile);
    expect(getCurrentProfile).toHaveBeenCalledOnce();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("未登录读取用户资料时返回 401 且不调用 Service", async () => {
    const getCurrentProfile = vi.fn();
    const app = createApp(createContainer({ getCurrentProfile }), {
      email: null,
      isAuthenticated: false,
      userId: null,
    });

    const response = await app.request("https://kuranote.example/users/me");

    expect(response.status).toBe(401);
    expect(getCurrentProfile).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("更新用户资料时传递规范化参数并刷新相关页面", async () => {
    const updateCurrentProfile = vi.fn().mockResolvedValue({
      ...profile,
      displayName: "新昵称",
    });
    const app = createApp(createContainer({ updateCurrentProfile }));

    const response = await app.request("https://kuranote.example/users/me", {
      body: JSON.stringify({ displayName: "  新昵称  " }),
      headers: sameOriginHeaders,
      method: "PATCH",
    });

    expect(response.status).toBe(200);
    expect(updateCurrentProfile).toHaveBeenCalledWith({
      displayName: "新昵称",
    });
    expect(revalidatePath).toHaveBeenCalledWith(routePaths.dashboard);
    expect(revalidatePath).toHaveBeenCalledWith(routePaths.settings);
    expect(revalidatePath).toHaveBeenCalledWith(
      "/ledgers/[ledgerId]/settings",
      "page",
    );
  });

  it("更新请求没有字段时返回 400 且不调用 Service 或缓存失效", async () => {
    const updateCurrentProfile = vi.fn();
    const app = createApp(createContainer({ updateCurrentProfile }));

    const response = await app.request("https://kuranote.example/users/me", {
      body: JSON.stringify({}),
      headers: sameOriginHeaders,
      method: "PATCH",
    });

    expect(response.status).toBe(400);
    expect(updateCurrentProfile).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("更新失败时返回应用错误且不触发缓存失效", async () => {
    const updateCurrentProfile = vi
      .fn()
      .mockRejectedValue(new AuthorizationError("user_inactive", "已停用"));
    const app = createApp(createContainer({ updateCurrentProfile }));

    const response = await app.request("https://kuranote.example/users/me", {
      body: JSON.stringify({ displayName: "新昵称" }),
      headers: sameOriginHeaders,
      method: "PATCH",
    });

    expect(response.status).toBe(403);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
