// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createCurrentLedgerService } from "server/ledger/service/currentLedgerService";
import type { CurrentLedgerRepository } from "server/ledger/repository/currentLedgerRepository";
import { currentLedgerErrorCodes } from "server/errors/currentLedger";
import { AppError, NotFoundError } from "server/shared/errors/appError";

function createService(
  switchFn: CurrentLedgerRepository["switch"],
): ReturnType<typeof createCurrentLedgerService> {
  return createCurrentLedgerService({
    currentLedgerRepository: { switch: switchFn },
  });
}

const input = { ledgerId: "ledger-1", userId: "user-1" };

describe("createCurrentLedgerService.switch", () => {
  it("Repository 返回成功时正常 resolve", async () => {
    const service = createService(vi.fn().mockResolvedValue({ ok: true }));

    await expect(service.switch(input)).resolves.toBeUndefined();
  });

  it("Repository 返回 ledger_invalid 时抛出 NotFoundError", async () => {
    const service = createService(
      vi.fn().mockResolvedValue({
        code: currentLedgerErrorCodes.ledgerInvalid,
        ok: false,
      }),
    );

    await expect(service.switch(input)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("Repository 返回其他错误时抛出通用 AppError", async () => {
    const service = createService(
      vi.fn().mockResolvedValue({
        code: currentLedgerErrorCodes.updateFailed,
        ok: false,
      }),
    );

    const error = await service.switch(input).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AppError);
    expect(error).not.toBeInstanceOf(NotFoundError);
    expect((error as AppError).code).toBe(currentLedgerErrorCodes.updateFailed);
  });
});
