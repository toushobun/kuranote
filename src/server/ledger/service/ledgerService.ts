import { routePaths } from "config/paths";
import {
  getLedgerCreateErrorMessage,
  ledgerCreateErrorCodes,
  type LedgerCreateErrorCode,
} from "server/errors/ledgerCreate";
import type {
  CreateLedgerInput,
  LedgerRepository,
} from "server/ledger/repository/ledgerRepository";
import {
  AppError,
  AuthenticationError,
  ValidationError,
} from "server/shared/errors/appError";
import type { ThemeColorKey } from "theme/themeColorTokens";
import { ledgerCurrencyOptions } from "types/ledgers";

export type LedgerServiceDependencies = {
  ledgerRepository: LedgerRepository;
};

export type LedgerCreateDefaultsInput = {
  email: string;
  hasCurrentLedger: boolean;
  inheritedCurrency?: string;
  userId: string;
};

export type LedgerCreateDefaults = {
  backHref: string;
  defaults: {
    baseCurrency: string;
    displayColor: ThemeColorKey;
    displayName: string;
    ledgerName: string;
  };
};

export type LedgerService = {
  create(input: CreateLedgerInput): Promise<void>;
  getMemberCounts(ledgerIds: string[]): Promise<Map<string, number>>;
  getCreateDefaults(
    input: LedgerCreateDefaultsInput,
  ): Promise<LedgerCreateDefaults>;
};

const validationErrorCodes = new Set<LedgerCreateErrorCode>([
  ledgerCreateErrorCodes.currencyInvalid,
  ledgerCreateErrorCodes.displayColorInvalid,
  ledgerCreateErrorCodes.displayNameRequired,
  ledgerCreateErrorCodes.displayNameTooLong,
  ledgerCreateErrorCodes.nameRequired,
  ledgerCreateErrorCodes.nameTooLong,
]);

function toAppError(code: LedgerCreateErrorCode): AppError {
  const message = getLedgerCreateErrorMessage(code) ?? "账本创建失败，请稍后重试。";

  if (code === ledgerCreateErrorCodes.authRequired) {
    return new AuthenticationError(code, message);
  }

  if (validationErrorCodes.has(code)) {
    return new ValidationError(code, message);
  }

  return new AppError(code, message);
}

/**
 * Ledger 创建与账本列表相关的 UseCase。资源级权限判断独立成立，
 * 不假设调用方一定经过 Router middleware。
 */
export function createLedgerService({
  ledgerRepository,
}: LedgerServiceDependencies): LedgerService {
  return {
    async create(input) {
      const result = await ledgerRepository.create(input);

      if (!result.ok) {
        throw toAppError(result.code);
      }
    },

    getMemberCounts(ledgerIds) {
      return ledgerRepository.getMemberCounts(ledgerIds);
    },

    async getCreateDefaults({ email, hasCurrentLedger, inheritedCurrency, userId }) {
      const displayName = await ledgerRepository.getUserDisplayName(userId);
      const emailName = email.split("@")[0]?.trim();
      const baseCurrency =
        inheritedCurrency &&
        ledgerCurrencyOptions.some((option) => option.value === inheritedCurrency)
          ? inheritedCurrency
          : "JPY";

      return {
        backHref: hasCurrentLedger ? routePaths.ledgers : routePaths.dashboard,
        defaults: {
          baseCurrency,
          displayColor: "amber",
          displayName: displayName || emailName || "未命名用户",
          ledgerName: "家庭账本",
        },
      };
    },
  };
}
