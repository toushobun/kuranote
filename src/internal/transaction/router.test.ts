// @vitest-environment node

import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppEnv } from "internal/appEnv";
import type { RequestContainer } from "internal/container";
import type { RequestDependencies } from "internal/shared/context/requestDependencies";
import {
  AuthorizationError,
  ValidationError,
} from "internal/shared/errors/appError";
import {
  errorHandlingMiddleware,
  openApiValidationErrorHook,
} from "internal/shared/http/errorResponse";
import { transactionRouter } from "internal/transaction/router";
import {
  transactionErrorCodes,
  transactionLinkedEditErrorMessages,
} from "internal/transaction/errors";

const mocks = vi.hoisted(() => ({ revalidateTransactionMutation: vi.fn() }));

vi.mock("internal/transaction/adapter/next/revalidate", () => ({
  revalidateTransactionMutation: mocks.revalidateTransactionMutation,
}));

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const accountId = "00000000-0000-4000-8000-000000000045";
const targetAccountId = "00000000-0000-4000-8000-000000000046";
const categoryId = "00000000-0000-4000-8000-000000005072";
const merchantId = "00000000-0000-4000-8000-000000001001";
const transactionRecordId = "00000000-0000-4000-8000-000000009999";
const currentLedger = {
  baseCurrency: "JPY",
  currentUserRole: "owner" as const,
  id: ledgerId,
  name: "家庭账本",
};

function createApp(
  overrides: Partial<RequestContainer["transaction"]["service"]> = {},
  auth: RequestDependencies["auth"] = {
    email: "user@example.com",
    isAuthenticated: true,
    userId,
  },
) {
  const service = {
    createNormal: vi.fn(),
    ...overrides,
  } as RequestContainer["transaction"]["service"];
  const linkedTransactionEditService = {
    updateNormal: vi.fn(),
    void: vi.fn(),
  } as RequestContainer["transaction"]["linkedTransactionEditService"];
  const getAccessibleLedger = vi.fn().mockResolvedValue(currentLedger);
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: openApiValidationErrorHook,
  });
  app.use("*", async (c, next) => {
    c.set("container", {
      ledger: { currentLedgerService: { getAccessibleLedger } },
      transaction: { linkedTransactionEditService, service },
    } as unknown as RequestContainer);
    c.set("requestDependencies", {
      auth,
      logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
      requestId: "request-1",
      supabase: {} as never,
    });
    c.set("requestId", "request-1");
    await next();
  });
  app.onError(errorHandlingMiddleware);
  app.route("/transactions", transactionRouter);
  return { app, getAccessibleLedger, linkedTransactionEditService, service };
}

const body = {
  accountId,
  items: [{ amount: 1200, categoryId }],
  ledgerId,
  merchantId,
  note: null,
  transactionAt: "2026-06-04T01:00:00.000Z",
  type: "expense",
};

describe("transactionRouter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("创建交易后返回 201 并刷新缓存", async () => {
    const { app, service } = createApp();
    const response = await app.request("/transactions", {
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
      },
      method: "POST",
    });
    expect(response.status).toBe(201);
    expect(service.createNormal).toHaveBeenCalledWith(body);
    expect(mocks.revalidateTransactionMutation).toHaveBeenCalledOnce();
  });

  it("拒绝通过通用 HTTP 写入口直接设置已报销", async () => {
    const { app, service } = createApp();
    const response = await app.request("/transactions", {
      body: JSON.stringify({
        ...body,
        items: [{ amount: 1200, categoryId, specialStatus: "reimbursed" }],
      }),
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
      },
      method: "POST",
    });

    expect(response.status).toBe(400);
    expect(service.createNormal).not.toHaveBeenCalled();
  });

  it("更新交易后返回 200 并刷新缓存", async () => {
    const { app, getAccessibleLedger, linkedTransactionEditService, service } =
      createApp({ updateNormal: vi.fn() });
    const response = await app.request(`/transactions/${transactionRecordId}`, {
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
      },
      method: "PATCH",
    });

    expect(response.status).toBe(200);
    expect(getAccessibleLedger).toHaveBeenCalledWith({
      ledgerId,
      userId,
    });
    expect(linkedTransactionEditService.updateNormal).toHaveBeenCalledWith(
      currentLedger,
      {
        ...body,
        confirmSync: false,
        expectedUpdatedAtByItemId: {},
        transactionRecordId,
      },
    );
    expect(service.updateNormal).not.toHaveBeenCalled();
    expect(mocks.revalidateTransactionMutation).toHaveBeenCalledOnce();
  });

  it("转换交易后返回 200 并刷新缓存", async () => {
    const { app, service } = createApp({ convert: vi.fn() });
    const conversionBody = {
      accountId,
      ledgerId,
      note: null,
      targetType: "transfer",
      transactionAt: "2026-06-04T01:00:00.000Z",
      transferAmount: 1200,
      transferTargetAccountId: targetAccountId,
    };
    const response = await app.request(
      `/transactions/${transactionRecordId}/conversion`,
      {
        body: JSON.stringify(conversionBody),
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        method: "POST",
      },
    );

    expect(response.status).toBe(200);
    expect(service.convert).toHaveBeenCalledWith({
      ...conversionBody,
      transactionRecordId,
    });
    expect(mocks.revalidateTransactionMutation).toHaveBeenCalledOnce();
  });

  it("作废交易后返回 200 并刷新缓存", async () => {
    const { app, linkedTransactionEditService, service } = createApp({
      void: vi.fn(),
    });
    const response = await app.request(
      `/transactions/${transactionRecordId}?ledgerId=${ledgerId}`,
      {
        headers: { origin: "http://localhost" },
        method: "DELETE",
      },
    );

    expect(response.status).toBe(200);
    expect(linkedTransactionEditService.void).toHaveBeenCalledWith(
      currentLedger,
      { ledgerId, transactionRecordId },
    );
    expect(service.void).not.toHaveBeenCalled();
    expect(mocks.revalidateTransactionMutation).toHaveBeenCalledOnce();
  });

  it("关联保护拒绝作废时返回安全的统一 400", async () => {
    const { app, linkedTransactionEditService } = createApp();
    vi.mocked(linkedTransactionEditService.void).mockRejectedValueOnce(
      new ValidationError(
        transactionErrorCodes.linkedDeleteForbidden,
        transactionLinkedEditErrorMessages.deleteForbidden,
      ),
    );

    const response = await app.request(
      `/transactions/${transactionRecordId}?ledgerId=${ledgerId}`,
      {
        headers: { origin: "http://localhost" },
        method: "DELETE",
      },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: transactionErrorCodes.linkedDeleteForbidden,
        message: transactionLinkedEditErrorMessages.deleteForbidden,
        requestId: "request-1",
        status: 400,
      },
    });
    expect(mocks.revalidateTransactionMutation).not.toHaveBeenCalled();
  });

  it("Service 拒绝权限时返回统一 403", async () => {
    const { app } = createApp({
      createNormal: vi
        .fn()
        .mockRejectedValue(
          new AuthorizationError("permission_denied", "没有权限。"),
        ),
    });
    const response = await app.request("/transactions", {
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
      },
      method: "POST",
    });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: { code: "permission_denied", status: 403 },
    });
    expect(mocks.revalidateTransactionMutation).not.toHaveBeenCalled();
  });

  it("跨站写请求在调用 Service 前被拒绝", async () => {
    const { app, service } = createApp();
    const response = await app.request("/transactions", {
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        origin: "https://evil.example",
      },
      method: "POST",
    });
    expect(response.status).toBe(403);
    expect(service.createNormal).not.toHaveBeenCalled();
  });
});
