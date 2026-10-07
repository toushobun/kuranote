import type { LedgerSetup } from "internal/ledger/entity/ledgerSetup";
import {
  getLedgerSetupTemplate,
  type LedgerSetupTemplate,
} from "internal/ledger/entity/ledgerSetupTemplate/ledgerSetupTemplate";
import {
  ledgerCreateErrorCodes,
  ledgerCreateErrorMessages,
} from "internal/ledger/errors/ledgerCreate";
import {
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
  type LedgerSetupErrorCode,
} from "internal/ledger/errors/ledgerSetup";
import type { CreateLedgerInput } from "internal/ledger/repository/ledgerRepository";
import type {
  LedgerSetupRecord,
  LedgerSetupRepository,
  LedgerSetupRpcErrorCode,
  UpdateLedgerSetupBasicInfoInput,
} from "internal/ledger/repository/ledgerSetupRepository";
import { validateLedgerSetupDraftInput } from "internal/ledger/schema/ledgerSetupDraft";
import { toLedgerCreateAppError } from "internal/ledger/service/ledgerService";
import { buildLedgerSetupCompletionPayload } from "internal/ledger/util/ledgerSetupCompletionPayload";
import {
  hasDuplicateLedgerSetupAccountName,
  isLedgerSetupDraftMatchingTemplate,
  resolveLedgerSetupDraft,
} from "internal/ledger/util/ledgerSetupDraft";
import {
  AppError,
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "internal/shared/errors/appError";

type LedgerSetupServiceDependencies = {
  currentUserId: string | null;
  ledgerSetupRepository: LedgerSetupRepository;
};

export type SaveLedgerSetupDraftCommand = {
  draft: unknown;
  ledgerId: string;
  step: unknown;
};

export type LedgerSetupService = {
  /**
   * 完成创建：按数据库中的草稿与代码模板生成 payload，在同一事务内写入默认数据，
   * 将账本标记为已完成并切换为当前账本。
   */
  complete(ledgerId: string): Promise<void>;
  /** 创建「创建中」账本，返回新账本 ID。不切换当前账本。 */
  create(input: CreateLedgerInput): Promise<{ ledgerId: string }>;
  /** 当前用户的创建中账本，没有时返回 null。草稿已按当前模板补全与校正。 */
  getCurrentUserSetup(): Promise<LedgerSetup | null>;
  /** 按币种返回预设模板；该币种没有模板时返回 null。 */
  getTemplate(currency: string): LedgerSetupTemplate | null;
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
    code === ledgerSetupErrorCodes.currencyMismatch ||
    code === ledgerSetupErrorCodes.inProgressExists ||
    code === ledgerSetupErrorCodes.notInProgress ||
    code === ledgerSetupErrorCodes.templateOutdated
  ) {
    return new ConflictError(code, message);
  }

  return new ValidationError(code, message);
}

function toLedgerSetup({ storedDraft, ...setup }: LedgerSetupRecord) {
  return {
    ...setup,
    draft: resolveLedgerSetupDraft(storedDraft, setup.baseCurrency),
    hasTemplateSelections:
      storedDraft.accounts !== undefined || storedDraft.merchants !== undefined,
  } satisfies LedgerSetup;
}

/**
 * 创建账本向导（创建中账本）的 Service。owner 与创建中状态由 RPC 在数据库内
 * 按登录用户校验；Service 负责草稿与模板的业务校验、payload 生成与错误语义转换。
 */
export function createLedgerSetupService({
  currentUserId,
  ledgerSetupRepository,
}: LedgerSetupServiceDependencies): LedgerSetupService {
  async function findSetup() {
    if (!currentUserId) {
      throw new AuthenticationError(
        ledgerCreateErrorCodes.authRequired,
        ledgerCreateErrorMessages[ledgerCreateErrorCodes.authRequired],
      );
    }

    const record =
      await ledgerSetupRepository.findCurrentUserSetupLedger(currentUserId);
    return record ? toLedgerSetup(record) : null;
  }

  return {
    async complete(ledgerId) {
      const setup = await findSetup();

      if (!setup || setup.id !== ledgerId) {
        throw toAppError(ledgerSetupErrorCodes.notFound);
      }

      // 草稿已按账本当前默认货币与模板版本校正：无法匹配当前模板的 key 已丢弃。
      if (hasDuplicateLedgerSetupAccountName(setup.draft.accounts.items)) {
        throw toAppError(ledgerSetupErrorCodes.accountNameDuplicate);
      }

      const result = await ledgerSetupRepository.complete({
        ledgerId,
        payload: buildLedgerSetupCompletionPayload(
          setup.draft,
          getLedgerSetupTemplate(setup.baseCurrency),
        ),
      });

      if (!result.ok) {
        throw toAppError(result.code);
      }
    },

    async create(input) {
      const result = await ledgerSetupRepository.create(input);

      if (!result.ok) {
        throw toAppError(result.code);
      }

      return { ledgerId: result.ledgerId };
    },

    getCurrentUserSetup() {
      return findSetup();
    },

    getTemplate(currency) {
      return getLedgerSetupTemplate(currency);
    },

    async saveDraft({ draft, ledgerId, step }) {
      const validation = validateLedgerSetupDraftInput({ draft, step });

      if (!validation.ok) {
        throw toAppError(validation.error);
      }

      // 模板币种与账本默认货币是否一致由 RPC 在持有账本行锁时校验。
      if (!isLedgerSetupDraftMatchingTemplate(validation.value.draft)) {
        throw toAppError(ledgerSetupErrorCodes.templateOutdated);
      }

      if (
        hasDuplicateLedgerSetupAccountName(
          validation.value.draft.accounts.items,
        )
      ) {
        throw toAppError(ledgerSetupErrorCodes.accountNameDuplicate);
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
