import {
  ledgerCreateErrorCodes,
  type LedgerCreateErrorCode,
} from "internal/ledger/errors/ledgerCreate";
import { findRpcBusinessError } from "internal/shared/supabase/rpcError";
import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";
import type { ThemeColorKey } from "theme/themeColorTokens";

export type CreateLedgerInput = {
  baseCurrency: string;
  displayColor: ThemeColorKey;
  displayName: string;
  ledgerName: string;
};

export type CreateLedgerResult =
  { ok: true } | { ok: false; code: LedgerCreateErrorCode };

const createLedgerRpcErrorMap = {
  auth_required: ledgerCreateErrorCodes.authRequired,
  currency_invalid: ledgerCreateErrorCodes.currencyInvalid,
  display_color_invalid: ledgerCreateErrorCodes.displayColorInvalid,
  display_name_required: ledgerCreateErrorCodes.displayNameRequired,
  display_name_too_long: ledgerCreateErrorCodes.displayNameTooLong,
  ledger_name_required: ledgerCreateErrorCodes.nameRequired,
  ledger_name_too_long: ledgerCreateErrorCodes.nameTooLong,
  user_inactive: ledgerCreateErrorCodes.userInactive,
} as const satisfies Readonly<Record<string, LedgerCreateErrorCode>>;

export interface LedgerRepository {
  create(input: CreateLedgerInput): Promise<CreateLedgerResult>;
  getMemberCounts(ledgerIds: string[]): Promise<Map<string, number>>;
  getUserDisplayName(userId: string): Promise<string | null>;
}

export function createSupabaseLedgerRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger = {
    error: () => undefined,
    info: () => undefined,
    warn: () => undefined,
  },
): LedgerRepository {
  return {
    async create(input) {
      const { error } = await supabase.rpc(
        "create_ledger_with_owner_settings",
        {
          p_base_currency: input.baseCurrency,
          p_display_color: input.displayColor,
          p_display_name: input.displayName,
          p_name: input.ledgerName,
        },
      );

      if (error) {
        const code = findRpcBusinessError(error, createLedgerRpcErrorMap);
        if (!code) {
          logger.error("[ledger] failed to create ledger", {
            databaseCode: error.code,
          });
          throw toRepositoryError(
            "ledger_create_failed",
            "账本创建失败，请稍后重试。",
          );
        }
        return {
          code,
          ok: false,
        };
      }

      return { ok: true };
    },

    async getMemberCounts(ledgerIds) {
      // 当前单用户账本数量预期较小，先用 per-ledger DB-side exact count 保持实现简单；
      // 后续如果账本数量增加，再改为 RPC / view 做 grouped count。
      const entries = await Promise.all(
        ledgerIds.map(async (ledgerId) => {
          const { count, error } = await supabase
            .from("ledger_member")
            .select("ledger_id", { count: "exact", head: true })
            .eq("ledger_id", ledgerId)
            .eq("status", "active");

          if (error) {
            logger.error("[ledger] failed to load ledger member count", {
              ledgerId,
              message: error.message,
            });
            throw toRepositoryError(
              "ledger_member_count_failed",
              "账本成员数量加载失败，请稍后重试。",
            );
          }

          return [ledgerId, count ?? 0] as const;
        }),
      );

      return new Map(entries);
    },

    async getUserDisplayName(userId) {
      const { data, error } = await supabase
        .from("app_user")
        .select("display_name")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        logger.error("[ledger] failed to load user display name", {
          message: error.message,
          userId,
        });
        throw toRepositoryError(
          "ledger_user_profile_load_failed",
          "用户资料加载失败，请稍后重试。",
        );
      }

      return data?.display_name?.trim() || null;
    },
  };
}
