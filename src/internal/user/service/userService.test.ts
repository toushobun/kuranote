// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  formatLedgerDisplayNameConflictMessage,
  userErrorMessages,
} from "internal/user/errors";
import { sharedErrorMessages } from "internal/shared/errors/sharedErrorMessages";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  RepositoryError,
  ValidationError,
} from "internal/shared/errors/appError";
import type { UserProfile } from "internal/user/entity/userProfile";
import type { AvatarStorageRepository } from "internal/user/repository/avatarStorageRepository";
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
  themeKey: "amberWarmth",
  transactionColorScheme: "expense_green_income_red",
};

function createRepository(
  overrides: Partial<UserRepository> = {},
): UserRepository {
  return {
    findById: vi.fn(),
    listCurrentLedgerDisplayNames: vi.fn(),
    updateCurrentDisplayName: vi.fn(),
    updateProfile: vi.fn(),
    ...overrides,
  };
}

function createAvatarStorageRepository(
  overrides: Partial<AvatarStorageRepository> = {},
): AvatarStorageRepository {
  return {
    getPublicUrl: vi.fn(
      (path: string) =>
        `https://project.supabase.co/storage/v1/object/public/avatars/${path}`,
    ),
    listUserAvatarPaths: vi.fn().mockResolvedValue([]),
    removeAvatars: vi.fn().mockResolvedValue(undefined),
    uploadAvatar: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("createUserService", () => {
  it("未登录时拒绝读取用户资料", async () => {
    const repository = createRepository();
    const service = createUserService({
      avatarStorageRepository: createAvatarStorageRepository(),
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
      avatarStorageRepository: createAvatarStorageRepository(),
      currentUserId: userId,
      userRepository: repository,
    });

    await expect(service.getCurrentProfile()).resolves.toEqual(activeProfile);
    expect(repository.findById).toHaveBeenCalledWith(userId);
  });

  it("用户资料不存在时抛出 NotFoundError", async () => {
    const service = createUserService({
      avatarStorageRepository: createAvatarStorageRepository(),
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
      avatarStorageRepository: createAvatarStorageRepository(),
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
      avatarStorageRepository: createAvatarStorageRepository(),
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
      avatarStorageRepository: createAvatarStorageRepository(),
      currentUserId: userId,
      userRepository: repository,
    });

    await expect(service.updateCurrentProfile({})).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(repository.findById).not.toHaveBeenCalled();
    expect(repository.updateProfile).not.toHaveBeenCalled();
  });

  it("更新当前用户的收支配色方案", async () => {
    const updateProfile = vi.fn().mockResolvedValue({
      ...activeProfile,
      transactionColorScheme: "expense_red_income_green",
    });
    const repository = createRepository({
      findById: vi.fn().mockResolvedValue(activeProfile),
      updateProfile,
    });
    const service = createUserService({
      avatarStorageRepository: createAvatarStorageRepository(),
      currentUserId: userId,
      userRepository: repository,
    });

    await service.updateCurrentProfile({
      transactionColorScheme: "expense_red_income_green",
    });

    expect(updateProfile).toHaveBeenCalledWith({
      transactionColorScheme: "expense_red_income_green",
      updatedBy: userId,
      userId,
    });
  });

  it("更新当前用户的主题并返回写库后的资料", async () => {
    const updatedProfile = { ...activeProfile, themeKey: "sakuraStory" };
    const updateProfile = vi.fn().mockResolvedValue(updatedProfile);
    const repository = createRepository({
      findById: vi.fn().mockResolvedValue(activeProfile),
      updateProfile,
    });
    const service = createUserService({
      avatarStorageRepository: createAvatarStorageRepository(),
      currentUserId: userId,
      userRepository: repository,
    });

    await expect(
      service.updateCurrentProfile({ themeKey: "sakuraStory" }),
    ).resolves.toEqual(updatedProfile);
    expect(updateProfile).toHaveBeenCalledWith({
      themeKey: "sakuraStory",
      updatedBy: userId,
      userId,
    });
  });

  it("未登录时拒绝更新主题", async () => {
    const repository = createRepository();
    const service = createUserService({
      avatarStorageRepository: createAvatarStorageRepository(),
      currentUserId: null,
      userRepository: repository,
    });

    await expect(
      service.updateCurrentProfile({ themeKey: "sakuraStory" }),
    ).rejects.toBeInstanceOf(AuthenticationError);
    expect(repository.updateProfile).not.toHaveBeenCalled();
  });

  it("用户已停用时拒绝更新主题", async () => {
    const repository = createRepository({
      findById: vi.fn().mockResolvedValue({
        ...activeProfile,
        status: "disabled",
      }),
    });
    const service = createUserService({
      avatarStorageRepository: createAvatarStorageRepository(),
      currentUserId: userId,
      userRepository: repository,
    });

    await expect(
      service.updateCurrentProfile({ themeKey: "sakuraStory" }),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(repository.updateProfile).not.toHaveBeenCalled();
  });

  it("头像地址不是 HTTPS URL 时拒绝写入", async () => {
    const repository = createRepository();
    const service = createUserService({
      avatarStorageRepository: createAvatarStorageRepository(),
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
      avatarStorageRepository: createAvatarStorageRepository(),
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
      avatarStorageRepository: createAvatarStorageRepository(),
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

describe("createUserService.listCurrentLedgerDisplayNames", () => {
  it("未登录时拒绝读取", async () => {
    const repository = createRepository();
    const service = createUserService({
      avatarStorageRepository: createAvatarStorageRepository(),
      currentUserId: null,
      userRepository: repository,
    });

    await expect(
      service.listCurrentLedgerDisplayNames(),
    ).rejects.toBeInstanceOf(AuthenticationError);
    expect(repository.listCurrentLedgerDisplayNames).not.toHaveBeenCalled();
  });

  it("返回当前用户所属账本的昵称", async () => {
    const service = createUserService({
      avatarStorageRepository: createAvatarStorageRepository(),
      currentUserId: userId,
      userRepository: createRepository({
        listCurrentLedgerDisplayNames: vi
          .fn()
          .mockResolvedValue(ledgerDisplayNames),
      }),
    });

    await expect(service.listCurrentLedgerDisplayNames()).resolves.toEqual(
      ledgerDisplayNames,
    );
  });
});

const familyLedgerId = "00000000-0000-4000-8000-000000000101";
const tripLedgerId = "00000000-0000-4000-8000-000000000102";
const ledgerDisplayNames = [
  { displayName: "爸爸", ledgerId: familyLedgerId, ledgerName: "家庭" },
  { displayName: "淞文", ledgerId: tripLedgerId, ledgerName: "旅行" },
];

function createDisplayNameService(overrides: Partial<UserRepository> = {}) {
  const repository = createRepository({
    findById: vi.fn().mockResolvedValue(activeProfile),
    listCurrentLedgerDisplayNames: vi
      .fn()
      .mockResolvedValue(ledgerDisplayNames),
    updateCurrentDisplayName: vi.fn().mockResolvedValue({ ok: true }),
    ...overrides,
  });

  return {
    repository,
    service: createUserService({
      avatarStorageRepository: createAvatarStorageRepository(),
      currentUserId: userId,
      userRepository: repository,
    }),
  };
}

describe("createUserService.updateCurrentDisplayName", () => {
  it("未登录时拒绝修改", async () => {
    const repository = createRepository();
    const service = createUserService({
      avatarStorageRepository: createAvatarStorageRepository(),
      currentUserId: null,
      userRepository: repository,
    });

    await expect(
      service.updateCurrentDisplayName({
        displayName: "新昵称",
        syncLedgerIds: [],
      }),
    ).rejects.toBeInstanceOf(AuthenticationError);
    expect(repository.updateCurrentDisplayName).not.toHaveBeenCalled();
  });

  it.each([
    [
      "空白",
      "   ",
      "display_name_required",
      userErrorMessages.displayNameRequired,
    ],
    [
      "超过 100 字",
      "名".repeat(101),
      "display_name_too_long",
      userErrorMessages.displayNameTooLong,
    ],
  ])("昵称%s时拒绝写入", async (_label, displayName, code, message) => {
    const { repository, service } = createDisplayNameService();

    await expect(
      service.updateCurrentDisplayName({ displayName, syncLedgerIds: [] }),
    ).rejects.toThrow(new ValidationError(code, message));
    expect(repository.updateCurrentDisplayName).not.toHaveBeenCalled();
  });

  it("去除首尾空白并去重后写入勾选账本", async () => {
    const { repository, service } = createDisplayNameService();

    await expect(
      service.updateCurrentDisplayName({
        displayName: " 新昵称 ",
        syncLedgerIds: [familyLedgerId, familyLedgerId],
      }),
    ).resolves.toBeUndefined();
    expect(repository.updateCurrentDisplayName).toHaveBeenCalledWith({
      displayName: "新昵称",
      syncLedgerIds: [familyLedgerId],
    });
  });

  it("不同步账本时不读取账本列表", async () => {
    const { repository, service } = createDisplayNameService();

    await service.updateCurrentDisplayName({
      displayName: "新昵称",
      syncLedgerIds: [],
    });

    expect(repository.listCurrentLedgerDisplayNames).not.toHaveBeenCalled();
    expect(repository.updateCurrentDisplayName).toHaveBeenCalledWith({
      displayName: "新昵称",
      syncLedgerIds: [],
    });
  });

  it("勾选的账本不属于当前用户时拒绝写入", async () => {
    const { repository, service } = createDisplayNameService();

    await expect(
      service.updateCurrentDisplayName({
        displayName: "新昵称",
        syncLedgerIds: [familyLedgerId, "00000000-0000-4000-8000-000000000999"],
      }),
    ).rejects.toThrow(
      new AuthorizationError(
        "ledger_permission_denied",
        userErrorMessages.displayNameLedgerPermissionDenied,
      ),
    );
    expect(repository.updateCurrentDisplayName).not.toHaveBeenCalled();
  });

  it("用户已停用时拒绝写入", async () => {
    const { repository, service } = createDisplayNameService({
      findById: vi
        .fn()
        .mockResolvedValue({ ...activeProfile, status: "disabled" }),
    });

    await expect(
      service.updateCurrentDisplayName({
        displayName: "新昵称",
        syncLedgerIds: [],
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(repository.updateCurrentDisplayName).not.toHaveBeenCalled();
  });

  it("账本内昵称冲突时抛出 ConflictError 并列出账本与原因", async () => {
    const { service } = createDisplayNameService({
      updateCurrentDisplayName: vi.fn().mockResolvedValue({
        conflicts: [
          {
            code: "display_name_placeholder_conflict",
            ledgerId: tripLedgerId,
            ledgerName: "旅行",
          },
        ],
        ok: false,
      }),
    });

    await expect(
      service.updateCurrentDisplayName({
        displayName: "新昵称",
        syncLedgerIds: [tripLedgerId],
      }),
    ).rejects.toThrow(
      new ConflictError(
        "display_name_ledger_conflict",
        formatLedgerDisplayNameConflictMessage([
          { code: "display_name_placeholder_conflict", ledgerName: "旅行" },
        ]),
      ),
    );
  });

  it.each([
    ["auth_required", AuthenticationError, sharedErrorMessages.authRequired],
    [
      "display_name_required",
      ValidationError,
      userErrorMessages.displayNameRequired,
    ],
    [
      "display_name_too_long",
      ValidationError,
      userErrorMessages.displayNameTooLong,
    ],
    [
      "ledger_permission_denied",
      AuthorizationError,
      userErrorMessages.displayNameLedgerPermissionDenied,
    ],
    ["user_inactive", AuthorizationError, userErrorMessages.userInactive],
  ] as const)(
    "RPC 业务错误 %s 转换为对应的应用错误",
    async (code, ErrorClass, message) => {
      const { service } = createDisplayNameService({
        updateCurrentDisplayName: vi
          .fn()
          .mockResolvedValue({ code, ok: false }),
      });

      const error = await service
        .updateCurrentDisplayName({ displayName: "新昵称", syncLedgerIds: [] })
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(ErrorClass);
      expect(error).toMatchObject({ code, message });
    },
  );
});

describe("updateCurrentAvatar", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const avatarFile = new Blob(["webp"], { type: "image/webp" });
  const uuid = "11111111-1111-4111-8111-111111111111";
  const newPath = `${userId}/${uuid}.webp`;
  const newAvatarUrl = `https://project.supabase.co/storage/v1/object/public/avatars/${newPath}`;

  function createAvatarService({
    avatarStorage = {},
    currentUserId = userId,
    repository = {},
  }: {
    avatarStorage?: Partial<AvatarStorageRepository>;
    currentUserId?: string | null;
    repository?: Partial<UserRepository>;
  } = {}) {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(uuid);
    const avatarStorageRepository =
      createAvatarStorageRepository(avatarStorage);
    const userRepository = createRepository({
      findById: vi.fn().mockResolvedValue(activeProfile),
      updateProfile: vi
        .fn()
        .mockResolvedValue({ ...activeProfile, avatarUrl: newAvatarUrl }),
      ...repository,
    });
    const service = createUserService({
      avatarStorageRepository,
      currentUserId,
      userRepository,
    });
    return { avatarStorageRepository, service, userRepository };
  }

  it("以新文件名上传后更新头像地址，并删除旧头像", async () => {
    const { avatarStorageRepository, service, userRepository } =
      createAvatarService({
        avatarStorage: {
          listUserAvatarPaths: vi
            .fn()
            .mockResolvedValue([`${userId}/old.webp`, newPath]),
        },
      });

    await expect(
      service.updateCurrentAvatar({
        contentType: "image/webp",
        file: avatarFile,
      }),
    ).resolves.toMatchObject({ avatarUrl: newAvatarUrl });
    expect(avatarStorageRepository.uploadAvatar).toHaveBeenCalledWith({
      contentType: "image/webp",
      file: avatarFile,
      path: newPath,
    });
    expect(userRepository.updateProfile).toHaveBeenCalledWith({
      avatarUrl: newAvatarUrl,
      updatedBy: userId,
      userId,
    });
    expect(avatarStorageRepository.listUserAvatarPaths).toHaveBeenCalledWith(
      userId,
    );
    expect(avatarStorageRepository.removeAvatars).toHaveBeenCalledWith([
      `${userId}/old.webp`,
    ]);
  });

  it.each([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
  ] as const)("%s 使用 .%s 扩展名", async (contentType, extension) => {
    const { avatarStorageRepository, service } = createAvatarService();

    await service.updateCurrentAvatar({ contentType, file: avatarFile });

    expect(avatarStorageRepository.uploadAvatar).toHaveBeenCalledWith(
      expect.objectContaining({ path: `${userId}/${uuid}.${extension}` }),
    );
  });

  it("未登录时不上传", async () => {
    const { avatarStorageRepository, service } = createAvatarService({
      currentUserId: null,
    });

    await expect(
      service.updateCurrentAvatar({
        contentType: "image/webp",
        file: avatarFile,
      }),
    ).rejects.toBeInstanceOf(AuthenticationError);
    expect(avatarStorageRepository.uploadAvatar).not.toHaveBeenCalled();
  });

  it("用户已停用时不上传", async () => {
    const { avatarStorageRepository, service } = createAvatarService({
      repository: {
        findById: vi
          .fn()
          .mockResolvedValue({ ...activeProfile, status: "disabled" }),
      },
    });

    await expect(
      service.updateCurrentAvatar({
        contentType: "image/webp",
        file: avatarFile,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(avatarStorageRepository.uploadAvatar).not.toHaveBeenCalled();
  });

  it("公开 URL 不是 HTTPS 时不上传", async () => {
    const { avatarStorageRepository, service } = createAvatarService({
      avatarStorage: {
        getPublicUrl: vi.fn(
          () => "http://127.0.0.1:54321/storage/v1/object/public/avatars/a",
        ),
      },
    });

    await expect(
      service.updateCurrentAvatar({
        contentType: "image/webp",
        file: avatarFile,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(avatarStorageRepository.uploadAvatar).not.toHaveBeenCalled();
  });

  it("上传失败时不更新头像地址", async () => {
    const uploadError = new RepositoryError(
      "user_avatar_upload_failed",
      userErrorMessages.avatarUploadFailed,
    );
    const { service, userRepository } = createAvatarService({
      avatarStorage: { uploadAvatar: vi.fn().mockRejectedValue(uploadError) },
    });

    await expect(
      service.updateCurrentAvatar({
        contentType: "image/webp",
        file: avatarFile,
      }),
    ).rejects.toBe(uploadError);
    expect(userRepository.updateProfile).not.toHaveBeenCalled();
  });

  it.each([
    [
      "列出旧头像失败",
      {
        listUserAvatarPaths: vi
          .fn()
          .mockRejectedValue(
            new RepositoryError("user_avatar_list_failed", ""),
          ),
      },
    ],
    [
      "删除旧头像失败",
      {
        listUserAvatarPaths: vi.fn().mockResolvedValue([`${userId}/old.webp`]),
        removeAvatars: vi
          .fn()
          .mockRejectedValue(
            new RepositoryError("user_avatar_remove_failed", ""),
          ),
      },
    ],
  ])("%s时仍返回更新后的资料", async (_label, avatarStorage) => {
    const { service } = createAvatarService({ avatarStorage });

    await expect(
      service.updateCurrentAvatar({
        contentType: "image/webp",
        file: avatarFile,
      }),
    ).resolves.toMatchObject({ avatarUrl: newAvatarUrl });
  });
});
