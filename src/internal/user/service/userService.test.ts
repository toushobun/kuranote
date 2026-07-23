// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "internal/shared/errors/appError";
import type { UserProfile } from "internal/user/entity/userProfile";
import type { UserRepository } from "internal/user/repository/userRepository";
import { createUserService } from "internal/user/service/userService";

const userId = "00000000-0000-4000-8000-000000000031";
const otherUserId = "00000000-0000-4000-8000-000000000032";
const activeProfile: UserProfile = {
  avatarUrl: "https://example.com/avatar.png",
  displayName: "淞文",
  email: "user@example.com",
  id: userId,
  status: "active",
};

function createRepository(
  overrides: Partial<UserRepository> = {},
): UserRepository {
  return {
    findById: vi.fn(),
    updateProfile: vi.fn(),
    ...overrides,
  };
}

describe("createUserService", () => {
  it("未登录时拒绝读取用户资料", async () => {
    const repository = createRepository();
    const service = createUserService({
      currentUserId: null,
      userRepository: repository,
    });

    await expect(service.getCurrentProfile()).rejects.toBeInstanceOf(
      AuthenticationError,
    );
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it("读取当前 active 用户资料", async () => {
    const repository = createRepository({
      findById: vi.fn().mockResolvedValue(activeProfile),
    });
    const service = createUserService({
      currentUserId: userId,
      userRepository: repository,
    });

    await expect(service.getCurrentProfile()).resolves.toEqual(activeProfile);
    expect(repository.findById).toHaveBeenCalledWith(userId);
  });

  it("用户资料不存在时抛出 NotFoundError", async () => {
    const service = createUserService({
      currentUserId: userId,
      userRepository: createRepository({
        findById: vi.fn().mockResolvedValue(null),
      }),
    });

    await expect(service.getCurrentProfile()).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("用户已停用时抛出 AuthorizationError", async () => {
    const service = createUserService({
      currentUserId: userId,
      userRepository: createRepository({
        findById: vi.fn().mockResolvedValue({
          ...activeProfile,
          status: "disabled",
        }),
      }),
    });

    await expect(service.getCurrentProfile()).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });

  it("更新资料时规范化昵称和头像地址并写入当前用户", async () => {
    const updatedProfile = {
      ...activeProfile,
      avatarUrl: "https://example.com/new-avatar.png",
      displayName: "新昵称",
    };
    const updateProfile = vi.fn().mockResolvedValue(updatedProfile);
    const repository = createRepository({
      findById: vi.fn().mockResolvedValue(activeProfile),
      updateProfile,
    });
    const service = createUserService({
      currentUserId: userId,
      userRepository: repository,
    });

    await expect(
      service.updateCurrentProfile({
        avatarUrl: "  https://example.com/new-avatar.png  ",
        displayName: "  新昵称  ",
      }),
    ).resolves.toEqual(updatedProfile);
    expect(updateProfile).toHaveBeenCalledWith({
      avatarUrl: "https://example.com/new-avatar.png",
      displayName: "新昵称",
      updatedBy: userId,
      userId,
    });
  });

  it("没有提供可更新字段时拒绝写入", async () => {
    const repository = createRepository();
    const service = createUserService({
      currentUserId: userId,
      userRepository: repository,
    });

    await expect(service.updateCurrentProfile({})).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(repository.findById).not.toHaveBeenCalled();
    expect(repository.updateProfile).not.toHaveBeenCalled();
  });

  it("头像地址不是 HTTPS URL 时拒绝写入", async () => {
    const repository = createRepository();
    const service = createUserService({
      currentUserId: userId,
      userRepository: repository,
    });

    await expect(
      service.updateCurrentProfile({ avatarUrl: "http://example.com/a.png" }),
    ).rejects.toMatchObject({ code: "avatar_url_invalid" });
    expect(repository.updateProfile).not.toHaveBeenCalled();
  });

  it("显示名同步接口禁止修改其他用户", async () => {
    const repository = createRepository();
    const service = createUserService({
      currentUserId: userId,
      userRepository: repository,
    });

    await expect(
      service.syncDisplayName({ displayName: "新昵称", userId: otherUserId }),
    ).rejects.toMatchObject({ code: "user_scope_mismatch" });
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it("显示名同步接口通过窄契约更新当前用户", async () => {
    const updateProfile = vi.fn().mockResolvedValue({
      ...activeProfile,
      displayName: "新昵称",
    });
    const repository = createRepository({
      findById: vi.fn().mockResolvedValue(activeProfile),
      updateProfile,
    });
    const service = createUserService({
      currentUserId: userId,
      userRepository: repository,
    });

    await expect(
      service.syncDisplayName({ displayName: " 新昵称 ", userId }),
    ).resolves.toBeUndefined();
    expect(updateProfile).toHaveBeenCalledWith({
      displayName: "新昵称",
      updatedBy: userId,
      userId,
    });
  });
});
