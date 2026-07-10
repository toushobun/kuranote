import { beforeEach, describe, expect, it, vi } from "vitest";

import { ledgerCreateErrorCodes } from "server/errors/ledgerCreate";
import { createSupabaseMock } from "test/supabaseMock";

import { createLedgerService } from "./ledgerCreate";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

const params = {
  baseCurrency: "JPY",
  displayColor: "amber" as const,
  displayName: "淞文",
  ledgerName: "家庭账本",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createLedgerService", () => {
  it("调用原子化 RPC 创建账本和初始化数据", async () => {
    const supabase = createSupabaseMock();
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(createLedgerService(params)).resolves.toEqual({ ok: true });
    expect(supabase.rpc).toHaveBeenCalledWith(
      "create_ledger_with_owner_settings",
      {
        p_base_currency: "JPY",
        p_display_color: "amber",
        p_display_name: "淞文",
        p_name: "家庭账本",
      },
    );
  });

  it("RPC 返回显示名错误时转换为对应错误码", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: { error: { message: "display_name_required" } },
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(createLedgerService(params)).resolves.toEqual({
      error: ledgerCreateErrorCodes.displayNameRequired,
      ok: false,
    });
  });

  it("未知数据库错误时返回通用创建失败", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: { error: { message: "unexpected database error" } },
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(createLedgerService(params)).resolves.toEqual({
      error: ledgerCreateErrorCodes.createFailed,
      ok: false,
    });
  });
});
