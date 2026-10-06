import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";
import {
  findRpcBusinessError,
  toConcurrentModificationError,
} from "internal/shared/supabase/rpcError";
import type { UserLedgerDisplayName } from "internal/user/entity/userLedgerDisplayName";
import {
  resolveTransactionColorScheme,
  resolveUserThemeKey,
  type TransactionColorScheme,
  type UserProfile,
  type UserStatus,
  type UserThemeKey,
} from "internal/user/entity/userProfile";
import {
  isLedgerDisplayNameConflictCode,
  userErrorMessages,
  type LedgerDisplayNameConflictCode,
} from "internal/user/errors";

export type UpdateUserProfileInput = {
  avatarUrl?: string | null;
  displayName?: string;
  themeKey?: UserThemeKey;
  transactionColorScheme?: TransactionColorScheme;
  updatedBy: string;
  userId: string;
};

export type UpdateDisplayNameInput = {
  displayName: string;
  syncLedgerIds: readonly string[];
};

export type LedgerDisplayNameConflict = {
  code: LedgerDisplayNameConflictCode;
  ledgerId: string;
  ledgerName: string;
};

/** RPC 通过 `details` 返回的稳定业务错误码。 */
export type UpdateDisplayNameErrorCode =
  | "auth_required"
  | "display_name_required"
  | "display_name_too_long"
  | "ledger_permission_denied"
  | "user_inactive";

export type UpdateDisplayNameResult =
  | { ok: true }
  | { code: UpdateDisplayNameErrorCode; ok: false }
  | { conflicts: LedgerDisplayNameConflict[]; ok: false };

export interface UserRepository {
  findById(userId: string): Promise<UserProfile | null>;
  /** 只读取当前登录用户可见的数据；权限由 RLS 兜底。 */
  listCurrentLedgerDisplayNames(): Promise<UserLedgerDisplayName[]>;
  /** 同一事务内更新账号昵称与勾选账本的账本内昵称。 */
  updateCurrentDisplayName(
    input: UpdateDisplayNameInput,
  ): Promise<UpdateDisplayNameResult>;
  updateProfile(input: UpdateUserProfileInput): Promise<UserProfile | null>;
}

const updateDisplayNameRpcErrorMap = {
  auth_required: "auth_required",
  display_name_required: "display_name_required",
  display_name_too_long: "display_name_too_long",
  ledger_permission_denied: "ledger_permission_denied",
  user_inactive: "user_inactive",
} as const satisfies Readonly<Record<string, UpdateDisplayNameErrorCode>>;

type AppUserRow = {
  avatar_url: string | null;
  display_name: string;
  email: string | null;
  id: string;
  status: string;
  theme_key: string;
  transaction_color_scheme: string;
};

function toUserStatus(status: string): UserStatus {
  if (status === "active" || status === "disabled") return status;

  throw toRepositoryError(
    "user_profile_invalid",
    userErrorMessages.profileInvalid,
  );
}

function toTransactionColorScheme(
  value: string,
  logger: Logger,
  userId: string,
): TransactionColorScheme {
  const resolved = resolveTransactionColorScheme(value);

  if (!resolved.isFallback) return resolved.value;

  // 收支配色只是展示偏好，脏值不应阻断登录或后续资料更新自愈。
  logger.warn("[user] invalid transaction color scheme in user profile", {
    userId,
  });

  return resolved.value;
}

function toUserThemeKey(
  value: string,
  logger: Logger,
  userId: string,
): UserThemeKey {
  const resolved = resolveUserThemeKey(value);

  if (!resolved.isFallback) return resolved.value;

  // 主题只是展示偏好，脏值不应阻断登录或后续资料更新自愈。
  logger.warn("[user] invalid theme key in user profile", { userId });

  return resolved.value;
}

function toUserProfile(row: AppUserRow, logger: Logger): UserProfile {
  return {
    avatarUrl: row.avatar_url,
    displayName: row.display_name,
    email: row.email,
    id: row.id,
    status: toUserStatus(row.status),
    themeKey: toUserThemeKey(row.theme_key, logger, row.id),
    transactionColorScheme: toTransactionColorScheme(
      row.transaction_color_scheme,
      logger,
      row.id,
    ),
  };
}

function toLedgerDisplayName(row: unknown): UserLedgerDisplayName | null {
  if (typeof row !== "object" || row === null) return null;
  const { display_name, ledger_id, ledger_name } = row as Record<
    string,
    unknown
  >;
  if (
    typeof ledger_id !== "string" ||
    typeof ledger_name !== "string" ||
    typeof display_name !== "string"
  ) {
    return null;
  }

  return {
    displayName: display_name,
    ledgerId: ledger_id,
    ledgerName: ledger_name,
  };
}

function toLedgerDisplayNameConflict(
  row: unknown,
): LedgerDisplayNameConflict | null {
  if (typeof row !== "object" || row === null) return null;
  const { error_code, ledger_id, ledger_name } = row as Record<string, unknown>;
  if (
    typeof ledger_id !== "string" ||
    typeof ledger_name !== "string" ||
    !isLedgerDisplayNameConflictCode(error_code)
  ) {
    return null;
  }

  return { code: error_code, ledgerId: ledger_id, ledgerName: ledger_name };
}

/** 任一行格式异常时返回 null，由调用方按读取失败处理。 */
function toRows<T>(data: unknown, toRow: (row: unknown) => T | null) {
  if (!Array.isArray(data)) return null;
  const rows = data.map(toRow);
  return rows.every((row): row is T => row !== null) ? rows : null;
}

const userProfileColumns =
  "id, display_name, email, avatar_url, status, theme_key, transaction_color_scheme";

export function createSupabaseUserRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
): UserRepository {
  return {
    async findById(userId) {
      const { data, error } = await supabase
        .from("app_user")
        .select(userProfileColumns)
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        logger.error("[user] failed to load user profile", {
          code: error.code,
          message: error.message,
          userId,
        });
        throw toRepositoryError(
          "user_profile_load_failed",
          userErrorMessages.profileLoadFailed,
        );
      }

      return data ? toUserProfile(data, logger) : null;
    },

    async listCurrentLedgerDisplayNames() {
      const { data, error } = await supabase.rpc(
        "list_current_user_ledger_display_names",
      );

      if (error) {
        logger.error("[user] failed to load ledger display names", {
          code: error.code,
          message: error.message,
        });
        throw toRepositoryError(
          "user_ledger_display_names_load_failed",
          userErrorMessages.ledgerDisplayNamesLoadFailed,
        );
      }

      const rows = toRows(data ?? [], toLedgerDisplayName);
      if (!rows) {
        logger.error("[user] ledger display names returned invalid data", {
          type: typeof data,
        });
        throw toRepositoryError(
          "user_ledger_display_names_invalid",
          userErrorMessages.ledgerDisplayNamesLoadFailed,
        );
      }

      return rows;
    },

    async updateCurrentDisplayName({ displayName, syncLedgerIds }) {
      const { data, error } = await supabase.rpc(
        "update_current_user_display_name",
        {
          p_display_name: displayName,
          p_sync_ledger_ids: [...syncLedgerIds],
        },
      );

      if (error) {
        const code = findRpcBusinessError(error, updateDisplayNameRpcErrorMap);
        if (code) return { code, ok: false };

        const conflict = toConcurrentModificationError(
          error,
          logger,
          "update_current_user_display_name",
        );
        if (conflict) throw conflict;

        logger.error("[user] failed to update display name", {
          code: error.code,
          message: error.message,
        });
        throw toRepositoryError(
          "user_display_name_update_failed",
          userErrorMessages.displayNameUpdateFailed,
        );
      }

      const conflicts = toRows(data ?? [], toLedgerDisplayNameConflict);
      if (!conflicts) {
        logger.error("[user] update display name returned invalid data", {
          type: typeof data,
        });
        throw toRepositoryError(
          "user_display_name_update_result_invalid",
          userErrorMessages.displayNameUpdateFailed,
        );
      }

      return conflicts.length === 0 ? { ok: true } : { conflicts, ok: false };
    },

    async updateProfile(input) {
      const updates: {
        avatar_url?: string | null;
        display_name?: string;
        theme_key?: UserThemeKey;
        transaction_color_scheme?: TransactionColorScheme;
        updated_by: string;
      } = { updated_by: input.updatedBy };

      if (input.avatarUrl !== undefined) {
        updates.avatar_url = input.avatarUrl;
      }
      if (input.displayName !== undefined) {
        updates.display_name = input.displayName;
      }
      if (input.themeKey !== undefined) {
        updates.theme_key = input.themeKey;
      }
      if (input.transactionColorScheme !== undefined) {
        updates.transaction_color_scheme = input.transactionColorScheme;
      }

      const { data, error } = await supabase
        .from("app_user")
        .update(updates)
        .eq("id", input.userId)
        .eq("status", "active")
        .select(userProfileColumns)
        .maybeSingle();

      if (error) {
        logger.error("[user] failed to update user profile", {
          code: error.code,
          message: error.message,
          userId: input.userId,
        });
        throw toRepositoryError(
          "user_profile_update_failed",
          userErrorMessages.profileUpdateFailed,
        );
      }

      return data ? toUserProfile(data, logger) : null;
    },
  };
}
