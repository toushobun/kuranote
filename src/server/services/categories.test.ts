import { beforeEach, describe, expect, it, vi } from "vitest";

import { categoryErrorCodes } from "server/errors/categories";
import { createSupabaseMock } from "test/supabaseMock";

import {
  archiveCategoryService,
  createCategoryService,
  reorderCategoriesService,
  updateCategoryService,
} from "./categories";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const categoryId = "00000000-0000-4000-8000-000000000101";
const secondCategoryId = "00000000-0000-4000-8000-000000000103";
const parentId = "00000000-0000-4000-8000-000000000102";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("category services", () => {
  it("创建大分类成功时保存 Emoji 并计算下一个排序值", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: [] }, { data: [{ sort_order: 20 }] }, {}],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      createCategoryService({
        iconName: "🍽️",
        ledgerId,
        name: "食费",
        parentId: null,
        type: "expense",
        userId,
      }),
    ).resolves.toEqual({ ok: true });

    expect(supabase.queries[2].calls).toContainEqual({
      args: [
        {
          created_by: userId,
          icon_name: "🍽️",
          ledger_id: ledgerId,
          name: "🍽️ 食费",
          parent_id: null,
          sort_order: 30,
          type: "expense",
          updated_by: userId,
        },
      ],
      method: "insert",
    });
  });

  it("创建小分类时先确认父分类属于当前账本", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: { id: parentId } },
        { data: [] },
        { data: [{ sort_order: 10 }] },
        {},
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      createCategoryService({
        iconName: "🛒",
        ledgerId,
        name: "超市",
        parentId,
        type: "expense",
        userId,
      }),
    ).resolves.toEqual({ ok: true });

    expect(supabase.queries[0].calls).toEqual(
      expect.arrayContaining([
        { args: ["id", parentId], method: "eq" },
        { args: ["ledger_id", ledgerId], method: "eq" },
        { args: ["type", "expense"], method: "eq" },
        { args: ["parent_id", null], method: "is" },
        { args: [], method: "maybeSingle" },
      ]),
    );
    expect(supabase.queries[3].calls).toContainEqual({
      args: [
        expect.objectContaining({
          icon_name: "🛒",
          name: "🛒 超市",
          parent_id: parentId,
          sort_order: 20,
        }),
      ],
      method: "insert",
    });
  });

  it("父分类不属于当前账本时返回 parent_invalid", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ data: null }] });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      createCategoryService({
        iconName: "🛒",
        ledgerId,
        name: "超市",
        parentId,
        type: "expense",
        userId,
      }),
    ).resolves.toEqual({
      error: categoryErrorCodes.parentInvalid,
      ok: false,
    });
    expect(supabase.queries).toHaveLength(1);
  });

  it("同级分类显示名称重复时返回 create_failed", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        {
          data: [
            {
              icon_name: "🍔",
              id: secondCategoryId,
              name: "🍔 食费",
            },
          ],
        },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      createCategoryService({
        iconName: "🍽️",
        ledgerId,
        name: "食费",
        parentId: null,
        type: "expense",
        userId,
      }),
    ).resolves.toEqual({
      error: categoryErrorCodes.createFailed,
      ok: false,
    });
    expect(supabase.queries).toHaveLength(1);
  });

  it("读取同级分类失败时返回 create_failed", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ error: { message: "select failed" } }],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      createCategoryService({
        iconName: "🍽️",
        ledgerId,
        name: "食费",
        parentId: null,
        type: "expense",
        userId,
      }),
    ).resolves.toEqual({
      error: categoryErrorCodes.createFailed,
      ok: false,
    });
  });

  it("读取排序值失败时返回 create_failed", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: [] }, { error: { message: "select failed" } }],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      createCategoryService({
        iconName: "🍽️",
        ledgerId,
        name: "食费",
        parentId: null,
        type: "expense",
        userId,
      }),
    ).resolves.toEqual({
      error: categoryErrorCodes.createFailed,
      ok: false,
    });
  });

  it("插入分类失败时返回 create_failed", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: [] },
        { data: [] },
        { error: { message: "duplicate category" } },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      createCategoryService({
        iconName: "🍽️",
        ledgerId,
        name: "食费",
        parentId: null,
        type: "expense",
        userId,
      }),
    ).resolves.toEqual({
      error: categoryErrorCodes.createFailed,
      ok: false,
    });
  });

  it("更新分类成功时同时更新名称与 Emoji", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: { id: categoryId, parent_id: null, type: "expense" } },
        { data: [] },
        { count: 1 },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      updateCategoryService({
        categoryId,
        iconName: "🍜",
        ledgerId,
        name: "外食",
        userId,
      }),
    ).resolves.toEqual({ ok: true });

    expect(supabase.queries[2].calls).toContainEqual({
      args: [
        { icon_name: "🍜", name: "🍜 外食", updated_by: userId },
        { count: "exact" },
      ],
      method: "update",
    });
  });

  it("更新分类不存在时返回 update_failed", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ data: null }] });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      updateCategoryService({
        categoryId,
        iconName: "🍜",
        ledgerId,
        name: "外食",
        userId,
      }),
    ).resolves.toEqual({
      error: categoryErrorCodes.updateFailed,
      ok: false,
    });
  });

  it("更新为同级重复显示名称时返回 update_failed", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: { id: categoryId, parent_id: parentId, type: "expense" } },
        {
          data: [
            {
              icon_name: "🍔",
              id: secondCategoryId,
              name: "🍔 外食",
            },
          ],
        },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      updateCategoryService({
        categoryId,
        iconName: "🍜",
        ledgerId,
        name: "外食",
        userId,
      }),
    ).resolves.toEqual({
      error: categoryErrorCodes.updateFailed,
      ok: false,
    });
    expect(supabase.queries).toHaveLength(2);
  });

  it("更新分类读取同级名称失败时返回 update_failed", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: { id: categoryId, parent_id: null, type: "expense" } },
        { error: { message: "select failed" } },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      updateCategoryService({
        categoryId,
        iconName: "🍜",
        ledgerId,
        name: "外食",
        userId,
      }),
    ).resolves.toEqual({
      error: categoryErrorCodes.updateFailed,
      ok: false,
    });
  });

  it("更新分类没有命中当前账本记录时返回 update_failed", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: { id: categoryId, parent_id: null, type: "expense" } },
        { data: [] },
        { count: 0 },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      updateCategoryService({
        categoryId,
        iconName: "🍜",
        ledgerId,
        name: "外食",
        userId,
      }),
    ).resolves.toEqual({
      error: categoryErrorCodes.updateFailed,
      ok: false,
    });
  });

  it("更新分类数据库错误时返回 update_failed", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: { id: categoryId, parent_id: null, type: "expense" } },
        { data: [] },
        { error: { message: "update error" } },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      updateCategoryService({
        categoryId,
        iconName: "🍜",
        ledgerId,
        name: "外食",
        userId,
      }),
    ).resolves.toEqual({
      error: categoryErrorCodes.updateFailed,
      ok: false,
    });
  });

  it("按传入顺序更新同级分类排序", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        {
          data: [
            { id: categoryId, sort_order: 10 },
            { id: secondCategoryId, sort_order: 20 },
          ],
        },
        { count: 1 },
        { count: 1 },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      reorderCategoriesService({
        categoryIds: [secondCategoryId, categoryId],
        ledgerId,
        parentId: null,
        type: "expense",
        userId,
      }),
    ).resolves.toEqual({ ok: true });

    expect(supabase.queries[1].calls).toContainEqual({
      args: [{ sort_order: 10, updated_by: userId }, { count: "exact" }],
      method: "update",
    });
    expect(supabase.queries[2].calls).toContainEqual({
      args: [{ sort_order: 20, updated_by: userId }, { count: "exact" }],
      method: "update",
    });
  });

  it("排序中途失败时恢复已经更新的分类顺序", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        {
          data: [
            { id: categoryId, sort_order: 10 },
            { id: secondCategoryId, sort_order: 20 },
          ],
        },
        { count: 1 },
        { error: { message: "update failed" } },
        { count: 1 },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      reorderCategoriesService({
        categoryIds: [secondCategoryId, categoryId],
        ledgerId,
        parentId: null,
        type: "expense",
        userId,
      }),
    ).resolves.toEqual({
      error: categoryErrorCodes.reorderFailed,
      ok: false,
      recoveryFailed: undefined,
    });

    expect(supabase.queries[3].calls).toContainEqual({
      args: [{ sort_order: 20, updated_by: userId }, { count: "exact" }],
      method: "update",
    });
  });

  it("排序恢复写入失败时返回恢复失败标记", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        {
          data: [
            { id: categoryId, sort_order: 10 },
            { id: secondCategoryId, sort_order: 20 },
          ],
        },
        { count: 1 },
        { error: { message: "update failed" } },
        { error: { message: "restore failed" } },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      reorderCategoriesService({
        categoryIds: [secondCategoryId, categoryId],
        ledgerId,
        parentId: null,
        type: "expense",
        userId,
      }),
    ).resolves.toEqual({
      error: categoryErrorCodes.reorderFailed,
      ok: false,
      recoveryFailed: true,
    });
  });

  it("排序列表未覆盖全部同级分类时返回 reorder_failed", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ data: [{ id: categoryId, sort_order: 10 }] }],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      reorderCategoriesService({
        categoryIds: [categoryId, secondCategoryId],
        ledgerId,
        parentId: null,
        type: "expense",
        userId,
      }),
    ).resolves.toEqual({
      error: categoryErrorCodes.reorderFailed,
      ok: false,
    });
  });

  it("归档大分类成功时同时归档其子分类", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: { id: categoryId, parent_id: null } },
        { count: 2 },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      archiveCategoryService({ categoryId, ledgerId, userId }),
    ).resolves.toEqual({ ok: true });

    expect(supabase.queries[1].calls).toEqual(
      expect.arrayContaining([
        { args: ["ledger_id", ledgerId], method: "eq" },
        { args: ["is_archived", false], method: "eq" },
        {
          args: [`id.eq.${categoryId},parent_id.eq.${categoryId}`],
          method: "or",
        },
      ]),
    );
  });

  it("归档小分类成功时只归档自身", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: { id: categoryId, parent_id: parentId } },
        { count: 1 },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      archiveCategoryService({ categoryId, ledgerId, userId }),
    ).resolves.toEqual({ ok: true });

    expect(supabase.queries[1].calls).toContainEqual({
      args: ["id", categoryId],
      method: "eq",
    });
  });

  it("归档分类不属于当前账本时返回 archive_failed", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ data: null }] });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      archiveCategoryService({ categoryId, ledgerId, userId }),
    ).resolves.toEqual({
      error: categoryErrorCodes.archiveFailed,
      ok: false,
    });
  });

  it("归档分类时 update 命中 0 行时返回 archive_failed", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        { data: { id: categoryId, parent_id: null } },
        { count: 0 },
      ],
    });
    mocks.createClient.mockResolvedValue(supabase.client);

    await expect(
      archiveCategoryService({ categoryId, ledgerId, userId }),
    ).resolves.toEqual({
      error: categoryErrorCodes.archiveFailed,
      ok: false,
    });
  });
});
