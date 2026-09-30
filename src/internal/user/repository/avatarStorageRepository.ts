import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";
import { userErrorMessages, type AvatarMimeType } from "internal/user/errors";

const avatarBucket = "avatars";

export type UploadAvatarInput = {
  contentType: AvatarMimeType;
  file: Blob;
  path: string;
};

export interface AvatarStorageRepository {
  /** 公开 bucket 的对象 URL，不访问网络。 */
  getPublicUrl(path: string): string;
  /** 列出用户目录下的全部对象路径；权限由 Storage RLS 兜底。 */
  listUserAvatarPaths(userId: string): Promise<string[]>;
  removeAvatars(paths: readonly string[]): Promise<void>;
  uploadAvatar(input: UploadAvatarInput): Promise<void>;
}

export function createSupabaseAvatarStorageRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
): AvatarStorageRepository {
  const bucket = () => supabase.storage.from(avatarBucket);

  return {
    getPublicUrl(path) {
      return bucket().getPublicUrl(path).data.publicUrl;
    },

    async listUserAvatarPaths(userId) {
      const { data, error } = await bucket().list(userId);

      if (error) {
        logger.error("[user] failed to list avatar objects", {
          message: error.message,
          userId,
        });
        throw toRepositoryError(
          "user_avatar_list_failed",
          userErrorMessages.avatarUpdateFailed,
        );
      }

      return data.map((object) => `${userId}/${object.name}`);
    },

    async removeAvatars(paths) {
      if (paths.length === 0) return;

      const { error } = await bucket().remove([...paths]);

      if (error) {
        logger.error("[user] failed to remove avatar objects", {
          count: paths.length,
          message: error.message,
        });
        throw toRepositoryError(
          "user_avatar_remove_failed",
          userErrorMessages.avatarUpdateFailed,
        );
      }
    },

    async uploadAvatar({ contentType, file, path }) {
      const { error } = await bucket().upload(path, file, {
        cacheControl: "31536000",
        contentType,
        upsert: false,
      });

      if (error) {
        logger.error("[user] failed to upload avatar", {
          message: error.message,
          path,
        });
        throw toRepositoryError(
          "user_avatar_upload_failed",
          userErrorMessages.avatarUploadFailed,
        );
      }
    },
  };
}
