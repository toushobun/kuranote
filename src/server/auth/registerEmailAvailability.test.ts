import { beforeEach, describe, expect, it, vi } from "vitest";

import { isRegisterEmailAvailable } from "./registerEmailAvailability";

const mocks = vi.hoisted(() => ({
  createServiceRoleClient: vi.fn(),
  listUsers: vi.fn(),
}));

vi.mock("lib/supabase/serviceRole", () => ({
  createServiceRoleClient: mocks.createServiceRoleClient,
}));

describe("isRegisterEmailAvailable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createServiceRoleClient.mockReturnValue({
      auth: {
        admin: {
          listUsers: mocks.listUsers,
        },
      },
    });
  });

  it("大小写不同的同一邮箱存在时返回不可用", async () => {
    mocks.listUsers.mockResolvedValue({
      data: {
        nextPage: null,
        users: [{ email: "Yamada@Example.Test" }],
      },
      error: null,
    });

    await expect(isRegisterEmailAvailable("yamada@example.test")).resolves.toBe(
      false,
    );
  });

  it("后续分页也没有同一邮箱时返回可用", async () => {
    mocks.listUsers
      .mockResolvedValueOnce({
        data: {
          nextPage: 2,
          users: [{ email: "first@example.test" }],
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          nextPage: null,
          users: [{ email: "second@example.test" }],
        },
        error: null,
      });

    await expect(isRegisterEmailAvailable("yamada@example.test")).resolves.toBe(
      true,
    );
    expect(mocks.listUsers).toHaveBeenNthCalledWith(2, {
      page: 2,
      perPage: 1000,
    });
  });

  it("第二页存在同一邮箱时返回不可用", async () => {
    mocks.listUsers
      .mockResolvedValueOnce({
        data: {
          nextPage: 2,
          users: [{ email: "other@example.test" }],
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          nextPage: null,
          users: [{ email: "yamada@example.test" }],
        },
        error: null,
      });

    await expect(isRegisterEmailAvailable("yamada@example.test")).resolves.toBe(
      false,
    );
  });

  it("Auth 用户查询失败时抛出异常", async () => {
    mocks.listUsers.mockResolvedValue({
      data: { users: [] },
      error: new Error("failed"),
    });

    await expect(
      isRegisterEmailAvailable("yamada@example.test"),
    ).rejects.toThrow("Failed to check register email availability.");
  });
});
