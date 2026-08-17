// @vitest-environment node

import { describe, expect, it } from "vitest";

import { ledgerSettingsErrorCodes } from "internal/ledger/errors/ledgerSettings";
import { createSupabaseLedgerSettingsRepository } from "internal/ledger/repository/ledgerSettingsRepository";
import { createSupabaseMock } from "test/supabaseMock";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";

describe("ledger special status disable error", () => {
  it("触发器错误码位于 message 时仍映射为业务错误", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        {
          error: {
            details: null,
            message: "special_status_has_active_items",
          },
        },
      ],
    });
    const repository = createSupabaseLedgerSettingsRepository(
      supabase.client as never,
    );

    await expect(
      repository.updateLedgerBaseSettings(ledgerId, {
        baseCurrency: "JPY",
        ledgerName: "家庭账本",
        transactionItemSpecialStatusEnabled: false,
        updatedBy: userId,
      }),
    ).resolves.toEqual({
      code: ledgerSettingsErrorCodes.specialStatusHasActiveItems,
      ok: false,
    });
  });
});
