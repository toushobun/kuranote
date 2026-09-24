// @vitest-environment node

import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { revalidatePath } from "next/cache";

import { routePaths } from "config/paths";
import type { AppEnv } from "internal/appEnv";
import type { RequestContainer } from "internal/container";
import { ledgerRouter } from "internal/ledger/router";
import { getLedgerInviteErrorMessage } from "internal/ledger/errors/ledgerInvite";
import {
  createdLedgerInviteResponseSchema,
  pendingLedgerInvitesResponseSchema,
} from "internal/ledger/schema";
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from "internal/shared/errors/appError";
import { errorHandlingMiddleware } from "internal/shared/http/errorResponse";

const userId = "00000000-0000-4000-8000-000000000031";
const ledgerId = "00000000-0000-4000-8000-000000000032";
const inviteId = "00000000-0000-4000-8000-000000000033";
const placeholderId = "00000000-0000-4000-8000-000000000051";
const headers = {
  "content-type": "application/json",
  origin: "https://kuranote.example",
};

function createContainer(overrides: Partial<RequestContainer["ledger"]> = {}) {
  return {
    account: {} as RequestContainer["account"],
    auth: {} as RequestContainer["auth"],
    category: {} as RequestContainer["category"],
    dataImport: {} as RequestContainer["dataImport"],
    dataExport: {} as RequestContainer["dataExport"],
    ledger: {
      currentLedgerService: {
        getAccessibleLedger: vi.fn(),
        switch: vi.fn(),
      },
      inviteService: {
        accept: vi.fn(),
        create: vi.fn(),
        listPending: vi.fn(),
        revoke: vi.fn(),
      },
      invitePreviewService: { load: vi.fn() },
      service: {
        create: vi.fn(),
        getCreateDefaults: vi.fn(),
        getMemberCounts: vi.fn(),
      },
      settingsService: { getView: vi.fn(), update: vi.fn() },
      ...overrides,
    },
    merchant: {} as RequestContainer["merchant"],
    statistics: {} as RequestContainer["statistics"],
    transaction: {} as RequestContainer["transaction"],
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
  app.route("/ledgers", ledgerRouter);
  return app;
}

function expectCommonLedgerPathsRevalidated() {
  expect(revalidatePath).toHaveBeenCalledWith(routePaths.dashboard);
  expect(revalidatePath).toHaveBeenCalledWith(routePaths.ledgers);
}

describe("ledger router", () => {
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
      createContainer({
        currentLedgerService: {
          getAccessibleLedger: vi.fn(),
          switch: switchCurrent,
        },
      }),
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

  describe("占位绑定邀请", () => {
    function createAppWithInviteService(
      inviteService: Partial<RequestContainer["ledger"]["inviteService"]>,
    ) {
      return createApp(
        createContainer({
          inviteService: {
            accept: vi.fn(),
            create: vi.fn(),
            listPending: vi.fn(),
            revoke: vi.fn(),
            ...inviteService,
          },
        }),
      );
    }

    function postInvite(
      app: ReturnType<typeof createApp>,
      body: Record<string, unknown>,
    ) {
      return app.request(
        `https://kuranote.example/ledgers/${ledgerId}/invites`,
        { body: JSON.stringify(body), headers, method: "POST" },
      );
    }

    it("创建绑定邀请时透传 placeholderId，响应符合 OpenAPI", async () => {
      const create = vi.fn().mockResolvedValue({
        inviteId,
        placeholderId,
        role: "viewer",
        token: "a".repeat(64),
      });
      const app = createAppWithInviteService({ create });

      const response = await postInvite(app, { placeholderId, role: "viewer" });

      expect(response.status).toBe(201);
      expect(create).toHaveBeenCalledWith({
        ledgerId,
        placeholderId,
        role: "viewer",
        userId,
      });
      const body = await response.json();
      expect(createdLedgerInviteResponseSchema.parse(body)).toEqual({
        inviteId,
        placeholderId,
        role: "viewer",
        token: "a".repeat(64),
      });
    });

    it("省略 placeholderId 时生成匿名邀请，响应 placeholderId 为 null", async () => {
      const create = vi.fn().mockResolvedValue({
        inviteId,
        placeholderId: null,
        role: "member",
        token: "a".repeat(64),
      });
      const app = createAppWithInviteService({ create });

      const response = await postInvite(app, { role: "member" });

      expect(response.status).toBe(201);
      expect(create.mock.calls[0][0].placeholderId).toBeUndefined();
      expect(
        createdLedgerInviteResponseSchema.parse(await response.json()),
      ).toMatchObject({ placeholderId: null });
    });

    it.each(["not-a-uuid", null, 1])(
      "placeholderId 为 %j 时返回 400 且不调用 Service",
      async (value) => {
        const create = vi.fn();
        const app = createAppWithInviteService({ create });

        const response = await postInvite(app, {
          placeholderId: value,
          role: "member",
        });

        expect(response.status).toBe(400);
        expect(create).not.toHaveBeenCalled();
        expect(revalidatePath).not.toHaveBeenCalled();
      },
    );

    it.each([
      ["placeholder_invite_pending", ConflictError, 409],
      ["placeholder_already_claimed", ConflictError, 409],
      ["placeholder_not_found", NotFoundError, 404],
    ] as const)(
      "Service 抛出 %s 时返回真实状态码与安全响应体",
      async (code, ErrorClass, status) => {
        const message = getLedgerInviteErrorMessage(code)!;
        const create = vi.fn().mockRejectedValue(new ErrorClass(code, message));
        const app = createAppWithInviteService({ create });

        const response = await postInvite(app, {
          placeholderId,
          role: "member",
        });

        expect(response.status).toBe(status);
        expect(await response.json()).toEqual({
          error: { code, message, requestId: "request-1", status },
        });
        expect(revalidatePath).not.toHaveBeenCalled();
      },
    );

    it("未知异常返回 500 且不泄露原始信息", async () => {
      const create = vi
        .fn()
        .mockRejectedValue(
          new Error(
            'duplicate key value violates unique constraint "ledger_invite_one_pending_placeholder"',
          ),
        );
      const app = createAppWithInviteService({ create });

      const response = await postInvite(app, { placeholderId, role: "member" });
      const text = await response.text();

      expect(response.status).toBe(500);
      expect(JSON.parse(text)).toMatchObject({
        error: { requestId: "request-1", status: 500 },
      });
      expect(text).not.toContain("ledger_invite_one_pending_placeholder");
    });

    it("待接受邀请列表返回 placeholderId，响应符合 OpenAPI", async () => {
      const invites = [
        {
          createdAt: "2026-09-24T00:00:00.000Z",
          id: inviteId,
          placeholderId,
          role: "member",
          token: "a".repeat(64),
        },
        {
          createdAt: "2026-09-23T00:00:00.000Z",
          id: "00000000-0000-4000-8000-000000000034",
          placeholderId: null,
          role: "viewer",
          token: null,
        },
      ];
      const app = createAppWithInviteService({
        listPending: vi.fn().mockResolvedValue(invites),
      });

      const response = await app.request(
        `https://kuranote.example/ledgers/${ledgerId}/invites`,
        { method: "GET" },
      );

      expect(response.status).toBe(200);
      expect(
        pendingLedgerInvitesResponseSchema.parse(await response.json()),
      ).toEqual({ invites });
    });
  });
});
