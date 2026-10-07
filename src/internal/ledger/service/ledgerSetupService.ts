import type { LedgerSetup } from "internal/ledger/entity/ledgerSetup";
import {
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
  type LedgerSetupErrorCode,
} from "internal/ledger/errors/ledgerSetup";
import type { CreateLedgerInput } from "internal/ledger/repository/ledgerRepository";
import type {
  LedgerSetupRepository,
  LedgerSetupRpcErrorCode,
  UpdateLedgerSetupBasicInfoInput,
} from "internal/ledger/repository/ledgerSetupRepository";
import { validateLedgerSetupDraftInput } from "internal/ledger/schema/ledgerSetupDraft";
import { toLedgerCreateAppError } from "internal/ledger/service/ledgerService";
import {
  AppError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "internal/shared/errors/appError";

type LedgerSetupServiceDependencies = {
  ledgerSetupRepository: LedgerSetupRepository;
};

export type SaveLedgerSetupDraftCommand = {
  draft: unknown;
  ledgerId: string;
  step: unknown;
};

export type LedgerSetupService = {
  /** 创建「创建中」账本，返回新账本 ID。不切换当前账本。 */
  create(input: CreateLedgerInput): Promise<{ ledgerId: string }>;
  /** 当前用户的创建中账本，没有时返回 null。 */
  getCurrentUserSetup(): Promise<LedgerSetup | null>;
  saveDraft(input: SaveLedgerSetupDraftCommand): Promise<void>;
  updateBasicInfo(input: UpdateLedgerSetupBasicInfoInput): Promise<void>;
};

const ledgerSetupErrorCodeSet: ReadonlySet<string> = new Set(
  Object.values(ledgerSetupErrorCodes),
);

function isLedgerSetupErrorCode(
  code: LedgerSetupRpcErrorCode,
): code is LedgerSetupErrorCode {
  return ledgerSetupErrorCodeSet.has(code);
}

function toAppError(code: LedgerSetupRpcErrorCode): AppError {
  if (!isLedgerSetupErrorCode(code)) {
    return toLedgerCreateAppError(code);
  }

  const message = ledgerSetupErrorMessages[code];

  if (code === ledgerSetupErrorCodes.notFound) {
    return new NotFoundError(code, message);
  }

  if (
    code === ledgerSetupErrorCodes.inProgressExists ||
    code === ledgerSetupErrorCodes.notInProgress
  ) {
    return new ConflictError(code, message);
  }

  return new ValidationError(code, message);
}

/**
 * 创建账本向导（创建中账本）的 Service。owner 与创建中状态由 RPC 在数据库内
 * 按登录用户校验；Service 负责输入边界校验与错误语义转换。
 */
export function createLedgerSetupService({
  ledgerSetupRepository,
}: LedgerSetupServiceDependencies): LedgerSetupService {
  return {
    async create(input) {
      const result = await ledgerSetupRepository.create(input);

      if (!result.ok) {
        throw toAppError(result.code);
      }

      return { ledgerId: result.ledgerId };
    },

    getCurrentUserSetup() {
      return ledgerSetupRepository.findCurrentUserSetupLedger();
    },

    async saveDraft({ draft, ledgerId, step }) {
      const validation = validateLedgerSetupDraftInput({ draft, step });

      if (!validation.ok) {
        throw toAppError(validation.error);
      }

      const result = await ledgerSetupRepository.saveDraft({
        ...validation.value,
        ledgerId,
      });

      if (!result.ok) {
        throw toAppError(result.code);
      }
    },

    async updateBasicInfo(input) {
      const result = await ledgerSetupRepository.updateBasicInfo(input);

      if (!result.ok) {
        throw toAppError(result.code);
      }
    },
  };
}
