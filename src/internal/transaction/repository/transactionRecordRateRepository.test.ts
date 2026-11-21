import { describe, expect, it, vi } from "vitest";

import {
  transactionLoadErrorCodes,
  transactionLoadErrorMessages,
} from "internal/transaction/errors";
import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";

import { loadTransactionRecordLedgerRates } from "./transactionRecordRateRepository";

const ledgerId = "00000000-0000-4000-8000-000000000032";

function createClient(
  data:
    | {
        record_id: string;
        currency: string | null;
        ledger_rate: number | string | null;
      }[]
    | null,
  error: { code: string; message: string } | null = null,
) {
  const inQuery = vi.fn().mockResolvedValue({ data, error });
  const eq = vi.fn().mockReturnValue({ in: inQuery });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return {
    client: { from } as unknown as AuthenticatedSupabaseClient,
    from,
    select,
    eq,
    inQuery,
  };
}

describe("loadTransactionRecordLedgerRates", () => {
  it("读取指定账本的记录汇率，并保留缺失汇率的 null", async () => {
    const { client, from, select, eq, inQuery } = createClient([
      { record_id: "record-1", currency: "USD", ledger_rate: "150.5" },
      { record_id: "record-2", currency: "CNY", ledger_rate: null },
    ]);
    const logger = { error: vi.fn() } as unknown as Logger;

    await expect(
      loadTransactionRecordLedgerRates(client, logger, ledgerId, [
        "record-1",
        "record-2",
        "record-1",
      ]),
    ).resolves.toEqual([
      { record_id: "record-1", record_currency: "USD", ledger_rate: "150.5" },
      { record_id: "record-2", record_currency: "CNY", ledger_rate: null },
    ]);
    expect(from).toHaveBeenCalledExactlyOnceWith(
      "transaction_record_ledger_rate",
    );
    expect(select).toHaveBeenCalledWith("record_id,currency,ledger_rate");
    expect(eq).toHaveBeenCalledWith("ledger_id", ledgerId);
    expect(inQuery).toHaveBeenCalledWith("record_id", ["record-1", "record-2"]);
  });

  it("没有记录 ID 时直接返回空数组，不执行数据库查询", async () => {
    const { client, from } = createClient([]);
    const logger = { error: vi.fn() } as unknown as Logger;
    await expect(
      loadTransactionRecordLedgerRates(client, logger, ledgerId, []),
    ).resolves.toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });

  it("数据库失败时返回统一错误码和安全文案，不泄露底层异常", async () => {
    const { client } = createClient(null, {
      code: "42501",
      message: "private connection string",
    });
    const logger = { error: vi.fn() } as unknown as Logger;

    await expect(
      loadTransactionRecordLedgerRates(client, logger, ledgerId, ["record-1"]),
    ).rejects.toMatchObject({
      code: transactionLoadErrorCodes.recordRatesLoadFailed,
      message: transactionLoadErrorMessages.recordsLoadFailed,
    });
    expect(logger.error).toHaveBeenCalledWith(
      "[transaction] failed to load record exchange rates",
      { databaseCode: "42501", ledgerId },
    );
  });
});
