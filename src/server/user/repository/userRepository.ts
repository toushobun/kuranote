import type { Logger } from "server/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "server/shared/supabase/authenticatedClient";
import { toRepositoryError } from "server/shared/supabase/repositoryError";
import type { UserProfile, UserStatus } from "server/user/entity/userProfile";

export type UpdateUserProfileInput = {
  avatarUrl?: string | null;
  displayName?: string;
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
};

function toUserStatus(status: string): UserStatus {
  if (status === "active" || status === "disabled") return status;

  throw toRepositoryError(
    "user_profile_invalid",
    "用户资料格式异常，请稍后重试。",
  );
}

function toUserProfile(row: AppUserRow): UserProfile {
  return {
    avatarUrl: row.avatar_url,
    displayName: row.display_name,
    email: row.email,
    id: row.id,
    status: toUserStatus(row.status),
  };
}

const userProfileColumns = "id, display_name, email, avatar_url, status";

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

      return data ? toUserProfile(data) : null;
    },

    async updateProfile(input) {
      const updates: {
        avatar_url?: string | null;
        display_name?: string;
        updated_by: string;
      } = { updated_by: input.updatedBy };

      if (input.avatarUrl !== undefined) {
        updates.avatar_url = input.avatarUrl;
      }
      if (input.displayName !== undefined) {
        updates.display_name = input.displayName;
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

      return data ? toUserProfile(data) : null;
    },
  };
}
