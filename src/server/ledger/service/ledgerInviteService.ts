import {
  getLedgerInviteErrorMessage,
  ledgerInviteErrorCodes,
  type LedgerInviteErrorCode,
} from "server/errors/ledgerInvite";
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

export type LedgerInviteService = {
  accept(token: string): Promise<void>;
  create(ledgerId: string, role: LedgerInviteRole): Promise<CreatedLedgerInvite>;
  revoke(ledgerId: string, inviteId: string): Promise<void>;
  listPending(ledgerId: string): Promise<PendingLedgerInvite[]>;
};

function toAppError(code: LedgerInviteErrorCode): AppError {
  const message =
    getLedgerInviteErrorMessage(code) ?? "邀请处理失败，请稍后重试。";

  switch (code) {
    case ledgerInviteErrorCodes.authRequired:
      return new AuthenticationError(code, message);
    case ledgerInviteErrorCodes.permissionDenied:
      return new AuthorizationError(code, message);
    case ledgerInviteErrorCodes.inviteInvalid:
      return new NotFoundError(code, message);
    case ledgerInviteErrorCodes.inviteAlreadyRevoked:
    case ledgerInviteErrorCodes.inviteUsed:
      return new ConflictError(code, message);
    case ledgerInviteErrorCodes.inviteRoleInvalid:
      return new ValidationError(code, message);
    default:
      return new RepositoryError(code, message);
  }
}

/**
 * Ledger 邀请相关的 UseCase。权限判断和业务状态校验独立成立，
 * 不假设调用方一定经过 Router middleware（Server Component / Server Action
 * 也会直接调用）。所有方法失败时抛出 shared/errors 定义的应用错误，
 * 调用方（Controller 或 Server Action）各自决定如何呈现。
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

    async create(ledgerId, role) {
      const result = await ledgerInviteRepository.create(ledgerId, role);

      if (!result.ok) {
        throw toAppError(result.code);
      }

      return {
        inviteId: result.inviteId,
        role: result.role,
        token: result.token,
      };
    },

    async listPending(ledgerId) {
      const result = await ledgerInviteRepository.listPending(ledgerId);

      if (!result.ok) {
        throw toAppError(result.code);
      }

      return result.invites;
    },

    async revoke(ledgerId, inviteId) {
      const result = await ledgerInviteRepository.revoke(ledgerId, inviteId);

      if (!result.ok) {
        throw toAppError(result.code);
      }
    },
  };
}
