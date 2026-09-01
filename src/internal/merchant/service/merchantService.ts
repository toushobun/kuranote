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
  MerchantTagData,
  UpdateMerchantInput,
} from "internal/merchant/repository/merchantRepository";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "internal/shared/errors/appError";
import type { CurrentLedgerRole } from "internal/ledger";
import { filterMerchantsByKeyword } from "utils/merchants";

export type MerchantListResult = {
  canManageMerchants: boolean;
  merchants: MerchantData[];
  selectedTag: MerchantTagData | null;
  tagFilterError: string | null;
  tags: MerchantTagData[];
};

export type MerchantLedgerInput = { ledgerId: string };
export type MerchantListInput = MerchantLedgerInput & {
  keyword: string;
  tagId?: string | null;
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
export type MerchantTagServiceInput = MerchantLedgerInput & { tagId: string };
export type CreateMerchantTagServiceInput = MerchantLedgerInput & {
  icon: string;
  name: string;
};
export type UpdateMerchantTagServiceInput = CreateMerchantTagServiceInput & {
  tagId: string;
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
  archiveTag(input: MerchantTagServiceInput): Promise<void>;
  assertCanManage(input: MerchantLedgerInput): Promise<void>;
  createAlias(input: CreateMerchantAliasServiceInput): Promise<void>;
  createMerchant(input: CreateMerchantServiceInput): Promise<void>;
  createTag(input: CreateMerchantTagServiceInput): Promise<void>;
  getMerchant(input: ArchiveMerchantServiceInput): Promise<MerchantData>;
  getMerchantIcon(input: MerchantIconInput): Promise<MerchantIcon>;
  list(input: MerchantListInput): Promise<MerchantListResult>;
  listTags(input: MerchantLedgerInput): Promise<MerchantTagData[]>;
  reorderTags(input: MerchantLedgerInput & { tagIds: string[] }): Promise<void>;
  setPreferredAlias(
    input: SetPreferredMerchantAliasServiceInput,
  ): Promise<void>;
  updateMerchant(input: UpdateMerchantServiceInput): Promise<void>;
  updateTag(input: UpdateMerchantTagServiceInput): Promise<void>;
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
    | typeof merchantErrorCodes.merchantTagArchiveFailed
    | typeof merchantErrorCodes.merchantTagUpdateFailed
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
        getMerchantErrorMessage(merchantErrorCodes.merchantInvalid),
      );
    }
  }

  async function listMerchants({
    keyword,
    ledgerId,
    tagId,
  }: MerchantListInput): Promise<MerchantListResult> {
    const { role } = await requireLedgerRole(ledgerId, false);
    const { merchants: allMerchants, tags } =
      await merchantRepository.listActive(ledgerId);
    const tagById = new Map(tags.map((tag) => [tag.id, tag]));
    const keywordFiltered = filterMerchantsByKeyword(allMerchants, keyword);
    const selectedTag = tagId ? (tagById.get(tagId) ?? null) : null;
    const tagFilterError =
      tagId && !selectedTag
        ? getMerchantErrorMessage(merchantErrorCodes.merchantTagInvalid)
        : null;
    return {
      canManageMerchants: canManageMasterData(role),
      merchants: tagId
        ? selectedTag
          ? keywordFiltered.filter((merchant) =>
              merchant.tags.some((tag) => tag.id === selectedTag.id),
            )
          : []
        : keywordFiltered,
      selectedTag,
      tagFilterError,
      tags,
    };
  }

  async function requireActiveTags(
    ledgerId: string,
    tagIds: string[],
  ): Promise<void> {
    if (tagIds.length === 0) return;
    const activeIds = new Set(
      await merchantRepository.listActiveTagIds(ledgerId),
    );
    if (tagIds.some((tagId) => !activeIds.has(tagId))) {
      throw new ValidationError(
        merchantErrorCodes.merchantTagInvalid,
        getMerchantErrorMessage(merchantErrorCodes.merchantTagInvalid),
      );
    }
  }

  async function requireActiveTag(ledgerId: string, tagId: string) {
    const tag = await merchantRepository.findActiveTag(ledgerId, tagId);
    if (!tag) {
      throw new NotFoundError(
        merchantErrorCodes.merchantTagInvalid,
        getMerchantErrorMessage(merchantErrorCodes.merchantTagInvalid),
      );
    }
    return tag;
  }

  return {
    async archiveAlias({ aliasId, ledgerId }) {
      const { userId } = await requireLedgerRole(ledgerId, true);
      const alias = await merchantRepository.findActiveAlias(aliasId);
      if (!alias) {
        throw new NotFoundError(
          merchantErrorCodes.aliasInvalid,
          getMerchantErrorMessage(merchantErrorCodes.aliasInvalid),
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
          getMerchantErrorMessage(merchantErrorCodes.aliasInvalid),
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

    async archiveTag({ ledgerId, tagId }) {
      await requireLedgerRole(ledgerId, true);
      await requireActiveTag(ledgerId, tagId);
      if (!(await merchantRepository.archiveTag(ledgerId, tagId))) {
        throw conflictError(merchantErrorCodes.merchantTagArchiveFailed);
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
      const tagIds = input.tagIds ?? [];
      await requireActiveTags(input.ledgerId, tagIds);
      await merchantRepository.createMerchant({ ...input, tagIds, userId });
    },

    async createTag(input) {
      await requireLedgerRole(input.ledgerId, true);
      await merchantRepository.createTag(input);
    },

    async findSummariesByIds({ ledgerId, merchantIds }) {
      await requireLedgerRole(ledgerId, false);
      return merchantRepository.findSummariesByIds(ledgerId, [
        ...new Set(merchantIds),
      ]);
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
          getMerchantErrorMessage(merchantErrorCodes.merchantInvalid),
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

    async listTags({ ledgerId }) {
      await requireLedgerRole(ledgerId, false);
      return merchantRepository.listActiveTags(ledgerId);
    },

    async reorderTags({ ledgerId, tagIds }) {
      await requireLedgerRole(ledgerId, true);
      await merchantRepository.reorderTags(ledgerId, tagIds);
    },

    async setPreferredAlias({ aliasId, ledgerId, merchantId }) {
      await requireLedgerRole(ledgerId, true);
      await requireActiveMerchant(ledgerId, merchantId);

      if (aliasId) {
        const alias = await merchantRepository.findActiveAlias(aliasId);
        if (!alias || alias.merchantId !== merchantId) {
          throw new NotFoundError(
            merchantErrorCodes.aliasInvalid,
            getMerchantErrorMessage(merchantErrorCodes.aliasInvalid),
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
      const tagIds = input.tagIds ?? [];
      await requireActiveTags(input.ledgerId, tagIds);
      const updated = await merchantRepository.updateMerchant({
        ...input,
        tagIds,
        userId,
      });
      if (!updated) {
        throw conflictError(merchantErrorCodes.updateFailed);
      }
    },

    async updateTag(input) {
      await requireLedgerRole(input.ledgerId, true);
      await requireActiveTag(input.ledgerId, input.tagId);
      if (!(await merchantRepository.updateTag(input))) {
        throw conflictError(merchantErrorCodes.merchantTagUpdateFailed);
      }
    },
  };
}
