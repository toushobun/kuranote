// @vitest-environment node

import { describe, expect, it } from "vitest";

import { createSupabaseMock } from "test/supabaseMock";

import { createSupabaseCategoryRepository } from "server/category/repository/categoryRepository";
import { RepositoryError } from "server/shared/errors/appError";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const otherLedgerId = "00000000-0000-4000-8000-000000000099";

describe("createSupabaseCategoryRepository", () => {
  it("只查询指定账本的未归档分类", async () => {
    const supabase = createSupabaseMock({ queryResponses: [{ data: [] }] });
    const repository = createSupabaseCategoryRepository(
      supabase.client as never,
    );

    await expect(repository.findActiveByLedgerId(ledgerId)).resolves.toEqual(
      [],
    );

    expect(supabase.queries).toHaveLength(1);
    expect(supabase.queries[0].table).toBe("category");
    expect(supabase.queries[0].calls).toContainEqual({
      args: ["ledger_id", ledgerId],
      method: "eq",
    });
    expect(supabase.queries[0].calls).not.toContainEqual({
      args: ["ledger_id", otherLedgerId],
      method: "eq",
    });
    expect(supabase.queries[0].calls).toContainEqual({
      args: ["is_archived", false],
      method: "eq",
    });
  });

  it("返回查询到的分类行", async () => {
    const row = {
      created_at: "2026-01-01T00:00:00.000Z",
      icon_name: null,
      id: "cat-1",
      name: "餐饮",
      parent_id: null,
      sort_order: 0,
      type: "expense" as const,
    };
    const supabase = createSupabaseMock({ queryResponses: [{ data: [row] }] });
    const repository = createSupabaseCategoryRepository(
      supabase.client as never,
    );

    await expect(repository.findActiveByLedgerId(ledgerId)).resolves.toEqual([
      row,
    ]);
  });

  it("Supabase 返回错误时转换为安全的 RepositoryError", async () => {
    const supabase = createSupabaseMock({
      queryResponses: [{ error: { message: "connection refused" } }],
    });
    const repository = createSupabaseCategoryRepository(
      supabase.client as never,
    );

    await expect(
      repository.findActiveByLedgerId(ledgerId),
    ).rejects.toBeInstanceOf(RepositoryError);
  });
});
