import { beforeEach, describe, expect, it, vi } from "vitest";

import { currentLedgerErrorCodes } from "server/errors/currentLedger";
import { createSupabaseMock } from "test/supabaseMock";

import { updateCurrentLedgerService } from "./currentLedger";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

const userId = "00000000-0000-4000-8000-000000000031";
const ledgerId = "00000000-0000-4000-8000-000000000032";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateCurrentLedgerService", () => {
  it("active 成员可以更新当前账本", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: { ledger_id: ledgerId } },
        { data: { id: ledgerId } },
        { count: 1 },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      updateCurrentLedgerService({ ledgerId, userId }),
    ).resolves.toEqual({ ok: true });

    expect(supabase.queries[0]).toEqual({
      calls: [
        { args: ["ledger_id"], method: "select" },
        { args: ["ledger_id", ledgerId], method: "eq" },
        { args: ["user_id", userId], method: "eq" },
        { args: ["status", "active"], method: "eq" },
        { args: [], method: "maybeSingle" },
      ],
      response: expect.any(Object),
      table: "ledger_member",
    });
    expect(supabase.queries[2].calls).toEqual(
      expect.arrayContaining([
        {
          args: [
            {
              current_ledger_id: ledgerId,
              updated_by: userId,
            },
            { count: "exact" },
          ],
          method: "update",
        },
        { args: ["id", userId], method: "eq" },
        { args: ["status", "active"], method: "eq" },
      ]),
    );
  });

  it("用户不是 active 成员时返回 ledger_invalid", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: null }],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      updateCurrentLedgerService({ ledgerId, userId }),
    ).resolves.toEqual({
      error: currentLedgerErrorCodes.ledgerInvalid,
      ok: false,
    });

    expect(supabase.queries).toHaveLength(1);
  });

  it("目标账本不存在或已归档时返回 ledger_invalid", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: { ledger_id: ledgerId } }, { data: null }],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      updateCurrentLedgerService({ ledgerId, userId }),
    ).resolves.toEqual({
      error: currentLedgerErrorCodes.ledgerInvalid,
      ok: false,
    });
  });

  it("更新用户当前账本没有命中记录时返回 update_failed", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: { ledger_id: ledgerId } },
        { data: { id: ledgerId } },
        { count: 0 },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      updateCurrentLedgerService({ ledgerId, userId }),
    ).resolves.toEqual({
      error: currentLedgerErrorCodes.updateFailed,
      ok: false,
    });
  });

  it("更新用户当前账本数据库错误时返回 update_failed", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: { ledger_id: ledgerId } },
        { data: { id: ledgerId } },
        { count: 1, error: { message: "update failed" } },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      updateCurrentLedgerService({ ledgerId, userId }),
    ).resolves.toEqual({
      error: currentLedgerErrorCodes.updateFailed,
      ok: false,
    });
  });
});
