import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";
import {
  isTransactionColorScheme,
  type TransactionColorScheme,
  type UserProfile,
  type UserStatus,
} from "internal/user/entity/userProfile";

export type UpdateUserProfileInput = {
  avatarUrl?: string | null;
  displayName?: string;
  transactionColorScheme?: TransactionColorScheme;
  updatedBy: string;
  userId: string;
};

export interface UserRepository {
  findById(userId: string): Promise<UserProfile | null>;
  updateProfile(input: UpdateUserProfileInput): Promise<UserProfile | null>;
}

type AppUserRow = {
  avatar_url: string | null;
  display_name: string;
  email: string | null;
  id: string;
  status: string;
  transaction_color_scheme: string;
};

function toUserStatus(status: string): UserStatus {
  if (status === "active" || status === "disabled") return status;

  throw toRepositoryError(
    "user_profile_invalid",
    "用户资料格式异常，请稍后重试。",
  );
}

function toTransactionColorScheme(
  value: string,
  logger: Logger,
  userId: string,
): TransactionColorScheme {
  if (isTransactionColorScheme(value)) return value;

  logger.error("[user] invalid transaction color scheme in user profile", {
    userId,
  });

  throw toRepositoryError(
    "user_profile_invalid",
    "用户资料格式异常，请稍后重试。",
  );
}

function toUserProfile(row: AppUserRow, logger: Logger): UserProfile {
  return {
    avatarUrl: row.avatar_url,
    displayName: row.display_name,
    email: row.email,
    id: row.id,
    status: toUserStatus(row.status),
    transactionColorScheme: toTransactionColorScheme(
      row.transaction_color_scheme,
      logger,
      row.id,
    ),
  };
}

const userProfileColumns =
  "id, display_name, email, avatar_url, status, transaction_color_scheme";

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
          "用户资料加载失败，请稍后重试。",
        );
      }

      return data ? toUserProfile(data, logger) : null;
    },

    async updateProfile(input) {
      const updates: {
        avatar_url?: string | null;
        display_name?: string;
        transaction_color_scheme?: TransactionColorScheme;
        updated_by: string;
      } = { updated_by: input.updatedBy };

      if (input.avatarUrl !== undefined) {
        updates.avatar_url = input.avatarUrl;
      }
      if (input.displayName !== undefined) {
        updates.display_name = input.displayName;
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
          "用户资料更新失败，请稍后重试。",
        );
      }

      return data ? toUserProfile(data, logger) : null;
    },
  };
}
