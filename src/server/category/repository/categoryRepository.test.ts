// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createSupabaseCategoryRepository } from "server/category/repository/categoryRepository";
import { RepositoryError } from "server/shared/errors/appError";
import type { Logger } from "server/shared/logging/logger";
import { createSupabaseMock } from "test/supabaseMock";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const categoryId = "00000000-0000-4000-8000-000000000101";
const parentId = "00000000-0000-4000-8000-000000000102";

function createLogger(): Logger {
  return { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
}

describe("createSupabaseCategoryRepository", () => {
  it("SSR 读取只查询指定账本的未归档分类并保持排序", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ data: [] }] });
    const repository = createSupabaseCategoryRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(repository.findActiveByLedgerId(ledgerId)).resolves.toEqual(
      [],
    );

    expect(supabase.queries[0].calls).toEqual(
      expect.arrayContaining([
        { args: ["ledger_id", ledgerId], method: "eq" },
        { args: ["is_archived", false], method: "eq" },
        { args: ["type", { ascending: true }], method: "order" },
        { args: ["sort_order", { ascending: true }], method: "order" },
        { args: ["name", { ascending: true }], method: "order" },
      ]),
    );
  });

  it("父分类查询同时限制账本、类型、未归档和根节点", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        {
          data: { id: parentId, parent_id: null, type: "expense" },
        },
      ],
    });
    const repository = createSupabaseCategoryRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(
      repository.findActiveRootById({
        categoryId: parentId,
        ledgerId,
        type: "expense",
      }),
    ).resolves.toEqual({
      id: parentId,
      parentId: null,
      type: "expense",
    });
    expect(supabase.queries[0].calls).toEqual(
      expect.arrayContaining([
        { args: ["id", parentId], method: "eq" },
        { args: ["ledger_id", ledgerId], method: "eq" },
        { args: ["type", "expense"], method: "eq" },
        { args: ["is_archived", false], method: "eq" },
        { args: ["parent_id", null], method: "is" },
      ]),
    );
  });

  it("同级查询按 parentId 限制范围并转换字段", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [
        {
          data: [
            {
              icon_name: "🍽️",
              id: categoryId,
              name: "🍽️ 餐饮",
              sort_order: 10,
            },
          ],
        },
      ],
    });
    const repository = createSupabaseCategoryRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(
      repository.listActiveSiblings({
        ledgerId,
        parentId,
        type: "expense",
      }),
    ).resolves.toEqual([
      {
        iconName: "🍽️",
        id: categoryId,
        name: "🍽️ 餐饮",
        sortOrder: 10,
      },
    ]);
    expect(supabase.queries[0].calls).toContainEqual({
      args: ["parent_id", parentId],
      method: "eq",
    });
  });

  it("创建分类时写入名称、Emoji、排序和审计字段", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{}] });
    const repository = createSupabaseCategoryRepository(
      supabase.client as never,
      createLogger(),
    );

    await repository.insert({
      createdBy: userId,
      iconName: "🍽️",
      ledgerId,
      name: "🍽️ 餐饮",
      parentId: null,
      sortOrder: 20,
      type: "expense",
    });

    expect(supabase.queries[0].calls).toContainEqual({
      args: [
        {
          created_by: userId,
          icon_name: "🍽️",
          ledger_id: ledgerId,
          name: "🍽️ 餐饮",
          parent_id: null,
          sort_order: 20,
          type: "expense",
          updated_by: userId,
        },
      ],
      method: "insert",
    });
  });

  it("归档大分类时使用自身或直接子分类条件", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ count: 2 }],
    });
    const repository = createSupabaseCategoryRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(
      repository.archive({
        archivedAt: "2026-07-21T00:00:00.000Z",
        archivedBy: userId,
        categoryId,
        includeChildren: true,
        ledgerId,
      }),
    ).resolves.toBe(2);
    expect(supabase.queries[0].calls).toContainEqual({
      args: [`id.eq.${categoryId},parent_id.eq.${categoryId}`],
      method: "or",
    });
  });

  it("Supabase 错误会记录安全字段并转换为 RepositoryError", async () => {
    const logger = createLogger();
    const supabase = createSupabaseMock({
      queryResponses: [{ error: { code: "42501", message: "RLS denied" } }],
    });
    const repository = createSupabaseCategoryRepository(
      supabase.client as never,
      logger,
    );

    await expect(
      repository.findActiveById({ categoryId, ledgerId }),
    ).rejects.toBeInstanceOf(RepositoryError);
    expect(logger.error).toHaveBeenCalledWith(
      "[category] failed to load category",
      {
        categoryId,
        code: "42501",
        ledgerId,
        message: "RLS denied",
      },
    );
  });
});
