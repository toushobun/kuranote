import { describe, expect, it, vi } from "vitest";

import { ledgerSetupDraftMaxBytes } from "internal/ledger/entity/ledgerSetup";
import {
  ledgerCreateErrorCodes,
  ledgerCreateErrorMessages,
} from "internal/ledger/errors/ledgerCreate";
import {
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
} from "internal/ledger/errors/ledgerSetup";
import type { LedgerSetupRepository } from "internal/ledger/repository/ledgerSetupRepository";
import { createLedgerSetupService } from "internal/ledger/service/ledgerSetupService";
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "internal/shared/errors/appError";

const ledgerId = "00000000-0000-4000-8000-000000000001";

const basicInfo = {
  baseCurrency: "JPY",
  displayColor: "amber" as const,
  displayName: "淞文",
  ledgerName: "家庭账本",
};

function createRepository(
  overrides: Partial<LedgerSetupRepository> = {},
): LedgerSetupRepository {
  return {
    create: vi.fn(async () => ({ ledgerId, ok: true as const })),
    findCurrentUserSetupLedger: vi.fn(async () => null),
    saveDraft: vi.fn(async () => ({ ok: true as const })),
    updateBasicInfo: vi.fn(async () => ({ ok: true as const })),
    ...overrides,
  };
}

describe("createLedgerSetupService.create", () => {
  it("创建成功时返回新账本 ID", async () => {
    const ledgerSetupRepository = createRepository();
    const service = createLedgerSetupService({ ledgerSetupRepository });

    await expect(service.create(basicInfo)).resolves.toEqual({ ledgerId });
    expect(ledgerSetupRepository.create).toHaveBeenCalledWith(basicInfo);
  });

  it("已有创建中账本时抛出 ConflictError", async () => {
    const service = createLedgerSetupService({
      ledgerSetupRepository: createRepository({
        create: vi.fn(async () => ({
          code: ledgerSetupErrorCodes.inProgressExists,
          ok: false as const,
        })),
      }),
    });

    const error = await service.create(basicInfo).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ConflictError);
    expect(error).toMatchObject({
      code: ledgerSetupErrorCodes.inProgressExists,
      message: ledgerSetupErrorMessages[ledgerSetupErrorCodes.inProgressExists],
    });
  });

  it("基本信息错误沿用账本创建的错误语义与文案", async () => {
    const service = createLedgerSetupService({
      ledgerSetupRepository: createRepository({
        create: vi.fn(async () => ({
          code: ledgerCreateErrorCodes.nameRequired,
          ok: false as const,
        })),
      }),
    });

    const error = await service.create(basicInfo).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toMatchObject({
      message: ledgerCreateErrorMessages[ledgerCreateErrorCodes.nameRequired],
    });
  });

  it("登录失效时抛出 AuthenticationError", async () => {
    const service = createLedgerSetupService({
      ledgerSetupRepository: createRepository({
        create: vi.fn(async () => ({
          code: ledgerCreateErrorCodes.authRequired,
          ok: false as const,
        })),
      }),
    });

    await expect(service.create(basicInfo)).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });
});

describe("createLedgerSetupService.getCurrentUserSetup", () => {
  it("返回 Repository 读取的创建中账本", async () => {
    const setup = {
      baseCurrency: "JPY",
      draft: {},
      id: ledgerId,
      name: "家庭账本",
      step: 2,
    };
    const service = createLedgerSetupService({
      ledgerSetupRepository: createRepository({
        findCurrentUserSetupLedger: vi.fn(async () => setup),
      }),
    });

    await expect(service.getCurrentUserSetup()).resolves.toEqual(setup);
  });
});

describe("createLedgerSetupService.saveDraft", () => {
  it("校验通过后保存草稿", async () => {
    const ledgerSetupRepository = createRepository();
    const service = createLedgerSetupService({ ledgerSetupRepository });

    await service.saveDraft({ draft: { accounts: [] }, ledgerId, step: 3 });

    expect(ledgerSetupRepository.saveDraft).toHaveBeenCalledWith({
      draft: { accounts: [] },
      ledgerId,
      step: 3,
    });
  });

  it.each([
    [{ draft: {}, step: 6 }, ledgerSetupErrorCodes.stepInvalid],
    [{ draft: [], step: 2 }, ledgerSetupErrorCodes.draftInvalid],
    [
      { draft: { note: "x".repeat(ledgerSetupDraftMaxBytes) }, step: 2 },
      ledgerSetupErrorCodes.draftTooLarge,
    ],
  ])("输入不合法时抛出 ValidationError 且不访问数据库", async (input, code) => {
    const ledgerSetupRepository = createRepository();
    const service = createLedgerSetupService({ ledgerSetupRepository });

    const error = await service
      .saveDraft({ ...input, ledgerId })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toMatchObject({ code });
    expect(ledgerSetupRepository.saveDraft).not.toHaveBeenCalled();
  });

  it.each([
    [ledgerSetupErrorCodes.notFound, NotFoundError],
    [ledgerSetupErrorCodes.notInProgress, ConflictError],
    [ledgerSetupErrorCodes.draftTooLarge, ValidationError],
  ] as const)(
    "数据库返回 %s 时转换为对应应用错误",
    async (code, errorClass) => {
      const service = createLedgerSetupService({
        ledgerSetupRepository: createRepository({
          saveDraft: vi.fn(async () => ({ code, ok: false as const })),
        }),
      });

      const error = await service
        .saveDraft({ draft: {}, ledgerId, step: 2 })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(errorClass);
      expect(error).toMatchObject({
        code,
        message: ledgerSetupErrorMessages[code],
      });
    },
  );
});

describe("createLedgerSetupService.updateBasicInfo", () => {
  it("更新成功时把输入交给 Repository", async () => {
    const ledgerSetupRepository = createRepository();
    const service = createLedgerSetupService({ ledgerSetupRepository });

    await service.updateBasicInfo({ ...basicInfo, ledgerId });

    expect(ledgerSetupRepository.updateBasicInfo).toHaveBeenCalledWith({
      ...basicInfo,
      ledgerId,
    });
  });

  it("非 owner 或不存在时抛出 NotFoundError", async () => {
    const service = createLedgerSetupService({
      ledgerSetupRepository: createRepository({
        updateBasicInfo: vi.fn(async () => ({
          code: ledgerSetupErrorCodes.notFound,
          ok: false as const,
        })),
      }),
    });

    await expect(
      service.updateBasicInfo({ ...basicInfo, ledgerId }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
