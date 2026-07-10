import { beforeEach, describe, expect, it, vi } from "vitest";

import { ledgerSettingsErrorCodes } from "server/errors/ledgerSettings";
import { createSupabaseMock } from "test/supabaseMock";

import { updateLedgerSettingsService } from "./ledgerSettings";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

const userId = "00000000-0000-4000-8000-000000000031";
const ledgerId = "00000000-0000-4000-8000-000000000032";
const memberUserId = "00000000-0000-4000-8000-000000000034";

const rpcErrorCases = [
  ["permission_denied", "42501", ledgerSettingsErrorCodes.permissionDenied],
  ["member_not_found", "22023", ledgerSettingsErrorCodes.memberInvalid],
  ["role_invalid", "22023", ledgerSettingsErrorCodes.roleInvalid],
  [
    "display_color_invalid",
    "22023",
    ledgerSettingsErrorCodes.displayColorInvalid,
  ],
  [
    "display_name_required",
    "22023",
    ledgerSettingsErrorCodes.displayNameRequired,
  ],
  [
    "display_name_too_long",
    "22023",
    ledgerSettingsErrorCodes.displayNameTooLong,
  ],
] as const;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateLedgerSettingsService RPC 错误映射", () => {
  it.each(rpcErrorCases)(
    "RPC details 返回 %s 时转换为对应错误码",
    async (details, code, expectedError) => {
      const supabase = createSupabaseMock({
        queryResponses: [
          { data: { role: "owner" } },
          { data: { id: ledgerId } },
        ],
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

      await expect(
        updateLedgerSettingsService({
          ledgerId,
          ledgerSettings: null,
          memberSettings: {
            displayColor: "amber",
            displayName: "配偶",
            role: "admin",
            userId: memberUserId,
          },
          userId,
        }),
      ).resolves.toEqual({ error: expectedError, ok: false });
    },
  );

  it("未知 details 即使 message 包含已知业务码也返回通用更新失败", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: { role: "owner" } }, { data: { id: ledgerId } }],
      rpcResponse: {
        error: {
          code: "22023",
          details: "unexpected_database_error",
          hint: null,
          message: "role_invalid",
        },
      },
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      updateLedgerSettingsService({
        ledgerId,
        ledgerSettings: null,
        memberSettings: {
          displayColor: "amber",
          displayName: "配偶",
          role: "admin",
          userId: memberUserId,
        },
        userId,
      }),
    ).resolves.toEqual({
      error: ledgerSettingsErrorCodes.updateFailed,
      ok: false,
    });
  });
});
