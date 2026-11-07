import type { LedgerSetup } from "internal/ledger/entity/ledgerSetup";
import { type LedgerSetupTemplate } from "internal/ledger/entity/ledgerSetupTemplate/ledgerSetupTemplate";
import { getLedgerSetupTemplate } from "internal/ledger/entity/ledgerSetupTemplate/getLedgerSetupTemplate";
import {
  ledgerCreateErrorCodes,
  ledgerCreateErrorMessages,
} from "internal/ledger/errors/ledgerCreate";
import {
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
  type LedgerSetupErrorCode,
} from "internal/ledger/errors/ledgerSetup";
import type {
  LedgerSetupRecord,
  LedgerSetupRepository,
  LedgerSetupRpcErrorCode,
  PersistLedgerSetupCommand,
} from "internal/ledger/repository/ledgerSetupRepository";
import { validateLedgerSetupDraftInput } from "internal/ledger/schema/ledgerSetupDraft";
import { toLedgerCreateAppError } from "internal/ledger/service/ledgerService";
import { buildLedgerSetupCompletionPayload } from "internal/ledger/util/ledgerSetupCompletionPayload";
import {
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

export type LedgerSetupService = {
  abandon(ledgerId: string): Promise<void>;
  getCurrentUserSetup(): Promise<LedgerSetup | null>;
  getTemplate(region: unknown): LedgerSetupTemplate | null;
  listDefaultRootCategoryNames(): Promise<string[]>;
  persist(
    input: Omit<PersistLedgerSetupCommand, "draft" | "payload"> & {
      draft: unknown;
    },
  ): Promise<string>;
};

export class LedgerSetupTemplateOutdatedError extends ConflictError {
  constructor(
    readonly draft: LedgerSetup["draft"],
    readonly template: LedgerSetupTemplate | null,
  ) {
    super(
      ledgerSetupErrorCodes.templateOutdated,
      ledgerSetupErrorMessages[ledgerSetupErrorCodes.templateOutdated],
    );
  }
}

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
    code === ledgerSetupErrorCodes.hasMembers ||
    code === ledgerSetupErrorCodes.hasTransactions ||
    code === ledgerSetupErrorCodes.regionMismatch ||
    code === ledgerSetupErrorCodes.inProgressExists ||
    code === ledgerSetupErrorCodes.notInProgress ||
    code === ledgerSetupErrorCodes.conflict
  ) {
    return new ConflictError(code, message);
  }

  return new ValidationError(code, message);
}

function toLedgerSetup({ storedDraft, ...setup }: LedgerSetupRecord) {
  return {
    ...setup,
    step: setup.livingRegion === null ? 1 : setup.step,
    draft: resolveLedgerSetupDraft(
      storedDraft,
      setup.livingRegion,
      getLedgerSetupTemplate(setup.livingRegion),
    ),
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
    async abandon(ledgerId) {
      const setup = await findSetup();
      if (!setup || setup.id !== ledgerId) {
        throw toAppError(ledgerSetupErrorCodes.notFound);
      }
      const result = await ledgerSetupRepository.abandon(ledgerId);
      if (!result.ok) {
        throw toAppError(result.code);
      }
    },
    getCurrentUserSetup() {
      return findSetup();
    },

    getTemplate(region) {
      return getLedgerSetupTemplate(region);
    },

    listDefaultRootCategoryNames() {
      return ledgerSetupRepository.listDefaultRootCategoryNames();
    },

    async persist(input) {
      const validation = validateLedgerSetupDraftInput({
        draft: input.draft,
        step: input.step,
      });
      if (!validation.ok) throw toAppError(validation.error);

      const template = getLedgerSetupTemplate(input.livingRegion);
      if (validation.value.draft.templateRegion !== input.livingRegion)
        throw toAppError(ledgerSetupErrorCodes.regionMismatch);
      if (
        !isLedgerSetupDraftMatchingTemplate(validation.value.draft, template)
      ) {
        throw new LedgerSetupTemplateOutdatedError(
          resolveLedgerSetupDraft(
            validation.value.draft,
            input.livingRegion,
            template,
          ),
          template,
        );
      }

      const result = await ledgerSetupRepository.persist({
        ...input,
        draft: validation.value.draft,
        step: validation.value.step,
        payload: input.complete
          ? buildLedgerSetupCompletionPayload(validation.value.draft, template)
          : null,
      });
      if (!result.ok) throw toAppError(result.code);
      return result.updatedAt;
    },
  };
}
