// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { ledgerSetupErrorCodes } from "internal/ledger/errors/ledgerSetup";
import { createSupabaseLedgerSetupRepository } from "internal/ledger/repository/ledgerSetupRepository";
import { createDefaultLedgerSetupDraft } from "internal/ledger/util/ledgerSetupDraft";
import type { Logger } from "internal/shared/logging/logger";
import {
  createSupabaseMock,
  type SupabaseMockResponse,
} from "test/supabaseMock";

const ledgerId = "00000000-0000-4000-8000-000000000001";
const userId = "00000000-0000-4000-8000-000000000031";
const draft = createDefaultLedgerSetupDraft("jp");

const command = {
  ledgerId,
  expectedUpdatedAt: null,
  name: "家庭账本",
  baseCurrency: "JPY",
  displayName: "淞文",
  displayColor: "amber",
  livingRegion: "jp" as const,
  step: 3,
  draft,
  complete: false,
  payload: null,
};

function makeRepository(
  rpcResponse: Partial<SupabaseMockResponse> = {},
  queryResponses: Partial<SupabaseMockResponse>[] = [],
) {
  const supabase = createSupabaseMock({ rpcResponse, queryResponses });
  const logger: Logger = { error: vi.fn(), warn: vi.fn(), info: vi.fn() };
  return {
    repository: createSupabaseLedgerSetupRepository(
      supabase.client as never,
      logger,
    ),
    supabase,
    logger,
  };
}

describe("LedgerSetupRepository.persist", () => {
  it("一次 RPC 传入完整草稿、客户端 UUID、版本和是否完成", async () => {
    const { repository, supabase } = makeRepository({
      data: "2026-11-07T03:00:00.000Z",
    });
    await expect(repository.persist(command)).resolves.toEqual({
      ok: true,
      updatedAt: "2026-11-07T03:00:00.000Z",
    });
    expect(supabase.rpc).toHaveBeenCalledWith("commit_ledger_setup", {
      p_ledger_id: ledgerId,
      p_expected_updated_at: null,
      p_name: "家庭账本",
      p_base_currency: "JPY",
      p_display_name: "淞文",
      p_display_color: "amber",
      p_living_region: "jp",
      p_step: 3,
      p_draft: draft,
      p_complete: false,
      p_payload: null,
    });
  });

  it.each([
    ["ledger_setup_conflict", ledgerSetupErrorCodes.conflict],
    ["ledger_setup_in_progress_exists", ledgerSetupErrorCodes.inProgressExists],
    ["ledger_setup_region_mismatch", ledgerSetupErrorCodes.regionMismatch],
  ] as const)("业务错误 %s 映射为 %s", async (details, code) => {
    const { repository } = makeRepository({
      error: { code: "40001", details, message: "untrusted" },
    });
    await expect(repository.persist(command)).resolves.toEqual({
      ok: false,
      code,
    });
  });

  it("未知数据库错误不会泄露原始 SQL 细节", async () => {
    const { repository, logger } = makeRepository({
      error: { code: "XX000", message: "PRIVATE_SQL_DETAILS" },
    });
    await expect(repository.persist(command)).rejects.toMatchObject({
      code: "ledger_setup_commit_failed",
    });
    expect(logger.error).toHaveBeenCalled();
  });

  it("返回非时间戳视为失败", async () => {
    const { repository } = makeRepository({ data: null });
    await expect(repository.persist(command)).rejects.toMatchObject({
      code: "ledger_setup_commit_failed",
    });
  });
});

describe("LedgerSetupRepository.findCurrentUserSetupLedger", () => {
  it("从服务端快照恢复最新 updated_at 作为乐观锁版本", async () => {
    const { repository, supabase } = makeRepository(
      {
        data: [
          {
            ledger_id: ledgerId,
            ledger_name: "家庭账本",
            base_currency: "JPY",
            setup_step: 3,
            setup_draft: draft,
            living_region: "jp",
          },
        ],
      },
      [
        { data: { display_name: "淞文", display_color: "amber" } },
        { data: { updated_at: "2026-11-07T00:00:00Z" } },
      ],
    );
    await expect(
      repository.findCurrentUserSetupLedger(userId),
    ).resolves.toMatchObject({
      id: ledgerId,
      name: "家庭账本",
      step: 3,
      updatedAt: "2026-11-07T00:00:00Z",
    });
    expect(supabase.queries[1].table).toBe("ledger");
  });

  it("未找到创建中的账本时不读取其他表", async () => {
    const { repository, supabase } = makeRepository({ data: [] });
    await expect(
      repository.findCurrentUserSetupLedger(userId),
    ).resolves.toBeNull();
    expect(supabase.queries).toEqual([]);
  });
});
