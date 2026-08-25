import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "internal/shared/errors/appError";
import type {
  TransactionColorScheme,
  UserProfile,
} from "internal/user/entity/userProfile";
import type { UserRepository } from "internal/user/repository/userRepository";

const displayNameMaxLength = 100;

export type UpdateCurrentUserProfileInput = {
  avatarUrl?: string | null;
  displayName?: string;
  transactionColorScheme?: TransactionColorScheme;
};

export type SyncUserDisplayNameInput = {
  displayName: string;
  userId: string;
};

/** Auth 模块后续只依赖此窄接口，不直接访问 app_user。 */
export interface UserDisplayNameSyncService {
  syncDisplayName(input: SyncUserDisplayNameInput): Promise<void>;
}

export interface UserService extends UserDisplayNameSyncService {
  getCurrentProfile(): Promise<UserProfile>;
  updateCurrentProfile(
    input: UpdateCurrentUserProfileInput,
  ): Promise<UserProfile>;
}

type UserServiceDependencies = {
  currentUserId: string | null;
  userRepository: UserRepository;
};

function normalizeDisplayName(displayName: string): string {
  const normalized = displayName.trim();

  if (!normalized) {
    throw new ValidationError("display_name_required", "请输入昵称。");
  }
  if (normalized.length > displayNameMaxLength) {
    throw new ValidationError(
      "display_name_too_long",
      `昵称最多 ${displayNameMaxLength} 个字符。`,
    );
  }

  return normalized;
}

function normalizeAvatarUrl(avatarUrl: string | null): string | null {
  if (avatarUrl === null) return null;

  const normalized = avatarUrl.trim();

  let isValidHttpsUrl = false;
  try {
    isValidHttpsUrl = new URL(normalized).protocol === "https:";
  } catch {
    isValidHttpsUrl = false;
  }

  if (!isValidHttpsUrl) {
    throw new ValidationError(
      "avatar_url_invalid",
      "头像地址必须是有效的 HTTPS URL。",
    );
  }

  return normalized;
}

export function createUserService({
  currentUserId,
  userRepository,
}: UserServiceDependencies): UserService {
  function requireCurrentUserId(): string {
    if (!currentUserId) {
      throw new AuthenticationError("auth_required", "请先登录。");
    }

    return currentUserId;
  }

  async function requireActiveProfile(userId: string): Promise<UserProfile> {
    const profile = await userRepository.findById(userId);

    if (!profile) {
      throw new NotFoundError("user_not_found", "用户资料不存在。");
    }
    if (profile.status !== "active") {
      throw new AuthorizationError("user_inactive", "当前用户已停用。");
    }

    return profile;
  }

  async function updateProfile(
    userId: string,
    input: UpdateCurrentUserProfileInput,
  ): Promise<UserProfile> {
    const normalizedInput: UpdateCurrentUserProfileInput = {};

    if (input.displayName !== undefined) {
      normalizedInput.displayName = normalizeDisplayName(input.displayName);
    }
    if (input.avatarUrl !== undefined) {
      normalizedInput.avatarUrl = normalizeAvatarUrl(input.avatarUrl);
    }
    if (input.transactionColorScheme !== undefined) {
      normalizedInput.transactionColorScheme = input.transactionColorScheme;
    }
    if (
      normalizedInput.displayName === undefined &&
      normalizedInput.avatarUrl === undefined &&
      normalizedInput.transactionColorScheme === undefined
    ) {
      throw new ValidationError(
        "profile_update_required",
        "请至少提供一项需要更新的用户资料。",
      );
    }

    await requireActiveProfile(userId);
    const updatedProfile = await userRepository.updateProfile({
      ...normalizedInput,
      updatedBy: userId,
      userId,
    });

    if (!updatedProfile) {
      throw new NotFoundError("user_not_found", "用户资料不存在。");
    }

    return updatedProfile;
  }

  return {
    async getCurrentProfile() {
      return requireActiveProfile(requireCurrentUserId());
    },

    async syncDisplayName({ displayName, userId }) {
      const authenticatedUserId = requireCurrentUserId();

      if (userId !== authenticatedUserId) {
        throw new AuthorizationError(
          "user_scope_mismatch",
          "不能修改其他用户的资料。",
        );
      }

      await updateProfile(userId, { displayName });
    },

    async updateCurrentProfile(input) {
      return updateProfile(requireCurrentUserId(), input);
    },
  };
}
