// @vitest-environment node

import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { revalidatePath } from "next/cache";

import { routePaths } from "config/paths";
import { accountRouter } from "server/account/router";
import type { AppEnv } from "server/appEnv";
import type { RequestContainer } from "server/container";
import type { RequestDependencies } from "server/shared/context/requestDependencies";
import { AuthorizationError } from "server/shared/errors/appError";
import {
  errorHandlingMiddleware,
  openApiValidationErrorHook,
} from "server/shared/http/errorResponse";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const accountId = "00000000-0000-4000-8000-000000000045";
const holderUserId = "00000000-0000-4000-8000-000000000041";
const authenticated: RequestDependencies["auth"] = {
  email: "user@example.com",
  isAuthenticated: true,
  userId,
};
const requestHeaders = {
  "content-type": "application/json",
  origin: "https://kuranote.example",
};

function createContainer(
  overrides: Partial<RequestContainer["account"]["service"]> = {},
): RequestContainer {
  return {
    account: {
      service: {
        archive: vi.fn(),
        create: vi.fn(),
        getView: vi.fn(),
        update: vi.fn(),
        ...overrides,
      },
    },
    auth: {} as RequestContainer["auth"],
    category: {} as RequestContainer["category"],
    ledger: {} as RequestContainer["ledger"],
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
  app.route("/ledgers", accountRouter);
  return app;
}

function createBody() {
  return {
    currency: "JPY",
    holderUserIds: [holderUserId],
    initialBalance: 1000,
    name: "现金",
    type: "cash",
  } as const;
}

describe("account router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("读取账户页面数据时返回 200 且不触发缓存失效", async () => {
    const view = {
      accounts: [],
      baseCurrency: "JPY",
      canManageAccounts: true,
      canWriteTransactions: true,
      holderOptions: [],
      ledgerName: "家庭账本",
    };
    const getView = vi.fn().mockResolvedValue(view);
    const app = createApp(createContainer({ getView }));

    const response = await app.request(
      `https://kuranote.example/ledgers/${ledgerId}/accounts`,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(view);
    expect(getView).toHaveBeenCalledWith({ ledgerId, userId });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("创建账户时调用 Service 并只在成功后刷新账户页面", async () => {
    const create = vi.fn().mockResolvedValue({ accountId });
    const app = createApp(createContainer({ create }));

    const response = await app.request(
      `https://kuranote.example/ledgers/${ledgerId}/accounts`,
      {
        body: JSON.stringify(createBody()),
        headers: requestHeaders,
        method: "POST",
      },
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ accountId });
    expect(create).toHaveBeenCalledWith({
      ...createBody(),
      ledgerId,
      userId,
    });
    expect(revalidatePath).toHaveBeenCalledWith(routePaths.accounts);
  });

  it("创建请求参数无效时返回 400 且不调用 Service", async () => {
    const create = vi.fn();
    const app = createApp(createContainer({ create }));

    const response = await app.request(
      `https://kuranote.example/ledgers/${ledgerId}/accounts`,
      {
        body: JSON.stringify({ ...createBody(), holderUserIds: [] }),
        headers: requestHeaders,
        method: "POST",
      },
    );

    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("Service 拒绝更新时返回 403 且不触发缓存失效", async () => {
    const update = vi
      .fn()
      .mockRejectedValue(
        new AuthorizationError("permission_denied", "没有权限"),
      );
    const app = createApp(createContainer({ update }));
    const { initialBalance: _initialBalance, ...updateBody } = createBody();

    const response = await app.request(
      `https://kuranote.example/ledgers/${ledgerId}/accounts/${accountId}`,
      {
        body: JSON.stringify(updateBody),
        headers: requestHeaders,
        method: "PATCH",
      },
    );

    expect(response.status).toBe(403);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("缺少同源 Origin 的删除请求返回 403 且不调用 Service", async () => {
    const archive = vi.fn();
    const app = createApp(createContainer({ archive }));

    const response = await app.request(
      `https://kuranote.example/ledgers/${ledgerId}/accounts/${accountId}`,
      { method: "DELETE" },
    );

    expect(response.status).toBe(403);
    expect(archive).not.toHaveBeenCalled();
  });
});
