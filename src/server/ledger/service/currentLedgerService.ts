import {
  currentLedgerErrorCodes,
  type CurrentLedgerErrorCode,
} from "server/errors/currentLedger";
import type {
  CurrentLedgerRepository,
  SwitchCurrentLedgerInput,
} from "server/ledger/repository/currentLedgerRepository";
import { AppError, NotFoundError } from "server/shared/errors/appError";

export type CurrentLedgerServiceDependencies = {
  currentLedgerRepository: CurrentLedgerRepository;
};

export type CurrentLedgerService = {
  switch(input: SwitchCurrentLedgerInput): Promise<void>;
};

function toAppError(code: CurrentLedgerErrorCode): AppError {
  if (code === currentLedgerErrorCodes.ledgerInvalid) {
    return new NotFoundError(code, "账本不存在或您不是该账本成员。");
  }

  return new AppError(code, "账本切换失败，请稍后重试。");
}

/**
 * 切换当前账本的 UseCase：校验目标账本存在、当前用户是其 active 成员，
 * 再更新 app_user.current_ledger_id。权限判断独立成立，不依赖 Router
 * middleware——Server Action 会直接调用。
 */
export function createCurrentLedgerService({
  currentLedgerRepository,
}: CurrentLedgerServiceDependencies): CurrentLedgerService {
  return {
    async switch(input) {
      const result = await currentLedgerRepository.switch(input);

      if (!result.ok) {
        throw toAppError(result.code);
      }
    },
  };
}
