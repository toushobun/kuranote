// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import type { CurrentLedger } from "lib/ledger/current-ledger";
import { createLedgerSettingsService } from "server/ledger/service/ledgerSettingsService";
import type { LedgerSettingsRepository } from "server/ledger/repository/ledgerSettingsRepository";
import { ledgerSettingsErrorCodes } from "server/errors/ledgerSettings";
import {
  AuthorizationError,
  NotFoundError,
} from "server/shared/errors/appError";

const userId = "00000000-0000-4000-8000-000000000031";
const otherUserId = "00000000-0000-4000-8000-000000000034";
const ledgerId = "00000000-0000-4000-8000-000000000032";

const currentLedger: CurrentLedger = {
  baseCurrency: "JPY",
  currentUserRole: "owner",
  id: ledgerId,
  name: "家庭账本",
};

function createService(overrides: Partial<LedgerSettingsRepository> = {}) {
  const ledgerSettingsRepository: LedgerSettingsRepository = {
    getMemberRole: vi.fn().mockResolvedValue("owner"),
    isLedgerActive: vi.fn().mockResolvedValue(true),
    listActiveMembers: vi.fn().mockResolvedValue([]),
    updateLedgerBaseSettings: vi.fn().mockResolvedValue({ ok: true }),
    updateMemberSettings: vi.fn().mockResolvedValue({ ok: true }),
    ...overrides,
  };
  return {
    ledgerSettingsRepository,
    service: createLedgerSettingsService({ ledgerSettingsRepository }),
  };
}

describe("createLedgerSettingsService.getView", () => {
  it("当前用户不在成员列表中时抛出 AuthorizationError", async () => {
    const { service } = createService({
      listActiveMembers: vi.fn().mockResolvedValue([]),
    });

    await expect(
      service.getView({ currentLedger, ledger: currentLedger, userId }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it.each([
    ["owner", true],
    ["admin", true],
    ["member", false],
    ["viewer", false],
  ] as const)("角色 %s 的 canEditLedger 为 %s", async (role, expected) => {
    const { service } = createService({
      listActiveMembers: vi.fn().mockResolvedValue([
        {
          avatarUrl: null,
          displayColor: null,
          displayName: "本人",
          email: "me@example.com",
          role,
          userId,
        },
      ]),
    });

    const view = await service.getView({
      currentLedger,
      ledger: currentLedger,
      userId,
    });

    expect(view.canEditLedger).toBe(expected);
    expect(view.currentUser.userId).toBe(userId);
    expect(view.ledger.isCurrent).toBe(true);
  });

  it("displayName 缺失时回退为默认文案", async () => {
    const { service } = createService({
      listActiveMembers: vi.fn().mockResolvedValue([
        {
          avatarUrl: null,
          displayColor: null,
          displayName: null,
          email: null,
          role: "member" as const,
          userId,
        },
      ]),
    });

    const view = await service.getView({
      currentLedger,
      ledger: currentLedger,
      userId,
    });

    expect(view.currentUser.displayName).toBe("未命名用户");
    expect(view.members[0].displayName).toBe("未命名用户");
  });
});

describe("createLedgerSettingsService.update — ledger 意图", () => {
  const ledgerSettingsInput = {
    intent: "ledger" as const,
    ledgerId,
    settings: { baseCurrency: "USD", ledgerName: "新名称" },
    userId,
  };

  it("账本不存在（role 为空）时抛出 NotFoundError", async () => {
    const { service } = createService({
      getMemberRole: vi.fn().mockResolvedValue(null),
    });

    await expect(service.update(ledgerSettingsInput)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("账本已归档时抛出 NotFoundError", async () => {
    const { service } = createService({
      isLedgerActive: vi.fn().mockResolvedValue(false),
    });

    await expect(service.update(ledgerSettingsInput)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("非 owner/admin 修改账本设置时抛出 AuthorizationError", async () => {
    const { service, ledgerSettingsRepository } = createService({
      getMemberRole: vi.fn().mockResolvedValue("member"),
    });

    await expect(service.update(ledgerSettingsInput)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
    expect(
      ledgerSettingsRepository.updateLedgerBaseSettings,
    ).not.toHaveBeenCalled();
  });

  it("owner 修改账本设置成功时调用 Repository", async () => {
    const { service, ledgerSettingsRepository } = createService();

    await expect(service.update(ledgerSettingsInput)).resolves.toBeUndefined();
    expect(
      ledgerSettingsRepository.updateLedgerBaseSettings,
    ).toHaveBeenCalledWith(ledgerId, {
      baseCurrency: "USD",
      ledgerName: "新名称",
      updatedBy: userId,
    });
  });

  it("Repository 更新失败时抛出映射后的错误", async () => {
    const { service } = createService({
      updateLedgerBaseSettings: vi.fn().mockResolvedValue({
        code: ledgerSettingsErrorCodes.updateFailed,
        ok: false,
      }),
    });

    await expect(service.update(ledgerSettingsInput)).rejects.toMatchObject({
      code: ledgerSettingsErrorCodes.updateFailed,
    });
  });
});

describe("createLedgerSettingsService.update — member 意图", () => {
  const memberSettingsInput = {
    intent: "member" as const,
    ledgerId,
    settings: {
      displayColor: "amber" as const,
      displayName: "配偶",
      role: "admin" as const,
      userId: otherUserId,
    },
    userId,
  };

  it("owner 修改他人成员设置成功时调用 Repository", async () => {
    const { service, ledgerSettingsRepository } = createService();

    await expect(service.update(memberSettingsInput)).resolves.toBeUndefined();
    expect(ledgerSettingsRepository.updateMemberSettings).toHaveBeenCalledWith({
      displayColor: "amber",
      displayName: "配偶",
      ledgerId,
      role: "admin",
      userId: otherUserId,
    });
  });

  it("普通成员修改自己的设置时允许", async () => {
    const { service, ledgerSettingsRepository } = createService({
      getMemberRole: vi.fn().mockResolvedValue("member"),
    });
    const selfInput = {
      ...memberSettingsInput,
      settings: { ...memberSettingsInput.settings, userId },
    };

    await expect(service.update(selfInput)).resolves.toBeUndefined();
    expect(ledgerSettingsRepository.updateMemberSettings).toHaveBeenCalled();
  });

  it("普通成员修改他人设置时抛出 AuthorizationError", async () => {
    const { service, ledgerSettingsRepository } = createService({
      getMemberRole: vi.fn().mockResolvedValue("member"),
    });

    await expect(service.update(memberSettingsInput)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
    expect(
      ledgerSettingsRepository.updateMemberSettings,
    ).not.toHaveBeenCalled();
  });
});
