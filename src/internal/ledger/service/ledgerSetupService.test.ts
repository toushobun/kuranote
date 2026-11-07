import { describe, expect, it, vi } from "vitest";

import {
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
} from "internal/ledger/errors/ledgerSetup";
import type { LedgerSetupRepository } from "internal/ledger/repository/ledgerSetupRepository";
import { createLedgerSetupService } from "internal/ledger/service/ledgerSetupService";
import { createDefaultLedgerSetupDraft } from "internal/ledger/util/ledgerSetupDraft";
import {
  ConflictError,
  AuthenticationError,
} from "internal/shared/errors/appError";

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
};

function createRepository(
  overrides: Partial<LedgerSetupRepository> = {},
): LedgerSetupRepository {
  return {
    abandon: vi.fn(async () => ({ ok: true as const })),
    persist: vi.fn(async () => ({
      ok: true as const,
      updatedAt: "2026-11-07T03:00:00.000Z",
    })),
    findCurrentUserSetupLedger: vi.fn(async () => null),
    listDefaultRootCategoryNames: vi.fn(async () => []),
    ...overrides,
  };
}

function makeService(
  repo = createRepository(),
  currentUserId: string | null = userId,
) {
  return {
    repo,
    service: createLedgerSetupService({
      currentUserId,
      ledgerSetupRepository: repo,
    }),
  };
}

describe("LedgerSetupService.persist", () => {
  it("保存退出只传草稿，不生成完成 payload", async () => {
    const { service, repo } = makeService();
    await expect(service.persist(command)).resolves.toBe(
      "2026-11-07T03:00:00.000Z",
    );
    expect(repo.persist).toHaveBeenCalledWith({
      ...command,
      payload: null,
    });
  });

  it("未提前保存时也能完成，一次事务提交默认类别和带币种账户", async () => {
    const { service, repo } = makeService();
    await service.persist({ ...command, step: 5, complete: true });
    expect(repo.persist).toHaveBeenCalledOnce();
    const call = vi.mocked(repo.persist).mock.calls[0][0];
    expect(call.payload).not.toBeNull();
    expect(call.payload?.accounts[0]).toMatchObject({
      currency: "JPY",
      name: "日元现金",
      type: "cash",
    });
    expect(call.payload?.templateRegion).toBe("jp");
  });

  it("无效草稿在 Repository 前拒绝", async () => {
    const { service, repo } = makeService();
    const invalid = { ...draft, templateRegion: "cn" as const };
    await expect(
      service.persist({ ...command, draft: invalid }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(repo.persist).not.toHaveBeenCalled();
  });

  it("模板过期返回冲突，保留客户端草稿", async () => {
    const { service, repo } = makeService();
    await expect(
      service.persist({
        ...command,
        draft: {
          ...draft,
          merchants: {
            selectedKeys: ["unknown-template-merchant"],
            skipped: false,
          },
        },
      }),
    ).rejects.toMatchObject({
      code: ledgerSetupErrorCodes.templateOutdated,
    });
    expect(repo.persist).not.toHaveBeenCalled();
  });

  it.each([
    ledgerSetupErrorCodes.conflict,
    ledgerSetupErrorCodes.inProgressExists,
  ])("版本冲突或另一草稿冲突 %s 不静默恢复", async (code) => {
    const { service } = makeService(
      createRepository({
        persist: vi.fn(async () => ({ ok: false as const, code })),
      }),
    );
    await expect(service.persist(command)).rejects.toMatchObject({
      code,
      message: ledgerSetupErrorMessages[code],
    });
  });
});

describe("LedgerSetupService.getCurrentUserSetup", () => {
  it("未登录不读取任何数据", async () => {
    const repo = createRepository();
    const { service } = makeService(repo, null);
    await expect(service.getCurrentUserSetup()).rejects.toBeInstanceOf(
      AuthenticationError,
    );
    expect(repo.findCurrentUserSetupLedger).not.toHaveBeenCalled();
  });

  it("恢复服务端持久化草稿和步骤及版本", async () => {
    const { service } = makeService(
      createRepository({
        findCurrentUserSetupLedger: vi.fn(async () => ({
          baseCurrency: "JPY" as const,
          livingRegion: "jp" as const,
          displayColor: "amber" as const,
          displayName: "淞文",
          id: ledgerId,
          name: "家庭账本",
          step: 4,
          updatedAt: "2026-11-07T02:00:00.000Z",
          storedDraft: draft,
        })),
      }),
    );
    await expect(service.getCurrentUserSetup()).resolves.toMatchObject({
      id: ledgerId,
      draft,
      step: 4,
      updatedAt: "2026-11-07T02:00:00.000Z",
    });
  });
});
