import { sharedErrorMessages } from "internal/shared/errors/sharedErrorMessages";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "internal/shared/errors/appError";
import type { UserLedgerDisplayName } from "internal/user/entity/userLedgerDisplayName";
import type {
  TransactionColorScheme,
  UserProfile,
} from "internal/user/entity/userProfile";
import {
  displayNameMaxLength,
  formatLedgerDisplayNameConflictMessage,
  userErrorMessages,
  type AvatarMimeType,
} from "internal/user/errors";
import type { AvatarStorageRepository } from "internal/user/repository/avatarStorageRepository";
import type {
  UpdateDisplayNameErrorCode,
  UserRepository,
} from "internal/user/repository/userRepository";

export type UpdateCurrentUserProfileInput = {
  avatarUrl?: string | null;
  displayName?: string;
  transactionColorScheme?: TransactionColorScheme;
};

export type UpdateCurrentDisplayNameInput = {
  displayName: string;
  /** 需要同步修改账本内昵称的账本 ID，来自客户端，Service 会重新校验。 */
  syncLedgerIds: readonly string[];
};

/** 文件格式与大小已由 schema 校验。 */
export type UpdateCurrentAvatarInput = {
  contentType: AvatarMimeType;
  file: Blob;
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
  listCurrentLedgerDisplayNames(): Promise<UserLedgerDisplayName[]>;
  updateCurrentAvatar(input: UpdateCurrentAvatarInput): Promise<UserProfile>;
  updateCurrentDisplayName(input: UpdateCurrentDisplayNameInput): Promise<void>;
  updateCurrentProfile(
    input: UpdateCurrentUserProfileInput,
  ): Promise<UserProfile>;
}

type UserServiceDependencies = {
  avatarStorageRepository: AvatarStorageRepository;
  currentUserId: string | null;
  userRepository: UserRepository;
};

function normalizeDisplayName(displayName: string): string {
  const normalized = displayName.trim();

  if (!normalized) {
    throw new ValidationError(
      "display_name_required",
      userErrorMessages.displayNameRequired,
    );
  }
  if (normalized.length > displayNameMaxLength) {
    throw new ValidationError(
      "display_name_too_long",
      userErrorMessages.displayNameTooLong,
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
      userErrorMessages.avatarUrlInvalid,
    );
  }

  return normalized;
}

const avatarFileExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const satisfies Record<AvatarMimeType, string>;

function toUpdateDisplayNameError(code: UpdateDisplayNameErrorCode) {
  switch (code) {
    case "auth_required":
      return new AuthenticationError(code, sharedErrorMessages.authRequired);
    case "display_name_required":
      return new ValidationError(code, userErrorMessages.displayNameRequired);
    case "display_name_too_long":
      return new ValidationError(code, userErrorMessages.displayNameTooLong);
    case "ledger_permission_denied":
      return new AuthorizationError(
        code,
        userErrorMessages.displayNameLedgerPermissionDenied,
      );
    case "user_inactive":
      return new AuthorizationError(code, userErrorMessages.userInactive);
  }
}

export function createUserService({
  avatarStorageRepository,
  currentUserId,
  userRepository,
}: UserServiceDependencies): UserService {
  function requireCurrentUserId(): string {
    if (!currentUserId) {
      throw new AuthenticationError(
        "auth_required",
        sharedErrorMessages.authRequired,
      );
    }

    return currentUserId;
  }

  async function requireActiveProfile(userId: string): Promise<UserProfile> {
    const profile = await userRepository.findById(userId);

    if (!profile) {
      throw new NotFoundError(
        "user_not_found",
        userErrorMessages.profileNotFound,
      );
    }
    if (profile.status !== "active") {
      throw new AuthorizationError(
        "user_inactive",
        userErrorMessages.userInactive,
      );
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
        userErrorMessages.profileUpdateRequired,
      );
    }

    await requireActiveProfile(userId);
    const updatedProfile = await userRepository.updateProfile({
      ...normalizedInput,
      updatedBy: userId,
      userId,
    });

    if (!updatedProfile) {
      throw new NotFoundError(
        "user_not_found",
        userErrorMessages.profileNotFound,
      );
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
          userErrorMessages.scopeMismatch,
        );
      }

      await updateProfile(userId, { displayName });
    },

    async listCurrentLedgerDisplayNames() {
      requireCurrentUserId();
      return userRepository.listCurrentLedgerDisplayNames();
    },

    async updateCurrentAvatar({ contentType, file }) {
      const userId = requireCurrentUserId();
      await requireActiveProfile(userId);

      // 每次使用新文件名，避免浏览器与 CDN 缓存旧头像。
      const path = `${userId}/${crypto.randomUUID()}.${avatarFileExtensions[contentType]}`;
      const avatarUrl = avatarStorageRepository.getPublicUrl(path);
      // 先校验 URL，避免上传后才因 avatar_url 约束失败而留下孤立文件。
      normalizeAvatarUrl(avatarUrl);

      await avatarStorageRepository.uploadAvatar({ contentType, file, path });
      const profile = await updateProfile(userId, { avatarUrl });

      try {
        const paths = await avatarStorageRepository.listUserAvatarPaths(userId);
        await avatarStorageRepository.removeAvatars(
          paths.filter((oldPath) => oldPath !== path),
        );
      } catch {
        // 旧头像清理失败不影响本次结果；Repository 已记录日志，下次更换时会再次清理。
      }

      return profile;
    },

    async updateCurrentDisplayName({ displayName, syncLedgerIds }) {
      const userId = requireCurrentUserId();
      const normalizedDisplayName = normalizeDisplayName(displayName);

      await requireActiveProfile(userId);

      // 客户端提交的账本必须是当前用户所属的 active 账本；RPC 内会再次校验。
      if (syncLedgerIds.length > 0) {
        const ledgers = await userRepository.listCurrentLedgerDisplayNames();
        const accessibleLedgerIds = new Set(
          ledgers.map((ledger) => ledger.ledgerId),
        );

        if (syncLedgerIds.some((id) => !accessibleLedgerIds.has(id))) {
          throw new AuthorizationError(
            "ledger_permission_denied",
            userErrorMessages.displayNameLedgerPermissionDenied,
          );
        }
      }

      const result = await userRepository.updateCurrentDisplayName({
        displayName: normalizedDisplayName,
        syncLedgerIds: [...new Set(syncLedgerIds)],
      });

      if (result.ok) return;
      if ("conflicts" in result) {
        throw new ConflictError(
          "display_name_ledger_conflict",
          formatLedgerDisplayNameConflictMessage(result.conflicts),
        );
      }

      throw toUpdateDisplayNameError(result.code);
    },

    async updateCurrentProfile(input) {
      return updateProfile(requireCurrentUserId(), input);
    },
  };
}
