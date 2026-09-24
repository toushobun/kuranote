// @vitest-environment node

import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { revalidatePath } from "next/cache";

import type { AppEnv } from "internal/appEnv";
import type { RequestContainer } from "internal/container";
import { ledgerInviteRouter } from "internal/ledger/inviteRouter";
import { getLedgerInviteErrorMessage } from "internal/ledger/errors/ledgerInvite";
import { acceptLedgerInviteResponseSchema } from "internal/ledger/schema";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
} from "internal/shared/errors/appError";
import { errorHandlingMiddleware } from "internal/shared/http/errorResponse";

function createTestApp(container: RequestContainer) {
  const app = new OpenAPIHono<AppEnv>();
  app.use("*", async (c, next) => {
    c.set("container", container);
    c.set("requestId", "test-request-id");
    await next();
  });
  app.onError(errorHandlingMiddleware);
  app.route("/ledger-invites", ledgerInviteRouter);
  return app;
}

function containerWithAccept(
  accept: RequestContainer["ledger"]["inviteService"]["accept"],
): RequestContainer {
  return {
    account: {} as RequestContainer["account"],
    auth: {} as RequestContainer["auth"],
    category: {} as RequestContainer["category"],
    dataImport: {} as RequestContainer["dataImport"],
    dataExport: {} as RequestContainer["dataExport"],
    ledger: {
      currentLedgerService:
        {} as RequestContainer["ledger"]["currentLedgerService"],
      inviteService: {
        accept,
        create: vi.fn(),
        inviteMember: vi.fn(),
        listPending: vi.fn(),
        revoke: vi.fn(),
      },
      invitePreviewService:
        {} as RequestContainer["ledger"]["invitePreviewService"],
      placeholderMemberService:
        {} as RequestContainer["ledger"]["placeholderMemberService"],
      service: {} as RequestContainer["ledger"]["service"],
      settingsService: {} as RequestContainer["ledger"]["settingsService"],
    },
    merchant: {} as RequestContainer["merchant"],
    statistics: {} as RequestContainer["statistics"],
    transaction: {} as RequestContainer["transaction"],
    user: {} as RequestContainer["user"],
  };
}

const acceptUrl = "https://kuranote.example/ledger-invites/accept";
const sameOriginHeaders = {
  "content-type": "application/json",
  origin: "https://kuranote.example",
};
// isValidLedgerInviteToken 要求 64 位十六进制字符串。
const validToken = "a".repeat(64);

describe("ledger invite router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("同源、Schema 校验通过且 Service 成功时返回 200，并触发缓存失效", async () => {
    const accept = vi.fn().mockResolvedValue({
      ledgerId: "00000000-0000-4000-8000-000000000032",
      placeholderId: null,
      result: "joined",
    });
    const app = createTestApp(containerWithAccept(accept));

    const response = await app.request(acceptUrl, {
      body: JSON.stringify({ token: validToken }),
      headers: sameOriginHeaders,
      method: "POST",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(accept).toHaveBeenCalledWith(validToken);
    expect(revalidatePath).toHaveBeenCalled();
  });

  it("缺少 Origin 时返回 403，且不调用 Service", async () => {
    const accept = vi.fn();
    const app = createTestApp(containerWithAccept(accept));

    const response = await app.request(acceptUrl, {
      body: JSON.stringify({ token: validToken }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(403);
    expect(accept).not.toHaveBeenCalled();
  });

  it("请求体缺少 token 时返回 400", async () => {
    const app = createTestApp(containerWithAccept(vi.fn()));

    const response = await app.request(acceptUrl, {
      body: JSON.stringify({}),
      headers: sameOriginHeaders,
      method: "POST",
    });

    expect(response.status).toBe(400);
  });

  it.each(["valid-token", "not-hex-format", "a".repeat(63), ""])(
    "token 格式不合法（%s）时返回 400，且不调用 Service",
    async (token) => {
      const accept = vi.fn();
      const app = createTestApp(containerWithAccept(accept));

      const response = await app.request(acceptUrl, {
        body: JSON.stringify({ token }),
        headers: sameOriginHeaders,
        method: "POST",
      });

      expect(response.status).toBe(400);
      expect(accept).not.toHaveBeenCalled();
    },
  );

  it("Service 抛出应用错误时返回对应状态码，且不触发缓存失效", async () => {
    const accept = vi
      .fn()
      .mockRejectedValue(new AuthenticationError("auth_required", "请先登录"));
    const app = createTestApp(containerWithAccept(accept));

    const response = await app.request(acceptUrl, {
      body: JSON.stringify({ token: validToken }),
      headers: sameOriginHeaders,
      method: "POST",
    });

    expect(response.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("邀请已被使用时返回 409", async () => {
    const accept = vi
      .fn()
      .mockRejectedValue(new ConflictError("invite_already_used", "已使用"));
    const app = createTestApp(containerWithAccept(accept));

    const response = await app.request(acceptUrl, {
      body: JSON.stringify({ token: validToken }),
      headers: sameOriginHeaders,
      method: "POST",
    });

    expect(response.status).toBe(409);
  });

  it("认领成功时仍返回 { ok: true }，响应符合 OpenAPI", async () => {
    const accept = vi.fn().mockResolvedValue({
      ledgerId: "00000000-0000-4000-8000-000000000032",
      placeholderId: "00000000-0000-4000-8000-000000000051",
      result: "claimed",
    });
    const app = createTestApp(containerWithAccept(accept));

    const response = await app.request(acceptUrl, {
      body: JSON.stringify({ token: validToken }),
      headers: sameOriginHeaders,
      method: "POST",
    });

    expect(response.status).toBe(200);
    expect(
      acceptLedgerInviteResponseSchema.parse(await response.json()),
    ).toEqual({ ok: true });
    expect(revalidatePath).toHaveBeenCalled();
  });

  it.each([
    "placeholder_claim_existing_member",
    "placeholder_claim_account_name_conflict",
    "placeholder_already_claimed",
  ] as const)("%s 时返回 409 与安全响应体，且不触发缓存失效", async (code) => {
    const message = getLedgerInviteErrorMessage(code)!;
    const accept = vi.fn().mockRejectedValue(new ConflictError(code, message));
    const app = createTestApp(containerWithAccept(accept));

    const response = await app.request(acceptUrl, {
      body: JSON.stringify({ token: validToken }),
      headers: sameOriginHeaders,
      method: "POST",
    });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: { code, message, requestId: "test-request-id", status: 409 },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("user_inactive 时返回 403 与安全响应体，且不触发缓存失效", async () => {
    const code = "user_inactive";
    const message = getLedgerInviteErrorMessage(code)!;
    const accept = vi
      .fn()
      .mockRejectedValue(new AuthorizationError(code, message));
    const app = createTestApp(containerWithAccept(accept));

    const response = await app.request(acceptUrl, {
      body: JSON.stringify({ token: validToken }),
      headers: sameOriginHeaders,
      method: "POST",
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: { code, message, requestId: "test-request-id", status: 403 },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("未知异常返回 500 且不泄露约束名称", async () => {
    const accept = vi
      .fn()
      .mockRejectedValue(
        new Error(
          'duplicate key value violates unique constraint "account_active_name_unique"',
        ),
      );
    const app = createTestApp(containerWithAccept(accept));

    const response = await app.request(acceptUrl, {
      body: JSON.stringify({ token: validToken }),
      headers: sameOriginHeaders,
      method: "POST",
    });
    const text = await response.text();

    expect(response.status).toBe(500);
    expect(JSON.parse(text)).toMatchObject({
      error: { requestId: "test-request-id", status: 500 },
    });
    expect(text).not.toContain("account_active_name_unique");
  });
});
