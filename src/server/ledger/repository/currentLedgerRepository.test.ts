// @vitest-environment node

import { describe, expect, it } from "vitest";

import { createSupabaseMock } from "test/supabaseMock";

import { createSupabaseCurrentLedgerRepository } from "server/ledger/repository/currentLedgerRepository";
import { currentLedgerErrorCodes } from "server/errors/currentLedger";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";

describe("createSupabaseCurrentLedgerRepository.switch", () => {
  it("成功时更新 app_user.current_ledger_id 并返回 ok: true", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: { ledger_id: ledgerId } },
        { data: { id: ledgerId } },
        { count: 1 },
      ],
    });
    const repository = createSupabaseCurrentLedgerRepository(
      supabase.client as never,
    );

    await expect(repository.switch({ ledgerId, userId })).resolves.toEqual({
      ok: true,
    });

    expect(supabase.queries[2].table).toBe("app_user");
    expect(supabase.queries[2].calls).toContainEqual({
      args: [
        { current_ledger_id: ledgerId, updated_by: userId },
        { count: "exact" },
      ],
      method: "update",
    });
  });

  it("当前用户不是该账本 active 成员时返回 ledger_invalid", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: null }],
    });
    const repository = createSupabaseCurrentLedgerRepository(
      supabase.client as never,
    );

    await expect(repository.switch({ ledgerId, userId })).resolves.toEqual({
      code: currentLedgerErrorCodes.ledgerInvalid,
      ok: false,
    });
  });

  it("账本不存在或已归档时返回 ledger_invalid", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: { ledger_id: ledgerId } }, { data: null }],
    });
    const repository = createSupabaseCurrentLedgerRepository(
      supabase.client as never,
    );

    await expect(repository.switch({ ledgerId, userId })).resolves.toEqual({
      code: currentLedgerErrorCodes.ledgerInvalid,
      ok: false,
    });
  });

  it("更新失败（count !== 1）时返回 update_failed", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: { ledger_id: ledgerId } },
        { data: { id: ledgerId } },
        { count: 0 },
      ],
    });
    const repository = createSupabaseCurrentLedgerRepository(
      supabase.client as never,
    );

    await expect(repository.switch({ ledgerId, userId })).resolves.toEqual({
      code: currentLedgerErrorCodes.updateFailed,
      ok: false,
    });
  });
});
