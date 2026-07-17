import {
  getLedgerInviteErrorMessage,
  ledgerInviteErrorCodes,
  type LedgerInviteErrorCode,
} from "server/errors/ledgerInvite";
import type { LedgerInviteRepository } from "server/ledger/repository/ledgerInviteRepository";
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  RepositoryError,
  ValidationError,
} from "server/shared/errors/appError";

export type LedgerInviteServiceDependencies = {
  ledgerInviteRepository: LedgerInviteRepository;
};

export type LedgerInviteService = {
  accept(token: string): Promise<void>;
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
 * 不假设调用方一定经过 Router middleware（Server Component 也会直接调用）。
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
  };
}
