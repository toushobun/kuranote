import { canManageMasterData } from "lib/ledger/permissions";
import type { LedgerAccessService } from "internal/ledger/service/ledgerAccessService";
import type { MerchantSummary } from "internal/merchant/entity/merchantSummary";
import { merchantErrorCodes } from "internal/merchant/errors";
import type {
  CreateMerchantInput,
  MerchantRepository,
  UpdateMerchantInput,
} from "internal/merchant/repository/merchantRepository";
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RepositoryError,
} from "internal/shared/errors/appError";
import type { CurrentLedgerRole } from "lib/ledger/current-ledger";
import type { MerchantRow } from "types/merchants";
import { filterMerchantsByKeyword } from "utils/merchants";

export type MerchantListResult = {
  canManageMerchants: boolean;
  merchants: MerchantRow[];
};

export type MerchantsView = MerchantListResult & {
  ledgerName: string;
};

export type MerchantLedgerInput = { ledgerId: string };
export type MerchantListInput = MerchantLedgerInput & {
  keyword: string;
};
export type MerchantViewInput = MerchantListInput & {
  ledgerName: string;
};
export type CreateMerchantServiceInput = Omit<CreateMerchantInput, "userId">;
export type UpdateMerchantServiceInput = Omit<UpdateMerchantInput, "userId">;
export type ArchiveMerchantServiceInput = MerchantLedgerInput & {
  merchantId: string;
};
export type CreateMerchantAliasServiceInput = MerchantLedgerInput & {
  alias: string;
  merchantId: string;
};
export type ArchiveMerchantAliasServiceInput = MerchantLedgerInput & {
  aliasId: string;
};

/** Transaction 等其他模块只依赖此窄查询接口，不直接访问 Merchant Repository。 */
export interface MerchantQueryService {
  findSummariesByIds(input: {
    ledgerId: string;
    merchantIds: string[];
  }): Promise<MerchantSummary[]>;
  listActiveOptions(input: MerchantLedgerInput): Promise<MerchantSummary[]>;
}

export interface MerchantService extends MerchantQueryService {
  archiveAlias(input: ArchiveMerchantAliasServiceInput): Promise<string>;
  archiveMerchant(input: ArchiveMerchantServiceInput): Promise<void>;
  createAlias(input: CreateMerchantAliasServiceInput): Promise<void>;
  createMerchant(input: CreateMerchantServiceInput): Promise<void>;
  getView(input: MerchantViewInput): Promise<MerchantsView>;
  list(input: MerchantListInput): Promise<MerchantListResult>;
  updateMerchant(input: UpdateMerchantServiceInput): Promise<void>;
}

type MerchantServiceDependencies = {
  currentUserId: string | null;
  ledgerAccessService: LedgerAccessService;
  merchantRepository: MerchantRepository;
};

function permissionError(): AuthorizationError {
  return new AuthorizationError(
    merchantErrorCodes.permissionDenied,
    "只有账本所有者或管理员可以维护商家。",
  );
}

function operationError(
  code:
    | typeof merchantErrorCodes.aliasArchiveFailed
    | typeof merchantErrorCodes.archiveFailed
    | typeof merchantErrorCodes.updateFailed,
  message: string,
  details?: unknown,
): RepositoryError {
  return new RepositoryError(code, message, { details });
}

/**
 * Merchant UseCase。成员资格、账本状态与管理权限均在 Service 独立校验，
 * 不依赖 Router middleware；SSR 与 Server Action 会直接调用这些方法。
 */
export function createMerchantService({
  currentUserId,
  ledgerAccessService,
  merchantRepository,
}: MerchantServiceDependencies): MerchantService {
  function requireUserId(): string {
    if (!currentUserId) {
      throw new AuthenticationError("auth_required", "请先登录。");
    }
    return currentUserId;
  }

  async function requireLedgerRole(
    ledgerId: string,
    manage: boolean,
  ): Promise<{ role: CurrentLedgerRole; userId: string }> {
    const userId = requireUserId();
    const role = await ledgerAccessService.getActiveMemberRole({
      ledgerId,
      userId,
    });

    if (!role) {
      throw new NotFoundError(
        merchantErrorCodes.ledgerInvalid,
        "账本不存在或您不是该账本成员。",
      );
    }
    if (manage && !canManageMasterData(role)) throw permissionError();

    return { role, userId };
  }

  async function requireActiveMerchant(
    ledgerId: string,
    merchantId: string,
  ): Promise<void> {
    if (!(await merchantRepository.findActiveMerchant(ledgerId, merchantId))) {
      throw new NotFoundError(
        merchantErrorCodes.merchantInvalid,
        "商家不存在或已归档。",
      );
    }
  }

  async function listMerchants({
    keyword,
    ledgerId,
  }: MerchantListInput): Promise<MerchantListResult> {
    const { role } = await requireLedgerRole(ledgerId, false);
    const merchants = await merchantRepository.listActive(ledgerId);
    return {
      canManageMerchants: canManageMasterData(role),
      merchants: filterMerchantsByKeyword(merchants, keyword),
    };
  }

  return {
    async archiveAlias({ aliasId, ledgerId }) {
      const { userId } = await requireLedgerRole(ledgerId, true);
      const alias = await merchantRepository.findActiveAlias(aliasId);
      if (!alias) {
        throw new NotFoundError(
          merchantErrorCodes.aliasInvalid,
          "商家别名不存在或已归档。",
        );
      }
      if (
        !(await merchantRepository.findActiveMerchant(
          ledgerId,
          alias.merchantId,
        ))
      ) {
        throw new NotFoundError(
          merchantErrorCodes.aliasInvalid,
          "商家别名不存在或不属于当前账本。",
        );
      }

      const archived = await merchantRepository.archiveAlias({
        aliasId,
        userId,
      });
      if (!archived) {
        throw operationError(
          merchantErrorCodes.aliasArchiveFailed,
          "商家别名归档失败，请稍后重试。",
          { merchantId: alias.merchantId },
        );
      }
      return alias.merchantId;
    },

    async archiveMerchant({ ledgerId, merchantId }) {
      const { userId } = await requireLedgerRole(ledgerId, true);
      const archived = await merchantRepository.archiveMerchant({
        ledgerId,
        merchantId,
        userId,
      });
      if (!archived) {
        throw operationError(
          merchantErrorCodes.archiveFailed,
          "商家归档失败，请稍后重试。",
        );
      }
    },

    async createAlias({ alias, ledgerId, merchantId }) {
      const { userId } = await requireLedgerRole(ledgerId, true);
      await requireActiveMerchant(ledgerId, merchantId);
      await merchantRepository.createAlias({ alias, merchantId, userId });
    },

    async createMerchant(input) {
      const { userId } = await requireLedgerRole(input.ledgerId, true);
      await merchantRepository.createMerchant({ ...input, userId });
    },

    async findSummariesByIds({ ledgerId, merchantIds }) {
      await requireLedgerRole(ledgerId, false);
      return merchantRepository.findSummariesByIds(ledgerId, [
        ...new Set(merchantIds),
      ]);
    },

    async getView({ ledgerName, ...input }) {
      return {
        ...(await listMerchants(input)),
        ledgerName,
      };
    },

    async list(input) {
      return listMerchants(input);
    },

    async listActiveOptions({ ledgerId }) {
      await requireLedgerRole(ledgerId, false);
      return merchantRepository.listActiveSummaries(ledgerId);
    },

    async updateMerchant(input) {
      const { userId } = await requireLedgerRole(input.ledgerId, true);
      const updated = await merchantRepository.updateMerchant({
        ...input,
        userId,
      });
      if (!updated) {
        throw operationError(
          merchantErrorCodes.updateFailed,
          "商家更新失败。请确认商家名称是否重复，或稍后重试。",
        );
      }
    },
  };
}
