// @vitest-environment node

import { describe, expect, it } from "vitest";

import { createSupabaseMock } from "test/supabaseMock";

import { createSupabaseLedgerSettingsRepository } from "internal/ledger/repository/ledgerSettingsRepository";
import { ledgerSettingsErrorCodes } from "internal/ledger/errors/ledgerSettings";
import { RepositoryError } from "internal/shared/errors/appError";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const otherUserId = "00000000-0000-4000-8000-000000000034";

describe("createSupabaseLedgerSettingsRepository.getMemberRole", () => {
  it("返回成员角色", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: { role: "admin" } }],
    });
    const repository = createSupabaseLedgerSettingsRepository(
      supabase.client as never,
    );

    await expect(repository.getMemberRole(ledgerId, userId)).resolves.toBe(
      "admin",
    );
  });

  it("角色值非法时转换为安全 RepositoryError", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: { role: "unexpected" } }],
    });
    const repository = createSupabaseLedgerSettingsRepository(
      supabase.client as never,
    );

    await expect(
      repository.getMemberRole(ledgerId, userId),
    ).rejects.toMatchObject({
      code: "ledger_member_role_invalid",
      message: "账本成员资料格式异常，请稍后重试。",
    });
  });

  it("非成员或查询出错时返回 null", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ data: null }] });
    const repository = createSupabaseLedgerSettingsRepository(
      supabase.client as never,
    );

    await expect(
      repository.getMemberRole(ledgerId, userId),
    ).resolves.toBeNull();
  });
});

describe("createSupabaseLedgerSettingsRepository.isLedgerActive", () => {
  it("账本存在且未归档时返回 true", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: { id: ledgerId } }],
    });
    const repository = createSupabaseLedgerSettingsRepository(
      supabase.client as never,
    );

    await expect(repository.isLedgerActive(ledgerId)).resolves.toBe(true);
  });

  it("账本不存在或已归档时返回 false", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ data: null }] });
    const repository = createSupabaseLedgerSettingsRepository(
      supabase.client as never,
    );

    await expect(repository.isLedgerActive(ledgerId)).resolves.toBe(false);
  });
});

describe("createSupabaseLedgerSettingsRepository.listActiveMembers", () => {
  it("没有成员时直接返回空数组，不再查询资料", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ data: [] }] });
    const repository = createSupabaseLedgerSettingsRepository(
      supabase.client as never,
    );

    await expect(repository.listActiveMembers(ledgerId)).resolves.toEqual([]);
    expect(supabase.queries).toHaveLength(1);
  });

  it("组合成员角色、资料与展示设置", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        {
          data: [
            { role: "owner", user_id: userId },
            { role: "member", user_id: otherUserId },
          ],
        },
        {
          data: [
            {
              avatar_url: "https://example.com/a.png",
              display_name: "淞文",
              email: "a@example.com",
              id: userId,
            },
            {
              avatar_url: null,
              display_name: "配偶资料名",
              email: "b@example.com",
              id: otherUserId,
            },
          ],
        },
        {
          data: [
            {
              display_color: "amber",
              display_name: "自定义昵称",
              user_id: userId,
            },
          ],
        },
      ],
    });
    const repository = createSupabaseLedgerSettingsRepository(
      supabase.client as never,
    );

    await expect(repository.listActiveMembers(ledgerId)).resolves.toEqual([
      {
        avatarUrl: "https://example.com/a.png",
        displayColor: "amber",
        displayName: "自定义昵称",
        email: "a@example.com",
        role: "owner",
        userId,
      },
      {
        avatarUrl: null,
        displayColor: null,
        displayName: "配偶资料名",
        email: "b@example.com",
        role: "member",
        userId: otherUserId,
      },
    ]);
  });

  it("成员查询失败时抛出 RepositoryError", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ error: { message: "connection refused" } }],
    });
    const repository = createSupabaseLedgerSettingsRepository(
      supabase.client as never,
    );

    await expect(repository.listActiveMembers(ledgerId)).rejects.toBeInstanceOf(
      RepositoryError,
    );
  });

  it("资料查询失败时抛出 RepositoryError", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: [{ role: "owner", user_id: userId }] },
        { error: { message: "connection refused" } },
        { data: [] },
      ],
    });
    const repository = createSupabaseLedgerSettingsRepository(
      supabase.client as never,
    );

    await expect(repository.listActiveMembers(ledgerId)).rejects.toBeInstanceOf(
      RepositoryError,
    );
  });

  it("展示设置查询失败时抛出 RepositoryError", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: [{ role: "owner", user_id: userId }] },
        { data: [] },
        { error: { message: "connection refused" } },
      ],
    });
    const repository = createSupabaseLedgerSettingsRepository(
      supabase.client as never,
    );

    await expect(repository.listActiveMembers(ledgerId)).rejects.toBeInstanceOf(
      RepositoryError,
    );
  });
});

describe("createSupabaseLedgerSettingsRepository.updateLedgerBaseSettings", () => {
  it("更新成功时返回 ok: true", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ count: 1 }] });
    const repository = createSupabaseLedgerSettingsRepository(
      supabase.client as never,
    );

    await expect(
      repository.updateLedgerBaseSettings(ledgerId, {
        baseCurrency: "JPY",
        ledgerName: "家庭账本",
        updatedBy: userId,
      }),
    ).resolves.toEqual({ ok: true });
  });

  it("更新账本基础设置时一并保存特殊状态开关", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ count: 1 }] });
    const repository = createSupabaseLedgerSettingsRepository(
      supabase.client as never,
    );

    await repository.updateLedgerBaseSettings(ledgerId, {
      baseCurrency: "JPY",
      ledgerName: "家庭账本",
      transactionItemSpecialStatusEnabled: true,
      updatedBy: userId,
    });

    expect(supabase.queries[0]?.calls[0]).toEqual({
      args: [
        {
          base_currency: "JPY",
          name: "家庭账本",
          transaction_item_special_status_enabled: true,
          updated_by: userId,
        },
        { count: "exact" },
      ],
      method: "update",
    });
  });

  it("count 不为 1 时返回 update_failed", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ count: 0 }] });
    const repository = createSupabaseLedgerSettingsRepository(
      supabase.client as never,
    );

    await expect(
      repository.updateLedgerBaseSettings(ledgerId, {
        baseCurrency: "JPY",
        ledgerName: "家庭账本",
        updatedBy: userId,
      }),
    ).resolves.toEqual({
      code: ledgerSettingsErrorCodes.updateFailed,
      ok: false,
    });
  });
});

describe("createSupabaseLedgerSettingsRepository.updateMemberSettings", () => {
  const input = {
    displayColor: "amber" as const,
    displayName: "配偶",
    ledgerId,
    role: "admin" as const,
    userId: otherUserId,
  };

  it("RPC 成功时返回 ok: true", async () => {
    const supabase = createSupabaseMock({ rpcResponse: {} });
    const repository = createSupabaseLedgerSettingsRepository(
      supabase.client as never,
    );

    await expect(repository.updateMemberSettings(input)).resolves.toEqual({
      ok: true,
    });
    expect(supabase.rpc).toHaveBeenCalledWith("update_ledger_member_settings", {
      p_display_color: "amber",
      p_display_name: "配偶",
      p_ledger_id: ledgerId,
      p_member_user_id: otherUserId,
      p_role: "admin",
    });
  });

  it.each([
    ["auth_required", ledgerSettingsErrorCodes.authRequired],
    ["permission_denied", ledgerSettingsErrorCodes.permissionDenied],
    ["member_not_found", ledgerSettingsErrorCodes.memberInvalid],
    ["role_invalid", ledgerSettingsErrorCodes.roleInvalid],
    ["display_color_invalid", ledgerSettingsErrorCodes.displayColorInvalid],
    ["display_name_required", ledgerSettingsErrorCodes.displayNameRequired],
    ["display_name_too_long", ledgerSettingsErrorCodes.displayNameTooLong],
  ] as const)("RPC details 返回 %s 时映射为 %s", async (details, expected) => {
    const supabase = createSupabaseMock({
      rpcResponse: { error: { details, message: "数据库业务校验失败" } },
    });
    const repository = createSupabaseLedgerSettingsRepository(
      supabase.client as never,
    );

    await expect(repository.updateMemberSettings(input)).resolves.toEqual({
      code: expected,
      ok: false,
    });
  });

  it("未知 details 即使 message 包含已知业务码也返回 RepositoryError", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: {
        error: {
          details: "unexpected_database_error",
          message: "role_invalid",
        },
      },
    });
    const repository = createSupabaseLedgerSettingsRepository(
      supabase.client as never,
    );

    await expect(repository.updateMemberSettings(input)).rejects.toMatchObject({
      code: "ledger_member_settings_update_failed",
      message: "账本成员设置保存失败，请稍后重试。",
    });
  });
});
