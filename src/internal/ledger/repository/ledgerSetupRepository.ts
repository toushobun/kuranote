import type {
  LedgerSetup,
  LedgerSetupDraft,
} from "internal/ledger/entity/ledgerSetup";
import type { LedgerCreateErrorCode } from "internal/ledger/errors/ledgerCreate";
import {
  ledgerSetupErrorCodes,
  ledgerSetupLoadErrorMessages,
  ledgerSetupWriteErrorMessages,
  type LedgerSetupErrorCode,
} from "internal/ledger/errors/ledgerSetup";
import {
  createLedgerRpcErrorMap,
  type CreateLedgerInput,
} from "internal/ledger/repository/ledgerRepository";
import { ledgerSetupDraftSchema } from "internal/ledger/schema/ledgerSetupDraft";
import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";
import { findRpcBusinessError } from "internal/shared/supabase/rpcError";

export type LedgerSetupRpcErrorCode =
  | LedgerCreateErrorCode
  | LedgerSetupErrorCode;

export type LedgerSetupWriteResult =
  | { ok: true }
  | { ok: false; code: LedgerSetupRpcErrorCode };

export type CreateLedgerSetupResult =
  | { ok: true; ledgerId: string }
  | { ok: false; code: LedgerSetupRpcErrorCode };

export type SaveLedgerSetupDraftInput = {
  draft: LedgerSetupDraft;
  ledgerId: string;
  step: number;
};

export type UpdateLedgerSetupBasicInfoInput = CreateLedgerInput & {
  ledgerId: string;
};

type LedgerSetupRow = {
  base_currency: string;
  ledger_id: string;
  ledger_name: string;
  setup_draft: unknown;
  setup_step: number;
};

const ledgerSetupRpcErrorMap = {
  ...createLedgerRpcErrorMap,
  ledger_setup_draft_invalid: ledgerSetupErrorCodes.draftInvalid,
  ledger_setup_draft_too_large: ledgerSetupErrorCodes.draftTooLarge,
  ledger_setup_in_progress_exists: ledgerSetupErrorCodes.inProgressExists,
  ledger_setup_not_found: ledgerSetupErrorCodes.notFound,
  ledger_setup_not_in_progress: ledgerSetupErrorCodes.notInProgress,
  ledger_setup_step_invalid: ledgerSetupErrorCodes.stepInvalid,
} as const satisfies Readonly<Record<string, LedgerSetupRpcErrorCode>>;

/**
 * 创建中账本的读写。所有操作都经由 SECURITY DEFINER RPC，
 * owner 与创建中状态由数据库按 auth.uid() 校验。
 */
export interface LedgerSetupRepository {
  create(input: CreateLedgerInput): Promise<CreateLedgerSetupResult>;
  findCurrentUserSetupLedger(): Promise<LedgerSetup | null>;
  saveDraft(input: SaveLedgerSetupDraftInput): Promise<LedgerSetupWriteResult>;
  updateBasicInfo(
    input: UpdateLedgerSetupBasicInfoInput,
  ): Promise<LedgerSetupWriteResult>;
}

export function createSupabaseLedgerSetupRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
): LedgerSetupRepository {
  return {
    async create(input) {
      const { data, error } = await supabase.rpc("create_ledger_setup", {
        p_base_currency: input.baseCurrency,
        p_display_color: input.displayColor,
        p_display_name: input.displayName,
        p_name: input.ledgerName,
      });

      if (error) {
        const code = findRpcBusinessError(error, ledgerSetupRpcErrorMap);
        if (code) return { code, ok: false };

        logger.error("[ledger] failed to create ledger setup", {
          databaseCode: error.code,
        });
        throw toRepositoryError(
          "ledger_setup_create_failed",
          ledgerSetupWriteErrorMessages.createFailed,
        );
      }

      if (typeof data !== "string" || data.length === 0) {
        logger.error("[ledger] create ledger setup returned no ledger id");
        throw toRepositoryError(
          "ledger_setup_create_failed",
          ledgerSetupWriteErrorMessages.createFailed,
        );
      }

      return { ledgerId: data, ok: true };
    },

    async findCurrentUserSetupLedger() {
      const { data, error } = await supabase.rpc(
        "get_current_user_setup_ledger",
      );

      if (error) {
        logger.error("[ledger] failed to load ledger setup", {
          databaseCode: error.code,
        });
        throw toRepositoryError(
          "ledger_setup_load_failed",
          ledgerSetupLoadErrorMessages.loadFailed,
        );
      }

      const rows: LedgerSetupRow[] = Array.isArray(data) ? data : [];
      const row = rows[0];
      if (!row) return null;

      // 数据库约束保证创建中账本的草稿为 JSON object；不符合时视为数据异常。
      const draft = ledgerSetupDraftSchema.safeParse(row.setup_draft);
      if (!draft.success) {
        logger.error("[ledger] invalid ledger setup draft", {
          ledgerId: row.ledger_id,
        });
        throw toRepositoryError(
          "ledger_setup_load_failed",
          ledgerSetupLoadErrorMessages.loadFailed,
        );
      }

      return {
        baseCurrency: row.base_currency,
        draft: draft.data,
        id: row.ledger_id,
        name: row.ledger_name,
        step: row.setup_step,
      };
    },

    async saveDraft({ draft, ledgerId, step }) {
      const { error } = await supabase.rpc("save_ledger_setup_draft", {
        p_draft: draft,
        p_ledger_id: ledgerId,
        p_step: step,
      });

      if (error) {
        const code = findRpcBusinessError(error, ledgerSetupRpcErrorMap);
        if (code) return { code, ok: false };

        logger.error("[ledger] failed to save ledger setup draft", {
          databaseCode: error.code,
          ledgerId,
        });
        throw toRepositoryError(
          "ledger_setup_draft_save_failed",
          ledgerSetupWriteErrorMessages.draftSaveFailed,
        );
      }

      return { ok: true };
    },

    async updateBasicInfo(input) {
      const { error } = await supabase.rpc("update_ledger_setup_basic_info", {
        p_base_currency: input.baseCurrency,
        p_display_color: input.displayColor,
        p_display_name: input.displayName,
        p_ledger_id: input.ledgerId,
        p_name: input.ledgerName,
      });

      if (error) {
        const code = findRpcBusinessError(error, ledgerSetupRpcErrorMap);
        if (code) return { code, ok: false };

        logger.error("[ledger] failed to update ledger setup basic info", {
          databaseCode: error.code,
          ledgerId: input.ledgerId,
        });
        throw toRepositoryError(
          "ledger_setup_basic_info_update_failed",
          ledgerSetupWriteErrorMessages.basicInfoUpdateFailed,
        );
      }

      return { ok: true };
    },
  };
}
