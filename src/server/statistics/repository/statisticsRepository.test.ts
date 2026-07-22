// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { RepositoryError } from "server/shared/errors/appError";
import { createSupabaseStatisticsRepository } from "server/statistics/repository/statisticsRepository";
import { createSupabaseMock } from "test/supabaseMock";

const ledgerId = "00000000-0000-4000-8000-000000000032";

function createLogger() {
  return { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
}

describe("createSupabaseStatisticsRepository", () => {
  it("只读取指定的未归档账本并转换字段", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        {
          data: {
            base_currency: "JPY",
            id: ledgerId,
            name: "家庭账本",
          },
        },
      ],
    });
    const repository = createSupabaseStatisticsRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(repository.findLedger(ledgerId)).resolves.toEqual({
      baseCurrency: "JPY",
      id: ledgerId,
      name: "家庭账本",
    });
    expect(supabase.queries[0].calls).toEqual(
      expect.arrayContaining([
        { args: ["id", ledgerId], method: "eq" },
        { args: ["is_archived", false], method: "eq" },
        { args: [], method: "maybeSingle" },
      ]),
    );
  });

  it("Dashboard 账户只读取当前账本的未归档记录并保持排序", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ data: [] }] });
    const repository = createSupabaseStatisticsRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(repository.listDashboardAccounts(ledgerId)).resolves.toEqual(
      [],
    );
    expect(supabase.queries[0].table).toBe("account");
    expect(supabase.queries[0].calls).toEqual(
      expect.arrayContaining([
        { args: ["ledger_id", ledgerId], method: "eq" },
        { args: ["is_archived", false], method: "eq" },
        { args: ["sort_order", { ascending: true }], method: "order" },
        { args: ["created_at", { ascending: true }], method: "order" },
      ]),
    );
  });

  it("月度统计没有交易时不会继续查询明细和关联主数据", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ data: [] }] });
    const repository = createSupabaseStatisticsRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(
      repository.loadMonthlySource({
        dateEnd: "2026-06-30T15:00:00.000Z",
        dateStart: "2026-05-31T15:00:00.000Z",
        ledgerId,
      }),
    ).resolves.toEqual({
      categories: [],
      items: [],
      merchants: [],
      records: [],
    });
    expect(supabase.queries).toHaveLength(1);
    expect(supabase.queries[0].table).toBe("transaction_record");
    expect(supabase.queries[0].calls).toEqual(
      expect.arrayContaining([
        { args: ["ledger_id", ledgerId], method: "eq" },
        { args: ["status", "active"], method: "eq" },
        { args: ["type", "normal"], method: "eq" },
        {
          args: ["transaction_at", "2026-05-31T15:00:00.000Z"],
          method: "gte",
        },
        {
          args: ["transaction_at", "2026-06-30T15:00:00.000Z"],
          method: "lt",
        },
      ]),
    );
  });

  it("Supabase 错误只记录数据库代码并转换为安全错误", async () => {
    const logger = createLogger();
    const supabase = createSupabaseMock({
      queryResponses: [
        { error: { code: "XX000", message: "private database detail" } },
      ],
    });
    const repository = createSupabaseStatisticsRepository(
      supabase.client as never,
      logger,
    );

    await expect(repository.findLedger(ledgerId)).rejects.toBeInstanceOf(
      RepositoryError,
    );
    expect(logger.error).toHaveBeenCalledWith(
      "[statistics] failed to load ledger",
      expect.objectContaining({ databaseCode: "XX000", ledgerId }),
    );
    expect(logger.error).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ databaseMessage: expect.anything() }),
    );
  });
});
