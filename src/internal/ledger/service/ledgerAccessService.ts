import type { CurrentLedgerRole } from "internal/ledger/entity/currentLedger";
import type { LedgerSettingsRepository } from "internal/ledger/repository/ledgerSettingsRepository";
import { NotFoundError } from "internal/shared/errors/appError";

export type GetActiveLedgerMemberRoleInput = {
  ledgerId: string;
  userId: string;
};

/** 供其他业务模块使用的账本访问窄接口。 */
export interface LedgerAccessService {
  getActiveMemberRole(
    input: GetActiveLedgerMemberRoleInput,
  ): Promise<CurrentLedgerRole | null>;
}

export async function requireActiveLedgerMemberRole(
  service: LedgerAccessService,
  input: GetActiveLedgerMemberRoleInput,
): Promise<CurrentLedgerRole> {
  const role = await service.getActiveMemberRole(input);

  if (!role) {
    throw new NotFoundError(
      "ledger_invalid",
      "账本不存在、已归档或您无法访问。",
    );
  }

  return role;
}

export function createLedgerAccessService(
  ledgerSettingsRepository: LedgerSettingsRepository,
): LedgerAccessService {
  return {
    async getActiveMemberRole({ ledgerId, userId }) {
      const [role, isLedgerActive] = await Promise.all([
        ledgerSettingsRepository.getMemberRole(ledgerId, userId),
        ledgerSettingsRepository.isLedgerActive(ledgerId),
      ]);

      return role && isLedgerActive ? role : null;
    },
  };
}
