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

/**
 * 服务实例随请求级 Container 创建，因此这里只在单次请求内缓存「有权限」的
 * 判定结果：数据导入一个批次会对同一账本重复调用上百次权限检查，每次都是
 * 两个数据库往返。无权限（null）与查询失败都不缓存，随后仍会重新查询。
 */
export function createLedgerAccessService(
  ledgerSettingsRepository: LedgerSettingsRepository,
): LedgerAccessService {
  const activeRoleByLedgerAndUser = new Map<string, CurrentLedgerRole>();

  return {
    async getActiveMemberRole({ ledgerId, userId }) {
      const cacheKey = `${ledgerId}:${userId}`;
      const cachedRole = activeRoleByLedgerAndUser.get(cacheKey);
      if (cachedRole) return cachedRole;

      const [role, isLedgerActive] = await Promise.all([
        ledgerSettingsRepository.getMemberRole(ledgerId, userId),
        ledgerSettingsRepository.isLedgerActive(ledgerId),
      ]);

      if (!role || !isLedgerActive) return null;
      activeRoleByLedgerAndUser.set(cacheKey, role);
      return role;
    },
  };
}
