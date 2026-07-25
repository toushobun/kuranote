// @vitest-environment node

import { describe, expect, it } from "vitest";

import { currentLedgerErrorCodes } from "internal/ledger/errors/currentLedger";
import { createSupabaseCurrentLedgerRepository } from "internal/ledger/repository/currentLedgerRepository";
import { createSupabaseMock } from "test/supabaseMock";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";

describe("createSupabaseCurrentLedgerRepository", () => {
  it("分别读取成员状态与账本状态", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: { ledger_id: ledgerId } },
        { data: { id: ledgerId } },
      ],
    });
    const repository = createSupabaseCurrentLedgerRepository(
      supabase.client as never,
    );

    await expect(repository.isActiveMember(ledgerId, userId)).resolves.toBe(
      true,
    );
    await expect(repository.isLedgerActive(ledgerId)).resolves.toBe(true);
  });

  it("成员查询失败不会伪装为非成员", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { error: { code: "XX000", message: "private database message" } },
      ],
    });
    const repository = createSupabaseCurrentLedgerRepository(
      supabase.client as never,
    );

    await expect(
      repository.isActiveMember(ledgerId, userId),
    ).rejects.toMatchObject({
      code: "current_ledger_member_lookup_failed",
      message: "账本成员信息读取失败，请稍后重试。",
    });
  });

  it("更新成功时返回 ok", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ count: 1 }] });
    const repository = createSupabaseCurrentLedgerRepository(
      supabase.client as never,
    );
    await expect(
      repository.updateCurrentLedger({ ledgerId, userId }),
    ).resolves.toEqual({ ok: true });
  });

  it("更新行数异常时返回 update_failed", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ count: 0 }] });
    const repository = createSupabaseCurrentLedgerRepository(
      supabase.client as never,
    );
    await expect(
      repository.updateCurrentLedger({ ledgerId, userId }),
    ).resolves.toEqual({
      code: currentLedgerErrorCodes.updateFailed,
      ok: false,
    });
  });

  it("更新查询失败转换为安全 RepositoryError", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { error: { code: "XX000", message: "private database message" } },
      ],
    });
    const repository = createSupabaseCurrentLedgerRepository(
      supabase.client as never,
    );

    await expect(
      repository.updateCurrentLedger({ ledgerId, userId }),
    ).rejects.toMatchObject({
      code: "current_ledger_update_failed",
      message: "当前账本切换失败，请稍后重试。",
    });
  });
});
