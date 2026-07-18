// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { routePaths } from "config/paths";
import { createLedgerService } from "server/ledger/service/ledgerService";
import type { LedgerRepository } from "server/ledger/repository/ledgerRepository";
import { ledgerCreateErrorCodes } from "server/errors/ledgerCreate";
import { AuthenticationError, ValidationError } from "server/shared/errors/appError";

function createService(overrides: Partial<LedgerRepository> = {}) {
  const ledgerRepository: LedgerRepository = {
    create: vi.fn().mockResolvedValue({ ok: true }),
    getMemberCounts: vi.fn().mockResolvedValue(new Map()),
    getUserDisplayName: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
  return { ledgerRepository, service: createLedgerService({ ledgerRepository }) };
}

const createInput = {
  baseCurrency: "JPY",
  displayColor: "amber" as const,
  displayName: "淞文",
  ledgerName: "家庭账本",
};

describe("createLedgerService.create", () => {
  it("Repository 成功时正常 resolve", async () => {
    const { service } = createService();

    await expect(service.create(createInput)).resolves.toBeUndefined();
  });

  it("Repository 返回权限错误时抛出 AuthenticationError", async () => {
    const { service } = createService({
      create: vi
        .fn()
        .mockResolvedValue({ code: ledgerCreateErrorCodes.authRequired, ok: false }),
    });

    await expect(service.create(createInput)).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });

  it("Repository 返回校验错误时抛出 ValidationError", async () => {
    const { service } = createService({
      create: vi
        .fn()
        .mockResolvedValue({ code: ledgerCreateErrorCodes.nameRequired, ok: false }),
    });

    await expect(service.create(createInput)).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});

describe("createLedgerService.getMemberCounts", () => {
  it("委托给 Repository", async () => {
    const counts = new Map([["ledger-1", 3]]);
    const { service, ledgerRepository } = createService({
      getMemberCounts: vi.fn().mockResolvedValue(counts),
    });

    await expect(service.getMemberCounts(["ledger-1"])).resolves.toBe(counts);
    expect(ledgerRepository.getMemberCounts).toHaveBeenCalledWith(["ledger-1"]);
  });
});

describe("createLedgerService.getCreateDefaults", () => {
  it("已有账本时返回账本列表页作为返回地址，没有则返回首页", async () => {
    const { service } = createService();

    await expect(
      service.getCreateDefaults({
        email: "user@example.com",
        hasCurrentLedger: true,
        userId: "user-1",
      }),
    ).resolves.toMatchObject({ backHref: routePaths.ledgers });

    await expect(
      service.getCreateDefaults({
        email: "user@example.com",
        hasCurrentLedger: false,
        userId: "user-1",
      }),
    ).resolves.toMatchObject({ backHref: routePaths.dashboard });
  });

  it("有已保存的显示名时优先使用", async () => {
    const { service } = createService({
      getUserDisplayName: vi.fn().mockResolvedValue("淞文"),
    });

    const result = await service.getCreateDefaults({
      email: "user@example.com",
      hasCurrentLedger: false,
      userId: "user-1",
    });

    expect(result.defaults.displayName).toBe("淞文");
  });

  it("没有显示名时回退为邮箱前缀，再回退为默认文案", async () => {
    const { service } = createService();

    const result = await service.getCreateDefaults({
      email: "songwen@example.com",
      hasCurrentLedger: false,
      userId: "user-1",
    });

    expect(result.defaults.displayName).toBe("songwen");

    const fallback = await service.getCreateDefaults({
      email: "@example.com",
      hasCurrentLedger: false,
      userId: "user-1",
    });

    expect(fallback.defaults.displayName).toBe("未命名用户");
  });

  it("继承的货币在可选范围内时使用，否则回退为 JPY", async () => {
    const { service } = createService();

    const inherited = await service.getCreateDefaults({
      email: "user@example.com",
      hasCurrentLedger: false,
      inheritedCurrency: "USD",
      userId: "user-1",
    });
    expect(inherited.defaults.baseCurrency).toBe("USD");

    const invalid = await service.getCreateDefaults({
      email: "user@example.com",
      hasCurrentLedger: false,
      inheritedCurrency: "not-a-currency",
      userId: "user-1",
    });
    expect(invalid.defaults.baseCurrency).toBe("JPY");
  });
});
