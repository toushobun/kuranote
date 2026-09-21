// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import type { LedgerSettingsRepository } from "internal/ledger/repository/ledgerSettingsRepository";
import {
  createLedgerAccessService,
  requireActiveLedgerMemberRole,
} from "internal/ledger/service/ledgerAccessService";
import { NotFoundError } from "internal/shared/errors/appError";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";

function createRepository(
  role: "owner" | "admin" | "member" | "viewer" | null,
  isLedgerActive: boolean,
): LedgerSettingsRepository {
  return {
    getMemberRole: vi.fn().mockResolvedValue(role),
    isLedgerActive: vi.fn().mockResolvedValue(isLedgerActive),
    listActiveMembers: vi.fn(),
    updateLedgerBaseSettings: vi.fn(),
    updateMemberSettings: vi.fn(),
  };
}

describe("createLedgerAccessService", () => {
  it("账本有效且用户是 active 成员时返回角色", async () => {
    const service = createLedgerAccessService(createRepository("admin", true));

    await expect(
      service.getActiveMemberRole({ ledgerId, userId }),
    ).resolves.toBe("admin");
  });

  it.each([
    [null, true],
    ["owner", false],
  ] as const)("成员或账本无效时返回 null", async (role, isLedgerActive) => {
    const service = createLedgerAccessService(
      createRepository(role, isLedgerActive),
    );

    await expect(
      service.getActiveMemberRole({ ledgerId, userId }),
    ).resolves.toBeNull();
  });

  it("成员或账本无效时由公共访问入口抛出安全的 404 错误", async () => {
    const service = createLedgerAccessService(createRepository(null, true));
    const action = requireActiveLedgerMemberRole(service, { ledgerId, userId });

    await expect(action).rejects.toBeInstanceOf(NotFoundError);
    await expect(action).rejects.toMatchObject({
      code: "ledger_invalid",
      name: NotFoundError.name,
    });
  });

  it("同一请求内对同一账本与用户的有权限判定只查询一次", async () => {
    const repository = createRepository("owner", true);
    const service = createLedgerAccessService(repository);

    await service.getActiveMemberRole({ ledgerId, userId });
    await service.getActiveMemberRole({ ledgerId, userId });

    expect(repository.getMemberRole).toHaveBeenCalledOnce();
    expect(repository.isLedgerActive).toHaveBeenCalledOnce();
  });

  it("不同用户或账本各自查询，互不共用缓存", async () => {
    const repository = createRepository("owner", true);
    const service = createLedgerAccessService(repository);

    await service.getActiveMemberRole({ ledgerId, userId });
    await service.getActiveMemberRole({ ledgerId, userId: "other-user" });
    await service.getActiveMemberRole({ ledgerId: "other-ledger", userId });

    expect(repository.getMemberRole).toHaveBeenCalledTimes(3);
  });

  it("无权限结果不缓存，后续加入后可立即通过", async () => {
    const repository = createRepository(null, true);
    const service = createLedgerAccessService(repository);

    await expect(
      service.getActiveMemberRole({ ledgerId, userId }),
    ).resolves.toBeNull();
    vi.mocked(repository.getMemberRole).mockResolvedValue("member");

    await expect(
      service.getActiveMemberRole({ ledgerId, userId }),
    ).resolves.toBe("member");
  });

  it("查询失败不缓存，下次重新查询", async () => {
    const repository = createRepository("owner", true);
    vi.mocked(repository.getMemberRole).mockRejectedValueOnce(
      new Error("temporary"),
    );
    const service = createLedgerAccessService(repository);

    await expect(
      service.getActiveMemberRole({ ledgerId, userId }),
    ).rejects.toThrow("temporary");
    await expect(
      service.getActiveMemberRole({ ledgerId, userId }),
    ).resolves.toBe("owner");
  });
});
