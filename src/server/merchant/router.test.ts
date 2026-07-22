// @vitest-environment node

import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { revalidatePath } from "next/cache";

import { routePaths } from "config/paths";
import type { AppEnv } from "server/appEnv";
import type { RequestContainer } from "server/container";
import { merchantRouter } from "server/merchant/router";
import type { MerchantService } from "server/merchant/service/merchantService";
import type { RequestDependencies } from "server/shared/context/requestDependencies";
import { AuthorizationError } from "server/shared/errors/appError";
import {
  errorHandlingMiddleware,
  openApiValidationErrorHook,
} from "server/shared/http/errorResponse";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const merchantId = "00000000-0000-4000-8000-000000001001";
const aliasId = "00000000-0000-4000-8000-000000001002";
const authenticated: RequestDependencies["auth"] = {
  email: "user@example.com",
  isAuthenticated: true,
  userId,
};
const writeHeaders = {
  "content-type": "application/json",
  origin: "https://kuranote.example",
};

function createService(
  overrides: Partial<MerchantService> = {},
): MerchantService {
  return {
    archiveAlias: vi.fn(),
    archiveMerchant: vi.fn(),
    createAlias: vi.fn(),
    createMerchant: vi.fn(),
    findSummariesByIds: vi.fn().mockResolvedValue([]),
    getView: vi.fn().mockResolvedValue({
      canManageMerchants: true,
      ledgerName: "家庭账本",
      merchants: [],
    }),
    list: vi.fn().mockResolvedValue({
      canManageMerchants: true,
      merchants: [],
    }),
    listActiveOptions: vi.fn().mockResolvedValue([]),
    updateMerchant: vi.fn(),
    ...overrides,
  };
}

function createApp(
  service: MerchantService,
  auth: RequestDependencies["auth"] = authenticated,
) {
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: openApiValidationErrorHook,
  });
  app.use("*", async (c, next) => {
    c.set("container", {
      account: {} as RequestContainer["account"],
      auth: {} as RequestContainer["auth"],
      category: {} as RequestContainer["category"],
      ledger: {} as RequestContainer["ledger"],
      merchant: { service },
      transaction: {} as RequestContainer["transaction"],
      user: {} as RequestContainer["user"],
    });
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
  app.route("/merchants", merchantRouter);
  return app;
}

describe("merchant router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("读取商家列表返回 200 且不传递 SSR 账本名称", async () => {
    const list = vi.fn().mockResolvedValue({
      canManageMerchants: true,
      merchants: [],
    });
    const app = createApp(createService({ list }));

    const response = await app.request(
      `https://kuranote.example/merchants?ledgerId=${ledgerId}&q=LIFE`,
    );

    expect(response.status).toBe(200);
    expect(list).toHaveBeenCalledWith({ keyword: "LIFE", ledgerId });
    expect(await response.json()).toEqual({
      canManageMerchants: true,
      merchants: [],
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("读取商家选项返回 200 且不触发缓存失效", async () => {
    const listActiveOptions = vi
      .fn()
      .mockResolvedValue([{ icon_url: null, id: merchantId, name: "LIFE" }]);
    const app = createApp(createService({ listActiveOptions }));

    const response = await app.request(
      `https://kuranote.example/merchants/options?ledgerId=${ledgerId}`,
    );

    expect(response.status).toBe(200);
    expect(listActiveOptions).toHaveBeenCalledWith({ ledgerId });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("创建商家成功返回 201 并刷新商家页面", async () => {
    const createMerchant = vi.fn();
    const app = createApp(createService({ createMerchant }));

    const response = await app.request("https://kuranote.example/merchants", {
      body: JSON.stringify({
        ledgerId,
        name: " LIFE ",
        note: null,
        siteUrl: "https://example.com",
      }),
      headers: writeHeaders,
      method: "POST",
    });

    expect(response.status).toBe(201);
    expect(createMerchant).toHaveBeenCalledWith({
      ledgerId,
      name: "LIFE",
      note: null,
      siteUrl: "https://example.com",
    });
    expect(revalidatePath).toHaveBeenCalledWith(routePaths.merchants);
  });

  it("创建商家参数不合法时返回 400 且不调用 Service 或缓存失效", async () => {
    const createMerchant = vi.fn();
    const app = createApp(createService({ createMerchant }));

    const response = await app.request("https://kuranote.example/merchants", {
      body: JSON.stringify({
        ledgerId,
        name: "",
        note: null,
        siteUrl: null,
      }),
      headers: writeHeaders,
      method: "POST",
    });

    expect(response.status).toBe(400);
    expect(createMerchant).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("更新商家时传递路径 ID 并在成功后刷新", async () => {
    const updateMerchant = vi.fn();
    const app = createApp(createService({ updateMerchant }));

    const response = await app.request(
      `https://kuranote.example/merchants/${merchantId}`,
      {
        body: JSON.stringify({
          ledgerId,
          name: "ライフ",
          note: null,
          siteUrl: null,
        }),
        headers: writeHeaders,
        method: "PATCH",
      },
    );

    expect(response.status).toBe(200);
    expect(updateMerchant).toHaveBeenCalledWith({
      ledgerId,
      merchantId,
      name: "ライフ",
      note: null,
      siteUrl: null,
    });
    expect(revalidatePath).toHaveBeenCalledWith(routePaths.merchants);
  });

  it("创建和归档别名会传递资源 ID 并刷新商家页面", async () => {
    const createAlias = vi.fn();
    const archiveAlias = vi.fn();
    const app = createApp(createService({ archiveAlias, createAlias }));

    const createResponse = await app.request(
      `https://kuranote.example/merchants/${merchantId}/aliases`,
      {
        body: JSON.stringify({ alias: "来福", ledgerId }),
        headers: writeHeaders,
        method: "POST",
      },
    );
    const archiveResponse = await app.request(
      `https://kuranote.example/merchants/aliases/${aliasId}?ledgerId=${ledgerId}`,
      { headers: { origin: "https://kuranote.example" }, method: "DELETE" },
    );

    expect(createResponse.status).toBe(201);
    expect(archiveResponse.status).toBe(200);
    expect(createAlias).toHaveBeenCalledWith({
      alias: "来福",
      ledgerId,
      merchantId,
    });
    expect(archiveAlias).toHaveBeenCalledWith({ aliasId, ledgerId });
    expect(revalidatePath).toHaveBeenCalledTimes(2);
  });

  it("跨来源写请求返回 403 且不调用 Service 或缓存失效", async () => {
    const createMerchant = vi.fn();
    const app = createApp(createService({ createMerchant }));

    const response = await app.request("https://kuranote.example/merchants", {
      body: JSON.stringify({
        ledgerId,
        name: "LIFE",
        note: null,
        siteUrl: null,
      }),
      headers: {
        "content-type": "application/json",
        origin: "https://evil.example",
      },
      method: "POST",
    });

    expect(response.status).toBe(403);
    expect(createMerchant).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("Service 失败时返回统一错误且不触发缓存失效", async () => {
    const archiveMerchant = vi
      .fn()
      .mockRejectedValue(new AuthorizationError("permission_denied", "无权限"));
    const app = createApp(createService({ archiveMerchant }));

    const response = await app.request(
      `https://kuranote.example/merchants/${merchantId}?ledgerId=${ledgerId}`,
      { headers: { origin: "https://kuranote.example" }, method: "DELETE" },
    );

    expect(response.status).toBe(403);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("未登录读取时返回 401", async () => {
    const list = vi.fn();
    const app = createApp(createService({ list }), {
      email: null,
      isAuthenticated: false,
      userId: null,
    });

    const response = await app.request(
      `https://kuranote.example/merchants?ledgerId=${ledgerId}`,
    );

    expect(response.status).toBe(401);
    expect(list).not.toHaveBeenCalled();
  });
});
