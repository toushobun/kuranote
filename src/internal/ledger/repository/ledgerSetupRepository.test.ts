// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { ledgerCreateErrorCodes } from "internal/ledger/errors/ledgerCreate";
import {
  ledgerSetupErrorCodes,
  ledgerSetupLoadErrorMessages,
  ledgerSetupWriteErrorMessages,
} from "internal/ledger/errors/ledgerSetup";
import { createSupabaseLedgerSetupRepository } from "internal/ledger/repository/ledgerSetupRepository";
import { createDefaultLedgerSetupDraft } from "internal/ledger/util/ledgerSetupDraft";
import type { Logger } from "internal/shared/logging/logger";
import {
  createSupabaseMock,
  type SupabaseMockResponse,
} from "test/supabaseMock";

const ledgerId = "00000000-0000-4000-8000-000000000001";

const draft = createDefaultLedgerSetupDraft("JPY");

const payload = {
  accounts: [{ name: "现金", type: "cash" as const }],
  merchantTags: [],
  merchants: [],
  specialStatusEnabled: false,
};

const basicInfo = {
  baseCurrency: "JPY",
  displayColor: "amber" as const,
  displayName: "淞文",
  ledgerName: "家庭账本",
};

const userId = "00000000-0000-4000-8000-000000000031";

const displaySettingResponse = {
  data: { display_color: "amber", display_name: "淞文" },
};

function createRepository(
  rpcResponse: Partial<SupabaseMockResponse> = {},
  queryResponses: Partial<SupabaseMockResponse>[] = [],
) {
  const supabase = createSupabaseMock({ queryResponses, rpcResponse });
  const logger: Logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };

  return {
    logger,
    repository: createSupabaseLedgerSetupRepository(
      supabase.client as never,
      logger,
    ),
    supabase,
  };
}

describe("createSupabaseLedgerSetupRepository.create", () => {
  it("调用 create_ledger_setup 并返回新账本 ID", async () => {
    const { repository, supabase } = createRepository({ data: ledgerId });

    await expect(repository.create(basicInfo)).resolves.toEqual({
      ledgerId,
      ok: true,
    });
    expect(supabase.rpc).toHaveBeenCalledWith("create_ledger_setup", {
      p_base_currency: "JPY",
      p_display_color: "amber",
      p_display_name: "淞文",
      p_name: "家庭账本",
    });
  });

  it.each([
    ["ledger_setup_in_progress_exists", ledgerSetupErrorCodes.inProgressExists],
    ["ledger_name_required", ledgerCreateErrorCodes.nameRequired],
    ["currency_invalid", ledgerCreateErrorCodes.currencyInvalid],
    ["user_inactive", ledgerCreateErrorCodes.userInactive],
  ] as const)("RPC details 返回 %s 时映射为 %s", async (details, code) => {
    const { repository } = createRepository({
      error: { details, message: "业务错误" },
    });

    await expect(repository.create(basicInfo)).resolves.toEqual({
      code,
      ok: false,
    });
  });

  it("未知错误时记录日志并转换为安全 RepositoryError", async () => {
    const { logger, repository } = createRepository({
      error: { code: "XX000", details: "unexpected", message: "private" },
    });

    await expect(repository.create(basicInfo)).rejects.toMatchObject({
      code: "ledger_setup_create_failed",
      message: ledgerSetupWriteErrorMessages.createFailed,
    });
    expect(logger.error).toHaveBeenCalledWith(
      "[ledger] failed to create ledger setup",
      { databaseCode: "XX000" },
    );
  });

  it("RPC 未返回账本 ID 时视为写入失败", async () => {
    const { repository } = createRepository({ data: null });

    await expect(repository.create(basicInfo)).rejects.toMatchObject({
      code: "ledger_setup_create_failed",
    });
  });
});

const setupRow = {
  base_currency: "JPY",
  ledger_id: ledgerId,
  ledger_name: "家庭账本",
  setup_draft: {
    accounts: [],
    features: { specialStatusEnabled: true },
  },
  setup_step: 3,
};

describe("createSupabaseLedgerSetupRepository.findCurrentUserSetupLedger", () => {
  it("把 RPC 行与当前用户的显示设置转换为创建中账本", async () => {
    const { repository, supabase } = createRepository({ data: [setupRow] }, [
      displaySettingResponse,
    ]);

    await expect(
      repository.findCurrentUserSetupLedger(userId),
    ).resolves.toEqual({
      baseCurrency: "JPY",
      displayColor: "amber",
      displayName: "淞文",
      id: ledgerId,
      name: "家庭账本",
      step: 3,
      storedDraft: { features: { specialStatusEnabled: true } },
    });
    expect(supabase.rpc).toHaveBeenCalledWith("get_current_user_setup_ledger");
    expect(supabase.queries[0]).toMatchObject({
      calls: [
        { args: ["display_name, display_color"], method: "select" },
        { args: ["ledger_id", ledgerId], method: "eq" },
        { args: ["user_id", userId], method: "eq" },
        { args: [], method: "maybeSingle" },
      ],
      table: "ledger_member_display_setting",
    });
  });

  it("显示设置查询失败时抛出读取失败", async () => {
    const { repository } = createRepository({ data: [setupRow] }, [
      { error: { code: "XX000", message: "private" } },
    ]);

    await expect(
      repository.findCurrentUserSetupLedger(userId),
    ).rejects.toMatchObject({
      code: "ledger_setup_load_failed",
      message: ledgerSetupLoadErrorMessages.loadFailed,
    });
  });

  it.each([
    ["显示设置缺失", { data: null }],
    [
      "个性色不是可选值",
      { data: { display_color: "unknown", display_name: "淞文" } },
    ],
  ])("%s时视为数据异常", async (_label, response) => {
    const { repository } = createRepository({ data: [setupRow] }, [response]);

    await expect(
      repository.findCurrentUserSetupLedger(userId),
    ).rejects.toMatchObject({ code: "ledger_setup_load_failed" });
  });

  it("没有创建中账本时返回 null", async () => {
    const { repository } = createRepository({ data: [] });

    await expect(
      repository.findCurrentUserSetupLedger(userId),
    ).resolves.toBeNull();
  });

  it("查询失败时不伪装为没有创建中账本", async () => {
    const { repository } = createRepository({
      error: { code: "XX000", message: "private" },
    });

    await expect(
      repository.findCurrentUserSetupLedger(userId),
    ).rejects.toMatchObject({
      code: "ledger_setup_load_failed",
      message: ledgerSetupLoadErrorMessages.loadFailed,
    });
  });

  it.each([
    ["草稿不是 object", { base_currency: "JPY", setup_draft: [] }],
    ["默认货币不是可选值", { base_currency: "XXX", setup_draft: {} }],
  ])("%s时视为数据异常", async (_label, row) => {
    const { repository } = createRepository({
      data: [
        { ...row, ledger_id: ledgerId, ledger_name: "家庭账本", setup_step: 2 },
      ],
    });

    await expect(
      repository.findCurrentUserSetupLedger(userId),
    ).rejects.toMatchObject({ code: "ledger_setup_load_failed" });
  });
});

describe("createSupabaseLedgerSetupRepository.listDefaultRootCategoryNames", () => {
  it("调用 get_ledger_default_root_categories 并按排序返回大分类名称", async () => {
    const { repository, supabase } = createRepository({
      data: [
        { name: "🍽️ 饮食", sort_order: 30 },
        { name: "💰 工资收入", sort_order: 10 },
        { name: "💸 其他收入", sort_order: 20 },
      ],
    });

    await expect(repository.listDefaultRootCategoryNames()).resolves.toEqual([
      "💰 工资收入",
      "💸 其他收入",
      "🍽️ 饮食",
    ]);
    expect(supabase.rpc).toHaveBeenCalledWith(
      "get_ledger_default_root_categories",
    );
  });

  it("没有返回行时返回空数组", async () => {
    const { repository } = createRepository({ data: null });

    await expect(repository.listDefaultRootCategoryNames()).resolves.toEqual(
      [],
    );
  });

  it("查询失败时记录日志并转换为安全 RepositoryError", async () => {
    const { logger, repository } = createRepository({
      error: { code: "XX000", details: "unexpected", message: "private" },
    });

    await expect(
      repository.listDefaultRootCategoryNames(),
    ).rejects.toMatchObject({
      code: "ledger_default_categories_load_failed",
      message: ledgerSetupLoadErrorMessages.defaultCategoriesLoadFailed,
    });
    expect(logger.error).toHaveBeenCalledWith(
      "[ledger] failed to load default root categories",
      { databaseCode: "XX000" },
    );
  });
});

describe("createSupabaseLedgerSetupRepository.saveDraft", () => {
  it("调用 save_ledger_setup_draft 保存步骤与草稿", async () => {
    const { repository, supabase } = createRepository();

    await expect(
      repository.saveDraft({ draft, ledgerId, step: 4 }),
    ).resolves.toEqual({ ok: true });
    expect(supabase.rpc).toHaveBeenCalledWith("save_ledger_setup_draft", {
      p_draft: draft,
      p_ledger_id: ledgerId,
      p_step: 4,
    });
  });

  it.each([
    ["ledger_setup_not_found", ledgerSetupErrorCodes.notFound],
    ["ledger_setup_not_in_progress", ledgerSetupErrorCodes.notInProgress],
    ["ledger_setup_step_invalid", ledgerSetupErrorCodes.stepInvalid],
    ["ledger_setup_draft_invalid", ledgerSetupErrorCodes.draftInvalid],
    ["ledger_setup_draft_too_large", ledgerSetupErrorCodes.draftTooLarge],
    [
      "ledger_setup_draft_currency_mismatch",
      ledgerSetupErrorCodes.currencyMismatch,
    ],
  ] as const)("RPC details 返回 %s 时映射为 %s", async (details, code) => {
    const { repository } = createRepository({
      error: { details, message: "业务错误" },
    });

    await expect(
      repository.saveDraft({ draft, ledgerId, step: 2 }),
    ).resolves.toEqual({ code, ok: false });
  });

  it("未知错误时转换为安全 RepositoryError", async () => {
    const { repository } = createRepository({
      error: { code: "XX000", message: "private" },
    });

    await expect(
      repository.saveDraft({ draft, ledgerId, step: 2 }),
    ).rejects.toMatchObject({
      code: "ledger_setup_draft_save_failed",
      message: ledgerSetupWriteErrorMessages.draftSaveFailed,
    });
  });
});

describe("createSupabaseLedgerSetupRepository.updateBasicInfo", () => {
  it("调用 update_ledger_setup_basic_info 更新基本信息", async () => {
    const { repository, supabase } = createRepository();

    await expect(
      repository.updateBasicInfo({ ...basicInfo, ledgerId }),
    ).resolves.toEqual({ ok: true });
    expect(supabase.rpc).toHaveBeenCalledWith(
      "update_ledger_setup_basic_info",
      {
        p_base_currency: "JPY",
        p_display_color: "amber",
        p_display_name: "淞文",
        p_ledger_id: ledgerId,
        p_name: "家庭账本",
      },
    );
  });

  it("创建中状态校验失败时返回业务错误码", async () => {
    const { repository } = createRepository({
      error: { details: "ledger_setup_not_in_progress", message: "业务错误" },
    });

    await expect(
      repository.updateBasicInfo({ ...basicInfo, ledgerId }),
    ).resolves.toEqual({
      code: ledgerSetupErrorCodes.notInProgress,
      ok: false,
    });
  });

  it("未知错误时转换为安全 RepositoryError", async () => {
    const { repository } = createRepository({
      error: { code: "XX000", message: "private" },
    });

    await expect(
      repository.updateBasicInfo({ ...basicInfo, ledgerId }),
    ).rejects.toMatchObject({
      code: "ledger_setup_basic_info_update_failed",
      message: ledgerSetupWriteErrorMessages.basicInfoUpdateFailed,
    });
  });
});

describe("createSupabaseLedgerSetupRepository.complete", () => {
  it("调用 complete_ledger_setup 提交 payload", async () => {
    const { repository, supabase } = createRepository();

    await expect(repository.complete({ ledgerId, payload })).resolves.toEqual({
      ok: true,
    });
    expect(supabase.rpc).toHaveBeenCalledWith("complete_ledger_setup", {
      p_ledger_id: ledgerId,
      p_payload: payload,
    });
  });

  it.each([
    ["ledger_setup_not_found", ledgerSetupErrorCodes.notFound],
    ["ledger_setup_not_in_progress", ledgerSetupErrorCodes.notInProgress],
    ["ledger_setup_payload_invalid", ledgerSetupErrorCodes.payloadInvalid],
    ["auth_required", ledgerCreateErrorCodes.authRequired],
  ] as const)("RPC details 返回 %s 时映射为 %s", async (details, code) => {
    const { repository } = createRepository({
      error: { details, message: "业务错误" },
    });

    await expect(repository.complete({ ledgerId, payload })).resolves.toEqual({
      code,
      ok: false,
    });
  });

  it("未知错误时记录日志并转换为安全 RepositoryError", async () => {
    const { logger, repository } = createRepository({
      error: { code: "XX000", message: "private" },
    });

    await expect(
      repository.complete({ ledgerId, payload }),
    ).rejects.toMatchObject({
      code: "ledger_setup_complete_failed",
      message: ledgerSetupWriteErrorMessages.completeFailed,
    });
    expect(logger.error).toHaveBeenCalledWith(
      "[ledger] failed to complete ledger setup",
      { databaseCode: "XX000", ledgerId },
    );
  });
});
