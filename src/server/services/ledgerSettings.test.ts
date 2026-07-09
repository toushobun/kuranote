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

const params = {
  ledgerId,
  ledgerSettings: null,
  memberSettings: null,
  userId,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateLedgerSettingsService", () => {
  it("管理员可以保存账本基础信息", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: { role: "admin" } },
        { data: { id: ledgerId } },
        { count: 1 },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      updateLedgerSettingsService({
        ...params,
        ledgerSettings: {
          baseCurrency: "JPY",
          ledgerName: "家庭账本",
        },
      }),
    ).resolves.toEqual({ ok: true });

    expect(supabase.queries[2]).toEqual({
      calls: expect.arrayContaining([
        {
          args: [
            {
              base_currency: "JPY",
              name: "家庭账本",
              updated_by: userId,
            },
            { count: "exact" },
          ],
          method: "update",
        },
        { args: ["id", ledgerId], method: "eq" },
        { args: ["is_archived", false], method: "eq" },
      ]),
      response: expect.any(Object),
      table: "ledger",
    });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("管理员保存成员设置时不会顺手更新账本基础信息", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: { role: "owner" } }, { data: { id: ledgerId } }],
      rpcResponse: {},
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      updateLedgerSettingsService({
        ...params,
        memberSettings: {
          displayColor: "amber",
          displayName: "配偶",
          role: "admin",
          userId: memberUserId,
        },
      }),
    ).resolves.toEqual({ ok: true });

    expect(supabase.queries).toHaveLength(2);
    expect(supabase.rpc).toHaveBeenCalledWith("update_ledger_member_settings", {
      p_display_color: "amber",
      p_display_name: "配偶",
      p_ledger_id: ledgerId,
      p_member_user_id: memberUserId,
      p_role: "admin",
    });
  });

  it("普通成员可以保存自己的当前账本昵称和个性色", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: { role: "member" } },
        { data: { id: ledgerId } },
      ],
      rpcResponse: {},
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      updateLedgerSettingsService({
        ...params,
        memberSettings: {
          displayColor: "sakura",
          displayName: "DENG SONGWEN",
          role: "member",
          userId,
        },
      }),
    ).resolves.toEqual({ ok: true });

    expect(supabase.rpc).toHaveBeenCalledWith("update_ledger_member_settings", {
      p_display_color: "sakura",
      p_display_name: "DENG SONGWEN",
      p_ledger_id: ledgerId,
      p_member_user_id: userId,
      p_role: "member",
    });
  });

  it("普通成员篡改自己的权限时返回 permission_denied", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: { role: "member" } },
        { data: { id: ledgerId } },
      ],
      rpcResponse: {
        error: { message: "permission_denied" },
      },
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      updateLedgerSettingsService({
        ...params,
        memberSettings: {
          displayColor: "sakura",
          displayName: "DENG SONGWEN",
          role: "admin",
          userId,
        },
      }),
    ).resolves.toEqual({
      error: ledgerSettingsErrorCodes.permissionDenied,
      ok: false,
    });

    expect(supabase.rpc).toHaveBeenCalledWith("update_ledger_member_settings", {
      p_display_color: "sakura",
      p_display_name: "DENG SONGWEN",
      p_ledger_id: ledgerId,
      p_member_user_id: userId,
      p_role: "admin",
    });
  });

  it("普通成员修改账本基础信息时返回 permission_denied", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: { role: "member" } },
        { data: { id: ledgerId } },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      updateLedgerSettingsService({
        ...params,
        ledgerSettings: {
          baseCurrency: "JPY",
          ledgerName: "家庭账本",
        },
      }),
    ).resolves.toEqual({
      error: ledgerSettingsErrorCodes.permissionDenied,
      ok: false,
    });

    expect(supabase.queries).toHaveLength(2);
  });

  it("普通成员修改其他成员设置时返回 permission_denied", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: { role: "member" } },
        { data: { id: ledgerId } },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      updateLedgerSettingsService({
        ...params,
        memberSettings: {
          displayColor: "amber",
          displayName: "配偶",
          role: "admin",
          userId: memberUserId,
        },
      }),
    ).resolves.toEqual({
      error: ledgerSettingsErrorCodes.permissionDenied,
      ok: false,
    });

    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("用户不是目标账本 active 成员时返回 ledger_invalid", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: null }, { data: { id: ledgerId } }],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(updateLedgerSettingsService(params)).resolves.toEqual({
      error: ledgerSettingsErrorCodes.ledgerInvalid,
      ok: false,
    });
  });

  it("成员设置保存失败时映射错误码", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: { role: "owner" } }, { data: { id: ledgerId } }],
      rpcResponse: {
        error: { message: "role_invalid" },
      },
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      updateLedgerSettingsService({
        ...params,
        memberSettings: {
          displayColor: "amber",
          displayName: "配偶",
          role: "owner",
          userId: memberUserId,
        },
      }),
    ).resolves.toEqual({
      error: ledgerSettingsErrorCodes.roleInvalid,
      ok: false,
    });
  });
});
