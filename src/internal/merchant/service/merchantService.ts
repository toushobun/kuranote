import { canManageMasterData } from "internal/ledger";
import {
  requireActiveLedgerMemberRole,
  type LedgerAccessService,
} from "internal/ledger";
import type { MerchantSummary } from "internal/merchant/entity/merchantSummary";
import {
  createMerchantIconService,
  type MerchantIcon,
} from "internal/merchant/service/merchantIconService";
import {
  getMerchantActionErrorMessage,
  getMerchantErrorMessage,
  merchantErrorCodes,
} from "internal/merchant/errors";
import type {
  CreateMerchantInput,
  MerchantData,
  MerchantRepository,
  UpdateMerchantInput,
} from "internal/merchant/repository/merchantRepository";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from "internal/shared/errors/appError";
import type { CurrentLedgerRole } from "internal/ledger";
import { filterMerchantsByKeyword } from "utils/merchants";

export type MerchantListResult = {
  canManageMerchants: boolean;
  merchants: MerchantData[];
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
export type MerchantIconInput = MerchantLedgerInput & { websiteUrl: string };
export type SetPreferredMerchantAliasServiceInput = MerchantLedgerInput & {
  aliasId: string | null;
  merchantId: string;
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
  assertCanManage(input: MerchantLedgerInput): Promise<void>;
  createAlias(input: CreateMerchantAliasServiceInput): Promise<void>;
  createMerchant(input: CreateMerchantServiceInput): Promise<void>;
  getMerchant(input: ArchiveMerchantServiceInput): Promise<MerchantData>;
  getMerchantIcon(input: MerchantIconInput): Promise<MerchantIcon>;
  getView(input: MerchantViewInput): Promise<MerchantsView>;
  list(input: MerchantListInput): Promise<MerchantListResult>;
  setPreferredAlias(
    input: SetPreferredMerchantAliasServiceInput,
  ): Promise<void>;
  updateMerchant(input: UpdateMerchantServiceInput): Promise<void>;
}

type MerchantServiceDependencies = {
  currentUserId: string | null;
  ledgerAccessService: LedgerAccessService;
  merchantRepository: MerchantRepository;
  merchantIconService?: ReturnType<typeof createMerchantIconService>;
};

function permissionError(): AuthorizationError {
  return new AuthorizationError(
    merchantErrorCodes.permissionDenied,
    getMerchantActionErrorMessage(merchantErrorCodes.permissionDenied) ??
      "没有权限维护商家。",
  );
}

function conflictError(
  code:
    | typeof merchantErrorCodes.aliasArchiveFailed
    | typeof merchantErrorCodes.aliasPreferredUpdateFailed
    | typeof merchantErrorCodes.archiveFailed
    | typeof merchantErrorCodes.updateFailed,
): ConflictError {
  return new ConflictError(
    code,
    getMerchantActionErrorMessage(code) ?? "商家操作失败，请稍后重试。",
  );
}

/**
 * Merchant UseCase。成员资格、账本状态与管理权限均在 Service 独立校验，
 * 不依赖 Router middleware；SSR 与 Server Action 会直接调用这些方法。
 */
export function createMerchantService({
  currentUserId,
  ledgerAccessService,
  merchantIconService = createMerchantIconService(),
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
    const role = await requireActiveLedgerMemberRole(ledgerAccessService, {
      ledgerId,
      userId,
    });
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
        getMerchantErrorMessage(merchantErrorCodes.merchantInvalid) ??
          "商家指定不正确。",
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
          getMerchantErrorMessage(merchantErrorCodes.aliasInvalid) ??
            "商家别名指定不正确。",
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
          getMerchantErrorMessage(merchantErrorCodes.aliasInvalid) ??
            "商家别名指定不正确。",
        );
      }

      const archived = await merchantRepository.archiveAlias({
        aliasId,
        userId,
      });
      if (!archived) {
        throw conflictError(merchantErrorCodes.aliasArchiveFailed);
      }
      return alias.merchantId;
    },

    async archiveMerchant({ ledgerId, merchantId }) {
      const { userId } = await requireLedgerRole(ledgerId, true);
      await requireActiveMerchant(ledgerId, merchantId);
      const archived = await merchantRepository.archiveMerchant({
        ledgerId,
        merchantId,
        userId,
      });
      if (!archived) {
        throw conflictError(merchantErrorCodes.archiveFailed);
      }
    },

    async assertCanManage({ ledgerId }) {
      await requireLedgerRole(ledgerId, true);
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

    async getMerchant({ ledgerId, merchantId }) {
      await requireLedgerRole(ledgerId, true);
      const merchant = await merchantRepository.findActiveMerchantData(
        ledgerId,
        merchantId,
      );
      if (!merchant) {
        throw new NotFoundError(
          merchantErrorCodes.merchantInvalid,
          getMerchantErrorMessage(merchantErrorCodes.merchantInvalid) ??
            "商家指定不正确。",
        );
      }
      return merchant;
    },

    async getMerchantIcon({ ledgerId, websiteUrl }) {
      await requireLedgerRole(ledgerId, false);
      return merchantIconService.fetchIcon(websiteUrl);
    },

    async list(input) {
      return listMerchants(input);
    },

    async listActiveOptions({ ledgerId }) {
      await requireLedgerRole(ledgerId, false);
      return merchantRepository.listActiveSummaries(ledgerId);
    },

    async setPreferredAlias({ aliasId, ledgerId, merchantId }) {
      await requireLedgerRole(ledgerId, true);
      await requireActiveMerchant(ledgerId, merchantId);

      if (aliasId) {
        const alias = await merchantRepository.findActiveAlias(aliasId);
        if (!alias || alias.merchantId !== merchantId) {
          throw new NotFoundError(
            merchantErrorCodes.aliasInvalid,
            getMerchantErrorMessage(merchantErrorCodes.aliasInvalid) ??
              "商家别名指定不正确。",
          );
        }
      }

      const updated = await merchantRepository.setPreferredAlias({
        aliasId,
        ledgerId,
        merchantId,
      });
      if (!updated) {
        throw conflictError(merchantErrorCodes.aliasPreferredUpdateFailed);
      }
    },

    async updateMerchant(input) {
      const { userId } = await requireLedgerRole(input.ledgerId, true);
      await requireActiveMerchant(input.ledgerId, input.merchantId);
      const updated = await merchantRepository.updateMerchant({
        ...input,
        userId,
      });
      if (!updated) {
        throw conflictError(merchantErrorCodes.updateFailed);
      }
    },
  };
}
