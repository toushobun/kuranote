import {
  currentLedgerErrorCodes,
  getCurrentLedgerErrorMessage,
  type CurrentLedgerErrorCode,
} from "internal/ledger/errors/currentLedger";
import type { CurrentLedgerRepository } from "internal/ledger/repository/currentLedgerRepository";
import {
  AppError,
  ConflictError,
  NotFoundError,
} from "internal/shared/errors/appError";

export type SwitchCurrentLedgerInput = {
  ledgerId: string;
  userId: string;
};

export type CurrentLedgerServiceDependencies = {
  currentLedgerRepository: CurrentLedgerRepository;
};

export type CurrentLedgerService = {
  switch(input: SwitchCurrentLedgerInput): Promise<void>;
};

function toAppError(code: CurrentLedgerErrorCode): AppError {
  const message =
    getCurrentLedgerErrorMessage(code) ?? "账本切换失败，请稍后重试。";

  if (code === currentLedgerErrorCodes.ledgerInvalid) {
    return new NotFoundError(code, message);
  }

  return new ConflictError(code, message);
}

/**
 * 切换当前账本的 UseCase。成员资格与账本状态由 Service 独立编排，
 * 不依赖 Router middleware 或数据库 RPC 内部的隐式权限判断。
 */
export function createCurrentLedgerService({
  currentLedgerRepository,
}: CurrentLedgerServiceDependencies): CurrentLedgerService {
  return {
    async switch({ ledgerId, userId }) {
      const [isActiveMember, isLedgerActive] = await Promise.all([
        currentLedgerRepository.isActiveMember(ledgerId, userId),
        currentLedgerRepository.isLedgerActive(ledgerId),
      ]);

      if (!isActiveMember || !isLedgerActive) {
        throw toAppError(currentLedgerErrorCodes.ledgerInvalid);
      }

      const result = await currentLedgerRepository.updateCurrentLedger({
        ledgerId,
        userId,
      });

      if (!result.ok) {
        throw toAppError(result.code);
      }
    },
  };
}
