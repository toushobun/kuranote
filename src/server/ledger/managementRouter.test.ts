// @vitest-environment node

import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { revalidatePath } from "next/cache";

import type { AppEnv } from "server/appEnv";
import type { RequestContainer } from "server/container";
import { ledgerManagementRouter } from "server/ledger/managementRouter";
import { AuthorizationError } from "server/shared/errors/appError";
import { errorHandlingMiddleware } from "server/shared/http/errorResponse";

const userId = "00000000-0000-4000-8000-000000000031";
const ledgerId = "00000000-0000-4000-8000-000000000032";
const headers = {
  "content-type": "application/json",
  origin: "https://kuranote.example",
};

function createContainer(overrides: Partial<RequestContainer["ledger"]> = {}) {
  return {
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

    const response = await app.request("https://kuranote.example/ledgers", {
      body: JSON.stringify({
        baseCurrency: "JPY",
        displayColor: "amber",
        displayName: "淞文",
        ledgerName: "家庭账本",
      }),
      headers,
      method: "POST",
    });

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalled();
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
      { headers: { origin: headers.origin }, method: "GET" },
    );

    expect(response.status).toBe(200);
    expect(listPending).toHaveBeenCalledWith({ ledgerId, userId });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
