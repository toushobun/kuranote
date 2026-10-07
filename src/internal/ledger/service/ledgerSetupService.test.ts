import { describe, expect, it, vi } from "vitest";

import { getLedgerSetupTemplate } from "internal/ledger/entity/ledgerSetupTemplate/ledgerSetupTemplate";
import {
  ledgerCreateErrorCodes,
  ledgerCreateErrorMessages,
} from "internal/ledger/errors/ledgerCreate";
import {
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
} from "internal/ledger/errors/ledgerSetup";
import type {
  LedgerSetupRecord,
  LedgerSetupRepository,
} from "internal/ledger/repository/ledgerSetupRepository";
import type { StoredLedgerSetupDraft } from "internal/ledger/schema/ledgerSetupDraft";
import { createLedgerSetupService } from "internal/ledger/service/ledgerSetupService";
import { createDefaultLedgerSetupDraft } from "internal/ledger/util/ledgerSetupDraft";
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "internal/shared/errors/appError";

const ledgerId = "00000000-0000-4000-8000-000000000001";
const userId = "00000000-0000-4000-8000-000000000031";

const draft = createDefaultLedgerSetupDraft("JPY");

function createRecord(
  storedDraft: StoredLedgerSetupDraft,
  overrides: Partial<LedgerSetupRecord> = {},
): LedgerSetupRecord {
  return {
    baseCurrency: "JPY",
    displayColor: "amber",
    displayName: "淞文",
    id: ledgerId,
    name: "家庭账本",
    step: 5,
    storedDraft,
    ...overrides,
  };
}

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
    complete: vi.fn(async () => ({ ok: true as const })),
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
    const service = createLedgerSetupService({
      currentUserId: userId,
      ledgerSetupRepository,
    });

    await expect(service.create(basicInfo)).resolves.toEqual({ ledgerId });
    expect(ledgerSetupRepository.create).toHaveBeenCalledWith(basicInfo);
  });

  it("已有创建中账本时抛出 ConflictError", async () => {
    const service = createLedgerSetupService({
      currentUserId: userId,
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
      currentUserId: userId,
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
      currentUserId: userId,
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
  it("按账本当前默认货币的模板补全草稿", async () => {
    const ledgerSetupRepository = createRepository({
      findCurrentUserSetupLedger: vi.fn(async () =>
        createRecord({}, { step: 2 }),
      ),
    });
    const service = createLedgerSetupService({
      currentUserId: userId,
      ledgerSetupRepository,
    });

    await expect(service.getCurrentUserSetup()).resolves.toEqual({
      baseCurrency: "JPY",
      displayColor: "amber",
      displayName: "淞文",
      draft,
      hasTemplateSelections: false,
      id: ledgerId,
      name: "家庭账本",
      step: 2,
    });
    expect(
      ledgerSetupRepository.findCurrentUserSetupLedger,
    ).toHaveBeenCalledWith(userId);
  });

  it.each([
    ["已保存账户选择", { accounts: draft.accounts }],
    ["已保存商家选择", { merchants: draft.merchants }],
  ])("%s时标记为已有模板相关选择", async (_label, storedDraft) => {
    const service = createLedgerSetupService({
      currentUserId: userId,
      ledgerSetupRepository: createRepository({
        findCurrentUserSetupLedger: vi.fn(async () =>
          createRecord(storedDraft),
        ),
      }),
    });

    await expect(service.getCurrentUserSetup()).resolves.toMatchObject({
      hasTemplateSelections: true,
    });
  });

  it("未登录时抛出 AuthenticationError 且不查询", async () => {
    const ledgerSetupRepository = createRepository();
    const service = createLedgerSetupService({
      currentUserId: null,
      ledgerSetupRepository,
    });

    await expect(service.getCurrentUserSetup()).rejects.toBeInstanceOf(
      AuthenticationError,
    );
    expect(
      ledgerSetupRepository.findCurrentUserSetupLedger,
    ).not.toHaveBeenCalled();
  });

  it("没有创建中账本时返回 null", async () => {
    const service = createLedgerSetupService({
      currentUserId: userId,
      ledgerSetupRepository: createRepository(),
    });

    await expect(service.getCurrentUserSetup()).resolves.toBeNull();
  });
});

describe("createLedgerSetupService.getTemplate", () => {
  it("按币种返回模板，没有模板时返回 null", () => {
    const service = createLedgerSetupService({
      currentUserId: userId,
      ledgerSetupRepository: createRepository(),
    });

    expect(service.getTemplate("JPY")).toBe(getLedgerSetupTemplate("JPY"));
    expect(service.getTemplate("USD")).toBeNull();
  });
});

describe("createLedgerSetupService.complete", () => {
  it("根据数据库中的草稿与代码模板生成 payload 并完成写入", async () => {
    const ledgerSetupRepository = createRepository({
      findCurrentUserSetupLedger: vi.fn(async () =>
        createRecord({
          ...draft,
          accounts: {
            items: [{ name: "PayPay", templateKey: "PayPay", type: "e_money" }],
            skipped: false,
          },
          features: { specialStatusEnabled: true },
          merchants: { selectedKeys: ["netflix"], skipped: false },
        }),
      ),
    });
    const service = createLedgerSetupService({
      currentUserId: userId,
      ledgerSetupRepository,
    });

    await service.complete(ledgerId);

    expect(ledgerSetupRepository.complete).toHaveBeenCalledWith({
      ledgerId,
      payload: {
        accounts: [{ name: "PayPay", type: "e_money" }],
        merchantTags: [{ icon: "🎬", key: "subscription", name: "订阅服务" }],
        merchants: [
          {
            aliases: [
              { alias: "网飞", locale: "zh" },
              { alias: "ネットフリックス", locale: "ja" },
            ],
            name: "Netflix",
            tagKeys: ["subscription"],
            websiteUrl: "https://www.netflix.com/jp/",
          },
        ],
        specialStatusEnabled: true,
      },
    });
  });

  it("草稿币种与账本当前默认货币不一致时按当前币种模板丢弃无法匹配的商家", async () => {
    const ledgerSetupRepository = createRepository({
      findCurrentUserSetupLedger: vi.fn(async () =>
        createRecord(draft, { baseCurrency: "USD" }),
      ),
    });
    const service = createLedgerSetupService({
      currentUserId: userId,
      ledgerSetupRepository,
    });

    await service.complete(ledgerId);

    expect(ledgerSetupRepository.complete).toHaveBeenCalledWith({
      ledgerId,
      payload: {
        accounts: [{ name: "现金", type: "cash" }],
        merchantTags: [],
        merchants: [],
        specialStatusEnabled: false,
      },
    });
  });

  it("模板版本变化时丢弃已不存在的商家 key", async () => {
    const ledgerSetupRepository = createRepository({
      findCurrentUserSetupLedger: vi.fn(async () =>
        createRecord({
          ...draft,
          merchants: { selectedKeys: ["removed", "gu"], skipped: false },
          templateVersion: 999,
        }),
      ),
    });
    const service = createLedgerSetupService({
      currentUserId: userId,
      ledgerSetupRepository,
    });

    await service.complete(ledgerId);

    expect(ledgerSetupRepository.complete).toHaveBeenCalledWith({
      ledgerId,
      payload: expect.objectContaining({
        merchants: [expect.objectContaining({ name: "GU" })],
      }),
    });
  });

  it.each([
    ["没有创建中账本", null],
    ["创建中账本不是目标账本", createRecord({}, { id: "other" })],
  ])("%s时抛出 NotFoundError 且不写入", async (_label, record) => {
    const ledgerSetupRepository = createRepository({
      findCurrentUserSetupLedger: vi.fn(async () => record),
    });
    const service = createLedgerSetupService({
      currentUserId: userId,
      ledgerSetupRepository,
    });

    const error = await service.complete(ledgerId).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error).toMatchObject({ code: ledgerSetupErrorCodes.notFound });
    expect(ledgerSetupRepository.complete).not.toHaveBeenCalled();
  });

  it("草稿中账户名称重复时抛出 ValidationError 且不写入", async () => {
    const ledgerSetupRepository = createRepository({
      findCurrentUserSetupLedger: vi.fn(async () =>
        createRecord({
          accounts: {
            items: [
              { name: "PayPay", type: "e_money" },
              { name: "paypay", type: "e_money" },
            ],
            skipped: false,
          },
        }),
      ),
    });
    const service = createLedgerSetupService({
      currentUserId: userId,
      ledgerSetupRepository,
    });

    const error = await service.complete(ledgerId).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toMatchObject({
      code: ledgerSetupErrorCodes.accountNameDuplicate,
      message:
        ledgerSetupErrorMessages[ledgerSetupErrorCodes.accountNameDuplicate],
    });
    expect(ledgerSetupRepository.complete).not.toHaveBeenCalled();
  });

  it.each([
    [ledgerSetupErrorCodes.notFound, NotFoundError],
    [ledgerSetupErrorCodes.notInProgress, ConflictError],
    [ledgerSetupErrorCodes.payloadInvalid, ValidationError],
  ] as const)(
    "数据库返回 %s 时转换为对应应用错误",
    async (code, errorClass) => {
      const service = createLedgerSetupService({
        currentUserId: userId,
        ledgerSetupRepository: createRepository({
          complete: vi.fn(async () => ({ code, ok: false as const })),
          findCurrentUserSetupLedger: vi.fn(async () => createRecord({})),
        }),
      });

      const error = await service.complete(ledgerId).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(errorClass);
      expect(error).toMatchObject({
        code,
        message: ledgerSetupErrorMessages[code],
      });
    },
  );

  it("登录失效时抛出 AuthenticationError", async () => {
    const service = createLedgerSetupService({
      currentUserId: userId,
      ledgerSetupRepository: createRepository({
        complete: vi.fn(async () => ({
          code: ledgerCreateErrorCodes.authRequired,
          ok: false as const,
        })),
        findCurrentUserSetupLedger: vi.fn(async () => createRecord({})),
      }),
    });

    await expect(service.complete(ledgerId)).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });
});

describe("createLedgerSetupService.saveDraft", () => {
  it("校验通过后保存草稿", async () => {
    const ledgerSetupRepository = createRepository();
    const service = createLedgerSetupService({
      currentUserId: userId,
      ledgerSetupRepository,
    });

    await service.saveDraft({ draft, ledgerId, step: 3 });

    expect(ledgerSetupRepository.saveDraft).toHaveBeenCalledWith({
      draft,
      ledgerId,
      step: 3,
    });
  });

  it.each([
    [{ draft, step: 6 }, ledgerSetupErrorCodes.stepInvalid],
    [{ draft: [], step: 2 }, ledgerSetupErrorCodes.draftInvalid],
    [{ draft: { accounts: [] }, step: 2 }, ledgerSetupErrorCodes.draftInvalid],
    [
      {
        draft: {
          ...draft,
          accounts: {
            items: [
              { name: "现金", type: "cash" },
              { name: " 现金 ", type: "cash" },
            ],
            skipped: false,
          },
        },
        step: 2,
      },
      ledgerSetupErrorCodes.accountNameDuplicate,
    ],
  ])("输入不合法时抛出 ValidationError 且不访问数据库", async (input, code) => {
    const ledgerSetupRepository = createRepository();
    const service = createLedgerSetupService({
      currentUserId: userId,
      ledgerSetupRepository,
    });

    const error = await service
      .saveDraft({ ...input, ledgerId })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toMatchObject({ code });
    expect(ledgerSetupRepository.saveDraft).not.toHaveBeenCalled();
  });

  it.each([
    ["模板版本已变化", { ...draft, templateVersion: 999 }],
    [
      "商家 key 不在模板中",
      { ...draft, merchants: { selectedKeys: ["unknown"], skipped: false } },
    ],
    [
      "无模板币种选择了商家",
      {
        ...createDefaultLedgerSetupDraft("USD"),
        merchants: { selectedKeys: ["amazon"], skipped: false },
      },
    ],
  ])("%s时抛出 ConflictError 且不访问数据库", async (_label, invalidDraft) => {
    const ledgerSetupRepository = createRepository();
    const service = createLedgerSetupService({
      currentUserId: userId,
      ledgerSetupRepository,
    });

    const error = await service
      .saveDraft({ draft: invalidDraft, ledgerId, step: 3 })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ConflictError);
    expect(error).toMatchObject({
      code: ledgerSetupErrorCodes.templateOutdated,
      message: ledgerSetupErrorMessages[ledgerSetupErrorCodes.templateOutdated],
    });
    expect(ledgerSetupRepository.saveDraft).not.toHaveBeenCalled();
  });

  it.each([
    [ledgerSetupErrorCodes.notFound, NotFoundError],
    [ledgerSetupErrorCodes.notInProgress, ConflictError],
    [ledgerSetupErrorCodes.currencyMismatch, ConflictError],
    [ledgerSetupErrorCodes.draftTooLarge, ValidationError],
  ] as const)(
    "数据库返回 %s 时转换为对应应用错误",
    async (code, errorClass) => {
      const service = createLedgerSetupService({
        currentUserId: userId,
        ledgerSetupRepository: createRepository({
          saveDraft: vi.fn(async () => ({ code, ok: false as const })),
        }),
      });

      const error = await service
        .saveDraft({ draft, ledgerId, step: 2 })
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
    const service = createLedgerSetupService({
      currentUserId: userId,
      ledgerSetupRepository,
    });

    await service.updateBasicInfo({ ...basicInfo, ledgerId });

    expect(ledgerSetupRepository.updateBasicInfo).toHaveBeenCalledWith({
      ...basicInfo,
      ledgerId,
    });
  });

  it("非 owner 或不存在时抛出 NotFoundError", async () => {
    const service = createLedgerSetupService({
      currentUserId: userId,
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
