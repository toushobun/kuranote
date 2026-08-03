import type { QueryData } from "@supabase/supabase-js";

import type { CurrentLedgerRole } from "internal/ledger/entity/currentLedger";
import {
  ledgerSettingsErrorCodes,
  type LedgerSettingsErrorCode,
} from "internal/ledger/errors/ledgerSettings";
import { findRpcBusinessError } from "internal/shared/supabase/rpcError";
import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";
import type { ThemeColorKey } from "theme/themeColorTokens";

export type LedgerMemberRow = {
  userId: string;
  role: CurrentLedgerRole;
  displayName: string | null;
  displayColor: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export type UpdateLedgerBaseSettingsInput = {
  baseCurrency: string;
  ledgerName: string;
  updatedBy: string;
  transactionItemSpecialStatusEnabled?: boolean;
};

export type UpdateLedgerMemberSettingsInput = {
  displayColor: ThemeColorKey;
  displayName: string;
  ledgerId: string;
  role: CurrentLedgerRole;
  userId: string;
};

export type LedgerSettingsWriteResult =
  | { ok: true }
  | { ok: false; code: LedgerSettingsErrorCode };

const memberSettingsRpcErrorMap = {
  auth_required: ledgerSettingsErrorCodes.authRequired,
  display_color_invalid: ledgerSettingsErrorCodes.displayColorInvalid,
  display_name_required: ledgerSettingsErrorCodes.displayNameRequired,
  display_name_too_long: ledgerSettingsErrorCodes.displayNameTooLong,
  member_not_found: ledgerSettingsErrorCodes.memberInvalid,
  permission_denied: ledgerSettingsErrorCodes.permissionDenied,
  role_invalid: ledgerSettingsErrorCodes.roleInvalid,
} as const satisfies Readonly<Record<string, LedgerSettingsErrorCode>>;

const ledgerBaseSettingsErrorCodes = [
  ledgerSettingsErrorCodes.specialStatusHasActiveItems,
] as const;

function findLedgerBaseSettingsErrorCode(
  details: string | null | undefined,
): LedgerSettingsErrorCode | null {
  const normalizedDetails = details?.trim();

  return (
    ledgerBaseSettingsErrorCodes.find((code) => code === normalizedDetails) ??
    null
  );
}

export interface LedgerSettingsRepository {
  getMemberRole(
    ledgerId: string,
    userId: string,
  ): Promise<CurrentLedgerRole | null>;
  isLedgerActive(ledgerId: string): Promise<boolean>;
  updateLedgerBaseSettings(
    ledgerId: string,
    input: UpdateLedgerBaseSettingsInput,
  ): Promise<LedgerSettingsWriteResult>;
  updateMemberSettings(
    input: UpdateLedgerMemberSettingsInput,
  ): Promise<LedgerSettingsWriteResult>;
  listActiveMembers(ledgerId: string): Promise<LedgerMemberRow[]>;
}

function toCurrentLedgerRole(role: unknown): CurrentLedgerRole {
  if (
    role === "owner" ||
    role === "admin" ||
    role === "member" ||
    role === "viewer"
  ) {
    return role;
  }

  throw toRepositoryError(
    "ledger_member_role_invalid",
    "账本成员资料格式异常，请稍后重试。",
  );
}

export function createSupabaseLedgerSettingsRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger = {
    error: () => undefined,
    info: () => undefined,
    warn: () => undefined,
  },
): LedgerSettingsRepository {
  return {
    async getMemberRole(ledgerId, userId) {
      const { data, error } = await supabase
        .from("ledger_member")
        .select("role")
        .eq("ledger_id", ledgerId)
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        logger.error("[ledger] failed to load ledger member role", {
          databaseCode: error.code,
          ledgerId,
          userId,
        });
        throw toRepositoryError(
          "ledger_member_role_load_failed",
          "账本成员权限读取失败，请稍后重试。",
        );
      }
      if (!data) return null;

      return toCurrentLedgerRole(data.role);
    },

    async isLedgerActive(ledgerId) {
      const { data, error } = await supabase
        .from("ledger")
        .select("id")
        .eq("id", ledgerId)
        .eq("is_archived", false)
        .maybeSingle();

      if (error) {
        logger.error("[ledger] failed to load ledger status", {
          databaseCode: error.code,
          ledgerId,
        });
        throw toRepositoryError(
          "ledger_status_load_failed",
          "账本信息读取失败，请稍后重试。",
        );
      }
      return Boolean(data);
    },

    async listActiveMembers(ledgerId) {
      const memberQuery = supabase
        .from("ledger_member")
        .select("user_id, role")
        .eq("ledger_id", ledgerId)
        .eq("status", "active")
        .order("joined_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true })
        .order("user_id", { ascending: true });
      type MemberRows = QueryData<typeof memberQuery>;

      const { data: memberData, error: memberError } = await memberQuery;

      if (memberError) {
        logger.error("[ledger] failed to load ledger settings members", {
          ledgerId,
          message: memberError.message,
        });
        throw toRepositoryError(
          "ledger_members_load_failed",
          "账本成员加载失败，请稍后重试。",
        );
      }

      const memberRows: MemberRows = memberData ?? [];
      const userIds = memberRows
        .map((member) => member.user_id)
        .filter((userId): userId is string => Boolean(userId));

      if (userIds.length === 0) return [];

      const [profilesResult, displaySettingsResult] = await Promise.all([
        supabase
          .from("app_user")
          .select("id, display_name, email, avatar_url")
          .in("id", userIds),
        supabase
          .from("ledger_member_display_setting")
          .select("user_id, display_name, display_color")
          .eq("ledger_id", ledgerId),
      ]);

      if (profilesResult.error) {
        logger.error("[ledger] failed to load ledger settings profiles", {
          ledgerId,
          message: profilesResult.error.message,
        });
        throw toRepositoryError(
          "ledger_member_profiles_load_failed",
          "账本成员资料加载失败，请稍后重试。",
        );
      }

      if (displaySettingsResult.error) {
        logger.error("[ledger] failed to load ledger member display settings", {
          ledgerId,
          message: displaySettingsResult.error.message,
        });
        throw toRepositoryError(
          "ledger_member_display_settings_load_failed",
          "账本成员显示设置加载失败，请稍后重试。",
        );
      }

      const profileByUserId = new Map(
        (profilesResult.data ?? []).map((profile) => [profile.id, profile]),
      );
      const displaySettingByUserId = new Map(
        (displaySettingsResult.data ?? []).map((setting) => [
          setting.user_id,
          setting,
        ]),
      );

      return memberRows.map((member) => {
        const userId = member.user_id ?? "";
        const profile = profileByUserId.get(userId);
        const displaySetting = displaySettingByUserId.get(userId);

        return {
          avatarUrl: profile?.avatar_url ?? null,
          displayColor: displaySetting?.display_color ?? null,
          displayName:
            displaySetting?.display_name ?? profile?.display_name ?? null,
          email: profile?.email ?? null,
          role: toCurrentLedgerRole(member.role),
          userId,
        };
      });
    },

    async updateLedgerBaseSettings(ledgerId, input) {
      const { count, error } = await supabase
        .from("ledger")
        .update(
          {
            base_currency: input.baseCurrency,
            name: input.ledgerName,
            ...(input.transactionItemSpecialStatusEnabled === undefined
              ? {}
              : {
                  transaction_item_special_status_enabled:
                    input.transactionItemSpecialStatusEnabled,
                }),
            updated_by: input.updatedBy,
          },
          { count: "exact" },
        )
        .eq("id", ledgerId)
        .eq("is_archived", false);

      if (error) {
        const code = findLedgerBaseSettingsErrorCode(error.details);
        if (code) {
          return { code, ok: false };
        }

        logger.error("[ledger] failed to update ledger base settings", {
          databaseCode: error.code,
          ledgerId,
        });
        throw toRepositoryError(
          "ledger_base_settings_update_failed",
          "账本设置保存失败，请稍后重试。",
        );
      }
      if (count !== 1) {
        return { code: ledgerSettingsErrorCodes.updateFailed, ok: false };
      }

      return { ok: true };
    },

    async updateMemberSettings(input) {
      const { error } = await supabase.rpc("update_ledger_member_settings", {
        p_display_color: input.displayColor,
        p_display_name: input.displayName,
        p_ledger_id: input.ledgerId,
        p_member_user_id: input.userId,
        p_role: input.role,
      });

      if (error) {
        const code = findRpcBusinessError(error, memberSettingsRpcErrorMap);
        if (!code) {
          logger.error("[ledger] failed to update ledger member settings", {
            databaseCode: error.code,
            ledgerId: input.ledgerId,
            userId: input.userId,
          });
          throw toRepositoryError(
            "ledger_member_settings_update_failed",
            "账本成员设置保存失败，请稍后重试。",
          );
        }
        return {
          code,
          ok: false,
        };
      }

      return { ok: true };
    },
  };
}
