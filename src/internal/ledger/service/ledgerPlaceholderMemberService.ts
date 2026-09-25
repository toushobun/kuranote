import {
  ledgerPlaceholderMemberNameMaxLength,
  type LedgerPlaceholderMemberSummary,
} from "internal/ledger/entity/ledgerPlaceholderMember";
import {
  getLedgerPlaceholderMemberErrorMessage,
  ledgerPlaceholderMemberErrorCodes,
  type LedgerPlaceholderMemberErrorCode,
} from "internal/ledger/errors/ledgerPlaceholderMember";
import type { LedgerPlaceholderMemberRepository } from "internal/ledger/repository/ledgerPlaceholderMemberRepository";
import {
  requireActiveLedgerMemberRole,
  type LedgerAccessService,
} from "internal/ledger/service/ledgerAccessService";
import { canManageMembers } from "internal/ledger/service/ledgerPermissions";
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  RepositoryError,
  ValidationError,
} from "internal/shared/errors/appError";

type LedgerPlaceholderMemberActor = {
  ledgerId: string;
  userId: string;
};

export type CreateLedgerPlaceholderMemberInput =
  LedgerPlaceholderMemberActor & { displayName: string };

export type RenameLedgerPlaceholderMemberInput =
  LedgerPlaceholderMemberActor & {
    displayName: string;
    placeholderId: string;
  };

export type DeleteLedgerPlaceholderMemberInput =
  LedgerPlaceholderMemberActor & { placeholderId: string };

/** 供 account 等其他模块使用的窄查询接口：只读取未认领占位摘要。 */
export interface LedgerPlaceholderMemberQueryService {
  listUnclaimed(
    input: LedgerPlaceholderMemberActor,
  ): Promise<LedgerPlaceholderMemberSummary[]>;
}

export type EnsureLedgerPlaceholderMembersForImportInput =
  LedgerPlaceholderMemberActor & { displayNames: string[] };

/**
 * 供数据导入使用的窄接口：读取未认领占位，并按名字批量创建或复用占位。
 * 批量确保在单一事务内完成，失败时不留下任何占位。
 */
export interface LedgerPlaceholderImportService extends LedgerPlaceholderMemberQueryService {
  /** 返回「规范化后的名字 → 占位 ID」；空列表直接返回空映射，不调用数据库。 */
  ensureForImport(
    input: EnsureLedgerPlaceholderMembersForImportInput,
  ): Promise<ReadonlyMap<string, string>>;
}

export interface LedgerPlaceholderMemberService extends LedgerPlaceholderImportService {
  create(
    input: CreateLedgerPlaceholderMemberInput,
  ): Promise<{ placeholderId: string }>;
  delete(input: DeleteLedgerPlaceholderMemberInput): Promise<void>;
  rename(input: RenameLedgerPlaceholderMemberInput): Promise<void>;
}

type LedgerPlaceholderMemberServiceDependencies = {
  ledgerAccessService: LedgerAccessService;
  ledgerPlaceholderMemberRepository: LedgerPlaceholderMemberRepository;
};

function toAppError(code: LedgerPlaceholderMemberErrorCode): AppError {
  const message =
    getLedgerPlaceholderMemberErrorMessage(code) ??
    "待邀请成员操作失败，请稍后重试。";

  switch (code) {
    case ledgerPlaceholderMemberErrorCodes.authRequired:
      return new AuthenticationError(code, message);
    case ledgerPlaceholderMemberErrorCodes.permissionDenied:
      return new AuthorizationError(code, message);
    case ledgerPlaceholderMemberErrorCodes.ledgerNotFound:
    case ledgerPlaceholderMemberErrorCodes.placeholderNotFound:
      return new NotFoundError(code, message);
    case ledgerPlaceholderMemberErrorCodes.placeholderAlreadyClaimed:
    case ledgerPlaceholderMemberErrorCodes.placeholderInUse:
    case ledgerPlaceholderMemberErrorCodes.placeholderNameConflict:
    case ledgerPlaceholderMemberErrorCodes.placeholderNameMemberConflict:
      return new ConflictError(code, message);
    case ledgerPlaceholderMemberErrorCodes.placeholderNameInvalid:
    case ledgerPlaceholderMemberErrorCodes.placeholderNameTooLong:
      return new ValidationError(code, message);
    default:
      return new RepositoryError(code, message);
  }
}

/** 与数据库规范化一致：只去除首尾空白，不做大小写折叠。 */
function normalizeDisplayName(displayName: string): string {
  const normalized = displayName.trim();
  if (!normalized) {
    throw toAppError(ledgerPlaceholderMemberErrorCodes.placeholderNameInvalid);
  }
  if (normalized.length > ledgerPlaceholderMemberNameMaxLength) {
    throw toAppError(ledgerPlaceholderMemberErrorCodes.placeholderNameTooLong);
  }
  return normalized;
}

/**
 * 账本占位成员的最小管理 Service。管理操作在 Service 内独立确认 active
 * 成员与 owner/admin 身份（第二道防线），归属、认领状态与重名等最终判断
 * 仍以 RPC 持锁后的结果为准。
 */
export function createLedgerPlaceholderMemberService({
  ledgerAccessService,
  ledgerPlaceholderMemberRepository,
}: LedgerPlaceholderMemberServiceDependencies): LedgerPlaceholderMemberService {
  async function requireManager(actor: LedgerPlaceholderMemberActor) {
    const role = await requireActiveLedgerMemberRole(
      ledgerAccessService,
      actor,
    );
    if (!canManageMembers(role)) {
      throw toAppError(ledgerPlaceholderMemberErrorCodes.permissionDenied);
    }
  }

  function unwrap(
    result:
      | { ok: true }
      | { code: LedgerPlaceholderMemberErrorCode; ok: false },
  ) {
    if (!result.ok) throw toAppError(result.code);
  }

  return {
    async create(input) {
      await requireManager(input);
      const result = await ledgerPlaceholderMemberRepository.create(
        input.ledgerId,
        normalizeDisplayName(input.displayName),
      );
      if (!result.ok) throw toAppError(result.code);
      return { placeholderId: result.placeholderId };
    },

    async delete(input) {
      await requireManager(input);
      unwrap(
        await ledgerPlaceholderMemberRepository.delete(
          input.ledgerId,
          input.placeholderId.toLowerCase(),
        ),
      );
    },

    async ensureForImport(input) {
      await requireManager(input);
      const displayNames = [
        ...new Set(input.displayNames.map(normalizeDisplayName)),
      ];
      if (displayNames.length === 0) return new Map();

      const result = await ledgerPlaceholderMemberRepository.ensure(
        input.ledgerId,
        displayNames,
      );
      if (!result.ok) throw toAppError(result.code);

      const placeholderIdByName = new Map(
        result.placeholders.map(({ displayName, placeholderId }) => [
          displayName,
          placeholderId,
        ]),
      );
      // 每个请求的名字都必须拿到占位 ID，否则不能继续导入（缺失会被误当成无持有人）。
      if (displayNames.some((name) => !placeholderIdByName.has(name))) {
        throw new RepositoryError(
          "ledger_placeholder_ensure_result_invalid",
          getLedgerPlaceholderMemberErrorMessage(
            ledgerPlaceholderMemberErrorCodes.createFailed,
          )!,
        );
      }
      return placeholderIdByName;
    },

    async listUnclaimed(input) {
      await requireActiveLedgerMemberRole(ledgerAccessService, input);
      return ledgerPlaceholderMemberRepository.listUnclaimed(input.ledgerId);
    },

    async rename(input) {
      await requireManager(input);
      unwrap(
        await ledgerPlaceholderMemberRepository.rename(
          input.ledgerId,
          input.placeholderId.toLowerCase(),
          normalizeDisplayName(input.displayName),
        ),
      );
    },
  };
}
