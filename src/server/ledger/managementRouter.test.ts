// @vitest-environment node

import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { revalidatePath } from "next/cache";

import { routePaths } from "config/paths";
import type { AppEnv } from "server/appEnv";
import type { RequestContainer } from "server/container";
import { ledgerManagementRouter } from "server/ledger/managementRouter";
import { AuthorizationError } from "server/shared/errors/appError";
import { errorHandlingMiddleware } from "server/shared/http/errorResponse";

const userId = "00000000-0000-4000-8000-000000000031";
const ledgerId = "00000000-0000-4000-8000-000000000032";
const inviteId = "00000000-0000-4000-8000-000000000033";
const headers = {
  "content-type": "application/json",
  origin: "https://kuranote.example",
};

function createContainer(overrides: Partial<RequestContainer["ledger"]> = {}) {
  return {
    auth: {} as RequestContainer["auth"],
    category: {} as RequestContainer["category"],
    ledger: {
      currentLedgerService: { switch: vi.fn() },
      inviteService: {
        accept: vi.fn(),
        create: vi.fn(),
        listPending: vi.fn(),
        revoke: vi.fn(),
      },
      service: {
        create: vi.fn(),
        getCreateDefaults: vi.fn(),
        getMemberCounts: vi.fn(),
      },
      settingsService: { getView: vi.fn(), update: vi.fn() },
      ...overrides,
    },
    user: {} as RequestContainer["user"],
  } satisfies RequestContainer;
}

function createApp(container: RequestContainer) {
  const app = new OpenAPIHono<AppEnv>();
  app.use("*", async (c, next) => {
    c.set("container", container);
    c.set("requestId", "request-1");
    c.set("requestDependencies", {
      auth: { email: "user@example.com", isAuthenticated: true, userId },
      logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
      requestId: "request-1",
      supabase: {} as never,
    });
    await next();
  });
  app.onError(errorHandlingMiddleware);
  app.route("/ledgers", ledgerManagementRouter);
  return app;
}

function expectCommonLedgerPathsRevalidated() {
  expect(revalidatePath).toHaveBeenCalledWith(routePaths.dashboard);
  expect(revalidatePath).toHaveBeenCalledWith(routePaths.ledgers);
}

describe("ledger management router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("账本创建成功后返回 201 并触发统一缓存失效", async () => {
    const create = vi.fn();
    const app = createApp(
      createContainer({
        service: {
          create,
          getCreateDefaults: vi.fn(),
          getMemberCounts: vi.fn(),
        },
      }),
    );
    const input = {
      baseCurrency: "JPY",
      displayColor: "amber",
      displayName: "淞文",
      ledgerName: "家庭账本",
    };

    const response = await app.request("https://kuranote.example/ledgers", {
      body: JSON.stringify(input),
      headers,
      method: "POST",
    });

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(input);
    expectCommonLedgerPathsRevalidated();
  });

  it("切换失败时返回应用错误且不触发缓存失效", async () => {
    const switchCurrent = vi
      .fn()
      .mockRejectedValue(new AuthorizationError("permission_denied", "无权限"));
    const app = createApp(
      createContainer({ currentLedgerService: { switch: switchCurrent } }),
    );

    const response = await app.request(
      "https://kuranote.example/ledgers/current",
      {
        body: JSON.stringify({ ledgerId }),
        headers,
        method: "POST",
      },
    );

    expect(response.status).toBe(403);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("更新账本设置时传递规范化参数并刷新对应设置页", async () => {
    const update = vi.fn();
    const app = createApp(
      createContainer({ settingsService: { getView: vi.fn(), update } }),
    );

    const response = await app.request(
      `https://kuranote.example/ledgers/${ledgerId}/settings`,
      {
        body: JSON.stringify({
          baseCurrency: "JPY",
          intent: "ledger",
          ledgerName: "新的账本名",
        }),
        headers,
        method: "PATCH",
      },
    );

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      intent: "ledger",
      ledgerId,
      settings: { baseCurrency: "JPY", ledgerName: "新的账本名" },
      userId,
    });
    expectCommonLedgerPathsRevalidated();
    expect(revalidatePath).toHaveBeenCalledWith(
      `/ledgers/${ledgerId}/settings`,
    );
  });

  it("账本设置输入无效时返回 400 且不调用 Service 或缓存失效", async () => {
    const update = vi.fn();
    const app = createApp(
      createContainer({ settingsService: { getView: vi.fn(), update } }),
    );

    const response = await app.request(
      `https://kuranote.example/ledgers/${ledgerId}/settings`,
      {
        body: JSON.stringify({
          baseCurrency: "INVALID",
          intent: "ledger",
          ledgerName: "新的账本名",
        }),
        headers,
        method: "PATCH",
      },
    );

    expect(response.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("创建邀请时传递账本、角色和用户并刷新对应设置页", async () => {
    const create = vi.fn().mockResolvedValue({
      inviteId,
      role: "member",
      token: "a".repeat(64),
    });
    const app = createApp(
      createContainer({
        inviteService: {
          accept: vi.fn(),
          create,
          listPending: vi.fn(),
          revoke: vi.fn(),
        },
      }),
    );

    const response = await app.request(
      `https://kuranote.example/ledgers/${ledgerId}/invites`,
      {
        body: JSON.stringify({ role: "member" }),
        headers,
        method: "POST",
      },
    );

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith({ ledgerId, role: "member", userId });
    expectCommonLedgerPathsRevalidated();
    expect(revalidatePath).toHaveBeenCalledWith(
      `/ledgers/${ledgerId}/settings`,
    );
  });

  it("撤销邀请时传递账本、邀请和用户并刷新对应设置页", async () => {
    const revoke = vi.fn();
    const app = createApp(
      createContainer({
        inviteService: {
          accept: vi.fn(),
          create: vi.fn(),
          listPending: vi.fn(),
          revoke,
        },
      }),
    );

    const response = await app.request(
      `https://kuranote.example/ledgers/${ledgerId}/invites/${inviteId}`,
      { headers, method: "DELETE" },
    );

    expect(response.status).toBe(200);
    expect(revoke).toHaveBeenCalledWith({ inviteId, ledgerId, userId });
    expectCommonLedgerPathsRevalidated();
    expect(revalidatePath).toHaveBeenCalledWith(
      `/ledgers/${ledgerId}/settings`,
    );
  });

  it("读取待接受邀请不会触发缓存失效", async () => {
    const listPending = vi.fn().mockResolvedValue([]);
    const app = createApp(
      createContainer({
        inviteService: {
          accept: vi.fn(),
          create: vi.fn(),
          listPending,
          revoke: vi.fn(),
        },
      }),
    );

    const response = await app.request(
      `https://kuranote.example/ledgers/${ledgerId}/invites`,
      { method: "GET" },
    );

    expect(response.status).toBe(200);
    expect(listPending).toHaveBeenCalledWith({ ledgerId, userId });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
