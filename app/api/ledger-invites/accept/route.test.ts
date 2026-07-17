import { beforeEach, describe, expect, it, vi } from "vitest";

import { ledgerInviteErrorCodes } from "server/errors/ledgerInvite";

import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  acceptLedgerInviteService: vi.fn(),
  revalidateCurrentLedgerPaths: vi.fn(),
}));

vi.mock("server/cache/currentLedger", () => ({
  revalidateCurrentLedgerPaths: mocks.revalidateCurrentLedgerPaths,
}));

vi.mock("server/services/ledgerInvite", () => ({
  acceptLedgerInviteService: mocks.acceptLedgerInviteService,
}));

const token = "a".repeat(64);

function createRequest(body: unknown) {
  return new Request("https://kuranote.test/api/ledger-invites/accept", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.acceptLedgerInviteService.mockResolvedValue({ ok: true });
});

describe("POST /api/ledger-invites/accept", () => {
  it("接受邀请成功时返回 200", async () => {
    const response = await POST(createRequest({ token }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.revalidateCurrentLedgerPaths).toHaveBeenCalledTimes(1);
  });

  it("token 无效时返回 404 和统一错误结构", async () => {
    const response = await POST(createRequest({ token: "invalid" }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: ledgerInviteErrorCodes.inviteInvalid,
        message: "该邀请链接无效或已失效。",
        status: 404,
      },
    });
    expect(mocks.acceptLedgerInviteService).not.toHaveBeenCalled();
  });

  it("未登录时返回 401", async () => {
    mocks.acceptLedgerInviteService.mockResolvedValue({
      error: ledgerInviteErrorCodes.authRequired,
      ok: false,
    });

    const response = await POST(createRequest({ token }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: ledgerInviteErrorCodes.authRequired,
        status: 401,
      },
    });
  });

  it("邀请已撤销时返回 409", async () => {
    mocks.acceptLedgerInviteService.mockResolvedValue({
      error: ledgerInviteErrorCodes.inviteAlreadyRevoked,
      ok: false,
    });

    const response = await POST(createRequest({ token }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: ledgerInviteErrorCodes.inviteAlreadyRevoked,
        status: 409,
      },
    });
  });

  it("未知异常时记录日志并返回 500", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.acceptLedgerInviteService.mockRejectedValue(error);

    const response = await POST(createRequest({ token }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: ledgerInviteErrorCodes.acceptFailed,
        status: 500,
      },
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[ledgerInvite] failed to accept invite route",
      error,
    );

    consoleError.mockRestore();
  });
});
