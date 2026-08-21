import {
  currentLedgerErrorCodes,
  getCurrentLedgerErrorMessage,
  type CurrentLedgerErrorCode,
} from "internal/ledger/errors/currentLedger";
import type { CurrentLedger } from "internal/ledger/entity/currentLedger";
import type {
  CurrentLedgerContextRepository,
  CurrentLedgerRepository,
} from "internal/ledger/repository/currentLedgerRepository";
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
  currentLedgerRepository: CurrentLedgerRepository &
    CurrentLedgerContextRepository;
};

export type CurrentLedgerService = {
  getAccessibleLedger(input: {
    email: string;
    ledgerId: string;
    userId: string;
  }): Promise<CurrentLedger>;
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
 * 当前账本 Service。成员资格与账本状态由 Service 独立编排，
 * 不依赖 Router middleware 或数据库 RPC 内部的隐式权限判断。
 */
export function createCurrentLedgerService({
  currentLedgerRepository,
}: CurrentLedgerServiceDependencies): CurrentLedgerService {
  return {
    async getAccessibleLedger({ email, ledgerId, userId }) {
      const context = await currentLedgerRepository.getContext(userId, email);
      const ledger = context.ledgers.find(
        (candidate) => candidate.id === ledgerId,
      );
      if (!ledger) {
        throw toAppError(currentLedgerErrorCodes.ledgerInvalid);
      }
      return ledger;
    },

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
