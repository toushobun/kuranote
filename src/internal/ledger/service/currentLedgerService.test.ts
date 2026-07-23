// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { currentLedgerErrorCodes } from "internal/ledger/errors/currentLedger";
import { createCurrentLedgerService } from "internal/ledger/service/currentLedgerService";
import { AppError, NotFoundError } from "internal/shared/errors/appError";

const input = { ledgerId: "ledger-1", userId: "user-1" };

function createService(
  options: {
    isActiveMember?: boolean;
    isLedgerActive?: boolean;
    updateResult?: unknown;
  } = {},
) {
  return createCurrentLedgerService({
    currentLedgerRepository: {
      isActiveMember: vi.fn().mockResolvedValue(options.isActiveMember ?? true),
      isLedgerActive: vi.fn().mockResolvedValue(options.isLedgerActive ?? true),
      updateCurrentLedger: vi
        .fn()
        .mockResolvedValue(options.updateResult ?? { ok: true }),
    },
  });
}

describe("createCurrentLedgerService.switch", () => {
  it("active 成员且账本有效时更新当前账本", async () => {
    await expect(createService().switch(input)).resolves.toBeUndefined();
  });

  it.each([
    { isActiveMember: false, isLedgerActive: true },
    { isActiveMember: true, isLedgerActive: false },
  ])("成员或账本无效时抛出 NotFoundError", async (options) => {
    await expect(createService(options).switch(input)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("更新失败时抛出通用 AppError", async () => {
    const error = await createService({
      updateResult: { code: currentLedgerErrorCodes.updateFailed, ok: false },
    })
      .switch(input)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AppError);
    expect(error).not.toBeInstanceOf(NotFoundError);
  });
});
