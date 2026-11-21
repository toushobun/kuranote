import { describe, expect, it, vi } from "vitest";
import { accountErrorCodes, accountErrorMessages } from "internal/account/errors";
import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";

import { loadAccountLedgerRates } from "./accountLedgerRateRepository";

function createClient(
  data: { account_id: string; ledger_rate: number | string | null }[] | null,
  error: { code: string; message: string } | null = null,
) {
  const eq = vi.fn().mockResolvedValue({ data, error });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return {
    client: { from } as unknown as AuthenticatedSupabaseClient,
    eq,
    from,
    select,
  };
}

describe("loadAccountLedgerRates", () => {
  it("读取账本账户的汇率并保留缺失汇率的 null", async () => {
    const { client, eq, from, select } = createClient([
      { account_id: "a", ledger_rate: "1.25" },
      { account_id: "b", ledger_rate: null },
    ]);
    const logger = { error: vi.fn() } as unknown as Logger;

    await expect(loadAccountLedgerRates(client, logger, "ledger-1")).resolves.toEqual(
      new Map([
        ["a", "1.25"],
        ["b", null],
      ]),
    );
    expect(from).toHaveBeenCalledWith("account_ledger_rate");
    expect(select).toHaveBeenCalledWith("account_id,ledger_rate");
    expect(eq).toHaveBeenCalledWith("ledger_id", "ledger-1");
  });

  it("数据库查询失败时返回统一仓储错误，不泄露原始异常", async () => {
    const { client } = createClient(null, {
      code: "42501",
      message: "private database connection details",
    });
    const logger = { error: vi.fn() } as unknown as Logger;

    await expect(loadAccountLedgerRates(client, logger, "ledger-1")).rejects.toMatchObject({
      code: accountErrorCodes.rateLoadFailed,
      message: accountErrorMessages[accountErrorCodes.rateLoadFailed],
    });
    expect(logger.error).toHaveBeenCalledWith(
      "[account] failed to load ledger rates",
      { code: "42501", ledgerId: "ledger-1" },
    );
  });
});
