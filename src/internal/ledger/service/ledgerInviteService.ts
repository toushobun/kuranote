import {
  getLedgerInviteErrorMessage,
  ledgerInviteErrorCodes,
  type LedgerInviteErrorCode,
} from "internal/ledger/errors/ledgerInvite";
import type {
  LedgerInviteRepository,
  PendingLedgerInvite,
} from "internal/ledger/repository/ledgerInviteRepository";
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  RepositoryError,
  ValidationError,
} from "internal/shared/errors/appError";
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
  const message =
    getLedgerInviteErrorMessage(code) ?? "邀请操作失败，请稍后重试。";

  switch (code) {
    case ledgerInviteErrorCodes.authRequired:
      return new AuthenticationError(code, message);
    case ledgerInviteErrorCodes.permissionDenied:
      return new AuthorizationError(code, message);
    case ledgerInviteErrorCodes.inviteInvalid:
      return new NotFoundError(code, message);
    case ledgerInviteErrorCodes.inviteUsed:
    case ledgerInviteErrorCodes.inviteAlreadyRevoked:
      return new ConflictError(code, message);
    case ledgerInviteErrorCodes.inviteRoleInvalid:
      return new ValidationError(code, message);
    default:
      return new RepositoryError(code, message);
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
