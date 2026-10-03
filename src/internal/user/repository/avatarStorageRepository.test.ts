// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { userErrorMessages } from "internal/user/errors";
import { RepositoryError } from "internal/shared/errors/appError";
import type { Logger } from "internal/shared/logging/logger";
import { createSupabaseAvatarStorageRepository } from "internal/user/repository/avatarStorageRepository";

const userId = "00000000-0000-4000-8000-000000000031";
const storageError = { message: "new row violates row-level security policy" };

function createStorageMock(
  responses: {
    list?: { data: unknown; error: unknown };
    remove?: { data: unknown; error: unknown };
    upload?: { data: unknown; error: unknown };
  } = {},
) {
  const bucket = {
    getPublicUrl: vi.fn((path: string) => ({
      data: {
        publicUrl: `https://project.supabase.co/storage/v1/object/public/avatars/${path}`,
      },
    })),
    list: vi.fn(async () => responses.list ?? { data: [], error: null }),
    remove: vi.fn(async () => responses.remove ?? { data: [], error: null }),
    upload: vi.fn(async () => responses.upload ?? { data: {}, error: null }),
  };
  const from = vi.fn(() => bucket);
  return { bucket, client: { storage: { from } }, from };
}

function createRepository(storage: ReturnType<typeof createStorageMock>) {
  const logger: Logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
  const repository = createSupabaseAvatarStorageRepository(
    storage.client as never,
    logger,
  );
  return { logger, repository };
}

describe("createSupabaseAvatarStorageRepository", () => {
  it("返回 avatars bucket 的公开 URL", () => {
    const storage = createStorageMock();
    const { repository } = createRepository(storage);

    expect(repository.getPublicUrl(`${userId}/a.webp`)).toBe(
      `https://project.supabase.co/storage/v1/object/public/avatars/${userId}/a.webp`,
    );
    expect(storage.from).toHaveBeenCalledWith("avatars");
  });

  it("以指定类型上传且不覆盖已有文件", async () => {
    const storage = createStorageMock();
    const { repository } = createRepository(storage);
    const file = new Blob(["x"], { type: "image/webp" });

    await repository.uploadAvatar({
      contentType: "image/webp",
      file,
      path: `${userId}/a.webp`,
    });

    expect(storage.bucket.upload).toHaveBeenCalledWith(
      `${userId}/a.webp`,
      file,
      { cacheControl: "31536000", contentType: "image/webp", upsert: false },
    );
  });

  it("上传失败时记录日志并抛出 RepositoryError", async () => {
    const storage = createStorageMock({
      upload: { data: null, error: storageError },
    });
    const { logger, repository } = createRepository(storage);

    const result = repository.uploadAvatar({
      contentType: "image/webp",
      file: new Blob(["x"]),
      path: `${userId}/a.webp`,
    });

    await expect(result).rejects.toBeInstanceOf(RepositoryError);
    await expect(result).rejects.toMatchObject({
      code: "user_avatar_upload_failed",
      message: userErrorMessages.avatarUploadFailed,
    });
    expect(logger.error).toHaveBeenCalledWith(
      "[user] failed to upload avatar",
      { message: storageError.message, path: `${userId}/a.webp` },
    );
  });

  it("列出用户目录下的对象路径", async () => {
    const storage = createStorageMock({
      list: { data: [{ name: "old.webp" }, { name: "new.webp" }], error: null },
    });
    const { repository } = createRepository(storage);

    await expect(repository.listUserAvatarPaths(userId)).resolves.toEqual([
      `${userId}/old.webp`,
      `${userId}/new.webp`,
    ]);
    expect(storage.bucket.list).toHaveBeenCalledWith(userId);
  });

  it("列出对象失败时抛出 RepositoryError", async () => {
    const storage = createStorageMock({
      list: { data: null, error: storageError },
    });
    const { logger, repository } = createRepository(storage);

    await expect(repository.listUserAvatarPaths(userId)).rejects.toMatchObject({
      code: "user_avatar_list_failed",
    });
    expect(logger.error).toHaveBeenCalledOnce();
  });

  it("删除指定对象，没有对象时不调用 Storage", async () => {
    const storage = createStorageMock();
    const { repository } = createRepository(storage);

    await repository.removeAvatars([]);
    expect(storage.bucket.remove).not.toHaveBeenCalled();

    await repository.removeAvatars([`${userId}/old.webp`]);
    expect(storage.bucket.remove).toHaveBeenCalledWith([`${userId}/old.webp`]);
  });

  it("删除失败时抛出 RepositoryError", async () => {
    const storage = createStorageMock({
      remove: { data: null, error: storageError },
    });
    const { logger, repository } = createRepository(storage);

    await expect(
      repository.removeAvatars([`${userId}/old.webp`]),
    ).rejects.toMatchObject({ code: "user_avatar_remove_failed" });
    expect(logger.error).toHaveBeenCalledOnce();
  });
});
