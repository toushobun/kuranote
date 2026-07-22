import {
  ledgerInviteErrorCodes,
  type LedgerInviteErrorCode,
} from "server/ledger/errors/ledgerInvite";
import type {
  LedgerInviteRepository,
  PendingLedgerInvite,
} from "server/ledger/repository/ledgerInviteRepository";
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  RepositoryError,
  ValidationError,
} from "server/shared/errors/appError";
import type { LedgerInviteRole } from "types/ledgers";

export type LedgerInviteServiceDependencies = {
  ledgerInviteRepository: LedgerInviteRepository;
};

export type CreatedLedgerInvite = {
  inviteId: string;
  role: LedgerInviteRole;
  token: string;
};

export type ManageLedgerInviteInput = {
  ledgerId: string;
  userId: string;
};

export type CreateLedgerInviteInput = ManageLedgerInviteInput & {
  role: LedgerInviteRole;
};

export type RevokeLedgerInviteInput = ManageLedgerInviteInput & {
  inviteId: string;
};

export type LedgerInviteService = {
  accept(token: string): Promise<void>;
  create(input: CreateLedgerInviteInput): Promise<CreatedLedgerInvite>;
  revoke(input: RevokeLedgerInviteInput): Promise<void>;
  listPending(input: ManageLedgerInviteInput): Promise<PendingLedgerInvite[]>;
};

function toAppError(code: LedgerInviteErrorCode): AppError {
  switch (code) {
    case ledgerInviteErrorCodes.authRequired:
      return new AuthenticationError(code, "请先登录。");
    case ledgerInviteErrorCodes.permissionDenied:
      return new AuthorizationError(code, "没有权限管理账本邀请。");
    case ledgerInviteErrorCodes.inviteInvalid:
      return new NotFoundError(code, "邀请不存在或已失效。");
    case ledgerInviteErrorCodes.inviteUsed:
    case ledgerInviteErrorCodes.inviteAlreadyRevoked:
      return new ConflictError(code, "邀请状态已发生变化。");
    case ledgerInviteErrorCodes.inviteRoleInvalid:
      return new ValidationError(code, "邀请角色无效。");
    case ledgerInviteErrorCodes.loadFailed:
      return new RepositoryError(code, "邀请列表加载失败，请稍后重试。");
    default:
      return new AppError(code, "邀请操作失败，请稍后重试。");
  }
}

async function requireInviteManager(
  repository: LedgerInviteRepository,
  { ledgerId, userId }: ManageLedgerInviteInput,
): Promise<void> {
  const role = await repository.getMemberRole(ledgerId, userId);

  if (role !== "owner" && role !== "admin") {
    throw toAppError(ledgerInviteErrorCodes.permissionDenied);
  }
}

/**
 * Ledger 邀请相关的 UseCase。创建、撤销和列表读取都在 Service 内独立
 * 校验 owner/admin 权限，不依赖 Router middleware 或 RPC 的隐式检查。
 */
export function createLedgerInviteService({
  ledgerInviteRepository,
}: LedgerInviteServiceDependencies): LedgerInviteService {
  return {
    async accept(token) {
      const result = await ledgerInviteRepository.accept(token);

      if (!result.ok) {
        throw toAppError(result.code);
      }
    },

    async create(input) {
      await requireInviteManager(ledgerInviteRepository, input);
      const result = await ledgerInviteRepository.create(
        input.ledgerId,
        input.role,
      );

      if (!result.ok) {
        throw toAppError(result.code);
      }

      return {
        inviteId: result.inviteId,
        role: result.role,
        token: result.token,
      };
    },

    async listPending(input) {
      await requireInviteManager(ledgerInviteRepository, input);
      const result = await ledgerInviteRepository.listPending(input.ledgerId);

      if (!result.ok) {
        throw toAppError(result.code);
      }

      return result.invites;
    },

    async revoke(input) {
      await requireInviteManager(ledgerInviteRepository, input);
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
