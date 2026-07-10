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

const rpcErrorCases = [
  ["auth_required", "42501", ledgerCreateErrorCodes.authRequired],
  ["ledger_name_required", "22023", ledgerCreateErrorCodes.nameRequired],
  ["ledger_name_too_long", "22023", ledgerCreateErrorCodes.nameTooLong],
  ["currency_invalid", "22023", ledgerCreateErrorCodes.currencyInvalid],
  [
    "display_name_required",
    "22023",
    ledgerCreateErrorCodes.displayNameRequired,
  ],
  ["display_name_too_long", "22023", ledgerCreateErrorCodes.displayNameTooLong],
  [
    "display_color_invalid",
    "22023",
    ledgerCreateErrorCodes.displayColorInvalid,
  ],
] as const;

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

  it.each(rpcErrorCases)(
    "RPC details 返回 %s 时转换为对应错误码",
    async (details, code, expectedError) => {
      const supabase = createSupabaseMock({
        rpcResponse: {
          error: {
            code,
            details,
            hint: null,
            message: "数据库业务校验失败",
          },
        },
      });
      mocks.createClient.mockResolvedValue(supabase.client);

      await expect(createLedgerService(params)).resolves.toEqual({
        error: expectedError,
        ok: false,
      });
    },
  );

  it("未知 details 即使 message 包含已知业务码也返回通用创建失败", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: {
        error: {
          code: "22023",
          details: "unexpected_database_error",
          hint: null,
          message: "display_name_required",
        },
      },
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(createLedgerService(params)).resolves.toEqual({
      error: ledgerCreateErrorCodes.createFailed,
      ok: false,
    });
  });
});
