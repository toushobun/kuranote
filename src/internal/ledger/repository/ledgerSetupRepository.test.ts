// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { ledgerCreateErrorCodes } from "internal/ledger/errors/ledgerCreate";
import {
  ledgerSetupErrorCodes,
  ledgerSetupLoadErrorMessages,
  ledgerSetupWriteErrorMessages,
} from "internal/ledger/errors/ledgerSetup";
import { createSupabaseLedgerSetupRepository } from "internal/ledger/repository/ledgerSetupRepository";
import type { Logger } from "internal/shared/logging/logger";
import {
  createSupabaseMock,
  type SupabaseMockResponse,
} from "test/supabaseMock";

const ledgerId = "00000000-0000-4000-8000-000000000001";

const basicInfo = {
  baseCurrency: "JPY",
  displayColor: "amber" as const,
  displayName: "淞文",
  ledgerName: "家庭账本",
};

function createRepository(rpcResponse: Partial<SupabaseMockResponse> = {}) {
  const supabase = createSupabaseMock({ rpcResponse });
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

describe("createSupabaseLedgerSetupRepository.findCurrentUserSetupLedger", () => {
  it("把 RPC 行转换为创建中账本", async () => {
    const { repository, supabase } = createRepository({
      data: [
        {
          base_currency: "JPY",
          ledger_id: ledgerId,
          ledger_name: "家庭账本",
          setup_draft: { accounts: [] },
          setup_step: 3,
        },
      ],
    });

    await expect(repository.findCurrentUserSetupLedger()).resolves.toEqual({
      baseCurrency: "JPY",
      draft: { accounts: [] },
      id: ledgerId,
      name: "家庭账本",
      step: 3,
    });
    expect(supabase.rpc).toHaveBeenCalledWith("get_current_user_setup_ledger");
  });

  it("没有创建中账本时返回 null", async () => {
    const { repository } = createRepository({ data: [] });

    await expect(repository.findCurrentUserSetupLedger()).resolves.toBeNull();
  });

  it("查询失败时不伪装为没有创建中账本", async () => {
    const { repository } = createRepository({
      error: { code: "XX000", message: "private" },
    });

    await expect(repository.findCurrentUserSetupLedger()).rejects.toMatchObject(
      {
        code: "ledger_setup_load_failed",
        message: ledgerSetupLoadErrorMessages.loadFailed,
      },
    );
  });

  it("草稿不是 object 时视为数据异常", async () => {
    const { repository } = createRepository({
      data: [
        {
          base_currency: "JPY",
          ledger_id: ledgerId,
          ledger_name: "家庭账本",
          setup_draft: [],
          setup_step: 2,
        },
      ],
    });

    await expect(repository.findCurrentUserSetupLedger()).rejects.toMatchObject(
      { code: "ledger_setup_load_failed" },
    );
  });
});

describe("createSupabaseLedgerSetupRepository.saveDraft", () => {
  it("调用 save_ledger_setup_draft 保存步骤与草稿", async () => {
    const { repository, supabase } = createRepository();

    await expect(
      repository.saveDraft({ draft: { merchants: [] }, ledgerId, step: 4 }),
    ).resolves.toEqual({ ok: true });
    expect(supabase.rpc).toHaveBeenCalledWith("save_ledger_setup_draft", {
      p_draft: { merchants: [] },
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
  ] as const)("RPC details 返回 %s 时映射为 %s", async (details, code) => {
    const { repository } = createRepository({
      error: { details, message: "业务错误" },
    });

    await expect(
      repository.saveDraft({ draft: {}, ledgerId, step: 2 }),
    ).resolves.toEqual({ code, ok: false });
  });

  it("未知错误时转换为安全 RepositoryError", async () => {
    const { repository } = createRepository({
      error: { code: "XX000", message: "private" },
    });

    await expect(
      repository.saveDraft({ draft: {}, ledgerId, step: 2 }),
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
