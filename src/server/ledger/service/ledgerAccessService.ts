import type { CurrentLedgerRole } from "lib/ledger/current-ledger";
import type { LedgerSettingsRepository } from "server/ledger/repository/ledgerSettingsRepository";

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
