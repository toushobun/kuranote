import {
  ledgerCurrencies,
  type LedgerCurrency,
} from "internal/ledger/entity/ledgerCurrency";
import type { LedgerSetup } from "internal/ledger/entity/ledgerSetup";
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
import {
  parseStoredLedgerSetupDraft,
  type LedgerSetupDraft,
  type StoredLedgerSetupDraft,
} from "internal/ledger/schema/ledgerSetupDraft";
import type { LedgerSetupCompletionPayload } from "internal/ledger/util/ledgerSetupCompletionPayload";
import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";
import { findRpcBusinessError } from "internal/shared/supabase/rpcError";
import { isThemeColorKey } from "theme/themeColorTokens";

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

export type CompleteLedgerSetupInput = {
  ledgerId: string;
  payload: LedgerSetupCompletionPayload;
};

/** 数据库中的创建中账本。草稿为保存时的原样（各部分可能缺失），由 Service 补全。 */
export type LedgerSetupRecord = Omit<
  LedgerSetup,
  "draft" | "hasTemplateSelections"
> & {
  storedDraft: StoredLedgerSetupDraft;
};

export type UpdateLedgerSetupBasicInfoInput = CreateLedgerInput & {
  ledgerId: string;
};

type LedgerDefaultRootCategoryRow = {
  name: string;
  sort_order: number;
};

type LedgerSetupRow = {
  base_currency: string;
  ledger_id: string;
  ledger_name: string;
  setup_draft: unknown;
  setup_step: number;
};

function isLedgerCurrency(value: string): value is LedgerCurrency {
  return (ledgerCurrencies as readonly string[]).includes(value);
}

const ledgerSetupRpcErrorMap = {
  ...createLedgerRpcErrorMap,
  ledger_setup_draft_currency_mismatch: ledgerSetupErrorCodes.currencyMismatch,
  ledger_setup_draft_invalid: ledgerSetupErrorCodes.draftInvalid,
  ledger_setup_draft_too_large: ledgerSetupErrorCodes.draftTooLarge,
  ledger_setup_in_progress_exists: ledgerSetupErrorCodes.inProgressExists,
  ledger_setup_not_found: ledgerSetupErrorCodes.notFound,
  ledger_setup_not_in_progress: ledgerSetupErrorCodes.notInProgress,
  ledger_setup_payload_invalid: ledgerSetupErrorCodes.payloadInvalid,
  ledger_setup_step_invalid: ledgerSetupErrorCodes.stepInvalid,
} as const satisfies Readonly<Record<string, LedgerSetupRpcErrorCode>>;

/**
 * 创建中账本的读写。所有操作都经由 SECURITY DEFINER RPC，
 * owner 与创建中状态由数据库按 auth.uid() 校验。
 */
export interface LedgerSetupRepository {
  complete(input: CompleteLedgerSetupInput): Promise<LedgerSetupWriteResult>;
  create(input: CreateLedgerInput): Promise<CreateLedgerSetupResult>;
  /** userId 为当前登录用户，用于读取其在该账本中的显示名与个性色。 */
  findCurrentUserSetupLedger(userId: string): Promise<LedgerSetupRecord | null>;
  /** 完成写入时将自动创建的大分类名称（按排序）。默认分类只在数据库中维护。 */
  listDefaultRootCategoryNames(): Promise<string[]>;
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
    async complete({ ledgerId, payload }) {
      const { error } = await supabase.rpc("complete_ledger_setup", {
        p_ledger_id: ledgerId,
        p_payload: payload,
      });

      if (error) {
        const code = findRpcBusinessError(error, ledgerSetupRpcErrorMap);
        if (code) return { code, ok: false };

        logger.error("[ledger] failed to complete ledger setup", {
          databaseCode: error.code,
          ledgerId,
        });
        throw toRepositoryError(
          "ledger_setup_complete_failed",
          ledgerSetupWriteErrorMessages.completeFailed,
        );
      }

      return { ok: true };
    },

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

    async findCurrentUserSetupLedger(userId) {
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

      // 数据库约束保证创建中账本的草稿为 JSON object、默认货币为可选值；不符合时视为数据异常。
      const storedDraft = parseStoredLedgerSetupDraft(row.setup_draft);
      if (!storedDraft || !isLedgerCurrency(row.base_currency)) {
        logger.error("[ledger] invalid ledger setup row", {
          ledgerId: row.ledger_id,
        });
        throw toRepositoryError(
          "ledger_setup_load_failed",
          ledgerSetupLoadErrorMessages.loadFailed,
        );
      }

      // owner 是创建中账本的 active 成员，可按 RLS 读取自己的显示设置。
      const displaySettingResult = await supabase
        .from("ledger_member_display_setting")
        .select("display_name, display_color")
        .eq("ledger_id", row.ledger_id)
        .eq("user_id", userId)
        .maybeSingle();

      if (displaySettingResult.error) {
        logger.error("[ledger] failed to load ledger setup display setting", {
          databaseCode: displaySettingResult.error.code,
          ledgerId: row.ledger_id,
        });
        throw toRepositoryError(
          "ledger_setup_load_failed",
          ledgerSetupLoadErrorMessages.loadFailed,
        );
      }

      // 创建中账本在创建时必定写入 owner 的显示设置；缺失或个性色不合法时视为数据异常。
      const displaySetting = displaySettingResult.data;
      if (!displaySetting || !isThemeColorKey(displaySetting.display_color)) {
        logger.error("[ledger] invalid ledger setup display setting", {
          ledgerId: row.ledger_id,
        });
        throw toRepositoryError(
          "ledger_setup_load_failed",
          ledgerSetupLoadErrorMessages.loadFailed,
        );
      }

      return {
        baseCurrency: row.base_currency,
        displayColor: displaySetting.display_color,
        displayName: displaySetting.display_name,
        id: row.ledger_id,
        name: row.ledger_name,
        step: row.setup_step,
        storedDraft,
      };
    },

    async listDefaultRootCategoryNames() {
      const { data, error } = await supabase.rpc(
        "get_ledger_default_root_categories",
      );

      if (error) {
        logger.error("[ledger] failed to load default root categories", {
          databaseCode: error.code,
        });
        throw toRepositoryError(
          "ledger_default_categories_load_failed",
          ledgerSetupLoadErrorMessages.defaultCategoriesLoadFailed,
        );
      }

      const rows: LedgerDefaultRootCategoryRow[] = Array.isArray(data)
        ? data
        : [];

      return [...rows]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(({ name }) => name);
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
