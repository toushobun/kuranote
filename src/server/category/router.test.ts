// @vitest-environment node

import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { revalidatePath } from "next/cache";

import { routePaths } from "config/paths";
import type { AppEnv } from "server/appEnv";
import { categoryErrorCodes } from "server/category/categoryErrors";
import { categoryRouter } from "server/category/router";
import type { RequestContainer } from "server/container";
import type { RequestDependencies } from "server/shared/context/requestDependencies";
import { AuthorizationError } from "server/shared/errors/appError";
import {
  errorHandlingMiddleware,
  openApiValidationErrorHook,
} from "server/shared/http/errorResponse";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const categoryId = "00000000-0000-4000-8000-000000000101";
const authenticated: RequestDependencies["auth"] = {
  email: "user@example.com",
  isAuthenticated: true,
  userId,
};
const headers = {
  "content-type": "application/json",
  origin: "https://kuranote.example",
};

function createContainer(
  overrides: Partial<RequestContainer["category"]["service"]> = {},
): RequestContainer {
  return {
    account: {} as RequestContainer["account"],
    auth: {} as RequestContainer["auth"],
    category: {
      service: {
        archive: vi.fn(),
        create: vi.fn(),
        findSummariesByIds: vi.fn(),
        getCategoriesView: vi.fn(),
        listActiveSummaries: vi.fn(),
        reorder: vi.fn(),
        update: vi.fn(),
        ...overrides,
      },
    },
    ledger: {} as RequestContainer["ledger"],
    merchant: {} as RequestContainer["merchant"],
    transaction: {} as RequestContainer["transaction"],
    user: {} as RequestContainer["user"],
  };
}

function createApp(
  container: RequestContainer,
  auth: RequestDependencies["auth"] = authenticated,
) {
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: openApiValidationErrorHook,
  });
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
  app.route("/categories", categoryRouter);
  return app;
}

describe("category router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("创建分类时校验参数、调用 Service、返回 201 并刷新分类页", async () => {
    const create = vi.fn();
    const app = createApp(createContainer({ create }));

    const response = await app.request(
      `https://kuranote.example/categories/${ledgerId}`,
      {
        body: JSON.stringify({
          iconName: "🍽️",
          name: "  餐饮  ",
          parentId: null,
          type: "expense",
        }),
        headers,
        method: "POST",
      },
    );

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith({
      iconName: "🍽️",
      ledgerId,
      name: "餐饮",
      parentId: null,
      type: "expense",
      userId,
    });
    expect(revalidatePath).toHaveBeenCalledWith(routePaths.categories);
  });

  it("创建请求参数无效时返回 400 且不调用 Service 或缓存失效", async () => {
    const create = vi.fn();
    const app = createApp(createContainer({ create }));

    const response = await app.request(
      `https://kuranote.example/categories/${ledgerId}`,
      {
        body: JSON.stringify({
          iconName: "unknown",
          name: "",
          parentId: null,
          type: "expense",
        }),
        headers,
        method: "POST",
      },
    );

    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("未登录时返回 401 且不调用 Service", async () => {
    const create = vi.fn();
    const app = createApp(createContainer({ create }), {
      email: null,
      isAuthenticated: false,
      userId: null,
    });

    const response = await app.request(
      `https://kuranote.example/categories/${ledgerId}`,
      {
        body: JSON.stringify({
          iconName: "🍽️",
          name: "餐饮",
          parentId: null,
          type: "expense",
        }),
        headers,
        method: "POST",
      },
    );

    expect(response.status).toBe(401);
    expect(create).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("来源不一致时 Same-Origin 中间件拒绝写请求", async () => {
    const create = vi.fn();
    const app = createApp(createContainer({ create }));

    const response = await app.request(
      `https://kuranote.example/categories/${ledgerId}`,
      {
        body: JSON.stringify({
          iconName: "🍽️",
          name: "餐饮",
          parentId: null,
          type: "expense",
        }),
        headers: { ...headers, origin: "https://evil.example" },
        method: "POST",
      },
    );

    expect(response.status).toBe(403);
    expect(create).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("更新、归档和排序路由传递路径参数与用户 ID", async () => {
    const update = vi.fn();
    const archive = vi.fn();
    const reorder = vi.fn();
    const app = createApp(createContainer({ archive, reorder, update }));

    const updateResponse = await app.request(
      `https://kuranote.example/categories/${ledgerId}/${categoryId}`,
      {
        body: JSON.stringify({ iconName: "🍜", name: "外食" }),
        headers,
        method: "PATCH",
      },
    );
    const archiveResponse = await app.request(
      `https://kuranote.example/categories/${ledgerId}/${categoryId}`,
      { headers: { origin: headers.origin }, method: "DELETE" },
    );
    const reorderResponse = await app.request(
      `https://kuranote.example/categories/${ledgerId}/order`,
      {
        body: JSON.stringify({
          categoryIds: [categoryId],
          parentId: null,
          type: "expense",
        }),
        headers,
        method: "PUT",
      },
    );

    expect(updateResponse.status).toBe(200);
    expect(archiveResponse.status).toBe(200);
    expect(reorderResponse.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      categoryId,
      iconName: "🍜",
      ledgerId,
      name: "外食",
      userId,
    });
    expect(archive).toHaveBeenCalledWith({
      categoryId,
      ledgerId,
      userId,
    });
    expect(reorder).toHaveBeenCalledWith({
      categoryIds: [categoryId],
      ledgerId,
      parentId: null,
      type: "expense",
      userId,
    });
    expect(revalidatePath).toHaveBeenCalledTimes(3);
  });

  it("Service 失败时返回统一应用错误且不触发缓存失效", async () => {
    const create = vi
      .fn()
      .mockRejectedValue(
        new AuthorizationError(categoryErrorCodes.permissionDenied, "没有权限"),
      );
    const app = createApp(createContainer({ create }));

    const response = await app.request(
      `https://kuranote.example/categories/${ledgerId}`,
      {
        body: JSON.stringify({
          iconName: "🍽️",
          name: "餐饮",
          parentId: null,
          type: "expense",
        }),
        headers,
        method: "POST",
      },
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: {
        code: categoryErrorCodes.permissionDenied,
        status: 403,
      },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
