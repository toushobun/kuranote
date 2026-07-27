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
});
