import {
  getLedgerInviteErrorMessage,
  ledgerInviteErrorCodes,
  type LedgerInviteErrorCode,
} from "internal/ledger/errors/ledgerInvite";
import type {
  AcceptedLedgerInvite,
  LedgerInviteRepository,
  PendingLedgerInvite,
} from "internal/ledger/repository/ledgerInviteRepository";
import {
  requireActiveLedgerMemberRole,
  type LedgerAccessService,
} from "internal/ledger/service/ledgerAccessService";
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  RepositoryError,
  ValidationError,
} from "internal/shared/errors/appError";
import type { LedgerInviteRole } from "internal/ledger/entity/ledgerInviteRole";

export type LedgerInviteServiceDependencies = {
  ledgerAccessService: LedgerAccessService;
  ledgerInviteRepository: LedgerInviteRepository;
};

export type CreatedLedgerInvite = {
  inviteId: string;
  placeholderId: string | null;
  role: LedgerInviteRole;
  token: string;
};

export type ManageLedgerInviteInput = {
  ledgerId: string;
  userId: string;
};

export type CreateLedgerInviteInput = ManageLedgerInviteInput & {
  /** 省略或为 null 时生成匿名邀请。 */
  placeholderId?: string | null;
  role: LedgerInviteRole;
};

export type RevokeLedgerInviteInput = ManageLedgerInviteInput & {
  inviteId: string;
};

export type LedgerInviteService = {
  accept(token: string): Promise<AcceptedLedgerInvite>;
  create(input: CreateLedgerInviteInput): Promise<CreatedLedgerInvite>;
  revoke(input: RevokeLedgerInviteInput): Promise<void>;
  listPending(input: ManageLedgerInviteInput): Promise<PendingLedgerInvite[]>;
};

function toAppError(code: LedgerInviteErrorCode): AppError {
  const message =
    getLedgerInviteErrorMessage(code) ?? "邀请操作失败，请稍后重试。";

  switch (code) {
    case ledgerInviteErrorCodes.authRequired:
      return new AuthenticationError(code, message);
    case ledgerInviteErrorCodes.permissionDenied:
    case ledgerInviteErrorCodes.userInactive:
      return new AuthorizationError(code, message);
    case ledgerInviteErrorCodes.inviteInvalid:
    case ledgerInviteErrorCodes.ledgerNotFound:
    case ledgerInviteErrorCodes.placeholderNotFound:
      return new NotFoundError(code, message);
    case ledgerInviteErrorCodes.inviteUsed:
    case ledgerInviteErrorCodes.inviteAlreadyRevoked:
    case ledgerInviteErrorCodes.placeholderAlreadyClaimed:
    case ledgerInviteErrorCodes.placeholderClaimAccountNameConflict:
    case ledgerInviteErrorCodes.placeholderClaimExistingMember:
    case ledgerInviteErrorCodes.placeholderInvitePending:
      return new ConflictError(code, message);
    case ledgerInviteErrorCodes.inviteRoleInvalid:
      return new ValidationError(code, message);
    default:
      return new RepositoryError(code, message);
  }
}

async function requireInviteManager(
  ledgerAccessService: LedgerAccessService,
  { ledgerId, userId }: ManageLedgerInviteInput,
): Promise<void> {
  const role = await requireActiveLedgerMemberRole(ledgerAccessService, {
    ledgerId,
    userId,
  });

  if (role !== "owner" && role !== "admin") {
    throw toAppError(ledgerInviteErrorCodes.permissionDenied);
  }
}

/**
 * Ledger 邀请相关的 UseCase。创建、撤销和列表读取都在 Service 内独立
 * 校验 owner/admin 权限，不依赖 Router middleware 或 RPC 的隐式检查。
 */
export function createLedgerInviteService({
  ledgerAccessService,
  ledgerInviteRepository,
}: LedgerInviteServiceDependencies): LedgerInviteService {
  return {
    async accept(token) {
      // 接受者不要求预先属于账本；成员冲突、占位状态等最终判断由 RPC 持锁完成。
      const result = await ledgerInviteRepository.accept(token);

      if (!result.ok) {
        throw toAppError(result.code);
      }

      return result.invite;
    },

    async create(input) {
      await requireInviteManager(ledgerAccessService, input);
      // Service 只预检管理权限；占位归属、认领状态与有效绑定由 RPC 持锁后判断。
      // 数据库返回小写 UUID，这里统一为小写，避免 Repository 的一致性校验误判。
      const result = await ledgerInviteRepository.create(
        input.ledgerId,
        input.role,
        input.placeholderId?.toLowerCase() ?? null,
      );

      if (!result.ok) {
        throw toAppError(result.code);
      }

      return {
        inviteId: result.inviteId,
        placeholderId: result.placeholderId,
        role: result.role,
        token: result.token,
      };
    },

    async listPending(input) {
      await requireInviteManager(ledgerAccessService, input);
      const result = await ledgerInviteRepository.listPending(input.ledgerId);

      if (!result.ok) {
        throw toAppError(result.code);
      }

      return result.invites;
    },

    async revoke(input) {
      await requireInviteManager(ledgerAccessService, input);
      const result = await ledgerInviteRepository.revoke(
        input.ledgerId,
        input.inviteId,
      );

      if (!result.ok) {
        throw toAppError(result.code);
      }
    },
  };
}
